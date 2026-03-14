import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSearchHistory } from '../../src/hooks/useSearchHistory';

describe('useSearchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('initializes with empty history', async () => {
    const { result } = renderHook(() => useSearchHistory());
    // Allow useEffect to run
    await act(async () => {});
    expect(result.current.history).toEqual([]);
  });

  it('loads existing history from storage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['query1', 'query2'])
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});
    expect(result.current.history).toEqual(['query1', 'query2']);
  });

  it('adds a new query to history', async () => {
    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.addToHistory('new query');
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-search-history',
      expect.stringContaining('new query')
    );
  });

  it('deduplicates queries case-insensitively', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['Old Query'])
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.addToHistory('old query');
    });

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const parsed = JSON.parse(savedArg);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toBe('old query');
  });

  it('keeps most recent queries first (LIFO)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['query1'])
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.addToHistory('query2');
    });

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const parsed = JSON.parse(savedArg);
    expect(parsed[0]).toBe('query2');
  });

  it('limits history to 10 entries', async () => {
    const existingHistory = Array.from({ length: 10 }, (_, i) => `query${i}`);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(existingHistory)
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.addToHistory('newQuery');
    });

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const parsed = JSON.parse(savedArg);
    expect(parsed.length).toBeLessThanOrEqual(10);
    expect(parsed[0]).toBe('newQuery');
  });

  it('removes a specific query', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['q1', 'q2', 'q3'])
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.removeFromHistory('q2');
    });

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    const parsed = JSON.parse(savedArg);
    expect(parsed).toEqual(['q1', 'q3']);
  });

  it('clears all history', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify(['q1', 'q2'])
    );

    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.clearHistory();
    });

    const savedArg = (AsyncStorage.setItem as jest.Mock).mock.calls[0][1];
    expect(JSON.parse(savedArg)).toEqual([]);
  });

  it('ignores empty/whitespace queries', async () => {
    const { result } = renderHook(() => useSearchHistory());
    await act(async () => {});

    await act(async () => {
      await result.current.addToHistory('');
      await result.current.addToHistory('   ');
    });

    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });
});

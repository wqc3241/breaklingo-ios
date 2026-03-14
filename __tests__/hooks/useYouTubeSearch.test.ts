import { renderHook, act } from '@testing-library/react-native';
import { useYouTubeSearch } from '../../src/hooks/useYouTubeSearch';
import { supabase } from '../../src/lib/supabase';

describe('useYouTubeSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useYouTubeSearch());
    expect(result.current.results).toEqual([]);
    expect(result.current.isSearching).toBe(false);
    expect(result.current.hasSearched).toBe(false);
  });

  it('searches and returns results', async () => {
    const mockResults = [
      {
        videoId: 'abc123',
        title: 'Learn Japanese',
        channelTitle: 'JapanesePod101',
        publishedAt: '2024-01-01',
        thumbnailUrl: 'https://img.youtube.com/vi/abc123/mqdefault.jpg',
        description: 'A great video',
      },
    ];

    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { results: mockResults },
      error: null,
    });

    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('Japanese');
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0].videoId).toBe('abc123');
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isSearching).toBe(false);
  });

  it('calls edge function with correct params', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { results: [] },
      error: null,
    });

    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('Spanish songs', 'es', 5);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('youtube-search', {
      body: { query: 'Spanish songs', languageCode: 'es', maxResults: 5 },
    });
  });

  it('handles empty search query', async () => {
    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('');
    });

    expect(supabase.functions.invoke).not.toHaveBeenCalled();
    expect(result.current.hasSearched).toBe(false);
  });

  it('handles API error gracefully', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('API error'),
    });

    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('test');
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(true);
    expect(result.current.isSearching).toBe(false);
  });

  it('clears search results', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { results: [{ videoId: 'a', title: 'T', channelTitle: 'C', publishedAt: '', thumbnailUrl: '', description: '' }] },
      error: null,
    });

    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('test');
    });
    expect(result.current.results).toHaveLength(1);
    expect(result.current.hasSearched).toBe(true);

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });

  it('handles malformed API response', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { results: 'not an array' },
      error: null,
    });

    const { result } = renderHook(() => useYouTubeSearch());

    await act(async () => {
      await result.current.search('test');
    });

    expect(result.current.results).toEqual([]);
  });
});

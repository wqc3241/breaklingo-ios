import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { useStreak } from '../../src/hooks/useStreak';

const STREAK_KEY = 'breaklingo-streak-data';

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('useStreak', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('starts with zero streak when no data stored', async () => {
    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });

  it('marks first day complete and sets streak to 1', async () => {
    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
    expect(result.current.longestStreak).toBe(1);
    expect(result.current.lastActiveDate).toBe(getToday());
  });

  it('does not double-count same day', async () => {
    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });
    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
  });

  it('continues streak from yesterday', async () => {
    const yesterday = getYesterday();
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: 3,
      lastActiveDate: yesterday,
      longestStreak: 5,
    }));

    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(4);
    expect(result.current.longestStreak).toBe(5);
  });

  it('resets streak when last active is more than a day ago', async () => {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: 10,
      lastActiveDate: '2020-01-01',
      longestStreak: 15,
    }));

    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    // Streak should be reset to 0 on load (broken streak)
    expect(result.current.currentStreak).toBe(0);

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
    expect(result.current.longestStreak).toBe(15); // longest preserved
  });

  it('updates longest streak when current exceeds it', async () => {
    const yesterday = getYesterday();
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: 5,
      lastActiveDate: yesterday,
      longestStreak: 5,
    }));

    const { result } = renderHook(() => useStreak());
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(6);
    expect(result.current.longestStreak).toBe(6);
  });
});

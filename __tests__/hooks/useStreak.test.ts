import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { useStreak, STREAK_KEY, loadStreakData, saveStreakData, refreshStreak, getToday, getYesterday } from '../../src/hooks/useStreak';
import { StatsProvider } from '../../src/context/StatsContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(StatsProvider, null, children);

describe('useStreak', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('starts with zero streak when no data stored', async () => {
    const { result } = renderHook(() => useStreak(), { wrapper });
    await act(async () => {});

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(0);
  });

  it('marks first day complete and sets streak to 1', async () => {
    const { result } = renderHook(() => useStreak(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
    expect(result.current.longestStreak).toBe(1);
    expect(result.current.lastActiveDate).toBe(getToday());
  });

  it('does not double-count same day', async () => {
    const { result } = renderHook(() => useStreak(), { wrapper });
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

    const { result } = renderHook(() => useStreak(), { wrapper });
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

    const { result } = renderHook(() => useStreak(), { wrapper });
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

    const { result } = renderHook(() => useStreak(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(6);
    expect(result.current.longestStreak).toBe(6);
  });
});

describe('streak utility functions', () => {
  it('refreshStreak resets when lastActiveDate is old', () => {
    const data = { currentStreak: 5, lastActiveDate: '2020-01-01', longestStreak: 10 };
    const refreshed = refreshStreak(data);
    expect(refreshed.currentStreak).toBe(0);
    expect(refreshed.longestStreak).toBe(10);
  });

  it('refreshStreak preserves streak when lastActiveDate is today', () => {
    const data = { currentStreak: 5, lastActiveDate: getToday(), longestStreak: 10 };
    const refreshed = refreshStreak(data);
    expect(refreshed.currentStreak).toBe(5);
  });

  it('refreshStreak preserves streak when lastActiveDate is yesterday', () => {
    const data = { currentStreak: 5, lastActiveDate: getYesterday(), longestStreak: 10 };
    const refreshed = refreshStreak(data);
    expect(refreshed.currentStreak).toBe(5);
  });
});

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import { StatsProvider, useStatsContext } from '../../src/context/StatsContext';
import { STREAK_KEY, getToday, getYesterday } from '../../src/hooks/useStreak';
import { XP_KEY } from '../../src/hooks/useExperience';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(StatsProvider, null, children);

describe('StatsContext', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('loads streak and XP from AsyncStorage on mount', async () => {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: 5,
      lastActiveDate: getToday(),
      longestStreak: 10,
    }));
    await AsyncStorage.setItem(XP_KEY, JSON.stringify({
      totalXP: 250,
      level: 1,
    }));

    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    expect(result.current.currentStreak).toBe(5);
    expect(result.current.longestStreak).toBe(10);
    expect(result.current.totalXP).toBe(250);
    expect(result.current.level).toBe(1);
  });

  it('shares state across multiple consumers', async () => {
    const { result: consumer1 } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    // Add XP via consumer1
    await act(async () => {
      await consumer1.current.addXP(100);
    });

    expect(consumer1.current.totalXP).toBe(100);
    expect(consumer1.current.level).toBe(1);

    // A second consumer in the same provider tree sees the same state
    // (In practice, verified by StatsHeader seeing updates from QuizScreen)
    // Here we verify the state is persisted and a new hook mount reads it
    const wrapper2 = ({ children }: { children: React.ReactNode }) =>
      React.createElement(StatsProvider, null, children);
    const { result: consumer2 } = renderHook(() => useStatsContext(), { wrapper: wrapper2 });
    await act(async () => {});

    expect(consumer2.current.totalXP).toBe(100);
  });

  it('addXP updates both state and AsyncStorage', async () => {
    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(85);
    });

    expect(result.current.totalXP).toBe(85);

    // Verify AsyncStorage
    const stored = await AsyncStorage.getItem(XP_KEY);
    expect(JSON.parse(stored!).totalXP).toBe(85);
  });

  it('markDayComplete updates both state and AsyncStorage', async () => {
    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
    expect(result.current.lastActiveDate).toBe(getToday());

    // Verify AsyncStorage
    const stored = await AsyncStorage.getItem(STREAK_KEY);
    expect(JSON.parse(stored!).currentStreak).toBe(1);
  });

  it('markDayComplete is idempotent on same day', async () => {
    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.markDayComplete();
    });
    await act(async () => {
      await result.current.markDayComplete();
    });

    expect(result.current.currentStreak).toBe(1);
  });

  it('refreshes broken streak on mount', async () => {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      currentStreak: 7,
      lastActiveDate: '2020-01-01',
      longestStreak: 12,
    }));

    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    expect(result.current.currentStreak).toBe(0);
    expect(result.current.longestStreak).toBe(12);
  });

  it('XP progress bar values are correct', async () => {
    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(150);
    });

    // Level 1: range 100-300 (200 XP span), xpInLevel = 50
    expect(result.current.level).toBe(1);
    expect(result.current.xpInLevel).toBe(50);
    expect(result.current.xpNeeded).toBe(200);
    expect(result.current.progress).toBe(0.25);
  });

  it('level boundary: exactly hitting level threshold', async () => {
    const { result } = renderHook(() => useStatsContext(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(100);
    });

    expect(result.current.level).toBe(1);
    expect(result.current.progress).toBe(0); // At boundary, progress is 0 within new level
    expect(result.current.xpInLevel).toBe(0);
    expect(result.current.xpNeeded).toBe(200);
  });

  it('throws when used outside StatsProvider', () => {
    // Suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useStatsContext());
    }).toThrow('useStatsContext must be used within a StatsProvider');
    spy.mockRestore();
  });
});

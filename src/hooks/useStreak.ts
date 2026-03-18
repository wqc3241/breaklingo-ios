import { useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STREAK_KEY = 'breaklingo-streak-data';

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  longestStreak: number;
}

export const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  lastActiveDate: '',
  longestStreak: 0,
};

export const loadStreakData = async (): Promise<StreakData> => {
  try {
    const stored = await AsyncStorage.getItem(STREAK_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STREAK;
  } catch {
    return DEFAULT_STREAK;
  }
};

export const saveStreakData = async (data: StreakData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save streak data:', error);
  }
};

/**
 * Refreshes streak state without marking a day complete.
 * If lastActiveDate is older than yesterday, the streak is broken and resets to 0.
 */
export const refreshStreak = (data: StreakData): StreakData => {
  const today = getToday();
  const yesterday = getYesterday();

  if (data.lastActiveDate === today || data.lastActiveDate === yesterday) {
    // Streak is still alive (active today or yesterday)
    return data;
  }

  // Streak is broken — reset current but keep longest
  return {
    ...data,
    currentStreak: 0,
  };
};

/**
 * Hook that delegates to StatsContext for shared streak state.
 * Import useStatsContext from context/StatsContext for the actual implementation.
 * This hook is a convenience wrapper.
 */
export const useStreak = () => {
  // Lazy import to avoid circular dependency
  const { useStatsContext } = require('../context/StatsContext');
  const stats = useStatsContext();
  return {
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    lastActiveDate: stats.lastActiveDate,
    markDayComplete: stats.markDayComplete,
  };
};

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STREAK_KEY = 'breaklingo-streak-data';

export interface StreakData {
  currentStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  longestStreak: number;
}

const getToday = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterday = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  lastActiveDate: '',
  longestStreak: 0,
};

const loadStreakData = async (): Promise<StreakData> => {
  try {
    const stored = await AsyncStorage.getItem(STREAK_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_STREAK;
  } catch {
    return DEFAULT_STREAK;
  }
};

const saveStreakData = async (data: StreakData): Promise<void> => {
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
const refreshStreak = (data: StreakData): StreakData => {
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

export const useStreak = () => {
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);

  useEffect(() => {
    loadStreakData().then((data) => {
      const refreshed = refreshStreak(data);
      setStreak(refreshed);
      // Persist if streak was reset
      if (refreshed.currentStreak !== data.currentStreak) {
        saveStreakData(refreshed);
      }
    });
  }, []);

  const markDayComplete = useCallback(async () => {
    const current = await loadStreakData();
    const today = getToday();
    const yesterday = getYesterday();

    // Already counted today
    if (current.lastActiveDate === today) {
      return;
    }

    let newStreak: number;
    if (current.lastActiveDate === yesterday) {
      // Continuing streak
      newStreak = current.currentStreak + 1;
    } else {
      // Starting fresh
      newStreak = 1;
    }

    const updated: StreakData = {
      currentStreak: newStreak,
      lastActiveDate: today,
      longestStreak: Math.max(newStreak, current.longestStreak),
    };

    await saveStreakData(updated);
    setStreak(updated);
  }, []);

  return {
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    lastActiveDate: streak.lastActiveDate,
    markDayComplete,
  };
};

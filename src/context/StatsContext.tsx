import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type StreakData,
  DEFAULT_STREAK,
  STREAK_KEY,
  loadStreakData,
  saveStreakData,
  refreshStreak,
  getToday,
  getYesterday,
} from '../hooks/useStreak';
import {
  type ExperienceData,
  DEFAULT_XP,
  loadXPData,
  saveXPData,
  computeLevel,
  computeProgress,
  getLevelXPInfo,
} from '../hooks/useExperience';

interface StatsContextType {
  // Streak
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  markDayComplete: () => Promise<void>;
  // XP
  totalXP: number;
  level: number;
  progress: number;
  xpInLevel: number;
  xpNeeded: number;
  addXP: (amount: number) => Promise<ExperienceData>;
}

const StatsContext = createContext<StatsContextType | null>(null);

export const useStatsContext = () => {
  const context = useContext(StatsContext);
  if (!context) {
    throw new Error('useStatsContext must be used within a StatsProvider');
  }
  return context;
};

export const StatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [streak, setStreak] = useState<StreakData>(DEFAULT_STREAK);
  const [xpData, setXPData] = useState<ExperienceData>(DEFAULT_XP);

  // Load both on mount
  useEffect(() => {
    loadStreakData().then((data) => {
      const refreshed = refreshStreak(data);
      setStreak(refreshed);
      if (refreshed.currentStreak !== data.currentStreak) {
        saveStreakData(refreshed);
      }
    });
    loadXPData().then(setXPData);
  }, []);

  const markDayComplete = useCallback(async () => {
    const current = await loadStreakData();
    const today = getToday();
    const yesterday = getYesterday();

    if (current.lastActiveDate === today) {
      return;
    }

    let newStreak: number;
    if (current.lastActiveDate === yesterday) {
      newStreak = current.currentStreak + 1;
    } else {
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

  const addXP = useCallback(async (amount: number) => {
    const current = await loadXPData();
    const newTotal = current.totalXP + amount;
    const newLevel = computeLevel(newTotal);

    const updated: ExperienceData = {
      totalXP: newTotal,
      level: newLevel,
    };

    await saveXPData(updated);
    setXPData(updated);
    return updated;
  }, []);

  const progress = computeProgress(xpData.totalXP, xpData.level);
  const levelInfo = getLevelXPInfo(xpData.totalXP, xpData.level);

  const value = useMemo(
    () => ({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastActiveDate: streak.lastActiveDate,
      markDayComplete,
      totalXP: xpData.totalXP,
      level: xpData.level,
      progress,
      xpInLevel: levelInfo.xpInLevel,
      xpNeeded: levelInfo.xpNeeded,
      addXP,
    }),
    [streak, xpData, progress, levelInfo.xpInLevel, levelInfo.xpNeeded, markDayComplete, addXP]
  );

  return (
    <StatsContext.Provider value={value}>
      {children}
    </StatsContext.Provider>
  );
};

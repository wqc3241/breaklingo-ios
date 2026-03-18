import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'breaklingo-experience-data';

export interface ExperienceData {
  totalXP: number;
  level: number;
}

const DEFAULT_XP: ExperienceData = {
  totalXP: 0,
  level: 0,
};

/**
 * Total XP required to reach level N = N * (N + 1) / 2 * 100
 * Level 1: 100, Level 2: 300, Level 3: 600, Level 4: 1000, etc.
 */
export const xpForLevel = (level: number): number => {
  return (level * (level + 1)) / 2 * 100;
};

/**
 * Given total XP, compute the current level.
 */
export const computeLevel = (totalXP: number): number => {
  let level = 0;
  while (xpForLevel(level + 1) <= totalXP) {
    level++;
  }
  return level;
};

/**
 * Returns progress within the current level as a number between 0 and 1.
 */
export const computeProgress = (totalXP: number, level: number): number => {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const range = nextLevelXP - currentLevelXP;
  if (range <= 0) return 0;
  return (totalXP - currentLevelXP) / range;
};

/**
 * Returns XP needed for the next level and XP earned within current level.
 */
export const getLevelXPInfo = (totalXP: number, level: number) => {
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  return {
    xpInLevel: totalXP - currentLevelXP,
    xpNeeded: nextLevelXP - currentLevelXP,
    xpToNext: nextLevelXP,
  };
};

const loadXPData = async (): Promise<ExperienceData> => {
  try {
    const stored = await AsyncStorage.getItem(XP_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_XP;
  } catch {
    return DEFAULT_XP;
  }
};

const saveXPData = async (data: ExperienceData): Promise<void> => {
  try {
    await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save XP data:', error);
  }
};

export const useExperience = () => {
  const [xpData, setXPData] = useState<ExperienceData>(DEFAULT_XP);

  useEffect(() => {
    loadXPData().then(setXPData);
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

  return {
    totalXP: xpData.totalXP,
    level: xpData.level,
    progress,
    xpInLevel: levelInfo.xpInLevel,
    xpNeeded: levelInfo.xpNeeded,
    addXP,
  };
};

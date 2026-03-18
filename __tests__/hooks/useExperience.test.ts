import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderHook, act } from '@testing-library/react-native';
import React from 'react';
import { useExperience, xpForLevel, computeLevel, computeProgress } from '../../src/hooks/useExperience';
import { StatsProvider } from '../../src/context/StatsContext';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(StatsProvider, null, children);

describe('XP utility functions', () => {
  it('xpForLevel returns correct thresholds', () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(1)).toBe(100);
    expect(xpForLevel(2)).toBe(300);
    expect(xpForLevel(3)).toBe(600);
    expect(xpForLevel(4)).toBe(1000);
  });

  it('computeLevel returns correct level for given XP', () => {
    expect(computeLevel(0)).toBe(0);
    expect(computeLevel(50)).toBe(0);
    expect(computeLevel(100)).toBe(1);
    expect(computeLevel(299)).toBe(1);
    expect(computeLevel(300)).toBe(2);
    expect(computeLevel(599)).toBe(2);
    expect(computeLevel(600)).toBe(3);
    expect(computeLevel(1000)).toBe(4);
  });

  it('computeProgress returns correct progress within level', () => {
    // Level 0: 0-100 XP range
    expect(computeProgress(0, 0)).toBe(0);
    expect(computeProgress(50, 0)).toBe(0.5);

    // Level 1: 100-300 XP range (200 XP span)
    expect(computeProgress(100, 1)).toBe(0);
    expect(computeProgress(200, 1)).toBe(0.5);
    expect(computeProgress(299, 1)).toBeCloseTo(0.995, 2);

    // Level 2: 300-600 XP range (300 XP span)
    expect(computeProgress(300, 2)).toBe(0);
    expect(computeProgress(450, 2)).toBe(0.5);
  });
});

describe('useExperience', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('starts at level 0 with 0 XP', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    expect(result.current.totalXP).toBe(0);
    expect(result.current.level).toBe(0);
    expect(result.current.progress).toBe(0);
  });

  it('adds XP and updates level', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(100);
    });

    expect(result.current.totalXP).toBe(100);
    expect(result.current.level).toBe(1);
  });

  it('accumulates XP across multiple calls', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(85); // quiz score
    });
    await act(async () => {
      await result.current.addXP(50); // talk session
    });

    expect(result.current.totalXP).toBe(135);
    expect(result.current.level).toBe(1);
  });

  it('levels up correctly through multiple levels', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    // Add 600 XP total => level 3
    await act(async () => {
      await result.current.addXP(600);
    });

    expect(result.current.totalXP).toBe(600);
    expect(result.current.level).toBe(3);
    expect(result.current.progress).toBe(0);
  });

  it('persists XP data in AsyncStorage', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(250);
    });

    // Re-mount hook
    const { result: result2 } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    expect(result2.current.totalXP).toBe(250);
    expect(result2.current.level).toBe(1);
  });

  it('returns correct xpInLevel and xpNeeded', async () => {
    const { result } = renderHook(() => useExperience(), { wrapper });
    await act(async () => {});

    await act(async () => {
      await result.current.addXP(150);
    });

    // Level 1: range 100-300, so xpInLevel = 50, xpNeeded = 200
    expect(result.current.level).toBe(1);
    expect(result.current.xpInLevel).toBe(50);
    expect(result.current.xpNeeded).toBe(200);
  });
});

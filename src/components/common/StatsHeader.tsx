import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, Zap } from 'lucide-react-native';
import { useStreak } from '../../hooks/useStreak';
import { useExperience } from '../../hooks/useExperience';
import { colors } from '../../lib/theme';

const StatsHeader: React.FC = () => {
  const { currentStreak } = useStreak();
  const { level, progress, xpInLevel, xpNeeded } = useExperience();

  return (
    <View style={styles.container}>
      {/* Streak */}
      <View style={styles.streakBadge}>
        <Flame
          size={20}
          color={currentStreak > 0 ? colors.primary : colors.muted}
          fill={currentStreak > 0 ? colors.primary : 'none'}
        />
        <Text style={[styles.streakText, currentStreak > 0 && styles.streakTextActive]}>
          {currentStreak}
        </Text>
      </View>

      {/* Level + XP bar */}
      <View style={styles.levelSection}>
        <View style={styles.levelBadge}>
          <Zap size={14} color={colors.primary} fill={colors.primary} />
          <Text style={styles.levelText}>Lvl {level}</Text>
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
        </View>
        <Text style={styles.xpText}>{xpInLevel}/{xpNeeded}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.muted,
  },
  streakTextActive: {
    color: colors.primary,
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primaryTinted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  xpBarBg: {
    width: 80,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpBarFill: {
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  xpText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
});

export default StatsHeader;

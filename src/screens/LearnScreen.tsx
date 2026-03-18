import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Star, Check, Lock, Trophy } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../hooks/useAuth';
import { useLearningUnits } from '../hooks/useLearningUnits';
import { loadQuizScores } from './QuizScreen';
import type { QuizScoreEntry } from './QuizScreen';
import { colors, getDifficultyColor } from '../lib/theme';
import { formatRelativeDate } from '../lib/dateUtils';
import type { LearningUnit } from '../lib/types';

const LearnScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { units, isLoading, isGenerating, hasMore, totalUnits, totalProjects, fetchUnits, fetchMoreUnits, cleanup } = useLearningUnits(user?.id);
  const [recentScores, setRecentScores] = useState<QuizScoreEntry[]>([]);

  useEffect(() => {
    fetchUnits();
    loadQuizScores().then((scores) => setRecentScores(scores.slice(0, 1)));
    return () => cleanup();
  }, [fetchUnits, cleanup]);

  const isUnitUnlocked = (unit: LearningUnit, index: number): boolean => {
    if (index === 0) return true;
    // Check if previous unit in same project is completed
    const sameProjectUnits = units
      .filter((u) => u.projectId === unit.projectId)
      .sort((a, b) => a.order - b.order);

    const unitIndex = sameProjectUnits.findIndex((u) => u.id === unit.id);
    if (unitIndex <= 0) return true;
    return sameProjectUnits[unitIndex - 1].completed;
  };

  const handleUnitPress = (unit: LearningUnit, index: number) => {
    if (!isUnitUnlocked(unit, index)) return;
    navigation.navigate('Quiz', { unitId: unit.id, unitTitle: unit.title });
  };

  const getStarsDisplay = (stars: number) => {
    const elements = [];
    for (let i = 0; i < stars; i++) {
      elements.push(<Star key={`filled-${i}`} size={12} color="#EAB308" fill="#EAB308" />);
    }
    for (let i = 0; i < 3 - stars; i++) {
      elements.push(<Star key={`empty-${i}`} size={12} color="#D4D4D4" />);
    }
    return elements;
  };


  // Group units by project, sorted by parsed order
  const projectGroups: { projectTitle: string; projectId: string | number; units: LearningUnit[] }[] = [];
  const seenProjects = new Set<string>();

  for (const unit of units) {
    const key = String(unit.projectId);
    if (!seenProjects.has(key)) {
      seenProjects.add(key);
      const sortedUnits = units
        .filter((u) => String(u.projectId) === key)
        .sort((a, b) => a.order - b.order);
      projectGroups.push({
        projectTitle: unit.projectTitle,
        projectId: unit.projectId,
        units: sortedUnits,
      });
    }
  }

  if (isLoading && units.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <LoadingState message="Loading learning path..." />
      </SafeAreaView>
    );
  }

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <LoadingState message="Generating lessons..." />
      </SafeAreaView>
    );
  }

  if (units.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <EmptyState
          icon={<GraduationCap size={36} color="#E8550C" />}
          title="No lessons yet"
          subtitle="Search for a YouTube video on the Search tab to create your first learning path with quizzes"
        />
      </SafeAreaView>
    );
  }

  const renderUnitCard = (unit: LearningUnit, index: number, totalInProject: number) => {
    const unlocked = isUnitUnlocked(unit, index);
    const diffColors = getDifficultyColor(unit.difficulty);

    return (
      <TouchableOpacity
        key={unit.id}
        style={[styles.unitCard, !unlocked && styles.unitCardLocked]}
        onPress={() => handleUnitPress(unit, index)}
        disabled={!unlocked}
      >
        <View style={styles.unitLeft}>
          <View style={[
            styles.unitCircle,
            unit.completed && styles.unitCircleCompleted,
            !unlocked && styles.unitCircleLocked,
          ]}>
            {unit.completed ? (
              <Check size={20} color={colors.correctText} />
            ) : !unlocked ? (
              <Lock size={20} color={colors.muted} />
            ) : (
              <Text style={[
                styles.unitCircleText,
                unit.completed && styles.unitCircleTextCompleted,
                !unlocked && styles.unitCircleTextLocked,
              ]}>
                {String(index + 1)}
              </Text>
            )}
          </View>
          {/* Connector line */}
          {index < totalInProject - 1 && (
            <View style={[styles.connector, unit.completed && styles.connectorCompleted]} />
          )}
        </View>
        <View style={styles.unitContent}>
          <Text style={[styles.unitTitle, !unlocked && styles.textLocked]} numberOfLines={1}>
            {unit.title}
          </Text>
          {unit.description ? (
            <Text style={[styles.unitDescription, !unlocked && styles.textLocked]} numberOfLines={2}>
              {unit.description}
            </Text>
          ) : null}
          <View style={styles.unitMeta}>
            <View style={[styles.badge, { backgroundColor: diffColors.bg }]}>
              <Text style={[styles.badgeText, { color: diffColors.text }]}>{unit.difficulty}</Text>
            </View>
            {unit.attempts > 0 && (
              <>
                <View style={styles.starsContainer}>{getStarsDisplay(unit.stars)}</View>
                <Text style={styles.scoreText}>
                  {unit.attempts} {unit.attempts === 1 ? 'attempt' : 'attempts'}
                </Text>
                <Text style={styles.scoreText}>Best: {unit.bestScore}%</Text>
              </>
            )}
            <Text style={styles.scoreText}>
              {Math.min(unit.questionCount || unit.questions.length, 10)} questions
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <FlatList
        data={projectGroups}
        keyExtractor={(item) => String(item.projectId)}
        ListHeaderComponent={
          <View>
            <View style={styles.pathSummary}>
              <Text style={styles.pathSummaryTitle}>Learning Path</Text>
              <Text style={styles.pathSummarySubtitle}>
                {totalUnits || units.length} {totalUnits === 1 ? 'unit' : 'units'} · {totalProjects || projectGroups.length} {totalProjects === 1 ? 'project' : 'projects'}
              </Text>
            </View>
            {recentScores.length > 0 && (() => {
              const entry = recentScores[0];
              return (
                <View style={styles.recentScoresSection}>
                  <View style={styles.latestScoreRow}>
                    <Trophy size={14} color="#EAB308" />
                    <Text style={styles.latestScoreLabel}>Latest:</Text>
                    <Text style={styles.latestScoreTitle} numberOfLines={1}>
                      {entry.unitTitle || 'Practice Quiz'}
                    </Text>
                    <Text style={[
                      styles.latestScorePercent,
                      { color: entry.percentage >= 70 ? colors.correctText : entry.percentage >= 60 ? colors.intermediateText : colors.wrongText },
                    ]}>
                      {entry.percentage}%
                    </Text>
                    <View style={styles.latestScoreStars}>
                      {Array.from({ length: 3 }).map((_, i) =>
                        i < entry.stars ? (
                          <Star key={i} size={10} color="#EAB308" fill="#EAB308" />
                        ) : (
                          <Star key={i} size={10} color="#D4D4D4" />
                        )
                      )}
                    </View>
                    <Text style={styles.latestScoreDate}>{formatRelativeDate(entry.date)}</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        }
        renderItem={({ item: group }) => (
          <View style={styles.projectGroup}>
            <Text style={styles.projectGroupTitle}>{group.projectTitle}</Text>
            {group.units.map((unit, index) => renderUnitCard(unit, index, group.units.length))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
        onEndReached={() => {
          if (hasMore && !isLoading) {
            fetchMoreUnits();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={hasMore ? (
          <ActivityIndicator style={{ padding: 16 }} color={colors.primary} />
        ) : null}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#A1A1A1',
  },
  subText: {
    marginTop: 4,
    fontSize: 14,
    color: '#D4D4D4',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#525252',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
    paddingBottom: 0,
  },
  projectGroup: {
    marginBottom: 24,
  },
  projectGroupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  unitCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  unitCardLocked: {
    opacity: 0.5,
  },
  unitLeft: {
    alignItems: 'center',
    marginRight: 12,
    width: 40,
  },
  unitCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8550C',
  },
  unitCircleCompleted: {
    backgroundColor: colors.correctBg,
    borderColor: colors.correctBorder,
  },
  unitCircleLocked: {
    backgroundColor: '#D4D4D4',
    borderColor: '#D4D4D4',
  },
  unitCircleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E8550C',
  },
  unitCircleTextCompleted: {
    color: colors.correctText,
  },
  unitCircleTextLocked: {
    fontSize: 12,
    color: '#A1A1A1',
  },
  connector: {
    width: 2,
    height: 14,
    backgroundColor: '#D4D4D4',
    marginTop: 4,
  },
  connectorCompleted: {
    backgroundColor: colors.correctBorder,
  },
  unitContent: {
    flex: 1,
  },
  unitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  unitDescription: {
    fontSize: 13,
    color: '#A1A1A1',
    marginBottom: 8,
    lineHeight: 18,
  },
  textLocked: {
    color: '#D4D4D4',
  },
  unitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: 12,
    color: '#A1A1A1',
    fontWeight: '500',
  },
  // Path summary
  pathSummary: {
    marginBottom: 12,
  },
  pathSummaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.foreground,
  },
  pathSummarySubtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 2,
  },
  // Recent scores
  recentScoresSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  latestScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  latestScoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
  },
  latestScoreTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.foreground,
    flexShrink: 1,
  },
  latestScorePercent: {
    fontSize: 13,
    fontWeight: '700',
  },
  latestScoreStars: {
    flexDirection: 'row',
    gap: 1,
  },
  latestScoreDate: {
    fontSize: 12,
    color: colors.muted,
  },
});

export default LearnScreen;

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GraduationCap, Star, Check, Lock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useLearningUnits } from '../hooks/useLearningUnits';
import type { LearningUnit } from '../lib/types';

const LearnScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { units, isLoading, isGenerating, fetchUnits, cleanup } = useLearningUnits(user?.id);

  useEffect(() => {
    fetchUnits();
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
    navigation.navigate('Quiz', { unitId: unit.id });
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return { bg: '#D1FAE5', text: '#065F46' };
      case 'intermediate':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'advanced':
        return { bg: '#FEE2E2', text: '#991B1B' };
      default:
        return { bg: '#F3F4F6', text: '#374151' };
    }
  };

  // Group units by project
  const projectGroups: { projectTitle: string; projectId: string | number; units: LearningUnit[] }[] = [];
  const seenProjects = new Set<string>();

  for (const unit of units) {
    const key = String(unit.projectId);
    if (!seenProjects.has(key)) {
      seenProjects.add(key);
      projectGroups.push({
        projectTitle: unit.projectTitle,
        projectId: unit.projectId,
        units: units.filter((u) => String(u.projectId) === key).sort((a, b) => a.order - b.order),
      });
    }
  }

  if (isLoading && units.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8550C" />
          <Text style={styles.loadingText}>Loading learning path...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isGenerating) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8550C" />
          <Text style={styles.loadingText}>Generating lessons...</Text>
          <Text style={styles.subText}>This may take a moment</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (units.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <GraduationCap size={48} color="#A1A1A1" />
          </View>
          <Text style={styles.emptyTitle}>No lessons yet</Text>
          <Text style={styles.emptySubtitle}>
            Search for a YouTube video to create your first learning path
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderUnitCard = (unit: LearningUnit, index: number) => {
    const unlocked = isUnitUnlocked(unit, index);
    const colors = getDifficultyColor(unit.difficulty);

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
              <Check size={20} color="#065F46" />
            ) : !unlocked ? (
              <Lock size={20} color="#A1A1A1" />
            ) : (
              <Text style={[
                styles.unitCircleText,
                unit.completed && styles.unitCircleTextCompleted,
                !unlocked && styles.unitCircleTextLocked,
              ]}>
                {String(unit.order + 1)}
              </Text>
            )}
          </View>
          {/* Connector line */}
          {index < units.filter((u) => u.projectId === unit.projectId).length - 1 && (
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
            <View style={[styles.badge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>{unit.difficulty}</Text>
            </View>
            {unit.attempts > 0 && (
              <>
                <View style={styles.starsContainer}>{getStarsDisplay(unit.stars)}</View>
                <Text style={styles.scoreText}>{unit.bestScore}%</Text>
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={projectGroups}
        keyExtractor={(item) => String(item.projectId)}
        renderItem={({ item: group }) => (
          <View style={styles.projectGroup}>
            <Text style={styles.projectGroupTitle}>{group.projectTitle}</Text>
            {group.units.map((unit, index) => renderUnitCard(unit, index))}
          </View>
        )}
        contentContainerStyle={styles.listContent}
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
    paddingBottom: 40,
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
    padding: 14,
    marginBottom: 2,
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
    backgroundColor: '#D1FAE5',
    borderColor: '#34D399',
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
    color: '#065F46',
  },
  unitCircleTextLocked: {
    fontSize: 12,
    color: '#A1A1A1',
  },
  connector: {
    width: 2,
    height: 20,
    backgroundColor: '#D4D4D4',
    marginTop: 4,
  },
  connectorCompleted: {
    backgroundColor: '#34D399',
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
});

export default LearnScreen;

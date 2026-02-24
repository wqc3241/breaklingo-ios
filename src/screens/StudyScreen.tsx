import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useProject } from '../hooks/useProject';
import type { VocabularyItem, GrammarItem } from '../lib/types';

type StudyTab = 'vocabulary' | 'grammar' | 'script';

const StudyScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudyTab>('vocabulary');
  const { user } = useAuth();
  const { currentProject } = useProject(user);

  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📖</Text>
          <Text style={styles.emptyTitle}>No lesson yet</Text>
          <Text style={styles.emptySubtitle}>
            Add a YouTube video to start learning
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentProject.status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.emptyTitle}>Processing...</Text>
          <Text style={styles.emptySubtitle}>
            AI transcript generation in progress. Check back soon.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const getDifficultyColor = (difficulty?: string) => {
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

  const renderVocabularyItem = ({ item }: { item: VocabularyItem }) => {
    const colors = getDifficultyColor(item.difficulty);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.word}>{item.word}</Text>
          {item.difficulty && (
            <View style={[styles.badge, { backgroundColor: colors.bg }]}>
              <Text style={[styles.badgeText, { color: colors.text }]}>
                {item.difficulty}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.definition}>
          {item.definition || item.meaning || ''}
        </Text>
      </View>
    );
  };

  const renderGrammarItem = ({ item }: { item: GrammarItem }) => (
    <View style={styles.card}>
      <Text style={styles.rule}>{item.rule}</Text>
      <Text style={styles.explanation}>{item.explanation}</Text>
      <Text style={styles.example}>{item.example}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Project Title */}
      <View style={styles.titleBar}>
        <Text style={styles.projectTitle} numberOfLines={1}>
          {currentProject.title}
        </Text>
        <View style={[styles.badge, { backgroundColor: '#E8F0FE' }]}>
          <Text style={[styles.badgeText, { color: '#1A73E8' }]}>
            {currentProject.detectedLanguage}
          </Text>
        </View>
      </View>

      {/* Segment Control */}
      <View style={styles.segmentContainer}>
        {(['vocabulary', 'grammar', 'script'] as StudyTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.segment,
              activeTab === tab && styles.segmentActive,
            ]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.segmentText,
                activeTab === tab && styles.segmentTextActive,
              ]}
            >
              {tab === 'vocabulary'
                ? `Vocab (${currentProject.vocabulary?.length || 0})`
                : tab === 'grammar'
                ? `Grammar (${currentProject.grammar?.length || 0})`
                : 'Script'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {activeTab === 'vocabulary' && (
        <FlatList
          data={currentProject.vocabulary || []}
          keyExtractor={(_, i) => `v-${i}`}
          renderItem={renderVocabularyItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No vocabulary items</Text>
            </View>
          }
        />
      )}

      {activeTab === 'grammar' && (
        <FlatList
          data={currentProject.grammar || []}
          keyExtractor={(_, i) => `g-${i}`}
          renderItem={renderGrammarItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Text style={styles.emptyListText}>No grammar items</Text>
            </View>
          }
        />
      )}

      {activeTab === 'script' && (
        <ScrollView style={styles.scriptContainer} contentContainerStyle={styles.scriptContent}>
          <Text style={styles.scriptText} selectable>
            {currentProject.script || 'No script available'}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
    color: '#000',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  segmentTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  word: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  definition: {
    fontSize: 15,
    color: '#3C3C43',
    lineHeight: 22,
  },
  rule: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  explanation: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    lineHeight: 20,
  },
  example: {
    fontSize: 15,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  scriptContainer: {
    flex: 1,
  },
  scriptContent: {
    padding: 16,
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 15,
    color: '#8E8E93',
  },
});

export default StudyScreen;

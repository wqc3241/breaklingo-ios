import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Volume2, RefreshCw } from 'lucide-react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import type { VocabularyItem, GrammarItem } from '../lib/types';

type StudyTab = 'vocabulary' | 'grammar' | 'script';

const StudyScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudyTab>('vocabulary');
  const { currentProject, setCurrentProject, autoSaveProject } = useProjectContext();
  const { regenerateAnalysis, isProcessing, processingStep } = useVideoProcessing();
  const { speak, isPlaying, currentText } = useTextToSpeech();

  const handleRegenerate = async () => {
    const result = await regenerateAnalysis(currentProject);
    if (result) {
      setCurrentProject(result);
      await autoSaveProject(result);
    }
  };

  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <BookOpen size={48} color="#A1A1A1" />
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
    const isSpeaking = isPlaying && currentText === item.word;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.wordRow}>
            <TouchableOpacity
              style={styles.speakerButton}
              onPress={() => speak(item.word)}
            >
              <Volume2 size={16} color="#E8550C" />
            </TouchableOpacity>
            <View style={styles.wordInfo}>
              <Text style={styles.word}>{item.word}</Text>
              {item.reading && (
                <Text style={styles.reading}>{item.reading}</Text>
              )}
            </View>
          </View>
          <View style={styles.badgeRow}>
            {item.partOfSpeech && (
              <View style={[styles.badge, { backgroundColor: '#EDE9FE' }]}>
                <Text style={[styles.badgeText, { color: '#7C3AED' }]}>
                  {item.partOfSpeech}
                </Text>
              </View>
            )}
            {item.difficulty && (
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>
                  {item.difficulty}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.definition}>
          {item.definition || item.meaning || ''}
        </Text>
      </View>
    );
  };

  const renderGrammarItem = ({ item }: { item: GrammarItem }) => {
    const isSpeaking = isPlaying && currentText === item.example;
    return (
      <View style={styles.card}>
        <Text style={styles.rule}>{item.rule}</Text>
        <Text style={styles.explanation}>{item.explanation}</Text>
        <TouchableOpacity
          style={styles.exampleRow}
          onPress={() => speak(item.example)}
        >
          <Volume2 size={16} color="#E8550C" />
          <Text style={styles.example}>{item.example}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Project Title + Regenerate */}
      <View style={styles.titleBar}>
        <View style={styles.titleLeft}>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {currentProject.title}
          </Text>
          <View style={[styles.badge, { backgroundColor: '#FFF5EA' }]}>
            <Text style={[styles.badgeText, { color: '#E8550C' }]}>
              {currentProject.detectedLanguage}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleRegenerate}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#E8550C" />
          ) : (
            <Text style={styles.regenerateText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>

      {isProcessing && processingStep ? (
        <View style={styles.processingBar}>
          <ActivityIndicator size="small" color="#E8550C" />
          <Text style={styles.processingText}>{processingStep}</Text>
        </View>
      ) : null}

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
    backgroundColor: '#F5F5F5',
  },
  titleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  projectTitle: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
    color: '#000',
  },
  regenerateButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateText: {
    fontSize: 18,
    color: '#E8550C',
  },
  processingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFF5EA',
    borderRadius: 8,
    padding: 8,
  },
  processingText: {
    fontSize: 13,
    color: '#E8550C',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#D4D4D4',
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
    color: '#A1A1A1',
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
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  speakerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerIcon: {
    fontSize: 16,
  },
  speakerIconActive: {
    opacity: 0.4,
  },
  wordInfo: {
    flex: 1,
  },
  word: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  reading: {
    fontSize: 13,
    color: '#A1A1A1',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  definition: {
    fontSize: 15,
    color: '#525252',
    lineHeight: 22,
    marginLeft: 40,
  },
  rule: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  explanation: {
    fontSize: 14,
    color: '#A1A1A1',
    marginBottom: 8,
    lineHeight: 20,
  },
  exampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  example: {
    fontSize: 15,
    color: '#E8550C',
    fontStyle: 'italic',
    flex: 1,
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
    color: '#525252',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyListText: {
    fontSize: 15,
    color: '#A1A1A1',
  },
});

export default StudyScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Volume2, FileText, RefreshCw } from 'lucide-react-native';
import EmptyState from '../components/common/EmptyState';
import { useProjectContext } from '../context/ProjectContext';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { supabase } from '../lib/supabase';
import { getDifficultyColor } from '../lib/theme';
import type { PracticeSentence } from '../lib/types';

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

const PracticeScreen: React.FC = () => {
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [practiceSentences, setPracticeSentences] = useState<PracticeSentence[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { currentProject, setCurrentProject, autoSaveProject } = useProjectContext();
  const { speak, isPlaying, currentText } = useTextToSpeech();

  useEffect(() => {
    if (currentProject?.practiceSentences) {
      setPracticeSentences(currentProject.practiceSentences);
    }
  }, [currentProject]);

  const generateSentences = async () => {
    if (!currentProject) return;

    const vocabulary = currentProject.vocabulary ?? [];
    const grammar = currentProject.grammar ?? [];
    const detectedLanguage = currentProject.detectedLanguage ?? 'Unknown';

    if (vocabulary.length === 0 || grammar.length === 0) {
      Alert.alert('Not enough data', 'Generate vocabulary and grammar first, then try again.');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-practice-sentences', {
        body: { vocabulary, grammar, detectedLanguage, count: 10 },
      });

      if (error) throw error;

      if (data?.sentences?.length > 0) {
        setPracticeSentences(data.sentences);
        // Persist generated sentences to project context and database
        if (currentProject) {
          const updated = { ...currentProject, practiceSentences: data.sentences };
          setCurrentProject(updated);
          await autoSaveProject(updated);
        }
        Alert.alert('Success', `Created ${data.sentences.length} sentences for practice.`);
      } else {
        Alert.alert('No sentences', 'Try again or check if vocabulary and grammar are available.');
      }
    } catch (error: any) {
      Alert.alert('Generation failed', error.message || 'Could not generate practice sentences');
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredSentences =
    difficultyFilter === 'all'
      ? practiceSentences
      : practiceSentences.filter((s) => s.difficulty === difficultyFilter);


  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container} edges={[]}>
        <EmptyState
          icon={<MessageCircle size={36} color="#E8550C" />}
          title="No practice sentences"
          subtitle="Search for a YouTube video first, then come back here to practice sentences"
        />
      </SafeAreaView>
    );
  }

  const renderSentence = ({ item }: { item: PracticeSentence }) => {
    const diffColors = getDifficultyColor(item.difficulty);
    const isCurrentlyPlaying = isPlaying && currentText === item.text;

    return (
      <View style={styles.sentenceCard}>
        <View style={styles.sentenceRow}>
          <TouchableOpacity
            style={styles.audioButton}
            onPress={() => speak(item.text)}
          >
            <View style={isCurrentlyPlaying ? styles.audioIconPlaying : undefined}>
              <Volume2 size={16} color="#E8550C" />
            </View>
          </TouchableOpacity>
          <View style={styles.sentenceContent}>
            <Text style={styles.sentenceText}>{item.text}</Text>
            <Text style={styles.translationText}>{item.translation}</Text>
          </View>
        </View>
        <View style={styles.tagsRow}>
          <View style={[styles.badge, { backgroundColor: diffColors.bg }]}>
            <Text style={[styles.badgeText, { color: diffColors.text }]}>{item.difficulty}</Text>
          </View>
          {item.usedVocabulary?.slice(0, 3).map((word, i) => (
            <View key={i} style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.badgeText, { color: '#374151' }]}>{word}</Text>
            </View>
          ))}
          {(item.usedVocabulary?.length || 0) > 3 && (
            <View style={[styles.badge, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.badgeText, { color: '#374151' }]}>
                +{item.usedVocabulary!.length - 3}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice Sentences</Text>
        <TouchableOpacity
          style={styles.generateButton}
          onPress={generateSentences}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <ActivityIndicator size="small" color="#E8550C" />
          ) : (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
              <RefreshCw size={14} color="#E8550C" />
              <Text style={styles.generateText}>Generate</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        {(['all', 'beginner', 'intermediate', 'advanced'] as DifficultyFilter[]).map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.filterChip,
              difficultyFilter === level && styles.filterChipActive,
            ]}
            onPress={() => setDifficultyFilter(level)}
          >
            <Text
              style={[
                styles.filterChipText,
                difficultyFilter === level && styles.filterChipTextActive,
              ]}
            >
              {level === 'all' ? `All (${practiceSentences.length})` : level.charAt(0).toUpperCase() + level.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredSentences.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}><FileText size={48} color="#A1A1A1" /></View>
          <Text style={styles.emptyTitle}>
            {practiceSentences.length === 0 ? 'No practice sentences yet' : 'No sentences at this level'}
          </Text>
          {practiceSentences.length === 0 && (
            <TouchableOpacity
              style={styles.generateButtonLarge}
              onPress={generateSentences}
            >
              <Text style={styles.generateButtonLargeText}>Generate Sentences</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredSentences}
          keyExtractor={(_, i) => `s-${i}`}
          renderItem={renderSentence}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  generateButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  generateText: {
    fontSize: 14,
    color: '#E8550C',
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  filterChipActive: {
    backgroundColor: '#E8550C',
    borderColor: '#E8550C',
  },
  filterChipText: {
    fontSize: 13,
    color: '#525252',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  sentenceCard: {
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
  sentenceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  audioButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  audioIcon: {
    fontSize: 16,
  },
  audioIconPlaying: {
    opacity: 0.5,
  },
  sentenceContent: {
    flex: 1,
  },
  sentenceText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
    lineHeight: 24,
  },
  translationText: {
    fontSize: 14,
    color: '#A1A1A1',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#525252',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    lineHeight: 22,
  },
  generateButtonLarge: {
    marginTop: 16,
    backgroundColor: '#E8550C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  generateButtonLargeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PracticeScreen;

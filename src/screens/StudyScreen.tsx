import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookOpen, Volume2, RefreshCw, Clock, AlertTriangle, Play, ChevronDown, ExternalLink, XCircle } from 'lucide-react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import type { VocabularyItem, GrammarItem } from '../lib/types';

const LANGUAGES = [
  'Japanese', 'Chinese', 'Korean', 'Spanish', 'French',
  'German', 'Italian', 'Portuguese', 'Russian', 'Arabic', 'Hindi', 'Other',
];

const extractVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/v\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

type StudyTab = 'vocabulary' | 'grammar' | 'script';

const StudyScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<StudyTab>('vocabulary');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [highlightedWords, setHighlightedWords] = useState<string[]>([]);
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

  const handleLanguageChange = async (language: string) => {
    if (!currentProject) return;
    const updated = { ...currentProject, detectedLanguage: language };
    setCurrentProject(updated);
    await autoSaveProject(updated);
    setShowLanguagePicker(false);
    Alert.alert(
      'Language updated',
      `Changed to ${language}. Tap the regenerate button to re-analyze.`
    );
  };

  const handleOpenVideo = () => {
    if (!currentProject?.url) return;
    Linking.openURL(currentProject.url);
  };

  const handleWordPress = (word: string) => {
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    if (!cleanWord) return;
    if (highlightedWords.includes(cleanWord)) {
      setHighlightedWords(highlightedWords.filter(w => w !== cleanWord));
    } else {
      setHighlightedWords([...highlightedWords, cleanWord]);
    }
  };

  const renderInteractiveScript = (script: string) => {
    return script.split(' ').map((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      const isHighlighted = highlightedWords.includes(cleanWord);
      return (
        <Text
          key={index}
          style={[
            styles.scriptWord,
            isHighlighted && styles.scriptWordHighlighted,
          ]}
          onPress={() => handleWordPress(word)}
        >
          {word}{' '}
        </Text>
      );
    });
  };

  if (!currentProject) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconCircle}>
            <BookOpen size={36} color="#E8550C" />
          </View>
          <Text style={styles.emptyTitle}>No lesson yet</Text>
          <Text style={styles.emptySubtitle}>
            Search for a YouTube video on the Search tab to start learning vocabulary and grammar
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentProject.status === 'pending') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBanner, { backgroundColor: '#FEF3C7' }]}>
            <Clock size={20} color="#92400E" />
            <Text style={[styles.statusBannerText, { color: '#92400E' }]}>
              Processing...
            </Text>
          </View>
          <Text style={styles.statusDetail}>
            AI transcript generation in progress. Check back soon.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (currentProject.status === 'failed') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.statusCard}>
          <View style={[styles.statusBanner, { backgroundColor: '#FEE2E2' }]}>
            <AlertTriangle size={20} color="#991B1B" />
            <Text style={[styles.statusBannerText, { color: '#991B1B' }]}>
              Generation failed
            </Text>
          </View>
          <Text style={styles.statusDetail}>
            {currentProject.errorMessage || 'An unknown error occurred. Please try again.'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRegenerate}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.retryButtonText}>Try Again</Text>
            )}
          </TouchableOpacity>
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

  const videoId = currentProject.url ? extractVideoId(currentProject.url) : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* YouTube Video Preview */}
      {videoId && (
        <TouchableOpacity style={styles.videoPreview} onPress={handleOpenVideo}>
          <View style={styles.videoOverlay}>
            <View style={styles.playButton}>
              <Play size={24} color="#fff" fill="#fff" />
            </View>
            <Text style={styles.videoLabel} numberOfLines={1}>
              Watch on YouTube
            </Text>
            <ExternalLink size={14} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Project Title + Language Selector + Regenerate */}
      <View style={styles.titleBar}>
        <View style={styles.titleLeft}>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {currentProject.title}
          </Text>
          <TouchableOpacity
            style={[styles.badge, styles.languageBadge]}
            onPress={() => setShowLanguagePicker(true)}
          >
            <Text style={[styles.badgeText, { color: '#E8550C' }]}>
              {currentProject.detectedLanguage}
            </Text>
            <ChevronDown size={12} color="#E8550C" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleRegenerate}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#E8550C" />
          ) : (
            <RefreshCw size={18} color="#E8550C" />
          )}
        </TouchableOpacity>
      </View>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.languagePickerContainer}>
            <Text style={styles.languagePickerTitle}>Select Language</Text>
            <ScrollView style={styles.languageList}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.languageOption,
                    currentProject.detectedLanguage === lang && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageChange(lang)}
                >
                  <Text
                    style={[
                      styles.languageOptionText,
                      currentProject.detectedLanguage === lang && styles.languageOptionTextActive,
                    ]}
                  >
                    {lang}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

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
              <BookOpen size={36} color="#A1A1A1" />
              <Text style={styles.emptyListTitle}>No vocabulary items</Text>
              <Text style={styles.emptyListText}>
                Tap the regenerate button to analyze the video for vocabulary
              </Text>
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
              <BookOpen size={36} color="#A1A1A1" />
              <Text style={styles.emptyListTitle}>No grammar items</Text>
              <Text style={styles.emptyListText}>
                Tap the regenerate button to analyze the video for grammar patterns
              </Text>
            </View>
          }
        />
      )}

      {activeTab === 'script' && (
        <ScrollView style={styles.scriptContainer} contentContainerStyle={styles.scriptContent}>
          {currentProject.script ? (
            <View style={styles.scriptHeader}>
              <TouchableOpacity
                style={[
                  styles.speakScriptButton,
                  isPlaying && currentText === currentProject.script && { backgroundColor: '#E8550C' },
                ]}
                onPress={() => speak(currentProject.script)}
              >
                <Volume2
                  size={16}
                  color={isPlaying && currentText === currentProject.script ? '#fff' : '#E8550C'}
                />
                <Text
                  style={[
                    styles.speakScriptText,
                    isPlaying && currentText === currentProject.script && styles.speakScriptTextActive,
                  ]}
                >
                  {isPlaying && currentText === currentProject.script ? 'Playing...' : 'Play Script'}
                </Text>
              </TouchableOpacity>
              {highlightedWords.length > 0 && (
                <TouchableOpacity
                  style={styles.clearHighlightsButton}
                  onPress={() => setHighlightedWords([])}
                >
                  <XCircle size={14} color="#A1A1A1" />
                  <Text style={styles.clearHighlightsText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
          <Text style={styles.scriptText}>
            {currentProject.script
              ? renderInteractiveScript(currentProject.script)
              : 'No script available'}
          </Text>
          <Text style={styles.scriptHint}>Tap words to highlight</Text>
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
  videoPreview: {
    backgroundColor: '#171717',
    height: 56,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(232, 85, 12, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusBannerText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statusDetail: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#E8550C',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  languageBadge: {
    backgroundColor: '#FFF5EA',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languagePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '80%',
    maxHeight: 400,
    padding: 16,
  },
  languagePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 12,
    textAlign: 'center',
  },
  languageList: {
    maxHeight: 340,
  },
  languageOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  languageOptionActive: {
    backgroundColor: '#FFF5EA',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#525252',
  },
  languageOptionTextActive: {
    color: '#E8550C',
    fontWeight: '600',
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
  scriptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  speakScriptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF5EA',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  speakScriptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E8550C',
  },
  speakScriptTextActive: {
    color: '#fff',
  },
  scriptText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  scriptWord: {
    fontSize: 16,
    lineHeight: 26,
    color: '#000',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scriptWordHighlighted: {
    backgroundColor: 'rgba(232, 85, 12, 0.2)',
    fontWeight: '500',
  },
  scriptHint: {
    fontSize: 12,
    color: '#A1A1A1',
    textAlign: 'center',
    marginTop: 16,
  },
  clearHighlightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  clearHighlightsText: {
    fontSize: 13,
    color: '#A1A1A1',
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
    gap: 8,
  },
  emptyListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#525252',
  },
  emptyListText: {
    fontSize: 14,
    color: '#A1A1A1',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default StudyScreen;

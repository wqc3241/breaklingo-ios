import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Keyboard,
  Dimensions,
} from 'react-native';
import { Search, Clock, X, ChevronDown, ChevronRight, Play, BookOpen } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { TEST_TRANSCRIPT, TEST_VIDEO_TITLE, TEST_VIDEO_URL } from '../lib/constants';
import { getRecommendationsByLanguage } from '../lib/recommendedVideos';
import { getDifficultyColor } from '../lib/theme';
import type { YouTubeSearchResult, CuratedVideo } from '../lib/types';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_GAP = 10;
const CARD_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_PADDING * 2 - CARD_GAP) / 2;

const InputScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedRecLang, setSelectedRecLang] = useState('Japanese');
  const [showHistory, setShowHistory] = useState(false);
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const { isProcessing, processingStep, extractVideoId, processVideo, analyzeContentWithAI, generatePracticeSentences, setIsProcessing, setProcessingStep, cleanup } = useVideoProcessing();
  const { currentProject, setCurrentProject, autoSaveProject } = useProjectContext();
  const { results, isSearching, hasSearched, search, clearSearch } = useYouTubeSearch();
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleSearch = useCallback(async () => {
    const query = searchQuery.trim();
    if (!query) return;
    Keyboard.dismiss();
    setShowHistory(false);
    await addToHistory(query);
    await search(query);
  }, [searchQuery, search, addToHistory]);

  const handleHistorySelect = useCallback(async (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
    Keyboard.dismiss();
    await addToHistory(query);
    await search(query);
  }, [search, addToHistory]);

  const handleVideoSelect = async (videoId: string) => {
    if (isProcessing) return;

    try {
      const project = await processVideo(
        videoId,
        undefined, // auto-detect language
        undefined,
        user?.id,
        (updatedProject) => {
          setCurrentProject(updatedProject);
          autoSaveProject(updatedProject);
        }
      );

      setCurrentProject(project);
      await autoSaveProject(project);
      setYoutubeUrl('');
      setSearchQuery('');
      clearSearch();
      navigation.navigate('MoreTab', { screen: 'Study' });
    } catch {
      // Error already handled in processVideo
    }
  };

  const handleUrlSubmit = () => {
    if (!youtubeUrl.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    const videoId = extractVideoId(youtubeUrl.trim());
    if (!videoId) {
      Alert.alert('Invalid URL', 'Please enter a valid YouTube video URL');
      return;
    }

    handleVideoSelect(videoId);
  };

  const handleUseTestData = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      setProcessingStep('Loading test transcript...');
      const transcript = TEST_TRANSCRIPT;

      setProcessingStep('Analyzing content with AI...');
      const { vocabulary, grammar, detectedLanguage } = await analyzeContentWithAI(transcript);

      setProcessingStep('Generating practice sentences...');
      const practiceSentences = await generatePracticeSentences(vocabulary, grammar, detectedLanguage);

      const project = {
        id: Date.now(),
        title: TEST_VIDEO_TITLE,
        url: TEST_VIDEO_URL,
        script: transcript,
        vocabulary,
        grammar,
        detectedLanguage,
        practiceSentences,
        status: 'completed' as const,
        userId: user?.id,
      };

      setCurrentProject(project);
      await autoSaveProject(project);
      Alert.alert('Demo loaded', `Lesson ready for study. Language: ${detectedLanguage}`);
      navigation.navigate('MoreTab', { screen: 'Study' });
    } catch {
      Alert.alert('Loading failed', 'Could not load demo data');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const recommendedByLanguage = getRecommendationsByLanguage();
  const recLanguages = Object.keys(recommendedByLanguage);

  const renderVideoCardGrid = (item: YouTubeSearchResult) => (
    <TouchableOpacity
      key={item.videoId}
      style={styles.videoCardGrid}
      onPress={() => handleVideoSelect(item.videoId)}
      disabled={isProcessing}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnailGrid}
        resizeMode="cover"
      />
      <View style={styles.videoInfoGrid}>
        <Text style={styles.videoTitleGrid} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoChannelGrid} numberOfLines={1}>{item.channelTitle}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCuratedCardGrid = (item: CuratedVideo) => (
    <TouchableOpacity
      key={item.videoId}
      style={styles.videoCardGrid}
      onPress={() => handleVideoSelect(item.videoId)}
      disabled={isProcessing}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnailGrid}
        resizeMode="cover"
      />
      <View style={styles.videoInfoGrid}>
        <Text style={styles.videoTitleGrid} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoChannelGrid} numberOfLines={1}>{item.channelTitle}</Text>
        <View style={styles.curatedMeta}>
          <View style={[styles.levelBadge, {
            backgroundColor: getDifficultyColor(item.level).bg,
          }]}>
            <Text style={[styles.levelText, {
              color: getDifficultyColor(item.level).text,
            }]}>{item.level}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Current Lesson Indicator */}
        {currentProject && (
          <TouchableOpacity
            style={styles.lessonBanner}
            onPress={() => navigation.navigate('MoreTab', { screen: 'Study' })}
          >
            <BookOpen size={16} color="#E8550C" />
            <View style={styles.lessonBannerInfo}>
              <Text style={styles.lessonBannerLabel}>CURRENT LESSON</Text>
              <Text style={styles.lessonBannerTitle} numberOfLines={1}>
                {currentProject.title || 'No lesson selected'}
              </Text>
            </View>
            <Text style={styles.lessonBannerStatus}>
              {currentProject.status === 'pending'
                ? 'Processing...'
                : currentProject.status === 'failed'
                ? 'Failed'
                : 'Ready'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Search Bar */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Search size={18} color="#A1A1A1" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search YouTube videos..."
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowHistory(text.length > 0 && !hasSearched);
              }}
              onFocus={() => setShowHistory(searchQuery.length === 0 && history.length > 0)}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); clearSearch(); setShowHistory(false); }}>
                <X size={16} color="#A1A1A1" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.searchButton, isSearching && styles.disabledButton]}
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchButtonText}>Search</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Search History Dropdown */}
          {showHistory && history.length > 0 && (
            <View style={styles.historyDropdown}>
              {history.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.historyItem}
                  onPress={() => handleHistorySelect(item)}
                >
                  <Clock size={14} color="#A1A1A1" />
                  <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
                  <TouchableOpacity onPress={() => removeFromHistory(item)}>
                    <X size={16} color="#A1A1A1" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.clearHistoryButton} onPress={clearHistory}>
                <Text style={styles.clearHistoryText}>Clear History</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Processing Indicator */}
        {isProcessing && processingStep ? (
          <View style={styles.processingCard}>
            <ActivityIndicator size="small" color="#E8550C" />
            <Text style={styles.processingText}>{processingStep}</Text>
          </View>
        ) : null}

        {/* URL Input (secondary) */}
        <TouchableOpacity
          style={styles.urlToggle}
          onPress={() => setShowUrlInput(!showUrlInput)}
        >
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
            {showUrlInput ? <ChevronDown size={14} color="#E8550C" /> : <ChevronRight size={14} color="#E8550C" />}
            <Text style={{color: '#E8550C', fontSize: 14}}>{showUrlInput ? 'Hide URL input' : 'Paste YouTube URL instead'}</Text>
          </View>
        </TouchableOpacity>

        {showUrlInput && (
          <View style={styles.urlCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="Paste YouTube URL..."
                value={youtubeUrl}
                onChangeText={setYoutubeUrl}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleUrlSubmit}
              />
              <TouchableOpacity
                style={[styles.submitButton, isProcessing && styles.disabledButton]}
                onPress={handleUrlSubmit}
                disabled={isProcessing}
              >
                <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Search Results — 2-column grid */}
        {hasSearched && results.length > 0 && (
          <View style={styles.section}>
            <View style={styles.searchResultsHeader}>
              <Text style={styles.resultCount}>{results.length} results found</Text>
              <TouchableOpacity onPress={() => { clearSearch(); setSearchQuery(''); }}>
                <Text style={styles.clearSearchText}>Clear search</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.gridContainer}>
              {results.map((item) => renderVideoCardGrid(item))}
            </View>
          </View>
        )}

        {hasSearched && results.length === 0 && !isSearching && (
          <View style={styles.emptyResults}>
            <Text style={styles.emptyResultsText}>No videos found. Try a different search.</Text>
          </View>
        )}

        {/* Recommended Videos (shown when no search results) */}
        {!hasSearched && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommended Videos</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.langTabs}
              contentContainerStyle={styles.langTabsContent}
            >
              {recLanguages.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    styles.langTab,
                    selectedRecLang === lang && styles.langTabActive,
                  ]}
                  onPress={() => setSelectedRecLang(lang)}
                >
                  <Text style={[
                    styles.langTabText,
                    selectedRecLang === lang && styles.langTabTextActive,
                  ]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.gridContainer}>
              {(recommendedByLanguage[selectedRecLang] || []).map((item) =>
                renderCuratedCardGrid(item)
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: CARD_PADDING,
    paddingBottom: 40,
  },
  // Current lesson banner
  lessonBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5EA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  lessonBannerInfo: {
    flex: 1,
  },
  lessonBannerLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A1A1A1',
    letterSpacing: 0.5,
  },
  lessonBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginTop: 1,
  },
  lessonBannerStatus: {
    fontSize: 12,
    color: '#E8550C',
    fontWeight: '500',
  },
  // Search
  searchCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#E8550C',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // History
  historyDropdown: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#D4D4D4',
    paddingTop: 8,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#525252',
  },
  clearHistoryButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  clearHistoryText: {
    fontSize: 13,
    color: '#E8550C',
  },
  // Processing
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5EA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  processingText: {
    fontSize: 14,
    color: '#E8550C',
  },
  // URL toggle
  urlToggle: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  urlCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#E8550C',
    borderRadius: 10,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Section
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  // Search results header
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultCount: {
    fontSize: 14,
    color: '#525252',
  },
  clearSearchText: {
    fontSize: 14,
    color: '#E8550C',
    fontWeight: '500',
  },
  // 2-column grid
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  videoCardGrid: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  thumbnailGrid: {
    width: '100%',
    height: CARD_WIDTH * 0.6,
    backgroundColor: '#D4D4D4',
  },
  videoInfoGrid: {
    padding: 8,
  },
  videoTitleGrid: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
    lineHeight: 18,
  },
  videoChannelGrid: {
    fontSize: 11,
    color: '#A1A1A1',
    marginBottom: 4,
  },
  // Curated
  curatedMeta: {
    flexDirection: 'row',
    gap: 6,
  },
  levelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Language Tabs
  langTabs: {
    marginBottom: 12,
  },
  langTabsContent: {
    gap: 8,
  },
  langTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  langTabActive: {
    backgroundColor: '#E8550C',
    borderColor: '#E8550C',
  },
  langTabText: {
    fontSize: 14,
    color: '#525252',
    fontWeight: '500',
  },
  langTabTextActive: {
    color: '#fff',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsText: {
    fontSize: 15,
    color: '#A1A1A1',
  },
});

export default InputScreen;

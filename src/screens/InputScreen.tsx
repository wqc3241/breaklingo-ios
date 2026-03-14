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
  Modal,
  FlatList,
  Image,
  Keyboard,
} from 'react-native';
import { Search, Clock, X, ChevronDown, ChevronRight, Play, Check } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { LANGUAGES, LANGUAGE_CODE_MAP } from '../lib/constants';
import { getRecommendationsByLanguage, CURATED_VIDEOS } from '../lib/recommendedVideos';
import type { YouTubeSearchResult, CuratedVideo } from '../lib/types';

const InputScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [pendingVideoId, setPendingVideoId] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedRecLang, setSelectedRecLang] = useState('Japanese');
  const [showHistory, setShowHistory] = useState(false);
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const { isProcessing, processingStep, extractVideoId, processVideo, cleanup } = useVideoProcessing();
  const { setCurrentProject, autoSaveProject } = useProjectContext();
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

  const handleVideoSelect = (videoId: string) => {
    setPendingVideoId(videoId);
    setShowLanguagePicker(true);
    setSelectedLanguage('');
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

  const handleLanguageSelected = async () => {
    if (!pendingVideoId || !selectedLanguage) return;
    setShowLanguagePicker(false);

    try {
      const languageCode = LANGUAGE_CODE_MAP[selectedLanguage];
      const project = await processVideo(
        pendingVideoId,
        languageCode,
        selectedLanguage,
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

  const recommendedByLanguage = getRecommendationsByLanguage();
  const recLanguages = Object.keys(recommendedByLanguage);

  const renderVideoCard = ({ item }: { item: YouTubeSearchResult }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => handleVideoSelect(item.videoId)}
      disabled={isProcessing}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoChannel}>{item.channelTitle}</Text>
        <Text style={styles.videoDate}>
          {new Date(item.publishedAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCuratedCard = ({ item }: { item: CuratedVideo }) => (
    <TouchableOpacity
      style={styles.curatedCard}
      onPress={() => handleVideoSelect(item.videoId)}
      disabled={isProcessing}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.curatedThumbnail}
        resizeMode="cover"
      />
      <View style={styles.curatedInfo}>
        <Text style={styles.curatedTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.curatedChannel}>{item.channelTitle}</Text>
        <View style={styles.curatedMeta}>
          <View style={[styles.levelBadge, {
            backgroundColor: item.level === 'beginner' ? '#D1FAE5' : item.level === 'intermediate' ? '#FEF3C7' : '#FEE2E2',
          }]}>
            <Text style={[styles.levelText, {
              color: item.level === 'beginner' ? '#065F46' : item.level === 'intermediate' ? '#92400E' : '#991B1B',
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
                <Text style={styles.searchButtonText}>Go</Text>
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
          <Text style={styles.urlToggleText}>
            {showUrlInput ? '▾ Hide URL input' : '▸ Paste YouTube URL instead'}
          </Text>
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

        {/* Search Results */}
        {hasSearched && results.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Search Results</Text>
            {results.map((item) => (
              <React.Fragment key={item.videoId}>
                {renderVideoCard({ item })}
              </React.Fragment>
            ))}
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
            {(recommendedByLanguage[selectedRecLang] || []).map((item) => (
              <React.Fragment key={item.videoId}>
                {renderCuratedCard({ item })}
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Language</Text>
            <Text style={styles.modalSubtitle}>
              Choose the language you want to learn from this video
            </Text>
            <FlatList
              data={[...LANGUAGES, { code: 'other', name: 'Other' }]}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.name && styles.languageItemSelected,
                  ]}
                  onPress={() => setSelectedLanguage(item.name)}
                >
                  <Text
                    style={[
                      styles.languageText,
                      selectedLanguage === item.name && styles.languageTextSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  {selectedLanguage === item.name && (
                    <Check size={14} color="#065F46" />
                  )}
                </TouchableOpacity>
              )}
              style={styles.languageList}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.primaryButton, !selectedLanguage && styles.disabledButton]}
                onPress={handleLanguageSelected}
                disabled={!selectedLanguage}
              >
                <Text style={styles.modalButtonTextWhite}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.outlineButton]}
                onPress={() => {
                  setShowLanguagePicker(false);
                  setSelectedLanguage('');
                  setPendingVideoId('');
                }}
              >
                <Text style={styles.modalButtonTextDark}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    fontSize: 16,
    color: '#A1A1A1',
    padding: 4,
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
  historyIcon: {
    fontSize: 14,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#525252',
  },
  historyRemove: {
    fontSize: 14,
    color: '#A1A1A1',
    padding: 4,
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
  urlToggleText: {
    fontSize: 14,
    color: '#E8550C',
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
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  disabledButton: {
    opacity: 0.5,
  },
  // Video Cards
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  videoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#D4D4D4',
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  videoChannel: {
    fontSize: 14,
    color: '#A1A1A1',
    marginBottom: 2,
  },
  videoDate: {
    fontSize: 12,
    color: '#D4D4D4',
  },
  // Curated Videos
  curatedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  curatedThumbnail: {
    width: 120,
    height: 90,
    backgroundColor: '#D4D4D4',
  },
  curatedInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  curatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  curatedChannel: {
    fontSize: 12,
    color: '#A1A1A1',
    marginBottom: 6,
  },
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
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#A1A1A1',
    marginBottom: 16,
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  languageItemSelected: {
    backgroundColor: '#FFF5EA',
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  languageTextSelected: {
    color: '#E8550C',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#E8550C',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#E8550C',
  },
  outlineButton: {
    backgroundColor: '#F5F5F5',
  },
  modalButtonTextWhite: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextDark: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default InputScreen;

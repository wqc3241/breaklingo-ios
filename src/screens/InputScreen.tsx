import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useVideoProcessing } from '../hooks/useVideoProcessing';
import { useProject } from '../hooks/useProject';
import { useAuth } from '../hooks/useAuth';
import { LANGUAGES, LANGUAGE_CODE_MAP } from '../lib/constants';

const InputScreen: React.FC = () => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [pendingVideoId, setPendingVideoId] = useState('');
  const navigation = useNavigation<any>();

  const { user } = useAuth();
  const { isProcessing, processingStep, extractVideoId, processVideo, cleanup } = useVideoProcessing();
  const { setCurrentProject, autoSaveProject } = useProject(user);

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

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

    setPendingVideoId(videoId);
    setShowLanguagePicker(true);
    setSelectedLanguage('');
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

      // Navigate to Study tab
      navigation.navigate('StudyTab');
    } catch (error) {
      // Error already handled in processVideo
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* URL Input Card */}
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.addLabel}>+</Text>
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
              {isProcessing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>▶</Text>
              )}
            </TouchableOpacity>
          </View>
          {isProcessing && processingStep ? (
            <View style={styles.processingRow}>
              <ActivityIndicator size="small" color="#8E8E93" />
              <Text style={styles.processingText}>{processingStep}</Text>
            </View>
          ) : null}
        </View>

        {/* Empty State */}
        {!isProcessing && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyTitle}>Add a video to start learning</Text>
            <Text style={styles.emptySubtitle}>
              Paste a YouTube URL above to extract vocabulary, grammar, and practice sentences.
            </Text>
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
                    <Text style={styles.checkmark}>✓</Text>
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
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addLabel: {
    fontSize: 18,
    color: '#8E8E93',
    fontWeight: '500',
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#007AFF',
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
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  processingText: {
    fontSize: 13,
    color: '#8E8E93',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 80,
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
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
    color: '#8E8E93',
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
    backgroundColor: '#E8F0FE',
  },
  languageText: {
    fontSize: 16,
    color: '#000',
  },
  languageTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#007AFF',
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
    backgroundColor: '#007AFF',
  },
  outlineButton: {
    backgroundColor: '#F2F2F7',
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

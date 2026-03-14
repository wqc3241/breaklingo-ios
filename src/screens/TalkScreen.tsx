import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Square, Send } from 'lucide-react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { useConversation } from '../hooks/useConversation';
import { loadSessions, deleteSession } from '../lib/conversationStorage';
import type { AppProject, ConversationMessage, ConversationSession } from '../lib/types';

type TalkView = 'projectSelect' | 'conversation' | 'summary' | 'history';

const TalkScreen: React.FC = () => {
  const [view, setView] = useState<TalkView>('projectSelect');
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [textInput, setTextInput] = useState('');
  const [pastSessions, setPastSessions] = useState<ConversationSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();
  const { fetchProjects } = useProjectContext();
  const {
    messages,
    state,
    summary,
    isListening,
    isTranscribing,
    finalTranscript,
    isPlaying,
    startConversation,
    sendTextMessage,
    handleVoiceInput,
    stopConversation,
    resetConversation,
  } = useConversation();

  useEffect(() => {
    loadProjectList();
    loadHistory();
  }, []);

  const loadProjectList = async () => {
    const data = await fetchProjects();
    setProjects(data.filter((p) => p.status === 'completed' && (p.vocabulary?.length || 0) > 0));
  };

  const loadHistory = async () => {
    const sessions = await loadSessions();
    setPastSessions(sessions);
  };

  const handleProjectSelect = async (project: AppProject) => {
    setView('conversation');
    await startConversation(project);
  };

  const handleSendText = async () => {
    const text = textInput.trim();
    if (!text) return;
    setTextInput('');
    await sendTextMessage(text);
  };

  const handleStop = async () => {
    await stopConversation();
    setView('summary');
  };

  const handleDone = () => {
    resetConversation();
    setView('projectSelect');
    loadHistory();
  };

  const handleDeleteSession = async (sessionId: string) => {
    Alert.alert('Delete Session', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteSession(sessionId);
          await loadHistory();
        },
      },
    ]);
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const getStatusLabel = () => {
    switch (state) {
      case 'listening': return '🎤 Listening...';
      case 'processing': return '⏳ Processing...';
      case 'speaking': return '🔊 Speaking...';
      default: return '';
    }
  };

  // Project Select View
  if (view === 'projectSelect') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Talk with AI</Text>
          <TouchableOpacity onPress={() => setView('history')}>
            <Text style={styles.historyLink}>History</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Choose a project to practice speaking</Text>

        {projects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Mic size={48} color="#A1A1A1" />
            </View>
            <Text style={styles.emptyTitle}>No projects ready</Text>
            <Text style={styles.emptySubtitle}>
              Complete a video analysis first to start voice practice
            </Text>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.projectCard}
                onPress={() => handleProjectSelect(item)}
              >
                <Text style={styles.projectTitle} numberOfLines={1}>{item.title}</Text>
                <View style={styles.projectMeta}>
                  <View style={[styles.badge, { backgroundColor: '#FFF5EA' }]}>
                    <Text style={[styles.badgeText, { color: '#E8550C' }]}>
                      {item.detectedLanguage}
                    </Text>
                  </View>
                  <Text style={styles.metaText}>{item.vocabulary?.length || 0} vocab</Text>
                  <Text style={styles.metaText}>{item.grammar?.length || 0} grammar</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    );
  }

  // History View
  if (view === 'history') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setView('projectSelect')}>
            <Text style={styles.backLink}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={{ width: 50 }} />
        </View>

        {pastSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No past conversations</Text>
          </View>
        ) : (
          <FlatList
            data={pastSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.sessionCard}
                onPress={() => setExpandedSession(expandedSession === item.id ? null : item.id)}
                onLongPress={() => handleDeleteSession(item.id)}
              >
                <Text style={styles.sessionTitle}>{item.projectTitle}</Text>
                <View style={styles.sessionMeta}>
                  <Text style={styles.metaText}>{item.language}</Text>
                  <Text style={styles.metaText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {item.summary && (
                    <Text style={styles.scoreText}>Score: {item.summary.score}%</Text>
                  )}
                </View>
                {expandedSession === item.id && item.summary && (
                  <View style={styles.expandedSummary}>
                    <Text style={styles.summaryText}>{item.summary.overallFeedback}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </SafeAreaView>
    );
  }

  // Summary View
  if (view === 'summary') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryEmoji}>
            <Mic size={48} color="#A1A1A1" />
          </View>
          <Text style={styles.summaryTitle}>Conversation Complete!</Text>

          {summary ? (
            <>
              <Text style={styles.summaryScore}>Score: {summary.score}%</Text>
              <Text style={styles.summaryFeedback}>{summary.overallFeedback}</Text>

              {summary.vocabularyFeedback.length > 0 && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Vocabulary</Text>
                  {summary.vocabularyFeedback.map((item, i) => (
                    <Text key={i} style={styles.feedbackItem}>• {item}</Text>
                  ))}
                </View>
              )}

              {summary.grammarFeedback.length > 0 && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Grammar</Text>
                  {summary.grammarFeedback.map((item, i) => (
                    <Text key={i} style={styles.feedbackItem}>• {item}</Text>
                  ))}
                </View>
              )}
            </>
          ) : (
            <Text style={styles.metaText}>No summary available</Text>
          )}

          <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Conversation View
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        {/* Status bar */}
        {state !== 'idle' && (
          <View style={styles.statusBar}>
            <Text style={styles.statusText}>{getStatusLabel()}</Text>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => `msg-${i}`}
          renderItem={({ item }: { item: ConversationMessage }) => (
            <View style={[
              styles.messageBubble,
              item.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}>
              <Text style={[
                styles.messageText,
                item.role === 'user' ? styles.userText : styles.aiText,
              ]}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContent}
        />

        {/* Live transcript */}
        {isListening && finalTranscript && (
          <View style={styles.liveTranscript}>
            <Text style={styles.liveTranscriptText}>{finalTranscript}</Text>
          </View>
        )}

        {/* Input area */}
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[
              styles.micButton,
              isListening && styles.micButtonActive,
              state === 'processing' && styles.micButtonDisabled,
            ]}
            onPress={handleVoiceInput}
            disabled={state === 'processing' || state === 'speaking'}
          >
            {isTranscribing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              isListening ? <Square size={16} color="#DC2626" /> : <Mic size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
          />

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendText}
            disabled={!textInput.trim() || state !== 'idle'}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.stopText}>End</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  flex: {
    flex: 1,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#A1A1A1',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  historyLink: {
    fontSize: 15,
    color: '#E8550C',
    fontWeight: '500',
  },
  backLink: {
    fontSize: 15,
    color: '#E8550C',
    fontWeight: '500',
  },
  // Project list
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  projectCard: {
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
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  metaText: {
    fontSize: 13,
    color: '#A1A1A1',
  },
  // Empty
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
  // Status bar
  statusBar: {
    backgroundColor: '#FFF5EA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    color: '#E8550C',
    fontWeight: '500',
  },
  // Messages
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E8550C',
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  aiText: {
    color: '#000',
  },
  // Live transcript
  liveTranscript: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  liveTranscriptText: {
    fontSize: 14,
    color: '#92400E',
    fontStyle: 'italic',
  },
  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#D4D4D4',
    gap: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: '#FF6B60',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micIcon: {
    fontSize: 20,
    color: '#fff',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8550C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  stopButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  stopText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  // History
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreText: {
    fontSize: 13,
    color: '#E8550C',
    fontWeight: '500',
  },
  expandedSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D4D4D4',
  },
  summaryText: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 20,
  },
  // Summary
  summaryContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  summaryScore: {
    fontSize: 20,
    fontWeight: '600',
    color: '#E8550C',
    marginBottom: 16,
  },
  summaryFeedback: {
    fontSize: 16,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  feedbackSection: {
    width: '100%',
    marginBottom: 16,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1A1',
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 14,
    color: '#525252',
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: '#E8550C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TalkScreen;

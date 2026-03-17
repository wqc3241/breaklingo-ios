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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Mic,
  Square,
  Send,
  Volume2,
  ArrowLeft,
  MessageCircle,
  Clock,
  BookOpen,
  Languages,
  ChevronRight,
} from 'lucide-react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useAuth } from '../hooks/useAuth';
import { useConversation } from '../hooks/useConversation';
import { loadSessions, deleteSession } from '../lib/conversationStorage';
import { colors } from '../lib/theme';
import type { AppProject, ConversationMessage, ConversationSession } from '../lib/types';

type TalkView = 'projectSelect' | 'conversation' | 'summary' | 'history';

const formatLastAccessed = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
};

const TalkScreen: React.FC = () => {
  const [view, setView] = useState<TalkView>('projectSelect');
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(null);
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
    setIsLoading(true);
    const data = await fetchProjects();
    setProjects(data.filter((p) => p.status === 'completed' && (p.vocabulary?.length || 0) > 0));
    setIsLoading(false);
    setIsRefreshing(false);
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    loadProjectList();
  };

  const loadHistory = async () => {
    const sessions = await loadSessions();
    setPastSessions(sessions);
  };

  const handleProjectSelect = async (project: AppProject) => {
    setSelectedProject(project);
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

  const handleBackToProjects = () => {
    Alert.alert(
      'End Conversation',
      'Are you sure you want to leave this conversation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            resetConversation();
            setSelectedProject(null);
            setView('projectSelect');
          },
        },
      ]
    );
  };

  const handleDone = () => {
    resetConversation();
    setSelectedProject(null);
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

  const filteredProjects = projects.filter(
    (p) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.detectedLanguage || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = () => {
    switch (state) {
      case 'listening': return <Mic size={14} color={colors.primary} />;
      case 'processing': return <ActivityIndicator size="small" color={colors.primary} />;
      case 'speaking': return <Volume2 size={14} color={colors.primary} />;
      default: return null;
    }
  };

  const getStatusLabel = () => {
    switch (state) {
      case 'listening': return 'Listening...';
      case 'processing': return 'Processing...';
      case 'speaking': return 'Speaking...';
      default: return '';
    }
  };

  // Project Select View
  if (view === 'projectSelect') {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Talk with AI</Text>
          <TouchableOpacity onPress={() => setView('history')} style={styles.historyButton}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.historyLink}>History</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Choose a project to practice speaking</Text>

        {pastSessions.length > 0 && !searchQuery && (
          <View style={styles.recentSection}>
            <Text style={styles.recentSectionTitle}>Recent Conversations</Text>
            {pastSessions.slice(0, 3).map((session) => (
              <TouchableOpacity
                key={session.id}
                style={styles.recentSessionCard}
                onPress={() => {
                  const project = projects.find((p) => String(p.id) === String(session.projectId));
                  if (project) {
                    handleProjectSelect(project);
                  } else {
                    setView('history');
                  }
                }}
              >
                <View style={styles.recentSessionIcon}>
                  <MessageCircle size={16} color={colors.primary} />
                </View>
                <View style={styles.recentSessionContent}>
                  <Text style={styles.recentSessionTitle} numberOfLines={1}>{session.projectTitle}</Text>
                  <View style={styles.recentSessionMeta}>
                    <Text style={styles.metaText}>
                      {formatLastAccessed(new Date(session.createdAt).toISOString())}
                    </Text>
                    {session.summary && (
                      <>
                        <Text style={styles.metaDot}>{'\u00B7'}</Text>
                        <Text style={styles.scoreText}>{session.summary.score}%</Text>
                      </>
                    )}
                  </View>
                </View>
                <ChevronRight size={16} color={colors.muted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.muted}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <MessageCircle size={48} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching projects' : 'No projects ready'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term'
                : 'Complete a video analysis first to start voice practice'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.projectCard}
                onPress={() => handleProjectSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.projectCardHeader}>
                  <Text style={styles.projectTitle} numberOfLines={2}>
                    {item.title || 'Untitled Project'}
                  </Text>
                  <Mic size={18} color={colors.primary} />
                </View>
                <View style={styles.projectMeta}>
                  <View style={styles.languageBadge}>
                    <Languages size={12} color={colors.primary} />
                    <Text style={styles.languageBadgeText}>
                      {item.detectedLanguage}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <BookOpen size={12} color={colors.muted} />
                    <Text style={styles.metaText}>{item.vocabulary?.length || 0} vocab</Text>
                  </View>
                  <Text style={styles.metaDot}>{'\u00B7'}</Text>
                  <Text style={styles.metaText}>{item.grammar?.length || 0} grammar</Text>
                  {item.lastAccessed && (
                    <>
                      <Text style={styles.metaDot}>{'\u00B7'}</Text>
                      <Text style={styles.metaText}>{formatLastAccessed(item.lastAccessed)}</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
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
          <TouchableOpacity onPress={() => setView('projectSelect')} style={styles.backButton}>
            <ArrowLeft size={18} color={colors.primary} />
            <Text style={styles.backLink}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>History</Text>
          <View style={{ width: 60 }} />
        </View>

        {pastSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Clock size={48} color={colors.muted} />
            </View>
            <Text style={styles.emptyTitle}>No past conversations</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation to see your history here
            </Text>
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
                  <View style={styles.languageBadge}>
                    <Languages size={11} color={colors.primary} />
                    <Text style={styles.languageBadgeText}>{item.language}</Text>
                  </View>
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
          <View style={styles.summaryIconContainer}>
            <View style={styles.summaryIconCircle}>
              <MessageCircle size={36} color={colors.primary} />
            </View>
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
                    <Text key={i} style={styles.feedbackItem}>{'\u2022'} {item}</Text>
                  ))}
                </View>
              )}

              {summary.grammarFeedback.length > 0 && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackLabel}>Grammar</Text>
                  {summary.grammarFeedback.map((item, i) => (
                    <Text key={i} style={styles.feedbackItem}>{'\u2022'} {item}</Text>
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
        {/* Conversation header with project info and back button */}
        <View style={styles.conversationHeader}>
          <TouchableOpacity onPress={handleBackToProjects} style={styles.backButton}>
            <ArrowLeft size={18} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.conversationHeaderInfo}>
            <Text style={styles.conversationHeaderTitle} numberOfLines={1}>
              {selectedProject?.title || 'Conversation'}
            </Text>
            <Text style={styles.conversationHeaderLang}>
              {selectedProject?.detectedLanguage || ''}
            </Text>
          </View>
          <TouchableOpacity style={styles.endButton} onPress={handleStop}>
            <Text style={styles.endButtonText}>End</Text>
          </TouchableOpacity>
        </View>

        {/* Status bar */}
        {state !== 'idle' && (
          <View style={styles.statusBar}>
            {getStatusIcon()}
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
              isListening ? <Square size={16} color={colors.recording} /> : <Mic size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={textInput}
            onChangeText={setTextInput}
            onSubmitEditing={handleSendText}
            returnKeyType="send"
            placeholderTextColor={colors.muted}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!textInput.trim() || state !== 'idle') && styles.sendButtonDisabled,
            ]}
            onPress={handleSendText}
            disabled={!textInput.trim() || state !== 'idle'}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.foreground,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.muted,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  backLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: '500',
  },
  // Recent conversations
  recentSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  recentSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  recentSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
  },
  recentSessionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryTinted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentSessionContent: {
    flex: 1,
  },
  recentSessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 2,
  },
  recentSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.foreground,
  },
  // Loading
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Project list
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  projectCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  projectCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
    marginRight: 8,
  },
  projectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  languageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryTinted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  languageBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: colors.muted,
  },
  metaDot: {
    fontSize: 13,
    color: colors.muted,
  },
  // Empty
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Conversation header
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversationHeaderInfo: {
    flex: 1,
    marginLeft: 8,
  },
  conversationHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
  },
  conversationHeaderLang: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
  endButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.recording,
  },
  endButtonText: {
    color: colors.recording,
    fontSize: 14,
    fontWeight: '600',
  },
  // Status bar
  statusBar: {
    flexDirection: 'row',
    backgroundColor: colors.primaryTinted,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    color: colors.primary,
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
    backgroundColor: colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  aiText: {
    color: colors.foreground,
  },
  // Live transcript
  liveTranscript: {
    backgroundColor: colors.transcriptBg,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  liveTranscriptText: {
    fontSize: 14,
    color: colors.transcriptText,
    fontStyle: 'italic',
  },
  // Input area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.recording,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.recordingLight,
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
    color: colors.foreground,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  // History
  sessionCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  scoreText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '500',
  },
  expandedSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryText: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },
  // Summary
  summaryContainer: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryIconContainer: {
    marginBottom: 16,
  },
  summaryIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryTinted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  summaryScore: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 16,
  },
  summaryFeedback: {
    fontSize: 16,
    color: colors.secondary,
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
    color: colors.muted,
    marginBottom: 6,
  },
  feedbackItem: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 22,
  },
  doneButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TalkScreen;

import React, { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { useProjectList } from '../hooks/useProjectList';
import { useConversation } from '../hooks/useConversation';
import { useStopAudioOnBlur } from '../hooks/useStopAudioOnBlur';
import { useStreak } from '../hooks/useStreak';
import { useExperience } from '../hooks/useExperience';
import { loadSessions, deleteSession } from '../lib/conversationStorage';
import type { AppProject, ConversationSession } from '../lib/types';

import TalkProjectSelect from './talk/TalkProjectSelect';
import TalkConversation from './talk/TalkConversation';
import TalkHistory from './talk/TalkHistory';
import TalkSummary from './talk/TalkSummary';

type TalkView = 'projectSelect' | 'conversation' | 'summary' | 'history';

const TalkScreen: React.FC = () => {
  const [view, setView] = useState<TalkView>('projectSelect');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(null);
  const [pastSessions, setPastSessions] = useState<ConversationSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { user } = useAuth();
  const {
    projects,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchProjects,
    fetchMore,
  } = useProjectList(user?.id, { completedWithVocabOnly: true });
  const { markDayComplete } = useStreak();
  const { addXP } = useExperience();
  const {
    messages,
    state,
    summary,
    isListening,
    isTranscribing,
    finalTranscript,
    startConversation,
    handleVoiceInput,
    stopConversation,
    resetConversation,
    setAutoListen,
    isSpeechActive,
  } = useConversation();

  const handleTalkBlur = useCallback(() => {
    setAutoListen(false);
  }, [setAutoListen]);
  useStopAudioOnBlur({ onBlur: handleTalkBlur });

  useEffect(() => {
    fetchProjects();
    loadHistory();
  }, [fetchProjects]);

  // Re-fetch when search query changes
  useEffect(() => {
    fetchProjects(searchQuery || undefined);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchProjects(searchQuery || undefined);
    setIsRefreshing(false);
  }, [fetchProjects, searchQuery]);

  const loadHistory = async () => {
    const sessions = await loadSessions();
    setPastSessions(sessions);
  };

  const handleProjectSelect = async (project: AppProject) => {
    setSelectedProject(project);
    setView('conversation');
    await startConversation(project);
  };

  const handleStop = async () => {
    await stopConversation();
    // Award 50 XP for completing a conversation and mark streak day
    await addXP(50);
    await markDayComplete();
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

  const handleToggleExpand = (sessionId: string) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  switch (view) {
    case 'projectSelect':
      return (
        <TalkProjectSelect
          projects={projects}
          pastSessions={pastSessions}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          isRefreshing={isRefreshing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={onRefresh}
          onFetchMore={fetchMore}
          onProjectSelect={handleProjectSelect}
          onShowHistory={() => setView('history')}
        />
      );

    case 'history':
      return (
        <TalkHistory
          pastSessions={pastSessions}
          expandedSession={expandedSession}
          onToggleExpand={handleToggleExpand}
          onDeleteSession={handleDeleteSession}
          onBack={() => setView('projectSelect')}
        />
      );

    case 'summary':
      return (
        <TalkSummary
          summary={summary}
          onDone={handleDone}
        />
      );

    case 'conversation':
      return (
        <TalkConversation
          selectedProject={selectedProject}
          messages={messages}
          state={state}
          isListening={isListening}
          isSpeechActive={isSpeechActive}
          isTranscribing={isTranscribing}
          finalTranscript={finalTranscript}
          onVoiceInput={handleVoiceInput}
          onBack={handleBackToProjects}
          onStop={handleStop}
        />
      );
  }
};

export default TalkScreen;

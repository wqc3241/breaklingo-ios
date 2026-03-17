import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useProjectContext } from '../context/ProjectContext';
import { useConversation } from '../hooks/useConversation';
import { loadSessions, deleteSession } from '../lib/conversationStorage';
import type { AppProject, ConversationSession } from '../lib/types';

import TalkProjectSelect from './talk/TalkProjectSelect';
import TalkConversation from './talk/TalkConversation';
import TalkHistory from './talk/TalkHistory';
import TalkSummary from './talk/TalkSummary';

type TalkView = 'projectSelect' | 'conversation' | 'summary' | 'history';

const TalkScreen: React.FC = () => {
  const [view, setView] = useState<TalkView>('projectSelect');
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(null);
  const [pastSessions, setPastSessions] = useState<ConversationSession[]>([]);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  const { fetchProjects } = useProjectContext();
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
          isRefreshing={isRefreshing}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={onRefresh}
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

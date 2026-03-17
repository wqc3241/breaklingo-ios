import { useState, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTextToSpeech } from './useTextToSpeech';
import { useWhisperSTT } from './useWhisperSTT';
import { isStopPhrase } from '../lib/languageUtils';
import { saveSession } from '../lib/conversationStorage';
import type {
  ConversationMessage,
  ConversationState,
  ConversationSummary,
  ConversationSession,
  AppProject,
} from '../lib/types';

export const useConversation = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [state, setState] = useState<ConversationState>('idle');
  const [summary, setSummary] = useState<ConversationSummary | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const projectRef = useRef<AppProject | null>(null);
  const messagesRef = useRef<ConversationMessage[]>([]);
  // Keep messagesRef in sync with messages state to avoid stale closures
  messagesRef.current = messages;

  const autoListenEnabledRef = useRef(true);

  const { speak, isPlaying } = useTextToSpeech();
  const { startListening, stopListening, cancelListening, isListening, isTranscribing, finalTranscript } = useWhisperSTT();

  const autoListenAfterSpeak = useCallback(() => {
    if (!autoListenEnabledRef.current) return;
    // Delay slightly so TTS audio doesn't get picked up by mic
    setTimeout(async () => {
      if (!autoListenEnabledRef.current) return;
      try {
        setState('listening');
        await startListening();
      } catch (error) {
        console.error('Auto-listen failed:', error);
        setState('idle');
      }
    }, 600);
  }, [startListening]);

  const setAutoListen = useCallback((enabled: boolean) => {
    autoListenEnabledRef.current = enabled;
  }, []);

  const startConversation = useCallback(async (project: AppProject) => {
    projectRef.current = project;
    startTimeRef.current = Date.now();
    const sessionId = `conv-${Date.now()}`;
    setCurrentSessionId(sessionId);
    setMessages([]);
    setSummary(null);
    setState('processing');

    try {
      const { data, error } = await supabase.functions.invoke('conversation-chat', {
        body: {
          messages: [],
          projectContext: {
            vocabulary: project.vocabulary,
            grammar: project.grammar,
            detectedLanguage: project.detectedLanguage,
            title: project.title,
          },
        },
      });

      if (error) {
        console.error('conversation-chat error:', error);
        // Use fallback greeting so user can still practice
        const fallback = `Hello! Let's practice ${project.detectedLanguage || 'this language'} together. Try saying something using the vocabulary from "${project.title}".`;
        const aiMessage: ConversationMessage = {
          role: 'assistant',
          content: fallback,
          timestamp: Date.now(),
        };
        setMessages([aiMessage]);
        setState('speaking');
        await speak(fallback);
        setState('idle');
        return;
      }

      const greeting = data?.message || data?.reply || 'Hello! Let\'s practice together.';
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };

      setMessages([aiMessage]);
      setState('speaking');

      // TTS, then auto-listen
      await speak(greeting);
      setState('idle');
      autoListenAfterSpeak();
    } catch (error) {
      console.error('Failed to start conversation:', error);
      // Use fallback greeting on network/unexpected errors too
      const fallback = `Hello! Let's practice together. Type or say something to get started.`;
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: fallback,
        timestamp: Date.now(),
      };
      setMessages([aiMessage]);
      setState('idle');
    }
  }, [speak]);

  const processUserInput = useCallback(async (text: string) => {
    if (!text.trim() || !projectRef.current) return;

    // Check for stop phrase
    if (isStopPhrase(text)) {
      await stopConversation();
      return;
    }

    const userMessage: ConversationMessage = {
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setState('processing');

    try {
      // Use messagesRef to get current messages and avoid stale closure
      const allMessages = [...messagesRef.current, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('conversation-chat', {
        body: {
          messages: allMessages,
          projectContext: {
            vocabulary: projectRef.current!.vocabulary,
            grammar: projectRef.current!.grammar,
            detectedLanguage: projectRef.current!.detectedLanguage,
            title: projectRef.current!.title,
          },
        },
      });

      if (error) {
        console.error('conversation-chat reply error:', error);
        Alert.alert('Connection Error', 'Could not get a response. Please try again.');
        setState('idle');
        return;
      }

      const reply = data?.message || data?.reply || '';
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      setState('speaking');

      await speak(reply);
      setState('idle');
      autoListenAfterSpeak();
    } catch (error) {
      console.error('Conversation error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
      setState('idle');
    }
  }, [speak]);

  const sendTextMessage = useCallback(async (text: string) => {
    await processUserInput(text);
  }, [processUserInput]);

  const handleVoiceInput = useCallback(async () => {
    try {
      if (isListening) {
        setState('processing');
        const text = await stopListening();
        if (text) {
          await processUserInput(text);
        } else {
          setState('idle');
        }
      } else {
        setState('listening');
        await startListening();
      }
    } catch (error) {
      console.error('Voice input error:', error);
      setState('idle');
    }
  }, [isListening, startListening, stopListening, processUserInput]);

  const stopConversation = useCallback(async () => {
    autoListenEnabledRef.current = false;
    await cancelListening();
    setState('processing');

    try {
      // Get conversation summary — use ref to get latest messages
      const currentMessages = messagesRef.current;
      const { data, error } = await supabase.functions.invoke('conversation-summary', {
        body: {
          messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
          language: projectRef.current?.detectedLanguage || 'Unknown',
        },
      });

      if (!error && data) {
        const summaryData: ConversationSummary = {
          score: data.score || 0,
          sentencesReviewed: data.sentencesReviewed || data.sentences_reviewed || [],
          vocabularyFeedback: data.vocabularyFeedback || data.vocabulary_feedback || [],
          grammarFeedback: data.grammarFeedback || data.grammar_feedback || [],
          overallFeedback: data.overallFeedback || data.overall_feedback || '',
        };
        setSummary(summaryData);

        // Save session
        if (currentSessionId && projectRef.current) {
          const session: ConversationSession = {
            id: currentSessionId,
            projectId: projectRef.current.id,
            projectTitle: projectRef.current.title,
            language: projectRef.current.detectedLanguage,
            messages: currentMessages,
            summary: summaryData,
            createdAt: startTimeRef.current,
            duration: Date.now() - startTimeRef.current,
          };
          await saveSession(session);
        }
      }
    } catch (error) {
      console.error('Failed to get summary:', error);
    } finally {
      setState('idle');
    }
  }, [currentSessionId, cancelListening]);

  const resetConversation = useCallback(() => {
    autoListenEnabledRef.current = true;
    setMessages([]);
    setSummary(null);
    setState('idle');
    setCurrentSessionId(null);
    projectRef.current = null;
  }, []);

  return {
    messages,
    state,
    summary,
    isListening,
    isTranscribing,
    finalTranscript,
    isPlaying,
    startConversation,
    processUserInput,
    sendTextMessage,
    handleVoiceInput,
    stopConversation,
    resetConversation,
    setAutoListen,
  };
};

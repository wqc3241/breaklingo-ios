import { useState, useCallback, useRef } from 'react';
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

  const { speak, isPlaying } = useTextToSpeech();
  const { startListening, stopListening, cancelListening, isListening, isTranscribing, finalTranscript } = useWhisperSTT();

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
          vocabulary: project.vocabulary,
          grammar: project.grammar,
          language: project.detectedLanguage,
        },
      });

      if (error) throw error;

      const greeting = data?.message || data?.reply || 'Hello! Let\'s practice together.';
      const aiMessage: ConversationMessage = {
        role: 'assistant',
        content: greeting,
        timestamp: Date.now(),
      };

      setMessages([aiMessage]);
      setState('speaking');

      // TTS
      await speak(greeting);
      setState('idle');
    } catch (error) {
      console.error('Failed to start conversation:', error);
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
      const allMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('conversation-chat', {
        body: {
          messages: allMessages,
          vocabulary: projectRef.current!.vocabulary,
          grammar: projectRef.current!.grammar,
          language: projectRef.current!.detectedLanguage,
        },
      });

      if (error) throw error;

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
    } catch (error) {
      console.error('Conversation error:', error);
      setState('idle');
    }
  }, [messages, speak]);

  const sendTextMessage = useCallback(async (text: string) => {
    await processUserInput(text);
  }, [processUserInput]);

  const handleVoiceInput = useCallback(async () => {
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
  }, [isListening, startListening, stopListening, processUserInput]);

  const stopConversation = useCallback(async () => {
    await cancelListening();
    setState('processing');

    try {
      // Get conversation summary
      const { data, error } = await supabase.functions.invoke('conversation-summary', {
        body: {
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
            messages,
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
  }, [messages, currentSessionId, cancelListening]);

  const resetConversation = useCallback(() => {
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
  };
};

import { useState, useCallback, useRef, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTextToSpeech } from './useTextToSpeech';
import { useWhisperSTT } from './useWhisperSTT';
import { useAIConsentContext } from '../context/AIConsentContext';
import { isStopPhrase } from '../lib/languageUtils';
import { saveSession } from '../lib/conversationStorage';
import { convertMessagesToEdgeFormat } from '../lib/conversationUtils';
import type {
  ConversationMessage,
  ConversationState,
  ConversationSummary,
  ConversationSession,
  AppProject,
} from '../lib/types';

// Delay after TTS finishes before starting mic, to avoid picking up speaker echo
const AUTO_LISTEN_DELAY_MS = 600;

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
  const { requireConsent } = useAIConsentContext();

  const autoListenEnabledRef = useRef(true);

  const { speak, stop: stopTTS, isPlaying } = useTextToSpeech();
  const { startListening, stopListening, cancelListening, isListening, isSpeechActive, isTranscribing, finalTranscript, setOnSilenceCallback } = useWhisperSTT();

  const autoListenAfterSpeak = useCallback(() => {
    if (!autoListenEnabledRef.current) return;
    // Delay slightly so TTS audio doesn't get picked up by mic
    setTimeout(async () => { // eslint-disable-line @typescript-eslint/no-misused-promises
      if (!autoListenEnabledRef.current) return;
      try {
        setState('listening');
        await startListening();
      } catch (error) {
        console.error('Auto-listen failed:', error);
        setState('idle');
      }
    }, AUTO_LISTEN_DELAY_MS);
  }, [startListening]);

  const setAutoListen = useCallback((enabled: boolean) => {
    autoListenEnabledRef.current = enabled;
  }, []);

  const startConversation = useCallback(async (project: AppProject) => {
    if (!requireConsent()) return;
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
  }, [speak, autoListenAfterSpeak]);

  const processUserInput = useCallback(async (text: string) => {
    const project = projectRef.current;
    if (!text.trim() || !project) return;

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
      const allMessages = convertMessagesToEdgeFormat([...messagesRef.current, userMessage]);

      const { data, error } = await supabase.functions.invoke('conversation-chat', {
        body: {
          messages: allMessages,
          projectContext: {
            vocabulary: project.vocabulary,
            grammar: project.grammar,
            detectedLanguage: project.detectedLanguage,
            title: project.title,
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
  }, [speak, autoListenAfterSpeak]);

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
  }, [isListening, startListening, stopListening, processUserInput, autoListenAfterSpeak]);

  // Register silence detection callback — auto-stop recording when user stops speaking
  const handleVoiceInputRef = useRef(handleVoiceInput);
  handleVoiceInputRef.current = handleVoiceInput;
  useEffect(() => {
    setOnSilenceCallback(() => {
      handleVoiceInputRef.current();
    });
    return () => setOnSilenceCallback(null);
  }, [setOnSilenceCallback]);

  const stopConversation = useCallback(async () => {
    autoListenEnabledRef.current = false;
    stopTTS();
    await cancelListening();
    setState('processing');

    try {
      // Get conversation summary — use ref to get latest messages
      const currentMessages = messagesRef.current;
      const { data, error } = await supabase.functions.invoke('conversation-summary', {
        body: {
          messages: convertMessagesToEdgeFormat(currentMessages),
          projectContext: {
            vocabulary: projectRef.current?.vocabulary || [],
            grammar: projectRef.current?.grammar || [],
            detectedLanguage: projectRef.current?.detectedLanguage || 'Unknown',
            title: projectRef.current?.title || '',
          },
          language: projectRef.current?.detectedLanguage || 'Unknown',
        },
      });

      if (!error && data?.summary) {
        const s = data.summary;
        const summaryData: ConversationSummary = {
          overallScore: s.overallScore ?? 0,
          overallComment: s.overallComment || '',
          sentencesUsed: s.sentencesUsed || [],
          vocabularyUsed: s.vocabularyUsed || [],
          grammarPatterns: s.grammarPatterns || [],
          feedback: s.feedback || [],
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
  }, [currentSessionId, cancelListening, stopTTS]);

  const resetConversation = useCallback(() => {
    stopTTS();
    cancelListening();
    autoListenEnabledRef.current = true;
    setMessages([]);
    setSummary(null);
    setState('idle');
    setCurrentSessionId(null);
    projectRef.current = null;
  }, [stopTTS, cancelListening]);

  return {
    messages,
    state,
    summary,
    isListening,
    isSpeechActive,
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

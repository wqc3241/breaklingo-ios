import { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, NativeModules, NativeEventEmitter } from 'react-native';
import { supabase, SUPABASE_URL } from '../lib/supabase';
import { useAIConsentContext } from '../context/AIConsentContext';

const { AudioRecorderModule } = NativeModules;

// Create event emitter for silence detection events from native module
const recorderEmitter = AudioRecorderModule
  ? new NativeEventEmitter(AudioRecorderModule)
  : null;

export const useWhisperSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const isListeningRef = useRef(false);
  const onSilenceCallbackRef = useRef<(() => void) | null>(null);
  const { requireConsent } = useAIConsentContext();

  // Keep ref in sync
  isListeningRef.current = isListening;

  // Listen for native audio events
  useEffect(() => {
    if (!recorderEmitter) return;

    const silenceSub = recorderEmitter.addListener('onSilenceDetected', () => {
      setIsSpeechActive(false);
      if (isListeningRef.current && onSilenceCallbackRef.current) {
        onSilenceCallbackRef.current();
      }
    });

    const speechSub = recorderEmitter.addListener('onSpeechStarted', () => {
      setIsSpeechActive(true);
    });

    return () => {
      silenceSub.remove();
      speechSub.remove();
    };
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!isListeningRef.current) return '';

    try {
      setIsListening(false);
      setIsSpeechActive(false);
      isListeningRef.current = false;
      if (!AudioRecorderModule) return '';
      const uri = await AudioRecorderModule.stopRecording();

      if (!uri) return '';

      if (!requireConsent()) return '';

      setIsTranscribing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-audio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        console.warn(`Transcription failed (${response.status}): ${errorBody}`);
        return '';
      }

      const data = await response.json();
      const text = data.text || '';
      setFinalTranscript(text);
      setTranscript(text);
      return text;
    } catch (error) {
      console.error('STT error:', error);
      return '';
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  const startListening = useCallback(async () => {
    try {
      if (!AudioRecorderModule) {
        Alert.alert('Error', 'Audio recording is not available on this device.');
        return;
      }

      const granted = await AudioRecorderModule.requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice conversation.');
        return;
      }

      await AudioRecorderModule.startRecording();
      setIsListening(true);
      setIsSpeechActive(false);
      isListeningRef.current = true;
      setTranscript('');
      setFinalTranscript('');
    } catch (error) {
      console.error('Failed to start listening:', error);
      Alert.alert('Error', 'Could not start microphone. Please check microphone permissions in Settings.');
    }
  }, []);

  const cancelListening = useCallback(async () => {
    try {
      if (AudioRecorderModule) await AudioRecorderModule.stopRecording();
    } catch {}
    setIsListening(false);
    setIsSpeechActive(false);
    isListeningRef.current = false;
    setTranscript('');
  }, []);

  // Allow callers to register a callback for when silence is detected
  const setOnSilenceCallback = useCallback((cb: (() => void) | null) => {
    onSilenceCallbackRef.current = cb;
  }, []);

  return {
    isListening,
    isSpeechActive,
    isTranscribing,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    cancelListening,
    setOnSilenceCallback,
  };
};

import { useState, useCallback } from 'react';
import { Alert, NativeModules } from 'react-native';
import { supabase, SUPABASE_URL } from '../lib/supabase';

const { AudioRecorderModule } = NativeModules;

export const useWhisperSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

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
      setTranscript('');
      setFinalTranscript('');
    } catch (error) {
      console.error('Failed to start listening:', error);
      Alert.alert('Error', 'Could not start microphone. Please check microphone permissions in Settings.');
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!isListening) return '';

    try {
      setIsListening(false);
      if (!AudioRecorderModule) return '';
      const uri = await AudioRecorderModule.stopRecording();

      if (!uri) return '';

      setIsTranscribing(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('audio', {
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

      if (!response.ok) throw new Error('Transcription failed');

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
  }, [isListening]);

  const cancelListening = useCallback(async () => {
    try {
      if (AudioRecorderModule) await AudioRecorderModule.stopRecording();
    } catch {}
    setIsListening(false);
    setTranscript('');
  }, []);

  return {
    isListening,
    isTranscribing,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    cancelListening,
  };
};

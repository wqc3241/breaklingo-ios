import { useState, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { supabase, SUPABASE_URL } from '../lib/supabase';

export const useWhisperSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const startListening = useCallback(async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required for voice conversation.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsListening(true);
      setTranscript('');
      setFinalTranscript('');
    } catch (error) {
      console.error('Failed to start listening:', error);
      Alert.alert('Error', 'Could not start microphone');
    }
  }, []);

  const stopListening = useCallback(async (): Promise<string> => {
    if (!recordingRef.current) return '';

    try {
      setIsListening(false);
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

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
  }, []);

  const cancelListening = useCallback(async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch {}
      recordingRef.current = null;
    }
    setIsListening(false);
    setTranscript('');

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });
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

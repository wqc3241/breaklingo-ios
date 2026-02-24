import { useState, useRef, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import { supabase, SUPABASE_URL } from '../lib/supabase';

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const speak = useCallback(async (text: string, voice: string = 'coral', instructions?: string) => {
    try {
      // If clicking the same text that's playing, stop it
      if (isPlaying && currentText === text) {
        if (soundRef.current) {
          await soundRef.current.stopAsync();
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        setIsPlaying(false);
        setCurrentText(null);
        return;
      }

      // If different audio is playing, stop it first
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(true);
      setCurrentText(text);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const functionUrl = `${SUPABASE_URL}/functions/v1/generate-speech`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          text,
          voice,
          ...(instructions && { instructions }),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate speech: ${errorText}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const dataUrl = reader.result as string;
          resolve(dataUrl);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: base64Data },
        { shouldPlay: true }
      );

      soundRef.current = sound;

      sound.setOnPlaybackStatusUpdate((status) => {
        if ('didJustFinish' in status && status.didJustFinish) {
          setIsPlaying(false);
          setCurrentText(null);
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not generate audio.';
      console.error('TTS Error:', error);
      Alert.alert('Error generating speech', message);
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, [isPlaying, currentText]);

  return { speak, isPlaying, currentText };
};

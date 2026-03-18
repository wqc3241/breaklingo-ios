import { useState, useCallback } from 'react';
import { Alert, NativeModules } from 'react-native';
import { supabase, SUPABASE_URL } from '../lib/supabase';

// btoa is available in Hermes runtime but not in RN's TS lib definitions
declare const btoa: (data: string) => string;

const { AudioPlayerModule } = NativeModules;

export const useTextToSpeech = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentText, setCurrentText] = useState<string | null>(null);

  const speak = useCallback(async (text: string, voice: string = 'coral', instructions?: string) => {
    try {
      if (!text || !text.trim()) return;

      if (!AudioPlayerModule) {
        console.warn('AudioPlayerModule is not available');
        return;
      }

      // If clicking the same text that's playing, stop it
      if (isPlaying && currentText === text) {
        await AudioPlayerModule.stop();
        setIsPlaying(false);
        setCurrentText(null);
        return;
      }

      // If different audio is playing, stop it first
      if (isPlaying) {
        await AudioPlayerModule.stop();
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

      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      // Play using native AVAudioPlayer — promise resolves when playback finishes
      await AudioPlayerModule.playBase64(base64);

      setIsPlaying(false);
      setCurrentText(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not generate audio.';
      console.error('TTS Error:', error);
      Alert.alert('Error generating speech', message);
      setIsPlaying(false);
      setCurrentText(null);
    }
  }, [isPlaying, currentText]);

  const stop = useCallback(async () => {
    try {
      if (AudioPlayerModule) {
        await AudioPlayerModule.stop();
      }
    } catch {}
    setIsPlaying(false);
    setCurrentText(null);
  }, []);

  return { speak, stop, isPlaying, currentText };
};

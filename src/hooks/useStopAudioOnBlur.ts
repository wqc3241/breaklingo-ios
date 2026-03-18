import { useEffect } from 'react';
import { NativeModules } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { AudioPlayerModule, AudioRecorderModule } = NativeModules;

/**
 * Stops all audio playback and recording when the screen loses focus.
 * Call this in any screen that uses TTS (useTextToSpeech) or STT (useWhisperSTT).
 *
 * @param options.cancelListening - Optional callback to cancel active STT recording
 * @param options.onBlur - Optional additional cleanup callback
 */
export const useStopAudioOnBlur = (options?: {
  cancelListening?: () => Promise<void> | void;
  onBlur?: () => void;
}) => {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      // Stop any playing TTS audio
      if (AudioPlayerModule) {
        try {
          AudioPlayerModule.stop();
        } catch {}
      }

      // Stop any active recording
      if (AudioRecorderModule) {
        try {
          AudioRecorderModule.stopRecording();
        } catch {}
      }

      // Cancel listening via hook if provided
      if (options?.cancelListening) {
        try {
          options.cancelListening();
        } catch {}
      }

      // Additional cleanup
      if (options?.onBlur) {
        try {
          options.onBlur();
        } catch {}
      }
    });

    return unsubscribe;
  }, [navigation, options?.cancelListening, options?.onBlur]);
};

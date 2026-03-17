import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, NativeModules } from 'react-native';
import { Mic, Square, Check, X } from 'lucide-react-native';
import { supabase, SUPABASE_URL } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import type { QuizQuestion } from '../../lib/types';

const { AudioRecorderModule } = NativeModules;

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const ReadAfterMeQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [similarity, setSimilarity] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const targetText = question.targetText || question.originalText || question.correctAnswer;

  const startRecording = async () => {
    try {
      if (!AudioRecorderModule) {
        Alert.alert('Error', 'Audio recording is not available on this device.');
        return;
      }

      const granted = await AudioRecorderModule.requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required for this question type.');
        return;
      }

      await AudioRecorderModule.startRecording();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Could not start recording. Please check microphone permissions in Settings.');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      const uri = await AudioRecorderModule.stopRecording();

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const transcribeAudio = async (uri: string) => {
    setIsTranscribing(true);
    try {
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

      if (!response.ok) {
        console.warn('Transcription failed:', response.status);
        setRetryMessage('No voice detected. Please try again.');
        return;
      }

      const data = await response.json();
      const transcribedText = data.text || '';

      if (!transcribedText.trim()) {
        setRetryMessage('No voice detected. Please try again.');
        return;
      }

      setRetryMessage(null);
      setTranscript(transcribedText);

      // Calculate word overlap similarity
      const targetWords = targetText.toLowerCase().split(/\s+/).filter(Boolean);
      const spokenWords = transcribedText.toLowerCase().split(/\s+/).filter(Boolean);

      const matchCount = targetWords.filter((w: string) =>
        spokenWords.some((sw: string) => sw.includes(w) || w.includes(sw))
      ).length;

      const sim = targetWords.length > 0 ? matchCount / targetWords.length : 0;
      setSimilarity(sim);
      setSubmitted(true);

      onAnswer(sim >= 0.7);
    } catch (error) {
      console.error('Transcription error:', error);
      setRetryMessage('No voice detected. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Retry message — fixed height container so record button doesn't shift */}
      <View style={styles.retryContainer}>
        {retryMessage && !submitted && (
          <Text style={styles.retryText}>{retryMessage}</Text>
        )}
      </View>

      {/* Record button */}
      {!submitted && (
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              {isRecording ? <Square size={16} color="#DC2626" /> : <Mic size={20} color="#FFFFFF" />}
              <Text style={styles.recordText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Results */}
      {submitted && transcript !== null && similarity !== null && (
        <View style={[
          styles.resultCard,
          similarity >= 0.7 ? styles.resultCorrect : styles.resultWrong,
        ]}>
          <Text style={styles.resultLabel}>Your speech:</Text>
          <Text style={styles.resultTranscript}>{transcript || '(no speech detected)'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.resultScore}>
              Similarity: {Math.round(similarity * 100)}%{' '}
            </Text>
            {similarity >= 0.7 ? <Check size={16} color={colors.correctText} /> : <X size={16} color={colors.wrongText} />}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  retryContainer: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    textAlign: 'center',
  },
  recordButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  recordButtonActive: {
    backgroundColor: '#FF6B60',
  },
  recordText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 2,
  },
  resultCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  resultCorrect: {
    backgroundColor: colors.correctBg,
    borderWidth: 1,
    borderColor: colors.correctBorder,
  },
  resultWrong: {
    backgroundColor: colors.wrongBg,
    borderWidth: 1,
    borderColor: colors.wrongBorder,
  },
  resultLabel: {
    fontSize: 12,
    color: '#A1A1A1',
    marginBottom: 4,
  },
  resultTranscript: {
    fontSize: 16,
    color: '#000',
    marginBottom: 8,
  },
  resultScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#525252',
  },
});

export default ReadAfterMeQ;

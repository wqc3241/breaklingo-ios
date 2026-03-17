import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const ListeningQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const { speak, isPlaying } = useTextToSpeech();

  const audioText = question.audioText || question.originalText || question.correctAnswer;

  const handlePlay = () => {
    if (audioText) {
      speak(audioText);
    }
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    onAnswer(answer === question.correctAnswer);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Large play button */}
      <TouchableOpacity
        style={[styles.playButton, isPlaying && styles.playButtonActive]}
        onPress={handlePlay}
      >
        {isPlaying ? <Pause size={20} color="#FFFFFF" /> : <Play size={20} color="#FFFFFF" />}
        <Text style={styles.playText}>{isPlaying ? 'Playing...' : 'Listen'}</Text>
      </TouchableOpacity>

      <View style={styles.optionsContainer}>
        {(question.options || []).map((option, index) => {
          let optionStyle = styles.optionDefault;
          let textStyle = styles.optionTextDefault;

          if (selectedAnswer) {
            if (option === question.correctAnswer) {
              optionStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
            } else if (option === selectedAnswer) {
              optionStyle = styles.optionWrong;
              textStyle = styles.optionTextWrong;
            }
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, optionStyle]}
              onPress={() => handleAnswer(option)}
              disabled={selectedAnswer !== null}
            >
              <Text style={[styles.optionText, textStyle]} numberOfLines={3}>
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  playButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8550C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#E8550C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: '#F98F38',
  },
  playIcon: {
    fontSize: 28,
    color: '#fff',
  },
  playText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  optionsContainer: {
    width: '100%',
    gap: 10,
  },
  optionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
    justifyContent: 'center',
  },
  optionDefault: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextDefault: {
    color: '#000',
  },
  optionTextCorrect: {
    color: '#065F46',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#991B1B',
    fontWeight: '600',
  },
});

export default ListeningQ;

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const TranslationQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    onAnswer(answer === question.correctAnswer);
  };

  return (
    <View style={styles.container}>
      {/* Context card */}
      <View style={styles.contextCard}>
        <Text style={styles.contextLabel}>Translate this:</Text>
        <Text style={styles.contextText}>
          {question.originalText || question.context || question.question}
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {question.options.map((option, index) => {
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
  },
  contextCard: {
    backgroundColor: '#FFF5EA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  contextLabel: {
    fontSize: 14,
    color: '#E8550C',
    fontWeight: '600',
    marginBottom: 8,
  },
  contextText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    lineHeight: 30,
  },
  optionsContainer: {
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

export default TranslationQ;

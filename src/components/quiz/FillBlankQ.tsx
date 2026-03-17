import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const FillBlankQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(answer);
    onAnswer(answer === question.correctAnswer);
  };

  return (
    <View style={styles.container}>
      {question.sentence && (
        <View style={styles.sentenceCard}>
          <Text style={styles.sentenceText}>
            {question.sentence.replace('___', '______')}
          </Text>
        </View>
      )}
      <Text style={styles.questionText}>{question.question}</Text>
      <View style={styles.optionsGrid}>
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
              <Text style={[styles.optionText, textStyle]} numberOfLines={2}>
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
  sentenceCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: '100%',
  },
  sentenceText: {
    fontSize: 18,
    color: '#000',
    textAlign: 'center',
    lineHeight: 28,
  },
  questionText: {
    fontSize: 18,
    color: '#525252',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  optionButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    minHeight: 52,
    justifyContent: 'center',
    width: '48%',
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
    fontSize: 15,
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

export default FillBlankQ;

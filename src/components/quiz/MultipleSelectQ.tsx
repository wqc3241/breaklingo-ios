import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const MultipleSelectQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const correctSet = new Set(question.correctSelections || []);

  const toggleAnswer = (answer: string) => {
    if (submitted) return;
    const newSet = new Set(selectedAnswers);
    if (newSet.has(answer)) {
      newSet.delete(answer);
    } else {
      newSet.add(answer);
    }
    setSelectedAnswers(newSet);
  };

  const handleCheck = () => {
    if (submitted || selectedAnswers.size === 0) return;
    setSubmitted(true);

    const isCorrect =
      selectedAnswers.size === correctSet.size &&
      [...selectedAnswers].every((a) => correctSet.has(a));

    onAnswer(isCorrect);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>
      <Text style={styles.hintText}>Select all that apply</Text>

      <View style={styles.optionsContainer}>
        {(question.options || []).map((option, index) => {
          const isSelected = selectedAnswers.has(option);
          const isCorrectOption = correctSet.has(option);

          let optionStyle = styles.optionDefault;
          let textStyle = styles.optionTextDefault;

          if (submitted) {
            if (isCorrectOption && isSelected) {
              optionStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
            } else if (isCorrectOption && !isSelected) {
              optionStyle = styles.optionMissed;
              textStyle = styles.optionTextCorrect;
            } else if (!isCorrectOption && isSelected) {
              optionStyle = styles.optionWrong;
              textStyle = styles.optionTextWrong;
            }
          } else if (isSelected) {
            optionStyle = styles.optionSelected;
            textStyle = styles.optionTextSelected;
          }

          return (
            <TouchableOpacity
              key={index}
              style={[styles.optionButton, optionStyle]}
              onPress={() => toggleAnswer(option)}
              disabled={submitted}
            >
              <View style={styles.checkboxRow}>
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && <Check size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.optionText, textStyle]} numberOfLines={3}>
                  {option}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {!submitted && (
        <TouchableOpacity
          style={[styles.checkButton, selectedAnswers.size === 0 && styles.checkButtonDisabled]}
          onPress={handleCheck}
          disabled={selectedAnswers.size === 0}
        >
          <Text style={styles.checkButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}
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
    marginBottom: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#A1A1A1',
    marginBottom: 20,
  },
  optionsContainer: {
    width: '100%',
    gap: 10,
  },
  optionButton: {
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  optionDefault: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  optionSelected: {
    backgroundColor: '#FFF5EA',
    borderWidth: 2,
    borderColor: '#E8550C',
  },
  optionCorrect: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#34D399',
  },
  optionMissed: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  optionWrong: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D4D4D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#E8550C',
    borderColor: '#E8550C',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  optionTextDefault: {
    color: '#000',
  },
  optionTextSelected: {
    color: '#E8550C',
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#065F46',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#991B1B',
    fontWeight: '600',
  },
  checkButton: {
    marginTop: 20,
    backgroundColor: '#E8550C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MultipleSelectQ;

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const WordArrangeQ: React.FC<Props> = ({ question, onAnswer }) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(
    [...(question.words || question.options || [])].sort(() => Math.random() - 0.5)
  );
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const correctOrder = question.correctOrder || [];

  const handleWordTap = (word: string, fromSelected: boolean) => {
    if (submitted) return;

    if (fromSelected) {
      setSelectedWords((prev) => {
        const idx = prev.indexOf(word);
        const newSelected = [...prev];
        newSelected.splice(idx, 1);
        return newSelected;
      });
      setAvailableWords((prev) => [...prev, word]);
    } else {
      setAvailableWords((prev) => {
        const idx = prev.indexOf(word);
        const newAvailable = [...prev];
        newAvailable.splice(idx, 1);
        return newAvailable;
      });
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const handleReset = () => {
    if (submitted) return;
    setAvailableWords(
      [...(question.words || question.options || [])].sort(() => Math.random() - 0.5)
    );
    setSelectedWords([]);
  };

  const handleCheck = () => {
    if (submitted || selectedWords.length === 0) return;
    setSubmitted(true);
    const correct = selectedWords.length === correctOrder.length &&
      selectedWords.every((w, i) => w === correctOrder[i]);
    setIsCorrect(correct);
    onAnswer(correct);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.questionText}>{question.question}</Text>

      {/* Selected words area */}
      <View style={[
        styles.selectedArea,
        submitted && (isCorrect ? styles.selectedAreaCorrect : styles.selectedAreaWrong),
      ]}>
        {selectedWords.length === 0 ? (
          <Text style={styles.placeholderText}>Tap words to build your answer</Text>
        ) : (
          <View style={styles.wordsRow}>
            {selectedWords.map((word, index) => (
              <TouchableOpacity
                key={`s-${index}`}
                style={styles.selectedWord}
                onPress={() => handleWordTap(word, true)}
                disabled={submitted}
              >
                <Text style={styles.selectedWordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Available words */}
      <View style={styles.wordsRow}>
        {availableWords.map((word, index) => (
          <TouchableOpacity
            key={`a-${index}`}
            style={styles.availableWord}
            onPress={() => handleWordTap(word, false)}
            disabled={submitted}
          >
            <Text style={styles.availableWordText}>{word}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!submitted && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkButton, selectedWords.length === 0 && styles.checkButtonDisabled]}
            onPress={handleCheck}
            disabled={selectedWords.length === 0}
          >
            <Text style={styles.checkButtonText}>Check</Text>
          </TouchableOpacity>
        </View>
      )}

      {submitted && !isCorrect && (
        <View style={styles.correctAnswerBox}>
          <Text style={styles.correctLabel}>Correct answer:</Text>
          <Text style={styles.correctText}>{correctOrder.join(' ')}</Text>
        </View>
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
    marginBottom: 20,
  },
  selectedArea: {
    width: '100%',
    minHeight: 80,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
    justifyContent: 'center',
  },
  selectedAreaCorrect: {
    borderColor: '#34D399',
    backgroundColor: '#D1FAE5',
    borderStyle: 'solid',
  },
  selectedAreaWrong: {
    borderColor: '#F87171',
    backgroundColor: '#FEE2E2',
    borderStyle: 'solid',
  },
  placeholderText: {
    color: '#A1A1A1',
    textAlign: 'center',
    fontSize: 15,
  },
  wordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  selectedWord: {
    backgroundColor: '#E8550C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedWordText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  availableWord: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  availableWordText: {
    color: '#000',
    fontSize: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  resetText: {
    color: '#525252',
    fontSize: 16,
    fontWeight: '500',
  },
  checkButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8550C',
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  correctAnswerBox: {
    marginTop: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  correctLabel: {
    fontSize: 12,
    color: '#A1A1A1',
    marginBottom: 4,
  },
  correctText: {
    fontSize: 16,
    color: '#065F46',
    fontWeight: '600',
  },
});

export default WordArrangeQ;

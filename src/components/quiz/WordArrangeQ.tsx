import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const WordArrangeQ: React.FC<Props> = ({ question, onAnswer }) => {
  // Fixed pool of words — order never changes, selected words are grayed out in place
  const allWords = useMemo(
    () => [...(question.words || question.options || [])].sort(() => Math.random() - 0.5),
    [question.words, question.options]
  );

  // Track selected word indices (in order of selection)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const correctOrder = question.correctOrder || [];
  const selectedWords = selectedIndices.map((i) => allWords[i]);
  const usedSet = new Set(selectedIndices);

  const handlePoolTap = (index: number) => {
    if (submitted || usedSet.has(index)) return;
    setSelectedIndices((prev) => [...prev, index]);
  };

  const handleSelectedTap = (positionInSelected: number) => {
    if (submitted) return;
    setSelectedIndices((prev) => {
      const newIndices = [...prev];
      newIndices.splice(positionInSelected, 1);
      return newIndices;
    });
  };

  const handleReset = () => {
    if (submitted) return;
    setSelectedIndices([]);
  };

  const handleCheck = () => {
    if (submitted || selectedIndices.length === 0) return;
    setSubmitted(true);
    const correct = selectedWords.length === correctOrder.length &&
      selectedWords.every((w, i) => w === correctOrder[i]);
    setIsCorrect(correct);
    onAnswer(correct);
  };

  return (
    <View style={styles.container}>
      {/* Selected words area */}
      <View style={[
        styles.selectedArea,
        submitted && (isCorrect ? styles.selectedAreaCorrect : styles.selectedAreaWrong),
      ]}>
        {selectedIndices.length === 0 ? (
          <View style={styles.placeholderContainer}>
            <Text style={styles.placeholderText}>Tap words to build your answer</Text>
          </View>
        ) : (
          <View style={styles.wordsRow}>
            {selectedWords.map((word, index) => (
              <TouchableOpacity
                key={`s-${index}`}
                style={styles.selectedWord}
                onPress={() => handleSelectedTap(index)}
                disabled={submitted}
              >
                <Text style={styles.selectedWordText}>{word}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Word pool — fixed positions, gray out used words */}
      <View style={styles.wordsRow}>
        {allWords.map((word, index) => {
          const isUsed = usedSet.has(index);
          return (
            <TouchableOpacity
              key={`p-${index}`}
              style={[styles.availableWord, isUsed && styles.availableWordUsed]}
              onPress={() => handlePoolTap(index)}
              disabled={submitted || isUsed}
            >
              <Text style={[styles.availableWordText, isUsed && styles.availableWordTextUsed]}>
                {word}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {!submitted && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.checkButton, selectedIndices.length === 0 && styles.checkButtonDisabled]}
            onPress={handleCheck}
            disabled={selectedIndices.length === 0}
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
  selectedArea: {
    width: '100%',
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    borderStyle: 'dashed',
  },
  selectedAreaCorrect: {
    borderColor: colors.correctBorder,
    backgroundColor: colors.correctBg,
    borderStyle: 'solid',
  },
  selectedAreaWrong: {
    borderColor: colors.wrongBorder,
    backgroundColor: colors.wrongBg,
    borderStyle: 'solid',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  availableWordUsed: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  availableWordText: {
    color: '#000',
    fontSize: 16,
  },
  availableWordTextUsed: {
    color: '#D4D4D4',
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
    color: colors.correctText,
    fontWeight: '600',
  },
});

export default WordArrangeQ;

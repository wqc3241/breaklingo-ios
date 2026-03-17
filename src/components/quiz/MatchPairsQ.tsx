import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';
import { colors } from '../../lib/theme';
import type { QuizQuestion } from '../../lib/types';

interface Props {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean) => void;
}

const MatchPairsQ: React.FC<Props> = ({ question, onAnswer }) => {
  const { speak } = useTextToSpeech();
  const pairs = question.pairs || [];

  const shuffledWords = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5).map((p) => p.word),
    [pairs]
  );
  const shuffledMeanings = useMemo(
    () => [...pairs].sort(() => Math.random() - 0.5).map((p) => p.meaning),
    [pairs]
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongMatch, setWrongMatch] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [errors, setErrors] = useState(0);

  const pairMap = useMemo(() => {
    const map: Record<string, string> = {};
    pairs.forEach((p) => { map[p.word] = p.meaning; });
    return map;
  }, [pairs]);

  const handleWordPress = (word: string) => {
    if (matchedPairs.has(word) || completed) return;
    speak(word);
    setSelectedWord(word);
    setWrongMatch(null);
  };

  const handleMeaningPress = (meaning: string) => {
    if (!selectedWord || completed) return;
    if (matchedPairs.has(selectedWord)) return;

    if (pairMap[selectedWord] === meaning) {
      const newMatched = new Set(matchedPairs);
      newMatched.add(selectedWord);
      setMatchedPairs(newMatched);
      setSelectedWord(null);

      if (newMatched.size === pairs.length) {
        setCompleted(true);
        onAnswer(errors === 0);
      }
    } else {
      setWrongMatch(meaning);
      setErrors((e) => e + 1);
      setTimeout(() => {
        setWrongMatch(null);
        setSelectedWord(null);
      }, 800);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.columnsContainer}>
        {/* Words column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Word</Text>
          {shuffledWords.map((word, index) => {
            const isMatched = matchedPairs.has(word);
            const isSelected = selectedWord === word;

            return (
              <TouchableOpacity
                key={`w-${index}`}
                style={[
                  styles.pairItem,
                  isMatched && styles.pairItemMatched,
                  isSelected && styles.pairItemSelected,
                ]}
                onPress={() => handleWordPress(word)}
                disabled={isMatched}
              >
                <Text style={[
                  styles.pairText,
                  isMatched && styles.pairTextMatched,
                  isSelected && styles.pairTextSelected,
                ]}>{word}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Meanings column */}
        <View style={styles.column}>
          <Text style={styles.columnHeader}>Meaning</Text>
          {shuffledMeanings.map((meaning, index) => {
            const isMatched = Object.entries(pairMap).some(
              ([w, m]) => m === meaning && matchedPairs.has(w)
            );
            const isWrong = wrongMatch === meaning;

            return (
              <TouchableOpacity
                key={`m-${index}`}
                style={[
                  styles.pairItem,
                  isMatched && styles.pairItemMatched,
                  isWrong && styles.pairItemWrong,
                ]}
                onPress={() => handleMeaningPress(meaning)}
                disabled={isMatched || !selectedWord}
              >
                <Text style={[
                  styles.pairText,
                  isMatched && styles.pairTextMatched,
                  isWrong && styles.pairTextWrong,
                ]}>{meaning}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  columnsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#A1A1A1',
    marginBottom: 8,
    textAlign: 'center',
  },
  pairItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#D4D4D4',
    alignItems: 'center',
  },
  pairItemSelected: {
    borderColor: '#E8550C',
    borderWidth: 1,
    backgroundColor: '#FFF5EA',
  },
  pairItemMatched: {
    backgroundColor: colors.correctBg,
    borderColor: colors.correctBorder,
  },
  pairItemWrong: {
    backgroundColor: colors.wrongBg,
    borderColor: colors.wrongBorder,
  },
  pairText: {
    fontSize: 15,
    color: '#000',
    textAlign: 'center',
  },
  pairTextSelected: {
    color: '#E8550C',
    fontWeight: '600',
  },
  pairTextMatched: {
    color: colors.correctText,
    fontWeight: '500',
  },
  pairTextWrong: {
    color: colors.wrongText,
  },
});

export default MatchPairsQ;

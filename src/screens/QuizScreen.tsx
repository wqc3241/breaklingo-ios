import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuizData } from '../hooks/useQuizData';
import type { QuizQuestion } from '../lib/types';

const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const { questions, isLoading, hasProjects, regenerate } = useQuizData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIndex];

  const handleAnswer = useCallback(
    (answer: string) => {
      if (selectedAnswer) return; // Already answered
      setSelectedAnswer(answer);

      const isCorrect = answer === currentQuestion.correctAnswer;
      setAnsweredCorrectly(isCorrect);

      if (isCorrect) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      // Auto-advance after delay
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1);
          setSelectedAnswer(null);
          setAnsweredCorrectly(null);
        } else {
          setIsComplete(true);
        }
      }, 1200);
    },
    [selectedAnswer, currentQuestion, currentIndex, questions.length]
  );

  const restartQuiz = async () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setStreak(0);
    setIsComplete(false);
    setAnsweredCorrectly(null);
    await regenerate();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Generating quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasProjects || questions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>
            {!hasProjects ? 'No projects yet' : 'Not enough data for quiz'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {!hasProjects
              ? 'Process some videos to create quiz content'
              : 'Add more vocabulary to enable quiz generation'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <Text style={styles.resultsEmoji}>
            {percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'}
          </Text>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <Text style={styles.resultsScore}>
            {score}/{questions.length} correct ({percentage}%)
          </Text>

          <View style={styles.resultsActions}>
            <TouchableOpacity style={styles.primaryActionButton} onPress={restartQuiz}>
              <Text style={styles.primaryActionText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryActionButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryActionText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* Score & Streak */}
      <View style={styles.statsRow}>
        <Text style={styles.statText}>Score: {score}</Text>
        {streak > 1 && (
          <Text style={styles.streakText}>🔥 {streak} streak!</Text>
        )}
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        {currentQuestion.originalText && (
          <Text style={styles.originalText}>{currentQuestion.originalText}</Text>
        )}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let optionStyle = styles.optionDefault;
          let textStyle = styles.optionTextDefault;

          if (selectedAnswer) {
            if (option === currentQuestion.correctAnswer) {
              optionStyle = styles.optionCorrect;
              textStyle = styles.optionTextCorrect;
            } else if (option === selectedAnswer && option !== currentQuestion.correctAnswer) {
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

      {/* Feedback */}
      {answeredCorrectly !== null && (
        <View style={styles.feedbackContainer}>
          <Text style={styles.feedbackText}>
            {answeredCorrectly ? '✓ Correct!' : '✗ Incorrect'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statText: {
    fontSize: 15,
    color: '#3C3C43',
    fontWeight: '500',
  },
  streakText: {
    fontSize: 15,
    color: '#FF9500',
    fontWeight: '600',
  },
  // Question
  questionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  originalText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#3C3C43',
    textAlign: 'center',
    lineHeight: 26,
  },
  // Options
  optionsContainer: {
    paddingHorizontal: 16,
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
    borderColor: '#E5E5EA',
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
  // Feedback
  feedbackContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
  },
  // Empty
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#007AFF',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Results
  resultsContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 18,
    color: '#3C3C43',
    marginBottom: 32,
  },
  resultsActions: {
    gap: 12,
    width: '100%',
  },
  primaryActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryActionButton: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default QuizScreen;

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FileText, Trophy, Heart, Star, X } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { useLearningUnits } from '../hooks/useLearningUnits';
import { useQuizData } from '../hooks/useQuizData';
import MultipleChoiceQ from '../components/quiz/MultipleChoiceQ';
import TranslationQ from '../components/quiz/TranslationQ';
import FillBlankQ from '../components/quiz/FillBlankQ';
import ListeningQ from '../components/quiz/ListeningQ';
import MultipleSelectQ from '../components/quiz/MultipleSelectQ';
import WordArrangeQ from '../components/quiz/WordArrangeQ';
import MatchPairsQ from '../components/quiz/MatchPairsQ';
import ReadAfterMeQ from '../components/quiz/ReadAfterMeQ';
import type { QuizQuestion } from '../lib/types';

const MAX_HEARTS = 3;

const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const unitId = route.params?.unitId;
  const { user } = useAuth();
  const { units, fetchUnits, updateUnitProgress } = useLearningUnits(user?.id);
  const { questions: fallbackQuestions, isLoading: fallbackLoading, hasProjects, regenerate } = useQuizData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [isComplete, setIsComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (unitId) {
      // Load from learning unit
      if (units.length === 0) {
        fetchUnits();
        return;
      }
      const unit = units.find((u) => u.id === unitId);
      if (unit && unit.questions.length > 0) {
        setActiveQuestions(unit.questions);
        setTotalQuestions(unit.questions.length);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    } else {
      // Fallback to old quiz mode
      if (!fallbackLoading) {
        setActiveQuestions(fallbackQuestions);
        setTotalQuestions(fallbackQuestions.length);
        setIsLoading(false);
      }
    }
  }, [unitId, units, fallbackQuestions, fallbackLoading, fetchUnits]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      if (isCorrect) {
        setScore((s) => s + 1);
      } else {
        setHearts((h) => h - 1);
      }

      // Auto-advance after delay
      setTimeout(() => {
        if (hearts - (isCorrect ? 0 : 1) <= 0) {
          setIsComplete(true);
          return;
        }
        if (currentIndex < activeQuestions.length - 1) {
          setCurrentIndex((i) => i + 1);
        } else {
          setIsComplete(true);
        }
      }, 1200);
    },
    [currentIndex, activeQuestions.length, hearts]
  );

  const handleComplete = useCallback(async () => {
    if (unitId && totalQuestions > 0) {
      const finalScore = score / totalQuestions;
      await updateUnitProgress(unitId, finalScore);
    }
  }, [unitId, score, totalQuestions, updateUnitProgress]);

  useEffect(() => {
    if (isComplete) {
      handleComplete();
    }
  }, [isComplete, handleComplete]);

  const restartQuiz = async () => {
    setCurrentIndex(0);
    setScore(0);
    setHearts(MAX_HEARTS);
    setIsComplete(false);
    if (!unitId) {
      await regenerate();
    }
  };

  const renderQuestion = (question: QuizQuestion) => {
    switch (question.type) {
      case 'multiple_choice':
      case 'tell_meaning':
        return <MultipleChoiceQ question={question} onAnswer={handleAnswer} />;
      case 'translation':
        return <TranslationQ question={question} onAnswer={handleAnswer} />;
      case 'fill_blank':
        return <FillBlankQ question={question} onAnswer={handleAnswer} />;
      case 'listening':
        return <ListeningQ question={question} onAnswer={handleAnswer} />;
      case 'multiple_select':
        return <MultipleSelectQ question={question} onAnswer={handleAnswer} />;
      case 'word_arrange':
        return <WordArrangeQ question={question} onAnswer={handleAnswer} />;
      case 'match_pairs':
        return <MatchPairsQ question={question} onAnswer={handleAnswer} />;
      case 'read_after_me':
        return <ReadAfterMeQ question={question} onAnswer={handleAnswer} />;
      default:
        return <MultipleChoiceQ question={question} onAnswer={handleAnswer} />;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8550C" />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <View style={styles.emptyIcon}>
            <FileText size={48} color="#A1A1A1" />
          </View>
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
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 60 ? 1 : 0;
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultsEmoji}>
            <Trophy size={64} color="#EAB308" />
          </View>
          <Text style={styles.resultsTitle}>Quiz Complete!</Text>
          <View style={styles.starsDisplay}>
            {Array.from({ length: 3 }).map((_, i) =>
              i < stars ? (
                <Star key={i} size={20} color="#EAB308" fill="#EAB308" />
              ) : (
                <Star key={i} size={20} color="#D4D4D4" />
              )
            )}
          </View>
          <Text style={styles.resultsScore}>
            {score}/{totalQuestions} correct ({percentage}%)
          </Text>
          {hearts <= 0 && (
            <Text style={styles.heartsOutText}>You ran out of hearts!</Text>
          )}

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

  const currentQuestion = activeQuestions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentIndex + 1) / activeQuestions.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1}/{activeQuestions.length}
        </Text>
      </View>

      {/* Hearts */}
      <View style={styles.heartsRow}>
        {Array.from({ length: MAX_HEARTS }).map((_, i) => (
          <View key={i} style={styles.heart}>
            {i < hearts ? (
              <Heart size={16} color="#EF4444" fill="#EF4444" />
            ) : (
              <Heart size={16} color="#D4D4D4" />
            )}
          </View>
        ))}
        <View style={styles.spacer} />
        <Text style={styles.scoreDisplay}>Score: {score}</Text>
      </View>

      {/* Question */}
      <ScrollView contentContainerStyle={styles.questionScroll}>
        {renderQuestion(currentQuestion)}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    color: '#A1A1A1',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#D4D4D4',
    borderRadius: 4,
  },
  progressFill: {
    height: 8,
    backgroundColor: '#E8550C',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#A1A1A1',
    fontWeight: '500',
  },
  heartsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  heart: {
    marginRight: 2,
  },
  spacer: {
    flex: 1,
  },
  scoreDisplay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#525252',
  },
  questionScroll: {
    flexGrow: 1,
    padding: 16,
  },
  // Empty
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#525252',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#A1A1A1',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#E8550C',
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
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  starsDisplay: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  resultsScore: {
    fontSize: 18,
    color: '#525252',
    marginBottom: 8,
  },
  heartsOutText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 24,
  },
  resultsActions: {
    gap: 12,
    width: '100%',
    marginTop: 16,
  },
  primaryActionButton: {
    backgroundColor: '#E8550C',
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
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D4D4D4',
  },
  secondaryActionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default QuizScreen;

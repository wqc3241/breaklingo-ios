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
import AsyncStorage from '@react-native-async-storage/async-storage';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { useLearningUnits } from '../hooks/useLearningUnits';
import { useQuizData } from '../hooks/useQuizData';
import { useStreak } from '../hooks/useStreak';
import { useExperience } from '../hooks/useExperience';
import MultipleChoiceQ from '../components/quiz/MultipleChoiceQ';
import TranslationQ from '../components/quiz/TranslationQ';
import FillBlankQ from '../components/quiz/FillBlankQ';
import ListeningQ from '../components/quiz/ListeningQ';
import MultipleSelectQ from '../components/quiz/MultipleSelectQ';
import WordArrangeQ from '../components/quiz/WordArrangeQ';
import MatchPairsQ from '../components/quiz/MatchPairsQ';
import ReadAfterMeQ from '../components/quiz/ReadAfterMeQ';
import QuizQuestionShell from '../components/quiz/QuizQuestionShell';
import type { QuizQuestion } from '../lib/types';

const MAX_HEARTS = 3;
const QUIZ_SCORES_KEY = 'breaklingo-quiz-scores';
const MAX_SCORES = 50;

export interface QuizScoreEntry {
  id: string;
  score: number;
  total: number;
  percentage: number;
  stars: number;
  unitId?: string;
  unitTitle?: string;
  date: string;
}

export const saveQuizScore = async (entry: QuizScoreEntry): Promise<void> => {
  try {
    const stored = await AsyncStorage.getItem(QUIZ_SCORES_KEY);
    const existing: QuizScoreEntry[] = stored ? JSON.parse(stored) : [];
    const updated = [entry, ...existing].slice(0, MAX_SCORES);
    await AsyncStorage.setItem(QUIZ_SCORES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save quiz score:', error);
  }
};

export const loadQuizScores = async (): Promise<QuizScoreEntry[]> => {
  try {
    const stored = await AsyncStorage.getItem(QUIZ_SCORES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load quiz scores:', error);
    return [];
  }
};

const QuizScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const unitId = route.params?.unitId;
  const { user } = useAuth();
  const { updateUnitProgress, fetchUnitQuestions } = useLearningUnits(user?.id);
  const unitTitle = route.params?.unitTitle;
  const { questions: fallbackQuestions, isLoading: fallbackLoading, hasProjects, regenerate } = useQuizData();
  const { markDayComplete } = useStreak();
  const { addXP } = useExperience();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [isComplete, setIsComplete] = useState(false);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (unitId) {
      // Lazy-load questions for this specific unit
      const loadQuestions = async () => {
        const questions = await fetchUnitQuestions(unitId);
        if (questions.length > 0) {
          const limited = questions.slice(0, 10);
          setActiveQuestions(limited);
          setTotalQuestions(limited.length);
        }
        setIsLoading(false);
      };
      loadQuestions();
    } else {
      // Fallback to old quiz mode
      if (!fallbackLoading) {
        setActiveQuestions(fallbackQuestions);
        setTotalQuestions(fallbackQuestions.length);
        setIsLoading(false);
      }
    }
  }, [unitId, fallbackQuestions, fallbackLoading, fetchUnitQuestions]);

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
    if (totalQuestions > 0) {
      const percentage = Math.round((score / totalQuestions) * 100);
      const stars = percentage >= 90 ? 3 : percentage >= 70 ? 2 : percentage >= 60 ? 1 : 0;

      if (unitId) {
        const finalScore = score / totalQuestions;
        await updateUnitProgress(unitId, finalScore);
      }

      await saveQuizScore({
        id: `quiz-${Date.now()}`,
        score,
        total: totalQuestions,
        percentage,
        stars,
        unitId: unitId || undefined,
        unitTitle: unitTitle || undefined,
        date: new Date().toISOString(),
      });

      // Award XP based on score percentage (e.g., 85% = 85 XP) and mark streak day
      await addXP(percentage);
      await markDayComplete();
    }
  }, [unitId, unitTitle, score, totalQuestions, updateUnitProgress, addXP, markDayComplete]);

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
    let typeLabel: string;
    let scriptText: string | undefined;
    let component: React.ReactNode;

    switch (question.type) {
      case 'multiple_choice':
      case 'tell_meaning': {
        typeLabel = question.type === 'tell_meaning' ? 'Vocabulary' : 'Multiple Choice';
        // Extract learning language text: prefer originalText, else parse from question string
        // Question format is often: "What does 'こんにちは' mean?"
        let mcScript = question.originalText;
        if (!mcScript && question.question) {
          const match = question.question.match(/[''""](.+?)[''""]|[「」](.+?)[「」]/);
          if (match) {
            mcScript = match[1] || match[2];
          }
        }
        scriptText = mcScript;
        component = <MultipleChoiceQ question={question} onAnswer={handleAnswer} />;
        break;
      }
      case 'translation': {
        typeLabel = 'Translation';
        let transScript = question.originalText || question.context || question.question;
        // Strip "Translate: " or "Translate:" prefix from AI-generated text
        if (transScript) {
          transScript = transScript.replace(/^Translate:\s*/i, '');
        }
        scriptText = transScript;
        component = <TranslationQ question={question} onAnswer={handleAnswer} />;
        break;
      }
      case 'fill_blank': {
        typeLabel = 'Fill in the Blank';
        let fillScript = question.sentence || question.question;
        if (fillScript) {
          fillScript = fillScript.replace(/^Fill in the blank:\s*/i, '');
        }
        scriptText = fillScript;
        component = <FillBlankQ question={question} onAnswer={handleAnswer} />;
        break;
      }
      case 'listening':
        typeLabel = 'Listening';
        scriptText = question.audioText || question.originalText;
        component = <ListeningQ question={question} onAnswer={handleAnswer} />;
        break;
      case 'multiple_select':
        typeLabel = 'Select All';
        scriptText = question.originalText;
        component = <MultipleSelectQ question={question} onAnswer={handleAnswer} />;
        break;
      case 'word_arrange':
        typeLabel = 'Word Order';
        scriptText = question.originalText;
        component = <WordArrangeQ question={question} onAnswer={handleAnswer} />;
        break;
      case 'match_pairs':
        typeLabel = 'Match Pairs';
        scriptText = undefined;
        component = <MatchPairsQ question={question} onAnswer={handleAnswer} />;
        break;
      case 'read_after_me':
        typeLabel = 'Pronunciation';
        scriptText = question.targetText || question.originalText;
        component = <ReadAfterMeQ question={question} onAnswer={handleAnswer} />;
        break;
      default:
        typeLabel = 'Multiple Choice';
        scriptText = question.originalText;
        component = <MultipleChoiceQ question={question} onAnswer={handleAnswer} />;
        break;
    }

    return (
      <QuizQuestionShell typeLabel={typeLabel} scriptText={scriptText}>
        {component}
      </QuizQuestionShell>
    );
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
          <View style={styles.emptyIconCircle}>
            <FileText size={36} color="#E8550C" />
          </View>
          <Text style={styles.emptyTitle}>
            {!hasProjects ? 'No projects yet' : 'Not enough data for quiz'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {!hasProjects
              ? 'Search for a YouTube video to create quiz content'
              : 'Add more vocabulary from video analysis to enable quiz generation'}
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
      <ErrorBoundary>
        <ScrollView contentContainerStyle={styles.questionScroll} key={currentIndex}>
          {renderQuestion(currentQuestion)}
        </ScrollView>
      </ErrorBoundary>
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
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
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

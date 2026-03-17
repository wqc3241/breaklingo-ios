import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import QuizScreen from '../../src/screens/QuizScreen';
import type { QuizQuestion } from '../../src/lib/types';

// --- Mocks (only hooks and navigation, NOT quiz components) ---

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: mockGoBack,
    dispatch: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@test.com' } }),
}));

jest.mock('../../src/hooks/useLearningUnits', () => ({
  useLearningUnits: () => ({
    units: [],
    fetchUnits: jest.fn(),
    updateUnitProgress: jest.fn(),
  }),
}));

let mockQuestions: QuizQuestion[] = [];

jest.mock('../../src/hooks/useQuizData', () => ({
  useQuizData: () => ({
    questions: mockQuestions,
    isLoading: false,
    hasProjects: true,
    regenerate: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: jest.fn(),
    isPlaying: false,
  }),
}));

// --- Test Data ---

const allTypeQuestions: QuizQuestion[] = [
  {
    id: 'mc-1',
    type: 'multiple_choice',
    question: 'What does 猫 mean?',
    correctAnswer: 'Cat',
    options: ['Dog', 'Cat', 'Bird', 'Fish'],
  },
  {
    id: 'tr-1',
    type: 'translation',
    question: 'What is the correct translation?',
    correctAnswer: 'I am happy',
    options: ['I am sad', 'I am happy', 'I am tired', 'I am hungry'],
    originalText: '私は嬉しいです',
  },
  {
    id: 'fb-1',
    type: 'fill_blank',
    question: 'Which word means "water"?',
    correctAnswer: '水',
    options: ['火', '水', '木', '金'],
  },
  {
    id: 'li-1',
    type: 'listening',
    question: 'What did you hear?',
    correctAnswer: 'こんにちは',
    options: ['さようなら', 'こんにちは', 'ありがとう', 'すみません'],
    audioText: 'こんにちは',
  },
  {
    id: 'ms-1',
    type: 'multiple_select',
    question: 'Select all fruits',
    correctAnswer: '',
    options: ['Apple', 'Car', 'Banana', 'Table'],
    correctSelections: ['Apple', 'Banana'],
  },
  {
    id: 'wa-1',
    type: 'word_arrange',
    question: 'Arrange the words correctly',
    correctAnswer: '',
    options: [],
    words: ['happy', 'I', 'am'],
    correctOrder: ['I', 'am', 'happy'],
  },
  {
    id: 'mp-1',
    type: 'match_pairs',
    question: 'Match the pairs',
    correctAnswer: '',
    options: [],
    pairs: [
      { word: '犬', meaning: 'Hound' },
      { word: '花', meaning: 'Flower' },
      { word: '月', meaning: 'Moon' },
    ],
  },
];

const simpleQuestions: QuizQuestion[] = [
  {
    id: 'sq-1',
    type: 'multiple_choice',
    question: 'Q1: What does あ mean?',
    correctAnswer: 'Ah',
    options: ['Ah', 'Bee', 'See', 'Dee'],
  },
  {
    id: 'sq-2',
    type: 'multiple_choice',
    question: 'Q2: What does い mean?',
    correctAnswer: 'Ee',
    options: ['Ee', 'Uu', 'Ey', 'Oh'],
  },
  {
    id: 'sq-3',
    type: 'multiple_choice',
    question: 'Q3: What does う mean?',
    correctAnswer: 'Uu',
    options: ['Ah', 'Ee', 'Uu', 'Ey'],
  },
];

const fiveQuestions: QuizQuestion[] = Array.from({ length: 5 }, (_, i) => ({
  id: `fq-${i + 1}`,
  type: 'multiple_choice' as const,
  question: `FiveQ${i + 1}`,
  correctAnswer: `Right${i + 1}`,
  options: [`Right${i + 1}`, `WrongA${i + 1}`, `WrongB${i + 1}`, `WrongC${i + 1}`],
}));

// --- Helpers ---

const advanceToNextQuestion = async () => {
  await act(async () => {
    jest.advanceTimersByTime(1200);
  });
};

// --- Tests ---

describe('QuizFlow Integration', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockQuestions = [];
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('completes quiz with all correct answers across all question types', async () => {
    mockQuestions = allTypeQuestions;
    const { getByText, getAllByText, queryByText } = render(<QuizScreen />);

    // Q1: Multiple Choice (1/7)
    await waitFor(() => expect(getByText('1/7')).toBeTruthy());
    expect(getByText('Score: 0')).toBeTruthy();
    fireEvent.press(getByText('Cat'));
    await advanceToNextQuestion();

    // Q2: Translation (2/7)
    await waitFor(() => expect(getByText('2/7')).toBeTruthy());
    expect(getByText('Score: 1')).toBeTruthy();
    fireEvent.press(getByText('I am happy'));
    await advanceToNextQuestion();

    // Q3: Fill Blank (3/7)
    await waitFor(() => expect(getByText('3/7')).toBeTruthy());
    expect(getByText('Score: 2')).toBeTruthy();
    fireEvent.press(getByText('水'));
    await advanceToNextQuestion();

    // Q4: Listening (4/7)
    await waitFor(() => expect(getByText('4/7')).toBeTruthy());
    expect(getByText('Score: 3')).toBeTruthy();
    // こんにちは appears in both the shell's script card and as an option
    const allKonnichiwa = getAllByText('こんにちは');
    fireEvent.press(allKonnichiwa[allKonnichiwa.length - 1]); // press the option (last one)
    await advanceToNextQuestion();

    // Q5: Multiple Select (5/7)
    await waitFor(() => expect(getByText('5/7')).toBeTruthy());
    expect(getByText('Score: 4')).toBeTruthy();
    act(() => { fireEvent.press(getByText('Apple')); });
    act(() => { fireEvent.press(getByText('Banana')); });
    act(() => { fireEvent.press(getByText('Check Answer')); });
    await advanceToNextQuestion();

    // Q6: Word Arrange (6/7)
    await waitFor(() => expect(getByText('6/7')).toBeTruthy());
    expect(getByText('Score: 5')).toBeTruthy();
    act(() => { fireEvent.press(getByText('I')); });
    act(() => { fireEvent.press(getByText('am')); });
    act(() => { fireEvent.press(getByText('happy')); });
    act(() => { fireEvent.press(getByText('Check')); });
    await advanceToNextQuestion();

    // Q7: Match Pairs (7/7)
    await waitFor(() => expect(getByText('7/7')).toBeTruthy());
    expect(getByText('Score: 6')).toBeTruthy();
    act(() => { fireEvent.press(getByText('犬')); });
    act(() => { fireEvent.press(getByText('Hound')); });
    act(() => { fireEvent.press(getByText('花')); });
    act(() => { fireEvent.press(getByText('Flower')); });
    act(() => { fireEvent.press(getByText('月')); });
    act(() => { fireEvent.press(getByText('Moon')); });
    await advanceToNextQuestion();

    // Results
    await waitFor(() => expect(getByText('Quiz Complete!')).toBeTruthy());
    expect(getByText('7/7 correct (100%)')).toBeTruthy();
    expect(queryByText('You ran out of hearts!')).toBeNull();
  });

  it('completes quiz with some wrong answers and shows correct star count', async () => {
    mockQuestions = simpleQuestions;
    const { getByText } = render(<QuizScreen />);

    // Q1: Answer wrong (hearts 3→2)
    await waitFor(() => expect(getByText('1/3')).toBeTruthy());
    fireEvent.press(getByText('Bee')); // wrong, correct is 'Ah'
    await advanceToNextQuestion();

    // Q2: Answer correct
    await waitFor(() => expect(getByText('2/3')).toBeTruthy());
    fireEvent.press(getByText('Ee'));
    await advanceToNextQuestion();

    // Q3: Answer correct
    await waitFor(() => expect(getByText('3/3')).toBeTruthy());
    fireEvent.press(getByText('Uu'));
    await advanceToNextQuestion();

    // Results: 2/3 = 67% → 1 star (≥60%, <70%)
    await waitFor(() => expect(getByText('Quiz Complete!')).toBeTruthy());
    expect(getByText('2/3 correct (67%)')).toBeTruthy();
  });

  it('shows game over when hearts reach zero', async () => {
    mockQuestions = fiveQuestions;
    const { getByText } = render(<QuizScreen />);

    // Q1: wrong (hearts 3→2)
    await waitFor(() => expect(getByText('1/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA1'));
    await advanceToNextQuestion();

    // Q2: wrong (hearts 2→1)
    await waitFor(() => expect(getByText('2/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA2'));
    await advanceToNextQuestion();

    // Q3: wrong (hearts 1→0) → game over
    await waitFor(() => expect(getByText('3/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA3'));
    await advanceToNextQuestion();

    // Game over
    await waitFor(() => expect(getByText('You ran out of hearts!')).toBeTruthy());
    expect(getByText('0/5 correct (0%)')).toBeTruthy();
  });

  it('restarts quiz when Try Again is pressed', async () => {
    mockQuestions = simpleQuestions;
    const { getByText } = render(<QuizScreen />);

    // Complete the quiz
    await waitFor(() => expect(getByText('1/3')).toBeTruthy());
    fireEvent.press(getByText('Ah'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('2/3')).toBeTruthy());
    fireEvent.press(getByText('Ee'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('3/3')).toBeTruthy());
    fireEvent.press(getByText('Uu'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('Quiz Complete!')).toBeTruthy());

    // Press Try Again
    await act(async () => {
      fireEvent.press(getByText('Try Again'));
    });

    // Verify quiz restarted
    await waitFor(() => expect(getByText('1/3')).toBeTruthy());
    expect(getByText('Score: 0')).toBeTruthy();
  });

  it('calls navigation.goBack when Done is pressed', async () => {
    mockQuestions = simpleQuestions;
    const { getByText } = render(<QuizScreen />);

    // Complete the quiz
    await waitFor(() => expect(getByText('1/3')).toBeTruthy());
    fireEvent.press(getByText('Ah'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('2/3')).toBeTruthy());
    fireEvent.press(getByText('Ee'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('3/3')).toBeTruthy());
    fireEvent.press(getByText('Uu'));
    await advanceToNextQuestion();

    await waitFor(() => expect(getByText('Quiz Complete!')).toBeTruthy());

    // Press Done
    fireEvent.press(getByText('Done'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows 0 stars for score below 60%', async () => {
    mockQuestions = fiveQuestions;
    const { getByText } = render(<QuizScreen />);

    // Q1: correct
    await waitFor(() => expect(getByText('1/5')).toBeTruthy());
    fireEvent.press(getByText('Right1'));
    await advanceToNextQuestion();

    // Q2: correct
    await waitFor(() => expect(getByText('2/5')).toBeTruthy());
    fireEvent.press(getByText('Right2'));
    await advanceToNextQuestion();

    // Q3: wrong (hearts 3→2)
    await waitFor(() => expect(getByText('3/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA3'));
    await advanceToNextQuestion();

    // Q4: wrong (hearts 2→1)
    await waitFor(() => expect(getByText('4/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA4'));
    await advanceToNextQuestion();

    // Q5: wrong (hearts 1→0) → game over
    await waitFor(() => expect(getByText('5/5')).toBeTruthy());
    fireEvent.press(getByText('WrongA5'));
    await advanceToNextQuestion();

    // Results: 2/5 = 40% → 0 stars
    await waitFor(() => expect(getByText('You ran out of hearts!')).toBeTruthy());
    expect(getByText('2/5 correct (40%)')).toBeTruthy();
  });
});

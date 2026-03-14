import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import QuizScreen from '../../src/screens/QuizScreen';

// Mock hooks
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    dispatch: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
  }),
}));

jest.mock('../../src/hooks/useLearningUnits', () => ({
  useLearningUnits: () => ({
    units: [],
    fetchUnits: jest.fn(),
    updateUnitProgress: jest.fn(),
  }),
}));

let mockQuestions: any[] = [];
let mockIsLoading = false;
let mockHasProjects = true;

jest.mock('../../src/hooks/useQuizData', () => ({
  useQuizData: () => ({
    questions: mockQuestions,
    isLoading: mockIsLoading,
    hasProjects: mockHasProjects,
    regenerate: jest.fn(),
  }),
}));

// Mock quiz components
jest.mock('../../src/components/quiz/MultipleChoiceQ', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return (props: any) => React.createElement(Text, null, `MC: ${props.question.question}`);
});

jest.mock('../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: jest.fn(),
    isPlaying: false,
  }),
}));

describe('QuizScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQuestions = [];
    mockIsLoading = false;
    mockHasProjects = true;
  });

  it('shows loading state initially', () => {
    mockIsLoading = true;
    const { getByText } = render(<QuizScreen />);
    expect(getByText('Loading quiz...')).toBeTruthy();
  });

  it('shows empty state when no projects', () => {
    mockHasProjects = false;
    const { getByText } = render(<QuizScreen />);
    expect(getByText('No projects yet')).toBeTruthy();
  });

  it('shows empty state when no quiz data', () => {
    mockHasProjects = true;
    const { getByText } = render(<QuizScreen />);
    expect(getByText('Not enough data for quiz')).toBeTruthy();
  });

  it('renders quiz with questions', async () => {
    mockQuestions = [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'What does 猫 mean?',
        correctAnswer: 'Cat',
        options: ['Cat', 'Dog', 'Bird', 'Fish'],
      },
    ];

    const { getByText } = render(<QuizScreen />);
    await waitFor(() => {
      expect(getByText('MC: What does 猫 mean?')).toBeTruthy();
    });
  });

  it('shows hearts display', async () => {
    mockQuestions = [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Test',
        correctAnswer: 'A',
        options: ['A', 'B', 'C', 'D'],
      },
    ];

    const { getByText } = render(<QuizScreen />);
    await waitFor(() => {
      expect(getByText('Score: 0')).toBeTruthy();
      expect(getByText('1/1')).toBeTruthy();
    });
  });
});

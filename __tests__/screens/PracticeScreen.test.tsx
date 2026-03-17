import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PracticeScreen from '../../src/screens/PracticeScreen';

let mockCurrentProject: any = null;

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    currentProject: mockCurrentProject,
  }),
}));

jest.mock('../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: jest.fn(),
    isPlaying: false,
    currentText: null,
  }),
}));

describe('PracticeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentProject = null;
  });

  it('shows empty state when no project', () => {
    const { getByText } = render(<PracticeScreen />);
    expect(getByText('No practice sentences')).toBeTruthy();
  });

  it('renders header and generate button with project', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [],
      practiceSentences: [
        {
          text: 'Hello',
          translation: 'Hi',
          difficulty: 'beginner',
          usedVocabulary: [],
          usedGrammar: [],
        },
      ],
    };

    const { getByText } = render(<PracticeScreen />);
    expect(getByText('Practice Sentences')).toBeTruthy();
    expect(getByText('Generate')).toBeTruthy();
  });

  it('renders difficulty filters with correct text', async () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [],
      practiceSentences: [
        {
          text: 'Hello',
          translation: 'Hi',
          difficulty: 'beginner',
          usedVocabulary: [],
          usedGrammar: [],
        },
      ],
    };

    const { getByText } = render(<PracticeScreen />);
    await waitFor(() => {
      expect(getByText('All (1)')).toBeTruthy();
    });
    expect(getByText('Beginner')).toBeTruthy();
    expect(getByText('Intermediate')).toBeTruthy();
    expect(getByText('Advanced')).toBeTruthy();
  });

  it('renders practice sentences', async () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [],
      practiceSentences: [
        {
          text: 'おはようございます',
          translation: 'Good morning',
          difficulty: 'beginner',
          usedVocabulary: ['おはよう'],
          usedGrammar: [],
        },
      ],
    };

    const { getByText } = render(<PracticeScreen />);
    await waitFor(() => {
      expect(getByText('おはようございます')).toBeTruthy();
      expect(getByText('Good morning')).toBeTruthy();
    });
  });

  it('filters by difficulty', async () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [],
      practiceSentences: [
        {
          text: 'Easy sentence',
          translation: 'Easy',
          difficulty: 'beginner',
          usedVocabulary: [],
          usedGrammar: [],
        },
        {
          text: 'Hard sentence',
          translation: 'Hard',
          difficulty: 'advanced',
          usedVocabulary: [],
          usedGrammar: [],
        },
      ],
    };

    const { getByText, queryByText } = render(<PracticeScreen />);
    await waitFor(() => {
      expect(getByText('Beginner')).toBeTruthy();
    });
    fireEvent.press(getByText('Beginner'));
    await waitFor(() => {
      expect(getByText('Easy sentence')).toBeTruthy();
      expect(queryByText('Hard sentence')).toBeNull();
    });
  });
});

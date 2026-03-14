import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import StudyScreen from '../../src/screens/StudyScreen';

// Mock hooks
let mockCurrentProject: any = null;
const mockSetCurrentProject = jest.fn();
const mockAutoSaveProject = jest.fn();

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    currentProject: mockCurrentProject,
    setCurrentProject: mockSetCurrentProject,
    autoSaveProject: mockAutoSaveProject,
  }),
}));

jest.mock('../../src/hooks/useVideoProcessing', () => ({
  useVideoProcessing: () => ({
    regenerateAnalysis: jest.fn(),
    isProcessing: false,
    processingStep: '',
  }),
}));

const mockSpeak = jest.fn();
jest.mock('../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: mockSpeak,
    isPlaying: false,
    currentText: null,
  }),
}));

describe('StudyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentProject = null;
  });

  it('shows empty state when no project', () => {
    const { getByText } = render(<StudyScreen />);
    expect(getByText('No lesson yet')).toBeTruthy();
  });

  it('renders vocab tab by default with project', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [{ word: '猫', meaning: 'Cat', reading: 'ねこ', partOfSpeech: 'noun' }],
      grammar: [],
      script: 'Hello world',
    };

    const { getByText } = render(<StudyScreen />);
    expect(getByText('Vocab (1)')).toBeTruthy();
    expect(getByText('Grammar (0)')).toBeTruthy();
    expect(getByText('Script')).toBeTruthy();
  });

  it('shows vocabulary items', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [{ word: '猫', meaning: 'Cat', reading: 'ねこ' }],
      grammar: [],
      script: '',
    };

    const { getByText } = render(<StudyScreen />);
    expect(getByText('猫')).toBeTruthy();
    expect(getByText('Cat')).toBeTruthy();
  });

  it('switches to grammar tab', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [{ rule: 'Particles', example: 'は is topic marker', explanation: 'Used to mark the topic' }],
      script: '',
    };

    const { getByText } = render(<StudyScreen />);
    fireEvent.press(getByText('Grammar (1)'));
    expect(getByText('Particles')).toBeTruthy();
  });

  it('switches to script tab', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Test',
      vocabulary: [],
      grammar: [],
      script: 'Full transcript here',
    };

    const { getByText } = render(<StudyScreen />);
    fireEvent.press(getByText('Script'));
    expect(getByText('Full transcript here')).toBeTruthy();
  });

  it('shows project title', () => {
    mockCurrentProject = {
      id: '1',
      title: 'Japanese Lesson',
      vocabulary: [],
      grammar: [],
      script: '',
    };

    const { getByText } = render(<StudyScreen />);
    expect(getByText('Japanese Lesson')).toBeTruthy();
  });
});

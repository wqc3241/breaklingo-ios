import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReadAfterMeQ from '../../../src/components/quiz/ReadAfterMeQ';
import type { QuizQuestion } from '../../../src/lib/types';

// Mock useTextToSpeech
const mockSpeak = jest.fn();
jest.mock('../../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: mockSpeak,
    isPlaying: false,
  }),
}));

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'read_after_me',
  question: 'Read after me',
  correctAnswer: 'Good morning',
  options: [],
  targetText: 'Good morning',
};

describe('ReadAfterMeQ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "Read after me:" label', () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Read after me:')).toBeTruthy();
  });

  it('renders target text', () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Good morning')).toBeTruthy();
  });

  it('renders listen button', () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Listen first')).toBeTruthy();
  });

  it('calls speak when listen pressed', () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    fireEvent.press(getByText('Listen first'));
    expect(mockSpeak).toHaveBeenCalledWith('Good morning');
  });

  it('renders record button', () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Record')).toBeTruthy();
  });

  it('starts recording on record button press', async () => {
    const { getByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    await waitFor(() => {
      fireEvent.press(getByText('Record'));
    });
    // Audio.requestPermissionsAsync should have been called
    const { Audio } = require('expo-av');
    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ListeningQ from '../../../src/components/quiz/ListeningQ';
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
  type: 'listening',
  question: 'What did you hear?',
  correctAnswer: 'Hello',
  options: ['Hello', 'Goodbye', 'Thanks', 'Sorry'],
  audioText: 'Hello',
};

describe('ListeningQ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the question', () => {
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('What did you hear?')).toBeTruthy();
  });

  it('renders play button with Listen text', () => {
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Listen')).toBeTruthy();
  });

  it('calls speak when play button pressed', () => {
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    fireEvent.press(getByText('Listen'));
    expect(mockSpeak).toHaveBeenCalledWith('Hello');
  });

  it('renders all options', () => {
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Hello')).toBeTruthy();
    expect(getByText('Goodbye')).toBeTruthy();
    expect(getByText('Thanks')).toBeTruthy();
    expect(getByText('Sorry')).toBeTruthy();
  });

  it('calls onAnswer(true) for correct answer', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Hello'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) for wrong answer', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Goodbye'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('prevents double selection', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <ListeningQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Hello'));
    fireEvent.press(getByText('Goodbye'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
});

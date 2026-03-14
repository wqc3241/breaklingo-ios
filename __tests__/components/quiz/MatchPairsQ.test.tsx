import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MatchPairsQ from '../../../src/components/quiz/MatchPairsQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'match_pairs',
  question: 'Match the pairs',
  correctAnswer: '',
  options: [],
  pairs: [
    { word: '猫', meaning: 'Cat' },
    { word: '犬', meaning: 'Dog' },
    { word: '鳥', meaning: 'Bird' },
  ],
};

describe('MatchPairsQ', () => {
  it('renders the question', () => {
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Match the pairs')).toBeTruthy();
  });

  it('renders column headers', () => {
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Word')).toBeTruthy();
    expect(getByText('Meaning')).toBeTruthy();
  });

  it('renders all words and meanings', () => {
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('猫')).toBeTruthy();
    expect(getByText('犬')).toBeTruthy();
    expect(getByText('鳥')).toBeTruthy();
    expect(getByText('Cat')).toBeTruthy();
    expect(getByText('Dog')).toBeTruthy();
    expect(getByText('Bird')).toBeTruthy();
  });

  it('selects a word on tap', () => {
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    // Just verify it doesn't throw
    fireEvent.press(getByText('猫'));
  });

  it('calls onAnswer after all pairs matched correctly', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={onAnswer} />
    );

    // Match all pairs correctly
    fireEvent.press(getByText('猫'));
    fireEvent.press(getByText('Cat'));
    fireEvent.press(getByText('犬'));
    fireEvent.press(getByText('Dog'));
    fireEvent.press(getByText('鳥'));
    fireEvent.press(getByText('Bird'));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) when errors were made', async () => {
    jest.useFakeTimers();
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MatchPairsQ question={mockQuestion} onAnswer={onAnswer} />
    );

    // Make a wrong match first
    fireEvent.press(getByText('猫'));
    fireEvent.press(getByText('Dog')); // wrong

    // Advance timer for the wrong match reset
    jest.advanceTimersByTime(1000);

    // Now match correctly
    fireEvent.press(getByText('猫'));
    fireEvent.press(getByText('Cat'));
    fireEvent.press(getByText('犬'));
    fireEvent.press(getByText('Dog'));
    fireEvent.press(getByText('鳥'));
    fireEvent.press(getByText('Bird'));

    expect(onAnswer).toHaveBeenCalledWith(false); // had errors

    jest.useRealTimers();
  });
});

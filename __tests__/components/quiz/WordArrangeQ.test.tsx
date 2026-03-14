import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WordArrangeQ from '../../../src/components/quiz/WordArrangeQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'word_arrange',
  question: 'Arrange the words to form a sentence',
  correctAnswer: '',
  options: [],
  words: ['is', 'the', 'cat', 'big'],
  correctOrder: ['the', 'cat', 'is', 'big'],
};

describe('WordArrangeQ', () => {
  it('renders the question', () => {
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Arrange the words to form a sentence')).toBeTruthy();
  });

  it('renders placeholder text', () => {
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Tap words to build your answer')).toBeTruthy();
  });

  it('renders all available words', () => {
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    // All words should be renderable
    expect(getByText('is')).toBeTruthy();
    expect(getByText('the')).toBeTruthy();
    expect(getByText('cat')).toBeTruthy();
    expect(getByText('big')).toBeTruthy();
  });

  it('renders Reset and Check buttons', () => {
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Reset')).toBeTruthy();
    expect(getByText('Check')).toBeTruthy();
  });

  it('moves word from available to selected on tap', () => {
    const { getByText, queryByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );

    fireEvent.press(getByText('the'));
    // Placeholder should be gone since we have a selected word
    expect(queryByText('Tap words to build your answer')).toBeNull();
  });

  it('calls onAnswer(true) for correct arrangement', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('the'));
    fireEvent.press(getByText('cat'));
    fireEvent.press(getByText('is'));
    fireEvent.press(getByText('big'));
    fireEvent.press(getByText('Check'));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) for wrong arrangement', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('big'));
    fireEvent.press(getByText('cat'));
    fireEvent.press(getByText('is'));
    fireEvent.press(getByText('the'));
    fireEvent.press(getByText('Check'));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('shows correct answer after wrong submission', () => {
    const { getByText } = render(
      <WordArrangeQ question={mockQuestion} onAnswer={jest.fn()} />
    );

    fireEvent.press(getByText('big'));
    fireEvent.press(getByText('Check'));

    expect(getByText('Correct answer:')).toBeTruthy();
    expect(getByText('the cat is big')).toBeTruthy();
  });
});

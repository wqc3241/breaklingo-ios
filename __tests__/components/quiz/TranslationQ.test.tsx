import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TranslationQ from '../../../src/components/quiz/TranslationQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'translation',
  question: 'Translate this sentence',
  correctAnswer: 'Good morning',
  options: ['Good morning', 'Good night', 'Hello', 'Goodbye'],
  originalText: 'おはようございます',
};

describe('TranslationQ', () => {
  it('renders all options', () => {
    const { getByText } = render(
      <TranslationQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    mockQuestion.options.forEach((opt) => {
      expect(getByText(opt)).toBeTruthy();
    });
  });

  it('does not render context card (shell handles it)', () => {
    const { queryByText } = render(
      <TranslationQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(queryByText('Translate this:')).toBeNull();
  });

  it('calls onAnswer(true) for correct selection', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <TranslationQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Good morning'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) for wrong selection', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <TranslationQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Goodbye'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('disables options after selection', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <TranslationQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('Good morning'));
    fireEvent.press(getByText('Hello'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
});

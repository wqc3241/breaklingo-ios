import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import FillBlankQ from '../../../src/components/quiz/FillBlankQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'fill_blank',
  question: 'Which word means "cat"?',
  correctAnswer: '猫',
  options: ['犬', '猫', '鳥', '魚'],
  sentence: 'The ___ is sleeping.',
};

describe('FillBlankQ', () => {
  it('renders options (question text handled by shell)', () => {
    const { getByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('猫')).toBeTruthy();
  });

  it('does not render sentence card (shell handles it)', () => {
    const { queryByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(queryByText('The ______ is sleeping.')).toBeNull();
  });

  it('renders options in a grid', () => {
    const { getByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    mockQuestion.options.forEach((opt) => {
      expect(getByText(opt)).toBeTruthy();
    });
  });

  it('calls onAnswer(true) for correct option', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('猫'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) for wrong option', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('犬'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('prevents double selection', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <FillBlankQ question={mockQuestion} onAnswer={onAnswer} />
    );
    fireEvent.press(getByText('猫'));
    fireEvent.press(getByText('犬'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MultipleChoiceQ from '../../../src/components/quiz/MultipleChoiceQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'multiple_choice',
  question: 'What does "猫" mean?',
  correctAnswer: 'Cat',
  options: ['Dog', 'Cat', 'Bird', 'Fish'],
  originalText: '猫',
};

describe('MultipleChoiceQ', () => {
  it('renders the question text', () => {
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('What does "猫" mean?')).toBeTruthy();
  });

  it('renders the original text when provided', () => {
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('猫')).toBeTruthy();
  });

  it('renders all four options', () => {
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Dog')).toBeTruthy();
    expect(getByText('Cat')).toBeTruthy();
    expect(getByText('Bird')).toBeTruthy();
    expect(getByText('Fish')).toBeTruthy();
  });

  it('calls onAnswer with true when correct answer selected', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('Cat'));
    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer with false when wrong answer selected', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('Dog'));
    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('prevents double-tapping after answering', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleChoiceQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('Cat'));
    fireEvent.press(getByText('Dog'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
  });

  it('does not show original text when not provided', () => {
    const questionNoOriginal = { ...mockQuestion, originalText: undefined };
    const { queryByText } = render(
      <MultipleChoiceQ question={questionNoOriginal} onAnswer={jest.fn()} />
    );
    expect(queryByText('猫')).toBeNull();
  });
});

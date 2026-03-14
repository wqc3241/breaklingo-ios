import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MultipleSelectQ from '../../../src/components/quiz/MultipleSelectQ';
import type { QuizQuestion } from '../../../src/lib/types';

const mockQuestion: QuizQuestion = {
  id: 'q1',
  type: 'multiple_select',
  question: 'Select all adjectives',
  correctAnswer: '',
  options: ['big', 'run', 'small', 'eat'],
  correctSelections: ['big', 'small'],
};

describe('MultipleSelectQ', () => {
  it('renders the question and hint', () => {
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Select all adjectives')).toBeTruthy();
    expect(getByText('Select all that apply')).toBeTruthy();
  });

  it('renders all options', () => {
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('big')).toBeTruthy();
    expect(getByText('run')).toBeTruthy();
    expect(getByText('small')).toBeTruthy();
    expect(getByText('eat')).toBeTruthy();
  });

  it('renders Check Answer button', () => {
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(getByText('Check Answer')).toBeTruthy();
  });

  it('toggles selection on tap', () => {
    const { getByText, getAllByTestId } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    // Tap "big" to select
    fireEvent.press(getByText('big'));
    // The checkmark icon should appear
    expect(getAllByTestId('icon-Check').length).toBeGreaterThanOrEqual(1);
  });

  it('calls onAnswer(true) when all correct selections made', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('big'));
    fireEvent.press(getByText('small'));
    fireEvent.press(getByText('Check Answer'));

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it('calls onAnswer(false) when incorrect selections made', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('big'));
    fireEvent.press(getByText('run'));
    fireEvent.press(getByText('Check Answer'));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('calls onAnswer(false) when selection is incomplete', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('big'));
    // Only selected 1 of 2 correct answers
    fireEvent.press(getByText('Check Answer'));

    expect(onAnswer).toHaveBeenCalledWith(false);
  });

  it('prevents submitting with no selections', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <MultipleSelectQ question={mockQuestion} onAnswer={onAnswer} />
    );

    fireEvent.press(getByText('Check Answer'));
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

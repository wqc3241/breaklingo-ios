import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeModules } from 'react-native';
import ReadAfterMeQ from '../../../src/components/quiz/ReadAfterMeQ';
import type { QuizQuestion } from '../../../src/lib/types';

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

  it('does not render "Read after me:" label (shell type banner handles it)', () => {
    const { queryByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    expect(queryByText('Read after me:')).toBeNull();
  });

  it('does not render target text card (shell handles it)', () => {
    const { queryByText } = render(
      <ReadAfterMeQ question={mockQuestion} onAnswer={jest.fn()} />
    );
    // The shell shows the target text, not the component itself
    expect(queryByText('Listen first')).toBeNull();
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
    expect(NativeModules.AudioRecorderModule.requestPermission).toHaveBeenCalled();
  });
});

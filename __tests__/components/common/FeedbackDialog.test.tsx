import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { FeedbackDialog } from '../../../src/components/common/FeedbackDialog';
import { supabase } from '../../../src/lib/supabase';

describe('FeedbackDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { success: true },
      error: null,
    });
  });

  it('renders title and close button when visible', () => {
    const { getByText, getByTestId } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('Send Feedback')).toBeTruthy();
    expect(getByTestId('icon-X')).toBeTruthy();
  });

  it('renders all category options', () => {
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('General')).toBeTruthy();
    expect(getByText('Bug Report')).toBeTruthy();
    expect(getByText('Feature Request')).toBeTruthy();
    expect(getByText('Question')).toBeTruthy();
  });

  it('renders submit button', () => {
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('Submit Feedback')).toBeTruthy();
  });

  it('shows character count', () => {
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('0/5000')).toBeTruthy();
  });

  it('disables submit button when message is empty', () => {
    const onAnswer = jest.fn();
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );

    // The button should be disabled when empty (disabled={isSubmitting || !message.trim()})
    const submitButton = getByText('Submit Feedback');
    expect(submitButton).toBeTruthy();
    // Pressing disabled button should not trigger API call
    fireEvent.press(submitButton);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByText, getByTestId } = render(
      <FeedbackDialog visible={true} onClose={onClose} />
    );

    fireEvent.press(getByTestId('icon-X'));
    expect(onClose).toHaveBeenCalled();
  });

  it('submits feedback successfully', async () => {
    const { getByText, getByPlaceholderText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );

    fireEvent.changeText(
      getByPlaceholderText('Tell us what you think...'),
      'Great app!'
    );

    await act(async () => {
      fireEvent.press(getByText('Submit Feedback'));
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('submit-feedback', {
      body: { category: 'General', message: 'Great app!' },
    });
  });

  it('can select different categories', () => {
    const { getByText, getByPlaceholderText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );

    fireEvent.press(getByText('Bug Report'));
    fireEvent.changeText(
      getByPlaceholderText('Tell us what you think...'),
      'Found a bug'
    );

    // Just verifying category change doesn't crash
    expect(getByText('Bug Report')).toBeTruthy();
  });
});

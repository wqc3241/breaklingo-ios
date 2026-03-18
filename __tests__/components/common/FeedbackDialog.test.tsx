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
    const { getAllByText, getByTestId } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    // "Submit Feedback" appears as both the dialog title and the button
    expect(getAllByText('Submit Feedback').length).toBeGreaterThanOrEqual(1);
    expect(getByTestId('icon-X')).toBeTruthy();
  });

  it('renders all category options', () => {
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('Bug Report')).toBeTruthy();
    expect(getByText('Feature Request')).toBeTruthy();
    expect(getByText('General Feedback')).toBeTruthy();
  });

  it('renders submit button', () => {
    const { getAllByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    // "Submit Feedback" appears as both title and button text
    const matches = getAllByText('Submit Feedback');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('shows character count', () => {
    const { getByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );
    expect(getByText('0/5000')).toBeTruthy();
  });

  it('disables submit button when message is empty', () => {
    const { getAllByText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );

    // The button should be disabled when empty (disabled={isSubmitting || !message.trim()})
    const submitButtons = getAllByText('Submit Feedback');
    expect(submitButtons.length).toBeGreaterThanOrEqual(1);
    // Pressing disabled button should not trigger API call
    fireEvent.press(submitButtons[submitButtons.length - 1]);
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
  });

  it('calls onClose when close button pressed', () => {
    const onClose = jest.fn();
    const { getByTestId } = render(
      <FeedbackDialog visible={true} onClose={onClose} />
    );

    fireEvent.press(getByTestId('icon-X'));
    expect(onClose).toHaveBeenCalled();
  });

  it('submits feedback successfully', async () => {
    const { getAllByText, getByPlaceholderText } = render(
      <FeedbackDialog visible={true} onClose={jest.fn()} />
    );

    fireEvent.changeText(
      getByPlaceholderText('Tell us what you think...'),
      'Great app!'
    );

    const submitButtons = getAllByText('Submit Feedback');
    await act(async () => {
      fireEvent.press(submitButtons[submitButtons.length - 1]);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('submit-feedback', {
      body: { category: 'General Feedback', message: 'Great app!' },
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

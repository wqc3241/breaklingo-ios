import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Linking } from 'react-native';
import { AIConsentDialog } from '../../../src/components/common/AIConsentDialog';

describe('AIConsentDialog', () => {
  const mockOnAgree = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the dialog when visible', () => {
    const { getByText, getByTestId } = render(
      <AIConsentDialog visible={true} onAgree={mockOnAgree} />
    );

    expect(getByText('AI-Powered Learning')).toBeTruthy();
    expect(getByText(/Google Gemini AI and OpenAI Whisper/)).toBeTruthy();
    expect(getByText(/never shared with AI services/)).toBeTruthy();
    expect(getByTestId('ai-consent-agree')).toBeTruthy();
    expect(getByTestId('ai-consent-learn-more')).toBeTruthy();
  });

  it('calls onAgree when I Agree button is pressed', () => {
    const { getByTestId } = render(
      <AIConsentDialog visible={true} onAgree={mockOnAgree} />
    );

    fireEvent.press(getByTestId('ai-consent-agree'));
    expect(mockOnAgree).toHaveBeenCalledTimes(1);
  });

  it('opens privacy policy URL when Learn More is pressed', () => {
    const { getByTestId } = render(
      <AIConsentDialog visible={true} onAgree={mockOnAgree} />
    );

    fireEvent.press(getByTestId('ai-consent-learn-more'));
    expect(Linking.openURL).toHaveBeenCalledWith('https://breaklingo.com/privacy');
  });

  it('does not call onAgree when Learn More is pressed', () => {
    const { getByTestId } = render(
      <AIConsentDialog visible={true} onAgree={mockOnAgree} />
    );

    fireEvent.press(getByTestId('ai-consent-learn-more'));
    expect(mockOnAgree).not.toHaveBeenCalled();
  });
});

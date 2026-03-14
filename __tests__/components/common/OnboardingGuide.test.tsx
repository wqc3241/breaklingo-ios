import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OnboardingGuide } from '../../../src/components/common/OnboardingGuide';

describe('OnboardingGuide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('shows modal when onboarding not complete', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });
  });

  it('does not show when onboarding already completed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
    const { queryByText } = render(<OnboardingGuide />);
    // Should not show the first step title
    await waitFor(() => {
      expect(queryByText('Search & Discover')).toBeNull();
    });
  });

  it('shows first step initially', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
      expect(getByText('Skip')).toBeTruthy();
    });
  });

  it('advances to next step on Next press', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Next'));
    });

    expect(getByText('Lesson Built Automatically')).toBeTruthy();
  });

  it('shows Get Started on last step', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });

    // Advance through all steps
    await act(async () => {
      fireEvent.press(getByText('Next')); // step 2
    });
    await act(async () => {
      fireEvent.press(getByText('Next')); // step 3
    });
    await act(async () => {
      fireEvent.press(getByText('Next')); // step 4
    });

    expect(getByText('Speak with AI')).toBeTruthy();
    expect(getByText('Get Started')).toBeTruthy();
  });

  it('saves completion to AsyncStorage on skip', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => {
      expect(getByText('Skip')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Skip'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-onboarding-complete',
      'true'
    );
  });

  it('saves completion on Get Started', async () => {
    const { getByText } = render(<OnboardingGuide />);
    await waitFor(() => expect(getByText('Next')).toBeTruthy());

    // Navigate to last step
    await act(async () => fireEvent.press(getByText('Next')));
    await act(async () => fireEvent.press(getByText('Next')));
    await act(async () => fireEvent.press(getByText('Next')));

    await act(async () => {
      fireEvent.press(getByText('Get Started'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-onboarding-complete',
      'true'
    );
  });
});

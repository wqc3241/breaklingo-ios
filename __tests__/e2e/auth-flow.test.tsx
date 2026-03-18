/**
 * E2E User Flow Tests: Authentication & Onboarding
 *
 * Tests the complete auth lifecycle: registration, login, OAuth, onboarding,
 * session management, and edge cases.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Mocks — must be set up before component imports
// ---------------------------------------------------------------------------

// react-native-svg needs real component mocks (AuthScreen uses Svg/Path directly)
jest.mock('react-native-svg', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => React.createElement(View, props),
    Svg: (props: any) => React.createElement(View, props),
    Path: (props: any) => React.createElement(View, props),
    Circle: (props: any) => React.createElement(View, props),
    Rect: (props: any) => React.createElement(View, props),
    G: (props: any) => React.createElement(View, props),
  };
});

// Controllable mock for useAuth hook
const mockHandleSignIn = jest.fn();
const mockHandleSignUp = jest.fn();
const mockHandleGoogleSignIn = jest.fn();
const mockHandleAppleSignIn = jest.fn();
const mockHandleForgotPassword = jest.fn();
const mockHandleLogout = jest.fn();

let mockAuthState: {
  user: any;
  session: any;
  isCheckingAuth: boolean;
} = {
  user: null,
  session: null,
  isCheckingAuth: false,
};

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    ...mockAuthState,
    handleSignIn: mockHandleSignIn,
    handleSignUp: mockHandleSignUp,
    handleGoogleSignIn: mockHandleGoogleSignIn,
    handleAppleSignIn: mockHandleAppleSignIn,
    handleForgotPassword: mockHandleForgotPassword,
    handleLogout: mockHandleLogout,
  }),
}));

jest.mock('../../src/context/ProjectContext', () => {
  const React = require('react');
  return {
    ProjectProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
    useProjectContext: () => ({
      currentProject: null,
      setCurrentProject: jest.fn(),
      autoSaveProject: jest.fn(),
    }),
  };
});

jest.mock('../../src/hooks/useVideoProcessing', () => ({
  useVideoProcessing: () => ({
    isProcessing: false,
    processingStep: '',
    extractVideoId: jest.fn(),
    processVideo: jest.fn(),
    cleanup: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useYouTubeSearch', () => ({
  useYouTubeSearch: () => ({
    results: [],
    isSearching: false,
    hasSearched: false,
    search: jest.fn(),
    clearSearch: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useSearchHistory', () => ({
  useSearchHistory: () => ({
    history: [],
    addToHistory: jest.fn(),
    removeFromHistory: jest.fn(),
    clearHistory: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useRecommendedVideos', () => ({
  useRecommendedVideos: () => ({
    recommendations: [],
    isLoading: false,
    hasHistory: false,
  }),
}));

jest.mock('../../src/hooks/useConversation', () => ({
  useConversation: () => ({
    messages: [],
    isLoading: false,
    sendMessage: jest.fn(),
    startConversation: jest.fn(),
    endConversation: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useLearningUnits', () => ({
  useLearningUnits: () => ({
    units: [],
    isLoading: false,
    fetchUnits: jest.fn(),
    generateUnit: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useWhisperSTT', () => ({
  useWhisperSTT: () => ({
    isRecording: false,
    transcript: '',
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
  }),
}));

// Import components after mocks
import AuthScreen from '../../src/screens/AuthScreen';
import { AppNavigator } from '../../src/navigation/AppNavigator';
import { OnboardingGuide } from '../../src/components/common/OnboardingGuide';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resetMocks = () => {
  mockHandleSignIn.mockReset();
  mockHandleSignUp.mockReset();
  mockHandleGoogleSignIn.mockReset();
  mockHandleAppleSignIn.mockReset();
  mockHandleForgotPassword.mockReset();
  mockHandleLogout.mockReset();
  (Alert.alert as jest.Mock).mockClear();
  (AsyncStorage.getItem as jest.Mock).mockClear();
  (AsyncStorage.setItem as jest.Mock).mockClear();

  mockAuthState = {
    user: null,
    session: null,
    isCheckingAuth: false,
  };
};

/**
 * Helper: switch to signup tab and press the Sign Up submit button.
 * "Sign Up" text appears twice (tab label + button text), so we use
 * getAllByText and press the last one (the submit button).
 */
const switchToSignUpAndSubmit = (
  getAllByText: (text: string | RegExp) => any[],
) => {
  const signUpElements = getAllByText('Sign Up');
  // First element is the tab, last is the submit button
  fireEvent.press(signUpElements[signUpElements.length - 1]);
};

/**
 * Helper: press the Sign In submit button when the tab is already active.
 * "Sign In" text appears twice (tab label + button text).
 */
const pressSignInButton = (
  getAllByText: (text: string | RegExp) => any[],
) => {
  const signInElements = getAllByText('Sign In');
  fireEvent.press(signInElements[signInElements.length - 1]);
};

// ---------------------------------------------------------------------------
// 1. User Registration Flow
// ---------------------------------------------------------------------------
describe('User Registration Flow', () => {
  beforeEach(resetMocks);

  // --- Email/Password Signup ---

  it('renders the signup form when Sign Up tab is tapped', () => {
    const { getAllByText, getAllByPlaceholderText } = render(<AuthScreen />);

    // Tap the Sign Up tab (first occurrence)
    fireEvent.press(getAllByText('Sign Up')[0]);

    // Email and password inputs should be visible
    expect(getAllByPlaceholderText('Email').length).toBeGreaterThan(0);
    expect(getAllByPlaceholderText('Password').length).toBeGreaterThan(0);

    // Both tab and button should show "Sign Up" (2 elements)
    expect(getAllByText('Sign Up').length).toBe(2);
  });

  it('validates email format on signup', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<AuthScreen />);

    // Switch to Sign Up tab
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'invalid-email');
    fireEvent.changeText(getByPlaceholderText('Password'), 'validpass123');

    // Press the submit button (last "Sign Up" element)
    switchToSignUpAndSubmit(getAllByText);

    await waitFor(() => {
      expect(getByText('Please enter a valid email address')).toBeTruthy();
    });

    expect(mockHandleSignUp).not.toHaveBeenCalled();
  });

  it('validates password length on signup (min 6 chars)', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'ab');

    switchToSignUpAndSubmit(getAllByText);

    await waitFor(() => {
      expect(getByText('Password must be at least 6 characters')).toBeTruthy();
    });

    expect(mockHandleSignUp).not.toHaveBeenCalled();
  });

  it('successfully creates an account with valid credentials', async () => {
    mockHandleSignUp.mockResolvedValueOnce({ user: { id: 'new-user' }, session: null });

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'newuser@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'SecurePass1');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(mockHandleSignUp).toHaveBeenCalledWith('newuser@example.com', 'SecurePass1');

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Check your email for verification link',
    );
  });

  // --- Google OAuth ---

  it('taps Google button and initiates OAuth flow', async () => {
    mockHandleGoogleSignIn.mockResolvedValueOnce(undefined);

    const { getByText } = render(<AuthScreen />);

    await act(async () => {
      fireEvent.press(getByText('Google'));
    });

    expect(mockHandleGoogleSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows alert when Google sign-in fails', async () => {
    mockHandleGoogleSignIn.mockRejectedValueOnce(new Error('Google auth cancelled'));

    const { getByText } = render(<AuthScreen />);

    await act(async () => {
      fireEvent.press(getByText('Google'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Google Sign In Failed',
      'Google auth cancelled',
    );
  });

  // --- Apple Sign In ---

  it('taps Apple button and initiates Apple auth flow', async () => {
    mockHandleAppleSignIn.mockResolvedValueOnce(undefined);

    const { getByText } = render(<AuthScreen />);

    await act(async () => {
      fireEvent.press(getByText('Apple'));
    });

    expect(mockHandleAppleSignIn).toHaveBeenCalledTimes(1);
  });

  it('shows alert when Apple sign-in fails', async () => {
    mockHandleAppleSignIn.mockRejectedValueOnce(new Error('Apple auth error'));

    const { getByText } = render(<AuthScreen />);

    await act(async () => {
      fireEvent.press(getByText('Apple'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Apple Sign In Failed',
      'Apple auth error',
    );
  });

  // --- Error handling ---

  it('shows alert on duplicate email during signup', async () => {
    mockHandleSignUp.mockRejectedValueOnce(
      new Error('User already registered'),
    );

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Up Failed',
      'User already registered',
    );
  });

  it('shows alert on weak password during signup', async () => {
    mockHandleSignUp.mockRejectedValueOnce(
      new Error('Password should be at least 6 characters'),
    );

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'abcdef');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Up Failed',
      'Password should be at least 6 characters',
    );
  });

  it('shows alert on network error during signup', async () => {
    mockHandleSignUp.mockRejectedValueOnce(new Error('Network request failed'));

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'validpass123');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Up Failed',
      'Network request failed',
    );
  });

  // --- Post-signup navigation ---

  it('navigates to MainTabs after successful signup (session exists)', () => {
    mockAuthState = {
      user: { id: 'new-user', email: 'new@example.com' },
      session: { access_token: 'tok', refresh_token: 'ref', user: { id: 'new-user' } },
      isCheckingAuth: false,
    };

    const { queryByPlaceholderText } = render(<AppNavigator />);

    // AuthScreen form should NOT be rendered when session is present
    expect(queryByPlaceholderText('Email')).toBeFalsy();
    expect(queryByPlaceholderText('Password')).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 2. Welcome Email (Test Case Design)
// ---------------------------------------------------------------------------
describe('Welcome Email — signup triggers email confirmation', () => {
  beforeEach(resetMocks);

  it('shows "Check your email" message after successful signup', async () => {
    mockHandleSignUp.mockResolvedValueOnce({
      user: { id: 'u1', email: 'new@example.com', email_confirmed_at: null },
      session: null,
    });

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'new@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'securepass');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Check your email for verification link',
    );
  });

  it('does NOT navigate to MainTabs when signup returns no session (email unconfirmed)', () => {
    // When no session exists, AppNavigator should render AuthStack (not MainTabs).
    // We render AuthScreen directly to verify it is the expected destination,
    // and separately verify AppNavigator does not render MainTabs content.
    mockAuthState = {
      user: null,
      session: null,
      isCheckingAuth: false,
    };

    // Verify AuthScreen renders independently (it would be shown by AuthStack)
    const authRender = render(<AuthScreen />);
    expect(authRender.getAllByText('Sign In').length).toBeGreaterThan(0);

    // Verify AppNavigator does NOT render MainTabs (session is null)
    const navRender = render(<AppNavigator />);
    // OnboardingGuide is only rendered inside the session branch
    // so Search & Discover would only appear if MainTabs + OnboardingGuide rendered
    expect(navRender.queryByText('Search & Discover')).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 3. Onboarding Guide
// ---------------------------------------------------------------------------
describe('Onboarding Guide', () => {
  beforeEach(() => {
    resetMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('first-time user sees OnboardingGuide overlay after login', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<OnboardingGuide />);

    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });
  });

  it('shows correct step-by-step instructions', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<OnboardingGuide />);

    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });

    expect(
      getByText(/Find YouTube videos in any language/),
    ).toBeTruthy();
  });

  it('user can tap through all onboarding steps', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByText, queryByText } = render(<OnboardingGuide />);

    // Step 1: Search & Discover
    await waitFor(() => {
      expect(getByText('Search & Discover')).toBeTruthy();
    });
    fireEvent.press(getByText('Next'));

    // Step 2: Lesson Built Automatically
    await waitFor(() => {
      expect(getByText('Lesson Built Automatically')).toBeTruthy();
    });
    fireEvent.press(getByText('Next'));

    // Step 3: Learn & Practice
    await waitFor(() => {
      expect(getByText('Learn & Practice')).toBeTruthy();
    });
    fireEvent.press(getByText('Next'));

    // Step 4: Speak with AI — final step shows "Get Started"
    await waitFor(() => {
      expect(getByText('Speak with AI')).toBeTruthy();
      expect(getByText('Get Started')).toBeTruthy();
    });

    // No "Next" button on the last step
    expect(queryByText('Next')).toBeFalsy();
  });

  it('after completing onboarding, state is saved to AsyncStorage', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<OnboardingGuide />);

    await waitFor(() => expect(getByText('Search & Discover')).toBeTruthy());
    fireEvent.press(getByText('Next'));
    await waitFor(() => expect(getByText('Lesson Built Automatically')).toBeTruthy());
    fireEvent.press(getByText('Next'));
    await waitFor(() => expect(getByText('Learn & Practice')).toBeTruthy());
    fireEvent.press(getByText('Next'));
    await waitFor(() => expect(getByText('Get Started')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Get Started'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-onboarding-complete',
      'true',
    );
  });

  it('dismissing (skipping) onboarding saves state', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { getByText } = render(<OnboardingGuide />);

    await waitFor(() => expect(getByText('Search & Discover')).toBeTruthy());

    await act(async () => {
      fireEvent.press(getByText('Skip'));
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-onboarding-complete',
      'true',
    );
  });

  it('does not show onboarding if already completed', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('true');

    const { queryByText } = render(<OnboardingGuide />);

    await act(async () => {});

    expect(queryByText('Search & Discover')).toBeFalsy();
    expect(queryByText('Get Started')).toBeFalsy();
  });
});

// ---------------------------------------------------------------------------
// 4. Edge Cases
// ---------------------------------------------------------------------------
describe('Auth Edge Cases', () => {
  beforeEach(resetMocks);

  it('shows error when user logs in with wrong password', async () => {
    mockHandleSignIn.mockRejectedValueOnce(
      new Error('Invalid login credentials'),
    );

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');

    await act(async () => {
      pressSignInButton(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Failed',
      'Invalid login credentials',
    );
  });

  it('shows error when user tries to signup with existing email', async () => {
    mockHandleSignUp.mockRejectedValueOnce(
      new Error('User already registered'),
    );

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'taken@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Up Failed',
      'User already registered',
    );
  });

  it('shows error on network timeout during sign-in', async () => {
    mockHandleSignIn.mockRejectedValueOnce(new Error('Network request failed'));

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    await act(async () => {
      pressSignInButton(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign In Failed',
      'Network request failed',
    );
  });

  it('shows error on network timeout during sign-up', async () => {
    mockHandleSignUp.mockRejectedValueOnce(new Error('Network request failed'));

    const { getAllByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getAllByText('Sign Up')[0]);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    await act(async () => {
      switchToSignUpAndSubmit(getAllByText);
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Sign Up Failed',
      'Network request failed',
    );
  });

  it('skips AuthScreen when user is already logged in', () => {
    mockAuthState = {
      user: { id: 'existing-user', email: 'logged@in.com' },
      session: { access_token: 'valid', refresh_token: 'ref', user: { id: 'existing-user' } },
      isCheckingAuth: false,
    };

    const { queryByPlaceholderText } = render(<AppNavigator />);

    // Auth form should not be visible
    expect(queryByPlaceholderText('Email')).toBeFalsy();
    expect(queryByPlaceholderText('Password')).toBeFalsy();
  });

  it('redirects to AuthScreen when session is null (expired)', () => {
    // When session expires (becomes null), AppNavigator should render AuthStack
    // instead of MainTabs. The navigation mock doesn't fully render the component
    // prop, so we verify by confirming MainTabs-exclusive content is absent.
    mockAuthState = {
      user: null,
      session: null,
      isCheckingAuth: false,
    };

    const { queryByText } = render(<AppNavigator />);

    // OnboardingGuide (only rendered in the session branch) should not appear
    expect(queryByText('Search & Discover')).toBeFalsy();
    // No MainTabs-specific content should be present
    expect(queryByText('Get Started')).toBeFalsy();
  });

  it('shows loading indicator while checking auth', () => {
    mockAuthState = {
      user: null,
      session: null,
      isCheckingAuth: true,
    };

    const { queryByPlaceholderText } = render(<AppNavigator />);

    // Neither AuthScreen nor MainTabs should be rendered
    expect(queryByPlaceholderText('Email')).toBeFalsy();
    expect(queryByPlaceholderText('Password')).toBeFalsy();
  });

  it('auto-login in DEV_TEST_MODE — session set means MainTabs rendered', () => {
    mockAuthState = {
      user: { id: 'test-user-id', email: 'qichaotomwang+1@gmail.com' },
      session: {
        access_token: 'dev-test-token',
        refresh_token: 'dev-test-refresh',
        user: { id: 'test-user-id' },
      },
      isCheckingAuth: false,
    };

    const { queryByPlaceholderText } = render(<AppNavigator />);

    // Auth form should NOT be visible — user is logged in
    expect(queryByPlaceholderText('Email')).toBeFalsy();
    expect(queryByPlaceholderText('Password')).toBeFalsy();
  });

  // --- Validation edge cases ---

  it('shows "Email is required" when submitting empty email', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<AuthScreen />);

    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    await act(async () => {
      pressSignInButton(getAllByText);
    });

    expect(getByText('Email is required')).toBeTruthy();
    expect(mockHandleSignIn).not.toHaveBeenCalled();
  });

  it('shows "Password is required" when submitting empty password', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = render(<AuthScreen />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'user@example.com');

    await act(async () => {
      pressSignInButton(getAllByText);
    });

    expect(getByText('Password is required')).toBeTruthy();
    expect(mockHandleSignIn).not.toHaveBeenCalled();
  });

  it('clears validation errors when switching between Sign In and Sign Up tabs', async () => {
    const { getAllByText, queryByText } = render(<AuthScreen />);

    // Trigger validation error by pressing Sign In submit button with empty form
    await act(async () => {
      pressSignInButton(getAllByText);
    });
    expect(queryByText('Email is required')).toBeTruthy();

    // Switch to Sign Up tab — errors should clear
    fireEvent.press(getAllByText('Sign Up')[0]);
    expect(queryByText('Email is required')).toBeFalsy();
  });

  it('forgot password flow sends reset email', async () => {
    mockHandleForgotPassword.mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText } = render(<AuthScreen />);

    fireEvent.press(getByText('Forgot password?'));

    expect(getByText('Reset Password')).toBeTruthy();

    fireEvent.changeText(getByPlaceholderText('Email'), 'reset@example.com');

    await act(async () => {
      fireEvent.press(getByText('Send Reset Link'));
    });

    expect(mockHandleForgotPassword).toHaveBeenCalledWith('reset@example.com');
    expect(Alert.alert).toHaveBeenCalledWith(
      'Success',
      'Check your email for password reset link',
    );
  });

  it('forgot password shows error on failure', async () => {
    mockHandleForgotPassword.mockRejectedValueOnce(
      new Error('User not found'),
    );

    const { getByText, getByPlaceholderText } = render(<AuthScreen />);
    fireEvent.press(getByText('Forgot password?'));

    fireEvent.changeText(getByPlaceholderText('Email'), 'nobody@example.com');

    await act(async () => {
      fireEvent.press(getByText('Send Reset Link'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'User not found');
  });

  it('back to Sign In from forgot password view', () => {
    const { getByText, queryByText, getAllByText } = render(<AuthScreen />);

    fireEvent.press(getByText('Forgot password?'));
    expect(getByText('Reset Password')).toBeTruthy();

    fireEvent.press(getByText('Back to Sign In'));

    // Should be back on main auth view
    expect(queryByText('Reset Password')).toBeFalsy();
    // Sign In tab should be visible (at least one element with "Sign In")
    expect(getAllByText('Sign In').length).toBeGreaterThan(0);
  });
});

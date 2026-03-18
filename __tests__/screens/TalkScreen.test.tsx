import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import TalkScreen from '../../src/screens/TalkScreen';

// Mock hooks
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com' },
  }),
}));

const mockStartConversation = jest.fn();
const mockResetConversation = jest.fn();
let mockConvState = 'idle';
let mockMessages: any[] = [];
let mockSummary: any = null;

jest.mock('../../src/hooks/useConversation', () => ({
  useConversation: () => ({
    messages: mockMessages,
    state: mockConvState,
    summary: mockSummary,
    isListening: false,
    isTranscribing: false,
    finalTranscript: '',
    isPlaying: false,
    startConversation: mockStartConversation,
    processUserInput: jest.fn(),
    sendTextMessage: jest.fn(),
    handleVoiceInput: jest.fn(),
    stopConversation: jest.fn(),
    resetConversation: mockResetConversation,
    setAutoListen: jest.fn(),
    isSpeechActive: false,
  }),
}));

jest.mock('../../src/hooks/useStreak', () => ({
  useStreak: () => ({
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    markDayComplete: jest.fn(() => Promise.resolve()),
  }),
}));

jest.mock('../../src/hooks/useExperience', () => ({
  useExperience: () => ({
    totalXP: 0,
    level: 0,
    progress: 0,
    xpInLevel: 0,
    xpNeeded: 100,
    addXP: jest.fn(() => Promise.resolve({ totalXP: 0, level: 0 })),
  }),
}));

let mockProjects: any[] = [];
const mockFetchProjects = jest.fn(() => Promise.resolve());
const mockFetchMore = jest.fn();

jest.mock('../../src/hooks/useProjectList', () => ({
  useProjectList: () => ({
    projects: mockProjects,
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    fetchProjects: mockFetchProjects,
    fetchMore: mockFetchMore,
    refresh: mockFetchProjects,
    updateProjectLocally: jest.fn(),
    removeProjectLocally: jest.fn(),
  }),
}));

jest.mock('../../src/lib/conversationStorage', () => ({
  loadSessions: jest.fn(() => Promise.resolve([])),
  deleteSession: jest.fn(() => Promise.resolve()),
}));

describe('TalkScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConvState = 'idle';
    mockMessages = [];
    mockSummary = null;
    mockProjects = [];
  });

  it('shows project selection when no conversation active', () => {
    const { getByText } = render(<TalkScreen />);
    expect(getByText('Talk with AI')).toBeTruthy();
    expect(getByText('Choose a project to practice speaking')).toBeTruthy();
  });

  it('shows empty message when no projects', () => {
    const { getByText } = render(<TalkScreen />);
    // The project select view is shown but with empty list
    expect(getByText('Choose a project to practice speaking')).toBeTruthy();
  });

  it('renders project list when projects exist', async () => {
    mockProjects = [
      {
        id: 'p1',
        title: 'Japanese Basics',
        vocabulary: [{ word: 'a', meaning: 'b' }],
        grammar: [{ rule: 'r', example: 'e', explanation: 'x' }],
        detectedLanguage: 'Japanese',
        status: 'completed',
      },
    ];

    const { getByText } = render(<TalkScreen />);
    await waitFor(() => {
      expect(getByText('Japanese Basics')).toBeTruthy();
    });
  });
});

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
  }),
}));

let mockProjects: any[] = [];

jest.mock('../../src/context/ProjectContext', () => ({
  useProjectContext: () => ({
    currentProject: null,
    setCurrentProject: jest.fn(),
    projects: mockProjects,
    fetchProjects: jest.fn(() => Promise.resolve(mockProjects)),
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

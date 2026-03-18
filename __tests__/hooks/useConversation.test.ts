import { renderHook, act } from '@testing-library/react-native';
import { useConversation } from '../../src/hooks/useConversation';
import { supabase } from '../../src/lib/supabase';
import type { AppProject } from '../../src/lib/types';

// Mock dependencies
jest.mock('../../src/hooks/useTextToSpeech', () => ({
  useTextToSpeech: () => ({
    speak: jest.fn(() => Promise.resolve()),
    isPlaying: false,
    stop: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useWhisperSTT', () => ({
  useWhisperSTT: () => ({
    isListening: false,
    isTranscribing: false,
    transcript: '',
    finalTranscript: '',
    startListening: jest.fn(() => Promise.resolve()),
    stopListening: jest.fn(() => Promise.resolve('hello')),
    cancelListening: jest.fn(() => Promise.resolve()),
    setOnSilenceCallback: jest.fn(),
  }),
}));

jest.mock('../../src/lib/conversationStorage', () => ({
  saveSession: jest.fn(() => Promise.resolve()),
}));

const mockProject: AppProject = {
  id: 'proj-1',
  title: 'Test Project',
  url: 'https://youtube.com/test',
  script: 'Hello world',
  vocabulary: [{ word: 'hello', meaning: 'greeting' }],
  grammar: [{ rule: 'basic', example: 'hello', explanation: 'greeting' }],
  practiceSentences: [],
  detectedLanguage: 'English',
};

describe('useConversation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: { message: 'Hello! Let\'s practice.' },
      error: null,
    });
  });

  it('initializes with idle state', () => {
    const { result } = renderHook(() => useConversation());
    expect(result.current.state).toBe('idle');
    expect(result.current.messages).toEqual([]);
    expect(result.current.summary).toBeNull();
  });

  it('starts a conversation', async () => {
    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation(mockProject);
    });

    expect(supabase.functions.invoke).toHaveBeenCalledWith('conversation-chat', {
      body: expect.objectContaining({
        messages: [],
        projectContext: {
          vocabulary: mockProject.vocabulary,
          grammar: mockProject.grammar,
          detectedLanguage: 'English',
          title: 'Test Project',
        },
      }),
    });
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].role).toBe('assistant');
    expect(result.current.messages[0].content).toBe('Hello! Let\'s practice.');
  });

  it('processes user text input', async () => {
    (supabase.functions.invoke as jest.Mock)
      .mockResolvedValueOnce({
        data: { message: 'Hello!' },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { message: 'Good reply!' },
        error: null,
      });

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation(mockProject);
    });

    await act(async () => {
      await result.current.sendTextMessage('Hi there');
    });

    expect(result.current.messages.length).toBeGreaterThanOrEqual(2);
  });

  it('resets conversation', async () => {
    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation(mockProject);
    });
    expect(result.current.messages).toHaveLength(1);

    act(() => {
      result.current.resetConversation();
    });

    expect(result.current.messages).toEqual([]);
    expect(result.current.state).toBe('idle');
    expect(result.current.summary).toBeNull();
  });

  it('ignores empty text input', async () => {
    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation(mockProject);
    });

    const msgCount = result.current.messages.length;

    await act(async () => {
      await result.current.processUserInput('');
    });

    expect(result.current.messages.length).toBe(msgCount);
  });

  it('handles API error in startConversation gracefully', async () => {
    (supabase.functions.invoke as jest.Mock).mockResolvedValue({
      data: null,
      error: new Error('Network error'),
    });

    const { result } = renderHook(() => useConversation());

    await act(async () => {
      await result.current.startConversation(mockProject);
    });

    expect(result.current.state).toBe('idle');
  });
});

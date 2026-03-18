/**
 * E2E-style tests for video language detection flow.
 * Verifies that the correct language is determined and passed through the pipeline.
 */

// Mock Supabase
const mockInvoke = jest.fn();
jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    functions: { invoke: (...args: any[]) => mockInvoke(...args) },
  },
  SUPABASE_URL: 'https://test.supabase.co',
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: { alert: jest.fn() },
  NativeModules: { AudioPlayerModule: null, AudioRecorderModule: null },
}));

import { renderHook, act } from '@testing-library/react-native';
import { useVideoProcessing } from '../../src/hooks/useVideoProcessing';

describe('Video Language Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('uses detectedLanguage from edge function when no language is provided', async () => {
    // extract-transcript returns Japanese as detected language
    mockInvoke.mockImplementation((fnName: string) => {
      if (fnName === 'extract-transcript') {
        return {
          data: {
            success: true,
            transcript: 'こんにちは。今日は日本語の勉強をしましょう。文法と語彙を練習します。',
            videoTitle: 'Japanese Lesson',
            captionsAvailable: true,
            detectedLanguage: 'ja',
          },
        };
      }
      if (fnName === 'analyze-content') {
        return {
          data: {
            vocabulary: [{ word: 'こんにちは', meaning: 'Hello' }],
            grammar: [{ pattern: 'です', explanation: 'Polite copula' }],
            detectedLanguage: 'Japanese',
          },
        };
      }
      if (fnName === 'generate-practice-sentences') {
        return { data: { sentences: [] } };
      }
      return { data: {} };
    });

    const { result } = renderHook(() => useVideoProcessing());

    let project: any;
    await act(async () => {
      project = await result.current.processVideo(
        'test123abcd',
        undefined, // No language code — let edge function detect
        undefined, // No language name
        'user-123',
        undefined,
      );
    });

    // Verify extract-transcript was called WITHOUT a languageCode
    expect(mockInvoke).toHaveBeenCalledWith('extract-transcript', {
      body: { videoId: 'test123abcd', languageCode: undefined },
    });

    // Verify analyze-content received the edge function's detected language as hint
    expect(mockInvoke).toHaveBeenCalledWith('analyze-content', {
      body: expect.objectContaining({
        targetLanguage: 'ja',
      }),
    });

    // Verify the final project uses AI-detected language (Japanese), not a wrong guess
    expect(project.detectedLanguage).toBe('Japanese');
  });

  it('AI detection overrides edge function language when they differ', async () => {
    // Edge function says "ar" (Arabic) but AI detects Japanese from transcript content
    mockInvoke.mockImplementation((fnName: string) => {
      if (fnName === 'extract-transcript') {
        return {
          data: {
            success: true,
            transcript: 'こんにちは。日本語のビデオです。語彙と文法を学びましょう。',
            videoTitle: 'Test Video',
            captionsAvailable: true,
            detectedLanguage: 'ar', // Wrong! Edge function detected Arabic
          },
        };
      }
      if (fnName === 'analyze-content') {
        return {
          data: {
            vocabulary: [{ word: '語彙', meaning: 'Vocabulary' }],
            grammar: [{ pattern: 'ましょう', explanation: 'Let us' }],
            detectedLanguage: 'Japanese', // AI correctly identifies Japanese
          },
        };
      }
      if (fnName === 'generate-practice-sentences') {
        return { data: { sentences: [] } };
      }
      return { data: {} };
    });

    const { result } = renderHook(() => useVideoProcessing());

    let project: any;
    await act(async () => {
      project = await result.current.processVideo(
        'test123abcd',
        undefined,
        undefined,
        'user-123',
        undefined,
      );
    });

    // AI detection should win over edge function's wrong detection
    expect(project.detectedLanguage).toBe('Japanese');
  });

  it('falls back to edge function language when AI does not detect', async () => {
    mockInvoke.mockImplementation((fnName: string) => {
      if (fnName === 'extract-transcript') {
        return {
          data: {
            success: true,
            transcript: 'Some transcript content that is long enough to be processed by the system.',
            videoTitle: 'Test Video',
            captionsAvailable: true,
            detectedLanguage: 'ko', // Korean from YouTube Data API
          },
        };
      }
      if (fnName === 'analyze-content') {
        return {
          data: {
            vocabulary: [{ word: '한국어', meaning: 'Korean' }],
            grammar: [],
            detectedLanguage: undefined, // AI returns nothing
          },
        };
      }
      if (fnName === 'generate-practice-sentences') {
        return { data: { sentences: [] } };
      }
      return { data: {} };
    });

    const { result } = renderHook(() => useVideoProcessing());

    let project: any;
    await act(async () => {
      project = await result.current.processVideo(
        'test123abcd',
        undefined,
        undefined,
        'user-123',
        undefined,
      );
    });

    // Should fall back to edge function's detection
    expect(project.detectedLanguage).toBe('ko');
  });

  it('uses knownLanguageName for curated videos', async () => {
    mockInvoke.mockImplementation((fnName: string) => {
      if (fnName === 'extract-transcript') {
        return {
          data: {
            success: true,
            transcript: 'Japanese transcript content long enough for processing and analysis.',
            videoTitle: 'Curated Japanese Video',
            captionsAvailable: true,
            detectedLanguage: 'ja',
          },
        };
      }
      if (fnName === 'analyze-content') {
        return {
          data: {
            vocabulary: [{ word: 'テスト', meaning: 'Test' }],
            grammar: [],
            detectedLanguage: 'Japanese',
          },
        };
      }
      if (fnName === 'generate-practice-sentences') {
        return { data: { sentences: [] } };
      }
      return { data: {} };
    });

    const { result } = renderHook(() => useVideoProcessing());

    let project: any;
    await act(async () => {
      project = await result.current.processVideo(
        'test123abcd',
        undefined,
        'Japanese', // Known language from curated video
        'user-123',
        undefined,
      );
    });

    // analyze-content should receive Japanese as hint
    expect(mockInvoke).toHaveBeenCalledWith('analyze-content', {
      body: expect.objectContaining({
        targetLanguage: 'Japanese',
      }),
    });

    expect(project.detectedLanguage).toBe('Japanese');
  });
});

import { renderHook, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { useVideoProcessing } from '../../src/hooks/useVideoProcessing';
import { supabase } from '../../src/lib/supabase';

describe('useVideoProcessing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractVideoId', () => {
    it('extracts ID from standard YouTube URL', () => {
      const { result } = renderHook(() => useVideoProcessing());
      expect(result.current.extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts ID from short YouTube URL', () => {
      const { result } = renderHook(() => useVideoProcessing());
      expect(result.current.extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid URL', () => {
      const { result } = renderHook(() => useVideoProcessing());
      expect(result.current.extractVideoId('not-a-url')).toBeNull();
      expect(result.current.extractVideoId('https://google.com')).toBeNull();
    });
  });

  describe('processVideo', () => {
    it('processes a video through the full pipeline', async () => {
      // Mock transcript
      (supabase.functions.invoke as jest.Mock)
        .mockResolvedValueOnce({
          data: { success: true, transcript: 'Hello world', videoTitle: 'Test Video', captionsAvailable: true },
          error: null,
        })
        // Mock analyze-content
        .mockResolvedValueOnce({
          data: {
            vocabulary: [{ word: 'hello', meaning: 'greeting' }],
            grammar: [{ rule: 'greet', example: 'hello', explanation: 'a greeting' }],
            detectedLanguage: 'English',
          },
          error: null,
        })
        // Mock generate-practice-sentences
        .mockResolvedValueOnce({
          data: {
            sentences: [{ text: 'Hello!', translation: 'Hi!', difficulty: 'beginner', usedVocabulary: ['hello'], usedGrammar: ['greet'] }],
          },
          error: null,
        });

      const { result } = renderHook(() => useVideoProcessing());

      let project;
      await act(async () => {
        project = await result.current.processVideo('testVideoId', 'en', 'English', 'user-1');
      });

      expect(project).toBeDefined();
      expect(project!.title).toBe('Test Video');
      expect(project!.vocabulary).toHaveLength(1);
      expect(project!.grammar).toHaveLength(1);
      expect(project!.practiceSentences).toHaveLength(1);
      expect(project!.status).toBe('completed');
    });

    it('handles rate limit error', async () => {
      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: { error: 'Rate limit exceeded' },
        error: null,
      });

      const { result } = renderHook(() => useVideoProcessing());

      await act(async () => {
        try {
          await result.current.processVideo('testId');
        } catch (e) {
          expect((e as Error).message).toBe('RATE_LIMIT_EXCEEDED');
        }
      });

      expect(Alert.alert).toHaveBeenCalledWith('Rate Limit Exceeded', expect.any(String));
    });
  });

  describe('regenerateAnalysis', () => {
    it('regenerates analysis for existing project', async () => {
      (supabase.functions.invoke as jest.Mock)
        .mockResolvedValueOnce({
          data: {
            vocabulary: [{ word: 'new', meaning: 'fresh' }],
            grammar: [{ rule: 'adj', example: 'new', explanation: 'adjective' }],
            detectedLanguage: 'English',
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { sentences: [] },
          error: null,
        });

      const { result } = renderHook(() => useVideoProcessing());
      const mockProject = {
        id: '1', title: 'Test', url: '', script: 'some transcript',
        vocabulary: [], grammar: [], practiceSentences: [], detectedLanguage: 'English',
      };

      let updated;
      await act(async () => {
        updated = await result.current.regenerateAnalysis(mockProject);
      });

      expect(updated).not.toBeNull();
      expect(updated!.vocabulary).toHaveLength(1);
    });

    it('returns null when no project provided', async () => {
      const { result } = renderHook(() => useVideoProcessing());

      let returned;
      await act(async () => {
        returned = await result.current.regenerateAnalysis(null);
      });

      expect(returned).toBeNull();
    });
  });

  describe('state management', () => {
    it('tracks processing state', async () => {
      (supabase.functions.invoke as jest.Mock)
        .mockResolvedValueOnce({
          data: { success: true, transcript: 'hi', videoTitle: 'T' },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { vocabulary: [], grammar: [], detectedLanguage: 'en' },
          error: null,
        })
        .mockResolvedValueOnce({ data: { sentences: [] }, error: null });

      const { result } = renderHook(() => useVideoProcessing());
      expect(result.current.isProcessing).toBe(false);

      await act(async () => {
        await result.current.processVideo('id');
      });

      expect(result.current.isProcessing).toBe(false);
    });

    it('cleanup clears intervals', () => {
      const { result } = renderHook(() => useVideoProcessing());
      expect(() => result.current.cleanup()).not.toThrow();
    });
  });
});

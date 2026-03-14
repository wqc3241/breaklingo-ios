import { renderHook, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import { useTextToSpeech } from '../../src/hooks/useTextToSpeech';

describe('useTextToSpeech', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve({ type: 'audio/mp3' }),
    });
  });

  it('initializes with not playing', () => {
    const { result } = renderHook(() => useTextToSpeech());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentText).toBeNull();
  });

  it('calls generate-speech API with correct parameters', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('Hello world');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/functions/v1/generate-speech'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('Hello world'),
      })
    );
  });

  it('creates and plays audio', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('test');
      // Let FileReader mock resolve
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(Audio.Sound.createAsync).toHaveBeenCalled();
  });

  it('passes custom voice parameter', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('test', 'alloy');
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.voice).toBe('alloy');
  });

  it('passes instructions when provided', async () => {
    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('test', 'coral', 'speak slowly');
    });

    const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.instructions).toBe('speak slowly');
  });

  it('handles API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('Server error'),
    });

    const { result } = renderHook(() => useTextToSpeech());

    await act(async () => {
      await result.current.speak('test');
    });

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentText).toBeNull();
  });
});

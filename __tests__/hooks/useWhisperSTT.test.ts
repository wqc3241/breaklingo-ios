import { renderHook, act } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import { useWhisperSTT } from '../../src/hooks/useWhisperSTT';

describe('useWhisperSTT', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: 'transcribed text' }),
    });
  });

  it('initializes with default state', () => {
    const { result } = renderHook(() => useWhisperSTT());
    expect(result.current.isListening).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.transcript).toBe('');
    expect(result.current.finalTranscript).toBe('');
  });

  it('starts listening when permission granted', async () => {
    const { result } = renderHook(() => useWhisperSTT());

    await act(async () => {
      await result.current.startListening();
    });

    expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    expect(Audio.setAudioModeAsync).toHaveBeenCalledWith({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
    expect(result.current.isListening).toBe(true);
  });

  it('stops listening and transcribes', async () => {
    const { result } = renderHook(() => useWhisperSTT());

    await act(async () => {
      await result.current.startListening();
    });

    let transcript: string = '';
    await act(async () => {
      transcript = await result.current.stopListening();
    });

    expect(transcript).toBe('transcribed text');
    expect(result.current.isListening).toBe(false);
    expect(result.current.finalTranscript).toBe('transcribed text');
  });

  it('returns empty string when no recording exists', async () => {
    const { result } = renderHook(() => useWhisperSTT());

    let transcript: string = '';
    await act(async () => {
      transcript = await result.current.stopListening();
    });

    expect(transcript).toBe('');
  });

  it('cancels listening', async () => {
    const { result } = renderHook(() => useWhisperSTT());

    await act(async () => {
      await result.current.startListening();
    });
    expect(result.current.isListening).toBe(true);

    await act(async () => {
      await result.current.cancelListening();
    });
    expect(result.current.isListening).toBe(false);
    expect(result.current.transcript).toBe('');
  });

  it('handles transcription API error gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({}),
    });

    const { result } = renderHook(() => useWhisperSTT());

    await act(async () => {
      await result.current.startListening();
    });

    let transcript: string = '';
    await act(async () => {
      transcript = await result.current.stopListening();
    });

    expect(transcript).toBe('');
    expect(result.current.isTranscribing).toBe(false);
  });
});

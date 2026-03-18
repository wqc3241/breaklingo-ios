import { renderHook } from '@testing-library/react-native';
import { NativeModules } from 'react-native';

// Capture the blur callback when addListener is called
let blurCallback: (() => void) | null = null;
const mockAddListener = jest.fn((event: string, cb: () => void) => {
  if (event === 'blur') blurCallback = cb;
  return jest.fn(); // unsubscribe
});

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    addListener: mockAddListener,
  }),
}));

import { useStopAudioOnBlur } from '../../src/hooks/useStopAudioOnBlur';

describe('useStopAudioOnBlur', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    blurCallback = null;
  });

  it('registers a blur listener on mount', () => {
    renderHook(() => useStopAudioOnBlur());
    expect(mockAddListener).toHaveBeenCalledWith('blur', expect.any(Function));
  });

  it('stops AudioPlayerModule on blur', () => {
    renderHook(() => useStopAudioOnBlur());
    expect(blurCallback).not.toBeNull();

    blurCallback!();

    expect(NativeModules.AudioPlayerModule.stop).toHaveBeenCalled();
  });

  it('stops AudioRecorderModule on blur', () => {
    renderHook(() => useStopAudioOnBlur());
    blurCallback!();

    expect(NativeModules.AudioRecorderModule.stopRecording).toHaveBeenCalled();
  });

  it('calls optional onBlur callback', () => {
    const onBlur = jest.fn();
    renderHook(() => useStopAudioOnBlur({ onBlur }));
    blurCallback!();

    expect(onBlur).toHaveBeenCalled();
  });

  it('calls optional cancelListening callback', () => {
    const cancelListening = jest.fn();
    renderHook(() => useStopAudioOnBlur({ cancelListening }));
    blurCallback!();

    expect(cancelListening).toHaveBeenCalled();
  });
});

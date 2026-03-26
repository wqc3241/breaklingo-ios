import { renderHook, act, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Unmock AIConsentContext so we test the real hook
jest.unmock('../../src/context/AIConsentContext');

import { useAIConsent } from '../../src/hooks/useAIConsent';

describe('useAIConsent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show consent dialog when no prior consent exists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAIConsent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasConsented).toBe(false);
    expect(result.current.showConsent).toBe(true);
  });

  it('should not show consent dialog when consent was previously given', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ agreed: true, date: '2026-01-01T00:00:00.000Z' })
    );

    const { result } = renderHook(() => useAIConsent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasConsented).toBe(true);
    expect(result.current.showConsent).toBe(false);
  });

  it('should save consent to AsyncStorage on agree', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAIConsent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasConsented).toBe(false);

    await act(async () => {
      await result.current.onAgree();
    });

    expect(result.current.hasConsented).toBe(true);
    expect(result.current.showConsent).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'breaklingo-ai-consent',
      expect.stringContaining('"agreed":true')
    );
  });

  it('requireConsent returns true when already consented', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
      JSON.stringify({ agreed: true, date: '2026-01-01T00:00:00.000Z' })
    );

    const { result } = renderHook(() => useAIConsent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requireConsent()).toBe(true);
  });

  it('requireConsent returns false and shows dialog when not consented', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const { result } = renderHook(() => useAIConsent());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Dismiss to test requireConsent re-showing
    act(() => {
      result.current.setShowConsent(false);
    });
    expect(result.current.showConsent).toBe(false);

    act(() => {
      const allowed = result.current.requireConsent();
      expect(allowed).toBe(false);
    });
    expect(result.current.showConsent).toBe(true);
  });
});

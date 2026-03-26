import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AI_CONSENT_KEY = 'breaklingo-ai-consent';

interface AIConsentData {
  agreed: boolean;
  date: string;
}

export const useAIConsent = () => {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    const loadConsent = async () => {
      try {
        const stored = await AsyncStorage.getItem(AI_CONSENT_KEY);
        if (stored) {
          const data: AIConsentData = JSON.parse(stored);
          setHasConsented(data.agreed === true);
        } else {
          setHasConsented(false);
          setShowConsent(true);
        }
      } catch {
        setHasConsented(false);
        setShowConsent(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadConsent();
  }, []);

  const onAgree = useCallback(async () => {
    try {
      const data: AIConsentData = {
        agreed: true,
        date: new Date().toISOString(),
      };
      await AsyncStorage.setItem(AI_CONSENT_KEY, JSON.stringify(data));
      setHasConsented(true);
      setShowConsent(false);
    } catch (error) {
      console.error('Failed to save AI consent:', error);
    }
  }, []);

  const requireConsent = useCallback((): boolean => {
    if (hasConsented) return true;
    setShowConsent(true);
    return false;
  }, [hasConsented]);

  return {
    hasConsented,
    isLoading,
    showConsent,
    setShowConsent,
    onAgree,
    requireConsent,
  };
};

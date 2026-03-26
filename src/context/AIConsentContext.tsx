import React, { createContext, useContext } from 'react';
import { useAIConsent } from '../hooks/useAIConsent';
import { AIConsentDialog } from '../components/common/AIConsentDialog';

interface AIConsentContextValue {
  hasConsented: boolean | null;
  isLoading: boolean;
  requireConsent: () => boolean;
}

const AIConsentContext = createContext<AIConsentContextValue>({
  hasConsented: null,
  isLoading: true,
  requireConsent: () => false,
});

export const useAIConsentContext = () => useContext(AIConsentContext);

export const AIConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hasConsented, isLoading, showConsent, onAgree, requireConsent } = useAIConsent();

  return (
    <AIConsentContext.Provider value={{ hasConsented, isLoading, requireConsent }}>
      {children}
      <AIConsentDialog visible={showConsent} onAgree={onAgree} />
    </AIConsentContext.Provider>
  );
};

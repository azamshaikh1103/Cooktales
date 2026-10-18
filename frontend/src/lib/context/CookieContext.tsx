'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type CookieConsent = {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  hasInteracted: boolean;
};

const defaultConsent: CookieConsent = {
  essential: true,
  analytics: false,
  advertising: false,
  hasInteracted: false,
};

const CookieContext = createContext<{
  consent: CookieConsent;
  updateConsent: (newConsent: Partial<CookieConsent>) => void;
  isLoading: boolean;
} | null>(null);

export function CookieProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<CookieConsent>(defaultConsent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('cooktale-cookie-prefs');
    if (saved) {
      try {
        setConsent({ ...JSON.parse(saved), hasInteracted: true });
      } catch (e) {
        console.error('Failed to parse cookie preferences');
      }
    }
    setIsLoading(false);
  }, []);

  const updateConsent = (newConsent: Partial<CookieConsent>) => {
    const updated = { ...consent, ...newConsent, hasInteracted: true };
    setConsent(updated);
    localStorage.setItem('cooktale-cookie-prefs', JSON.stringify(updated));
  };

  const value = useMemo(() => ({ consent, updateConsent, isLoading }), [consent, isLoading]);

  return <CookieContext.Provider value={value}>{children}</CookieContext.Provider>;
}

export const useCookieConsent = () => {
  const context = useContext(CookieContext);
  if (!context) throw new Error('useCookieConsent must be used within CookieProvider');
  return context;
};

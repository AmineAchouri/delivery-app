'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface CurrencyContextType {
  currency: string;
  symbol: string;
  formatPrice: (price: number | string) => string;
  setCurrency: (currency: string) => void;
}

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$',
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('USD');

  useEffect(() => {
    // Load currency from saved business settings
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.currency) {
          setCurrencyState(settings.currency);
        }
      } catch (e) {
        console.error('Failed to parse business settings');
      }
    }
    
    // Listen for storage changes (when settings are saved)
    const handleStorageChange = () => {
      const settings = localStorage.getItem('businessSettings');
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          if (parsed.currency) {
            setCurrencyState(parsed.currency);
          }
        } catch (e) {}
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const settings = localStorage.getItem('businessSettings');
      if (settings) {
        try {
          const parsed = JSON.parse(settings);
          if (parsed.currency && parsed.currency !== currency) {
            setCurrencyState(parsed.currency);
          }
        } catch (e) {}
      }
    }, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currency]);

  const symbol = currencySymbols[currency] || '$';

  const formatPrice = (price: number | string): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(numPrice)) return `${symbol}0.00`;
    return `${symbol}${numPrice.toFixed(2)}`;
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    // Also update in localStorage
    const savedSettings = localStorage.getItem('businessSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        settings.currency = newCurrency;
        localStorage.setItem('businessSettings', JSON.stringify(settings));
      } catch (e) {}
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, symbol, formatPrice, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Return default values if not in provider
    return {
      currency: 'USD',
      symbol: '$',
      formatPrice: (price: number | string) => {
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return `$${isNaN(numPrice) ? '0.00' : numPrice.toFixed(2)}`;
      },
      setCurrency: () => {},
    };
  }
  return context;
}

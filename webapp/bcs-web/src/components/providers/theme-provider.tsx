'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'sepia';
export type FontSize = 'small' | 'default' | 'large' | 'xlarge';

interface ThemeContextProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [fontSize, setFontSizeState] = useState<FontSize>('default');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('reader-theme') as Theme || 'light';
    const savedFontSize = localStorage.getItem('reader-font-size') as FontSize || 'default';
    setThemeState(savedTheme);
    setFontSizeState(savedFontSize);
    
    // Apply immediately on mount
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.documentElement.setAttribute('data-font-size', savedFontSize);
    setMounted(true);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('reader-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const setFontSize = (newSize: FontSize) => {
    setFontSizeState(newSize);
    localStorage.setItem('reader-font-size', newSize);
    document.documentElement.setAttribute('data-font-size', newSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

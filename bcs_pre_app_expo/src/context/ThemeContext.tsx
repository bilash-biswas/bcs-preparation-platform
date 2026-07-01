import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    // Load theme from storage on mount
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme_preference');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeState(savedTheme);
          setColorScheme(savedTheme);
        } else {
          // Fallback to system scheme if available
          const initialScheme = colorScheme === 'dark' ? 'dark' : 'light';
          setThemeState(initialScheme);
          setColorScheme(initialScheme);
        }
      } catch (e) {
        console.error('Failed to load theme preference', e);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const nextTheme: ThemeMode = theme === 'light' ? 'dark' : 'light';
      setThemeState(nextTheme);
      setColorScheme(nextTheme);
      await AsyncStorage.setItem('theme_preference', nextTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
};

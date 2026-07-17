// @readme/shared/src/services/theme.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

// --- 1. THE CONTEXT & PROVIDER ---
export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {}
});

export const ThemeProvider = ({ children }) => {
  const systemTheme = useRNColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark');
  const toggleTheme = () => setIsDarkMode(prev => !prev);

  return React.createElement(
    ThemeContext.Provider,
    { value: { isDarkMode, toggleTheme } },
    children
  );
};

export const useThemeContext = () => useContext(ThemeContext);

export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  const { isDarkMode } = useThemeContext();
  useEffect(() => {
    setHasHydrated(true);
  }, []);
  if (hasHydrated) {
    return isDarkMode ? 'dark' : 'light';
  }
  return 'light';
}

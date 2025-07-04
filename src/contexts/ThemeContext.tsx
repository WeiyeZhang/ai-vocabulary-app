import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'theme-dark' | 'theme-light';
const THEME_STORAGE_KEY = 'ai-vocab-theme';

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(THEME_STORAGE_KEY) as Theme) || 'theme-dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove('theme-light', 'theme-dark');
    root.classList.add(theme);

    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = { theme, setTheme };
  
  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

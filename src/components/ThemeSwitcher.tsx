import React from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import SunIcon from './icons/SunIcon.tsx';
import MoonIcon from './icons/MoonIcon.tsx';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'theme-dark' ? 'theme-light' : 'theme-dark');
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-colors text-yellow-400 hover:bg-yellow-400/10"
      aria-label="Toggle theme"
    >
      {theme === 'theme-dark' ? (
        <SunIcon className="w-6 h-6" />
      ) : (
        <MoonIcon className="w-6 h-6 text-primary" />
      )}
    </button>
  );
};

export default ThemeSwitcher;

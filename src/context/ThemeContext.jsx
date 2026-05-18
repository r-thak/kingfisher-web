import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    document.documentElement.classList.add('no-transitions');
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    
    // Force a layout reflow to make sure style changes are applied instantly without transition
    window.getComputedStyle(document.documentElement).opacity;
    
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 50);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
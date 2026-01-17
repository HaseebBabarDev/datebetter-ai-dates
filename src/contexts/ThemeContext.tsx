import React, { createContext, useContext, useEffect, useState } from "react";

export type ColorScheme = "original" | "blue";
export type ThemeMode = "light" | "dark";

interface ThemeContextType {
  colorScheme: ColorScheme;
  themeMode: ThemeMode;
  setColorScheme: (scheme: ColorScheme) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_COLOR = "devi-color-scheme";
const STORAGE_KEY_MODE = "devi-theme-mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_COLOR);
    return (stored as ColorScheme) || "original";
  });

  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY_MODE);
    if (stored) return stored as ThemeMode;
    // Check system preference
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });

  useEffect(() => {
    // Apply color scheme class
    document.documentElement.classList.remove("theme-original", "theme-blue");
    document.documentElement.classList.add(`theme-${colorScheme}`);
    localStorage.setItem(STORAGE_KEY_COLOR, colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    // Apply dark mode class
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(themeMode);
    localStorage.setItem(STORAGE_KEY_MODE, themeMode);
  }, [themeMode]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
  };

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const toggleDarkMode = () => {
    setThemeModeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        themeMode,
        setColorScheme,
        setThemeMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// src/context/SettingsContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';

// --- NEW Context Shape ---
interface SettingsContextType {
  settings: AppSettings; // Your existing Firebase settings
  setSettings: (newSettings: AppSettings) => Promise<void>;
  loading: boolean;
  error: string | null;
  theme: 'light' | 'dark'; // NEW: state for the current theme
  toggleTheme: () => void; // NEW: function to switch the theme
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setLocalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // NEW: State for theme, initialized from localStorage or OS preference
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light' || storedTheme === 'dark') {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // This effect fetches your dynamic data (siteTitle, etc.) from Firebase.
  // --- THIS IS YOUR ORIGINAL CODE, UNCHANGED ---
  useEffect(() => {
    const fetchSettings = async () => {
      setError(null);
      const settingsDocRef = doc(db, 'config', 'settings');
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          const fetchedSettings = { ...DEFAULT_SETTINGS, ...docSnap.data() };
          setLocalSettings(fetchedSettings as AppSettings);
        } else {
          await setDoc(settingsDocRef, DEFAULT_SETTINGS);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // NEW: This effect applies the theme class to the <html> element
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // NEW: Function to be called by a theme toggle button
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // --- THIS IS YOUR ORIGINAL FUNCTION, UNCHANGED ---
  const updateSettings = async (newSettings: AppSettings) => {
    setLocalSettings(newSettings);
    const settingsDocRef = doc(db, 'config', 'settings');
    await setDoc(settingsDocRef, newSettings, { merge: true });
  };
  
  // UPDATED: The value now includes `theme` and `toggleTheme` and removes `themeStyles`
  const value = { settings, setSettings: updateSettings, loading, error, theme, toggleTheme };
  
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) { throw new Error('useSettings must be used within a SettingsProvider'); }
  return context;
};
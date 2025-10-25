import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS, THEME_COLORS } from '../constants'; // Import both constants

// --- This part is for the visual theme, which is now hardcoded ---
interface ThemeStyles {
  background: React.CSSProperties;
  card: React.CSSProperties;
  bodyText: React.CSSProperties;
  primaryHeading: React.CSSProperties;
  secondaryHeading: React.CSSProperties;
  accentText: React.CSSProperties;
  button: React.CSSProperties;
}

const isDarkMode = () => window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const generateThemeStyles = (): ThemeStyles => {
    const darkMode = isDarkMode();
    return {
      background: { backgroundColor: darkMode ? THEME_COLORS.darkBackgroundColor : THEME_COLORS.backgroundColor },
      card: { backgroundColor: darkMode ? THEME_COLORS.darkCardColor : THEME_COLORS.cardColor },
      bodyText: { color: darkMode ? THEME_COLORS.darkBodyTextColor : THEME_COLORS.bodyTextColor },
      primaryHeading: { color: darkMode ? THEME_COLORS.darkPrimaryHeadingColor : THEME_COLORS.primaryHeadingColor },
      secondaryHeading: { color: darkMode ? THEME_COLORS.darkSecondaryHeadingColor : THEME_COLORS.secondaryHeadingColor },
      accentText: { color: THEME_COLORS.accentColor },
      button: { backgroundColor: THEME_COLORS.accentColor, color: '#ffffff' },
    };
};

// --- This part is for the dynamic settings from Firebase ---
interface SettingsContextType {
  settings: AppSettings; // No longer null
  setSettings: (newSettings: AppSettings) => Promise<void>;
  themeStyles: ThemeStyles;
  loading: boolean;
  error: string | null;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // We start with the hardcoded default settings
  const [settings, setLocalSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // This effect will fetch the dynamic data (siteTitle, logoUrl) from Firebase
  useEffect(() => {
    const fetchSettings = async () => {
      setError(null);
      const settingsDocRef = doc(db, 'config', 'settings');
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          // We merge the fetched data with our defaults to ensure nothing is missing
          const fetchedSettings = { ...DEFAULT_SETTINGS, ...docSnap.data() };
          setLocalSettings(fetchedSettings as AppSettings);
        } else {
          // If no settings document exists, we're already using the correct defaults.
          // We can create it in Firebase for the first time.
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

  // The theme is always generated from our hardcoded constants, so it's always available
  const themeStyles = useMemo(() => generateThemeStyles(), []);

  // This listener will update the theme if the user toggles dark/light mode on their OS
  const [_, rerender] = React.useState(0);
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => rerender(c => c + 1);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // This function updates the settings in both our local state and Firebase
  const updateSettings = async (newSettings: AppSettings) => {
    setLocalSettings(newSettings);
    const settingsDocRef = doc(db, 'config', 'settings');
    await setDoc(settingsDocRef, newSettings, { merge: true }); // Use merge to avoid overwriting fields
  };

  const value = { settings, setSettings: updateSettings, themeStyles, loading, error };
  
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) { throw new Error('useSettings must be used within a SettingsProvider'); }
  return context;
};
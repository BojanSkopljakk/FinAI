import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  const systemColorScheme = useRNColorScheme();
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | null>(null);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemePreference(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  // Return the user's preferred theme if set, otherwise fall back to system theme
  return themePreference || systemColorScheme || 'light';
}

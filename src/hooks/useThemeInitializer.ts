import { useEffect } from 'react';
import { useThemeStore } from '../lib/theme-store';
import { addMqlChangeListener, removeMqlChangeListener } from '../utils/mqlCompat';

export const useThemeInitializer = () => {
  const applyTheme = useThemeStore(state => state.applyTheme);
  const settings = useThemeStore(state => state.settings);
  const isDark = useThemeStore(state => state.isDark);

  useEffect(() => {
    // 組件掛載時立即應用主題
    applyTheme();
    
    // 也可以在這裡設置系統偏好監聽
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent | { matches: boolean }) => {
      if (settings.mode === 'system') {
        useThemeStore.setState({ isDark: e.matches });
        applyTheme();
      }
    };
    
    addMqlChangeListener(mediaQuery as any, handleChange);
    
    return () => {
      removeMqlChangeListener(mediaQuery as any, handleChange);
    };
  }, [applyTheme, settings.mode]);

  // 當主題設定變更時重新應用
  useEffect(() => {
    applyTheme();
  }, [settings, isDark, applyTheme]);

  return { settings, isDark };
};

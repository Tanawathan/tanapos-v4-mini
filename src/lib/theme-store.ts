import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 主題類型定義
export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorblindMode = 'normal' | 'colorblind';

// 主題設定接口
export interface ThemeSettings {
  mode: ThemeMode;
  colorblindMode: ColorblindMode;
  highContrast: boolean;
  reducedMotion: boolean;
}

// 主題狀態接口
interface ThemeState {
  settings: ThemeSettings;
  isDark: boolean;
  
  // 動作
  setThemeMode: (mode: ThemeMode) => void;
  setColorblindMode: (mode: ColorblindMode) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  toggleTheme: () => void;
  applyTheme: () => void;
}

// 檢測系統偏好
const getSystemPreference = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// 檢測用戶偏好設定
const getUserPreferences = () => ({
  highContrast: window.matchMedia('(prefers-contrast: high)').matches,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
});

// 主題 Store
export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      settings: {
        mode: 'system',
        colorblindMode: 'normal',
        highContrast: false,
        reducedMotion: false,
      },
      isDark: getSystemPreference(),

      setThemeMode: (mode: ThemeMode) => {
        set((state) => ({
          settings: { ...state.settings, mode },
          isDark: mode === 'system' ? getSystemPreference() : mode === 'dark'
        }));
        get().applyTheme();
      },

      setColorblindMode: (colorblindMode: ColorblindMode) => {
        set((state) => ({
          settings: { ...state.settings, colorblindMode }
        }));
        get().applyTheme();
      },

      setHighContrast: (highContrast: boolean) => {
        set((state) => ({
          settings: { ...state.settings, highContrast }
        }));
        get().applyTheme();
      },

      setReducedMotion: (reducedMotion: boolean) => {
        set((state) => ({
          settings: { ...state.settings, reducedMotion }
        }));
        get().applyTheme();
      },

      toggleTheme: () => {
        const { settings } = get();
        const newMode: ThemeMode = 
          settings.mode === 'light' ? 'dark' : 
          settings.mode === 'dark' ? 'system' : 'light';
        get().setThemeMode(newMode);
      },

      applyTheme: () => {
        if (typeof window === 'undefined') return;
        
        const { settings, isDark } = get();
        const html = document.documentElement;
        
        // 清除所有主題類別
        html.classList.remove('dark', 'colorblind-mode');
        
        // 應用深色模式
        if (isDark) {
          html.classList.add('dark');
        }
        
        // 應用色盲模式
        if (settings.colorblindMode === 'colorblind') {
          html.classList.add('colorblind-mode');
        }
        
        // 應用高對比度
        if (settings.highContrast) {
          html.style.setProperty('--border-width', '2px');
        } else {
          html.style.removeProperty('--border-width');
        }
        
        // 應用減少動畫
        if (settings.reducedMotion) {
          html.style.setProperty('--transition-fast', 'none');
          html.style.setProperty('--transition-normal', 'none');
          html.style.setProperty('--transition-slow', 'none');
        } else {
          html.style.removeProperty('--transition-fast');
          html.style.removeProperty('--transition-normal');
          html.style.removeProperty('--transition-slow');
        }
        
        // 設定主題色彩到 meta 標籤
        const themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (themeColorMeta) {
          themeColorMeta.setAttribute('content', isDark ? '#0F172A' : '#FFFFFF');
        }
      },
    }),
    {
      name: 'theme-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

// 初始化主題
export const initializeTheme = () => {
  // 監聽系統主題變化
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // 取得當前 store 狀態
    const currentState = useThemeStore.getState();
    
    // 根據設定模式決定是否為深色模式
    const shouldBeDark = currentState.settings.mode === 'system' 
      ? mediaQuery.matches 
      : currentState.settings.mode === 'dark';
    
    // 更新 isDark 狀態
    useThemeStore.setState({ isDark: shouldBeDark });
    
    const handleChange = (e: MediaQueryListEvent) => {
      const currentSettings = useThemeStore.getState().settings;
      if (currentSettings.mode === 'system') {
        useThemeStore.setState({ isDark: e.matches });
        useThemeStore.getState().applyTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    // 初始檢測用戶偏好
    const userPrefs = getUserPreferences();
    useThemeStore.setState((state) => ({
      settings: {
        ...state.settings,
        highContrast: userPrefs.highContrast,
        reducedMotion: userPrefs.reducedMotion,
      }
    }));
    
    // 應用初始主題
    useThemeStore.getState().applyTheme();
  }
};

// React Hook
export const useTheme = () => {
  const {
    settings,
    isDark,
    setThemeMode,
    setColorblindMode,
    setHighContrast,
    setReducedMotion,
    toggleTheme,
  } = useThemeStore();

  return {
    // 狀態
    settings,
    isDark,
    isColorblind: settings.colorblindMode === 'colorblind',
    
    // 動作
    setThemeMode,
    setColorblindMode,
    setHighContrast,
    setReducedMotion,
    toggleTheme,
    
    // 便利方法
    setLightMode: () => setThemeMode('light'),
    setDarkMode: () => setThemeMode('dark'),
    setSystemMode: () => setThemeMode('system'),
    enableColorblindMode: () => setColorblindMode('colorblind'),
    disableColorblindMode: () => setColorblindMode('normal'),
  };
};

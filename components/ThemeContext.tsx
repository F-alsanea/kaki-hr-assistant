
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'dusk';

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dusk');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'dusk');
    root.classList.add(theme);
    
    // مزامنة الألوان الأساسية للخلفية (Background Sync) لضمان أعلى معايير التباين
    const backgrounds = {
      light: '#F8FAFC',
      dark: '#020617',
      dusk: '#1E1B4B'
    };
    document.body.style.backgroundColor = backgrounds[theme];
  }, [theme]);

  const themeClasses = {
    // Light: الخلفية فاتحة جداً والخط بلون الحبر العميق
    light: "bg-[#F8FAFC] text-[#0F172A]",
    // Dark: الخلفية سوداء فحمي والخط بلون الثلج
    dark: "bg-[#020617] text-[#F1F5F9]",
    // Dusk: الخلفية نيلي مشبع والخط بلون السحاب النيلي
    dusk: "bg-[#1E1B4B] text-[#E0E7FF]"
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div className={`min-h-screen transition-all duration-500 ease-in-out selection:bg-indigo-500/30 ${themeClasses[theme]}`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

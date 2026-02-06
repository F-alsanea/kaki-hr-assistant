
import React from 'react';
import { useTheme } from './ThemeContext';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, 
  size = 150, 
  strokeWidth = 15 
}) => {
  const { theme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = (p: number) => {
    if (p >= 80) return '#10b981'; // Emerald
    if (p >= 50) return '#6366f1'; // Indigo
    return '#f43f5e'; // Rose
  };

  const getGlowColor = (p: number) => {
    if (p >= 80) return 'rgba(16, 185, 129, 0.4)';
    if (p >= 50) return 'rgba(99, 102, 241, 0.4)';
    return 'rgba(244, 63, 94, 0.4)';
  };

  const trackColor = theme === 'light' 
    ? '#f1f5f9' 
    : theme === 'dark' 
      ? '#1e293b' 
      : 'rgba(255, 255, 255, 0.05)';
      
  const textColor = theme === 'light' 
    ? '#1e293b' 
    : theme === 'dark' 
      ? '#f8fafc' 
      : '#e0e7ff';

  return (
    <div className="relative inline-flex items-center justify-center group">
      {/* Background Pulse Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[45px] opacity-15 group-hover:opacity-30 transition-opacity duration-1000 animate-pulse"
        style={{ backgroundColor: getColor(percentage) }}
      />
      
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-2xl overflow-visible">
        <defs>
          <linearGradient id={`gradient-${percentage}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={getColor(percentage)} />
            <stop offset="100%" stopColor={getColor(percentage)} stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Progress Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
        />
        
        {/* Animated Progress Bar */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#gradient-${percentage})`}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          style={{ 
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 2s cubic-bezier(0.2, 1, 0.3, 1)',
            filter: 'url(#glow)'
          }}
          strokeLinecap="round"
        />
      </svg>
      
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span 
          className="text-5xl md:text-7xl font-black transition-all duration-500 hover:scale-110 cursor-default"
          style={{ 
            color: textColor, 
            textShadow: `0 0 25px ${getGlowColor(percentage)}` 
          }}
        >
          {percentage}
        </span>
        <span className="text-[10px] md:text-xs font-black text-slate-400 opacity-60 uppercase tracking-widest mt-1">
          درجة المطابقة
        </span>
      </div>
    </div>
  );
};

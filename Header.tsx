
import React from 'react';

interface HeaderProps {
  onShowSettings: () => void;
  onClearChat: () => void;
  onToggleTheme: () => void;
  onLanguageChange: (lang: string) => void;
  currentLanguage: string;
  theme: 'neon' | 'obsidian';
  hasMessages: boolean;
  isTyping: boolean;
}

const SharinganIcon: React.FC<{ isTyping: boolean }> = ({ isTyping }) => (
  <div className="relative w-8 h-8 flex items-center justify-center">
    <div className={`w-full h-full ${isTyping ? 'animate-[sharingan-rotate_1.5s_linear_infinite]' : 'animate-[sharingan-rotate_12s_linear_infinite]'}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_var(--accent-primary)]">
        <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent-primary)" strokeWidth="4" />
        {[0, 120, 240].map(deg => (
          <g key={deg} transform={`rotate(${deg} 50 50)`}>
             <path d="M50 20 C58 20 64 26 64 34 C64 42 58 48 50 48 C42 48 36 42 36 34 C36 26 42 20 50 20" fill="var(--accent-primary)" />
          </g>
        ))}
        <circle cx="50" cy="50" r="12" fill="var(--accent-secondary)" />
      </svg>
    </div>
  </div>
);

const Header: React.FC<HeaderProps> = ({ 
  onShowSettings, 
  onClearChat, 
  onToggleTheme, 
  onLanguageChange,
  currentLanguage,
  theme, 
  hasMessages, 
  isTyping 
}) => {
  const languages = [
    { id: 'English', label: 'EN' },
    { id: 'Bengali', label: 'BN' },
    { id: 'Hindi', label: 'HI' }
  ];

  return (
    <header className="h-20 px-4 sm:px-8 flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--bg-primary)]/90 backdrop-blur-3xl sticky top-0 z-[60]">
      <div className="flex items-center gap-4">
        <SharinganIcon isTyping={isTyping} />
        <div>
           <h1 className="cinzel font-black tracking-widest attractive-text text-xl leading-none">VULCAN</h1>
           <span className="text-[8px] mono text-purple-500 font-bold uppercase tracking-[0.3em] block mt-1">Roast Engine v3.0</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-1 rounded-2xl">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => onLanguageChange(lang.id)}
              className={`px-4 py-2 text-[11px] mono font-black rounded-xl transition-all ${
                currentLanguage === lang.id 
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-[0_0_15px_var(--accent-primary)]' 
                  : 'text-white/20 hover:text-white'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onToggleTheme} className="w-10 h-10 flex items-center justify-center text-[var(--accent-primary)] bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all">
            {theme === 'neon' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>}
          </button>
          {hasMessages && (
            <button onClick={onClearChat} className="w-10 h-10 flex items-center justify-center text-red-500/60 hover:text-red-500 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
            </button>
          )}
          <button onClick={onShowSettings} className="w-10 h-10 flex items-center justify-center text-purple-500 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

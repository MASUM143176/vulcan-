
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message, Role, PersonaConfig } from './types';
import { vulcanService } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import Header from './components/Header';

const STORAGE_KEYS = {
  HISTORY: 'VULCAN_DATA_HISTORY_V2',
  PERSONA: 'VULCAN_DATA_PERSONA_V2',
  THEME: 'VULCAN_DATA_THEME_V2'
};

const STARTER_PROMPTS = [
  { label: "Roast Me", prompt: "Annihilate my fragile ego. Go hard." },
  { label: "Judge My Taste", prompt: "I like pineapples on pizza. Judge me." },
  { label: "Cold Truth", prompt: "Tell me a funny, brutal truth about humans." },
  { label: "Check Fit", prompt: "I'm wearing socks with sandals. Roast it." }
];

const LoadingBurn: React.FC = () => (
  <div className="flex flex-col gap-2 py-8 animate-fade-up max-w-xl mx-auto w-full px-6">
    <div className="flex items-center gap-4">
      <div className="relative w-10 h-10 flex items-center justify-center animate-[sharingan-rotate_1.5s_linear_infinite]">
         <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_10px_var(--accent-primary)]">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent-primary)" strokeWidth="6" />
            <circle cx="50" cy="20" r="10" fill="var(--accent-primary)" />
         </svg>
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-[10px] mono text-purple-500 font-black tracking-[0.3em] italic animate-pulse uppercase">VULCAN_COOKING...</span>
        <div className="h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-purple-500 w-1/3 animate-[loading-slide_1s_infinite_linear]"></div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [persona, setPersona] = useState<PersonaConfig>({ sarcasm: 98, edge: 95, language: "English", fastReply: false });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [theme, setTheme] = useState<'neon' | 'obsidian'>('neon');
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const stopSignalRef = useRef<boolean>(false);

  // Initialize
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const savedPersona = localStorage.getItem(STORAGE_KEYS.PERSONA);
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'neon' | 'obsidian';
    
    if (savedHistory) setMessages(JSON.parse(savedHistory));
    if (savedPersona) setPersona(JSON.parse(savedPersona));
    if (savedTheme) setTheme(savedTheme || 'neon');

    vulcanService.initChat(
      savedPersona ? JSON.parse(savedPersona) : persona, 
      savedHistory ? JSON.parse(savedHistory) : []
    );
  }, []);

  // Sync Persistence
  useEffect(() => {
    document.body.className = theme === 'obsidian' ? 'theme-obsidian' : '';
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(messages)); }, [messages]);
  useEffect(() => { 
    localStorage.setItem(STORAGE_KEYS.PERSONA, JSON.stringify(persona));
    vulcanService.updatePersona(persona, messages);
  }, [persona]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping, suggestions]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.onresult = (e: any) => setInputText(prev => prev + (prev.trim() ? ' ' : '') + e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const triggerResponse = async (historyUntilUser: Message[]) => {
    setIsTyping(true);
    setError(null);
    setSuggestions([]);
    stopSignalRef.current = false;

    let assistantText = '';
    const assistantId = Math.random().toString(36).substring(7);
    const lastUserMessage = historyUntilUser[historyUntilUser.length - 1];

    try {
      vulcanService.initChat(persona, historyUntilUser.slice(0, -1));
      const stream = vulcanService.sendMessageStream(lastUserMessage.text);
      const newAssistantMsg: Message = { id: assistantId, role: Role.MODEL, text: '', timestamp: Date.now() };
      setMessages([...historyUntilUser, newAssistantMsg]);

      for await (const chunk of stream) {
        if (stopSignalRef.current) break;
        assistantText += chunk;
        setMessages(prev => prev.map(msg => msg.id === assistantId ? { ...msg, text: assistantText } : msg));
      }

      const contextSuggestions = await vulcanService.getSuggestions([...historyUntilUser, { ...newAssistantMsg, text: assistantText }]);
      setSuggestions(contextSuggestions);
    } catch (err) {
      setError("ROAST ENGINE STALLED. CHECK CONNECTION.");
    } finally {
      setIsTyping(false);
      stopSignalRef.current = false;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || isTyping) return;

    const userMessage: Message = {
      id: Math.random().toString(36).substring(7),
      role: Role.USER,
      text: textToSend,
      timestamp: Date.now()
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    await triggerResponse(newHistory);
  };

  const handleSaveEdit = async (id: string, newText: string) => {
    setEditingId(null);
    const msgIndex = messages.findIndex(m => m.id === id);
    if (msgIndex === -1 || messages[msgIndex].text === newText) return;

    // Truncate history at the edited message and regenerate
    const updatedHistory = messages.slice(0, msgIndex);
    const editedMsg = { ...messages[msgIndex], text: newText };
    const newHistory = [...updatedHistory, editedMsg];
    
    setMessages(newHistory);
    await triggerResponse(newHistory);
  };

  const currentPills = suggestions.length > 0 
    ? suggestions.map(s => ({ label: s, prompt: s }))
    : STARTER_PROMPTS;

  return (
    <div className="flex flex-col h-screen overflow-hidden transition-colors selection:bg-purple-500/30">
      <Header 
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'neon' ? 'obsidian' : 'neon')}
        onLanguageChange={(lang) => setPersona({ ...persona, language: lang })}
        currentLanguage={persona.language}
        onShowSettings={() => setShowSettings(true)} 
        onClearChat={() => {
          setMessages([]);
          setSuggestions([]);
          localStorage.removeItem(STORAGE_KEYS.HISTORY);
          vulcanService.initChat(persona, []);
        }}
        hasMessages={messages.length > 0}
        isTyping={isTyping}
      />
      
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-3xl animate-fade-in">
          <div className="w-full max-w-sm bg-[var(--bg-tertiary)] border-2 border-purple-500/30 rounded-[2.5rem] p-10 shadow-2xl relative">
            <h3 className="text-[14px] font-black tracking-[0.4em] text-purple-500 uppercase mono mb-10">CALIBRATE</h3>
            <div className="space-y-10">
              {[
                { label: 'Sarcasm Level', key: 'sarcasm' as const },
                { label: 'Edge Factor', key: 'edge' as const }
              ].map(({ label, key }) => (
                <div key={key}>
                  <div className="flex justify-between mb-4 text-[11px] mono uppercase font-black text-white/50">
                    <span>{label}</span>
                    <span className="text-purple-500">{persona[key]}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={persona[key]}
                    onChange={(e) => setPersona({ ...persona, [key]: parseInt(e.target.value) })}
                    className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-600"
                  />
                </div>
              ))}
            </div>
            <button onClick={() => setShowSettings(false)} className="w-full mt-12 py-5 bg-purple-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-purple-500 transition-all shadow-xl active:scale-95">CONFIRM</button>
          </div>
        </div>
      )}

      <main ref={scrollRef} className="flex-1 overflow-y-auto w-full relative pt-10 pb-52 scroll-smooth custom-scrollbar">
        {messages.length === 0 && (
          <div className="max-w-4xl mx-auto w-full px-6 flex flex-col items-center justify-center min-h-[60vh] animate-fade-up">
             <h2 className="text-7xl sm:text-9xl font-black cinzel tracking-tighter italic attractive-text leading-none mb-6">VULCAN</h2>
             <div className="h-px w-24 bg-purple-500/30"></div>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <ChatMessage 
              key={msg.id} 
              message={msg} 
              isEditing={editingId === msg.id}
              onEdit={(id) => setEditingId(id)}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={() => setEditingId(null)}
            />
          ))}
          {isTyping && <LoadingBurn />}
          {error && <div className="max-w-xl mx-auto w-full text-purple-500 mono text-[10px] font-black p-6 border-2 border-purple-500 bg-purple-500/10 animate-pulse rounded-2xl mx-4">{error}</div>}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 sm:p-10 z-40 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)]/95 to-transparent">
        <div className="max-w-2xl mx-auto w-full">
          
          <div className="flex overflow-x-auto gap-3 mb-6 pb-3 no-scrollbar">
            {currentPills.map((pill, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(undefined, pill.prompt)}
                className="px-6 py-3 whitespace-nowrap rounded-[1.2rem] border border-purple-500/30 bg-[var(--bg-secondary)]/90 text-[11px] mono uppercase font-black text-purple-500 hover:border-purple-500 hover:bg-purple-500/10 transition-all shadow-xl active:scale-95 flex-shrink-0"
              >
                {pill.label}
              </button>
            ))}
          </div>

          <form 
            onSubmit={isTyping ? (e) => { e.preventDefault(); stopSignalRef.current = true; } : handleSendMessage}
            className="flex items-center bg-[var(--bg-secondary)] border-2 border-purple-500/20 rounded-[2rem] pl-6 pr-3 py-3 focus-within:border-purple-500/50 shadow-2xl transition-all"
          >
            <button 
              type="button"
              onClick={() => isListening ? recognitionRef.current.stop() : (setIsListening(true), recognitionRef.current.start())}
              className={`w-10 h-10 flex items-center justify-center transition-all rounded-full ${isListening ? 'bg-purple-500 text-white animate-pulse' : 'text-purple-500/40 hover:text-purple-500'}`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isTyping ? "Engine is cooking..." : "Drop a burn..."}
              className="flex-1 bg-transparent border-none text-[var(--text-primary)] px-4 focus:outline-none text-[17px] placeholder:text-purple-500/20 font-medium"
              disabled={isTyping}
            />

            <button 
              type="submit" 
              disabled={!isTyping && !inputText.trim()} 
              className={`w-14 h-14 flex items-center justify-center rounded-[1.4rem] transition-all ${isTyping ? 'bg-red-600/20 text-red-500 animate-pulse' : (inputText.trim() ? 'bg-purple-600 text-white shadow-[0_0_25px_var(--glow-color)]' : 'bg-white/5 text-white/10')}`}
            >
              {isTyping ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="3"/></svg>
              ) : (
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default App;

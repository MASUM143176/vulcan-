
import React, { useState } from 'react';
import { Message, Role } from '../types';

interface ChatMessageProps {
  message: Message;
  isEditing?: boolean;
  onEdit?: (id: string) => void;
  onSaveEdit?: (id: string, newText: string) => void;
  onCancelEdit?: () => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isEditing, 
  onEdit, 
  onSaveEdit, 
  onCancelEdit 
}) => {
  const isUser = message.role === Role.USER;
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const processInlineStyles = (text: string) => {
    const tokens = text.split(/(`.*?`|\*\*.*?\*\*|\*.*?\*)/g);
    return tokens.map((token, i) => {
      if (token.startsWith('`') && token.endsWith('`')) {
        return <code key={i} className="px-1 bg-cyan-400/10 text-cyan-300 rounded mono text-[0.8em] border border-cyan-400/20">{token.slice(1, -1)}</code>;
      }
      if (token.startsWith('**') && token.endsWith('**')) {
        return <strong key={i} className="attractive-text font-black">{token.slice(2, -2)}</strong>;
      }
      return <span key={i}>{token}</span>;
    });
  };

  return (
    <div className={`flex flex-col mb-2 animate-fade-up max-w-xl mx-auto w-full px-4 group ${isUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
        <span className={`text-[7px] mono uppercase font-black tracking-widest ${isUser ? 'text-purple-500/30' : 'text-[var(--accent-primary)]/60'}`}>
          {isUser ? 'Operator_LOG' : 'VULCAN_OUT'}
        </span>
        {!isUser && !isEditing && (
          <button 
            onClick={handleCopy}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-purple-500/40 hover:text-purple-500"
            title="Copy Roast"
          >
            {copied ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M8 4v8a2 2 0 0 0 2 2h8M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            )}
          </button>
        )}
      </div>
      
      <div className={`w-full ${isUser ? 'text-right' : 'text-left'}`}>
        {isEditing ? (
          <div className="w-full mt-1 bg-[var(--bg-secondary)] border border-purple-500/40 rounded-2xl p-4 shadow-xl">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full bg-transparent border-none text-white text-[13px] focus:outline-none min-h-[60px] mono resize-none"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-3 border-t border-white/5 pt-3">
              <button onClick={onCancelEdit} className="text-[9px] mono uppercase font-black text-white/20 hover:text-white transition-colors">Discard</button>
              <button onClick={() => onSaveEdit?.(message.id, editText)} className="px-4 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg text-[9px] mono font-black text-purple-500 hover:bg-purple-500 hover:text-white transition-all">Re-Sync</button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => isUser && onEdit?.(message.id)}
            className={`whitespace-pre-wrap leading-relaxed text-[14px] transition-all cursor-default ${
              isUser 
                ? 'text-[var(--text-primary)]/40 italic hover:text-[var(--text-primary)]/60 cursor-pointer' 
                : 'text-[var(--text-primary)] font-medium'
            }`}
          >
            {processInlineStyles(message.text)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;

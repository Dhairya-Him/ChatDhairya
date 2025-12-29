import React from 'react';
import { Message } from '../types';
import { User, Sparkles, Volume2 } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

const renderFormattedText = (text: string) => {
  if (!text) return null;

  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const content = part.slice(3, -3).replace(/^[a-z]+\n/, '');
      const language = part.match(/^```([a-z]+)/)?.[1] || '';
      
      return (
        <div key={index} className="my-3 overflow-hidden rounded-lg bg-zinc-950/50 border border-zinc-800 font-mono text-sm">
          {language && (
             <div className="bg-zinc-900/50 px-3 py-1 text-xs text-zinc-500 border-b border-zinc-800 uppercase">
                {language}
             </div>
          )}
          <div className="overflow-x-auto p-3 text-zinc-200">
            <pre className="whitespace-pre">{content}</pre>
          </div>
        </div>
      );
    }

    const lines = part.split('\n');
    return (
      <span key={index}>
        {lines.map((line, lineIdx) => {
          if (line.trim() === '') return <br key={lineIdx} />;
          
          if (line.startsWith('### ')) return <h3 key={lineIdx} className="text-lg font-semibold text-zinc-100 mt-4 mb-2">{line.slice(4)}</h3>;
          if (line.startsWith('## ')) return <h2 key={lineIdx} className="text-xl font-bold text-zinc-50 mt-5 mb-2">{line.slice(3)}</h2>;
          
          if (line.trim().startsWith('- ')) return <li key={lineIdx} className="ml-4 list-disc text-zinc-300 my-1">{processInlineStyles(line.slice(2))}</li>;
          if (line.trim().match(/^\d+\. /)) return <li key={lineIdx} className="ml-4 list-decimal text-zinc-300 my-1">{processInlineStyles(line.replace(/^\d+\. /, ''))}</li>;

          return <p key={lineIdx} className="mb-2 leading-relaxed text-zinc-300">{processInlineStyles(line)}</p>;
        })}
      </span>
    );
  });
};

const processInlineStyles = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-zinc-100 font-semibold">{part.slice(2, -2)}</strong>;
    }
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((cp, j) => {
        if (cp.startsWith('`') && cp.endsWith('`')) {
            return <code key={`${i}-${j}`} className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300 font-mono text-sm">{cp.slice(1, -1)}</code>;
        }
        return cp;
    });
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const handleSpeak = () => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-8 animate-fade-in group`}>
      <div className={`flex max-w-[90%] md:max-w-[75%] gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`
          flex h-8 w-8 shrink-0 items-center justify-center rounded-full
          ${isUser 
            ? 'bg-zinc-800 text-zinc-400' 
            : 'bg-brand-600 text-white'
          }
        `}>
          {isUser ? <User size={16} /> : <Sparkles size={16} />}
        </div>

        {/* Bubble */}
        <div className="relative">
            <div className={`
            rounded-2xl px-5 py-3
            ${isUser 
                ? 'bg-zinc-800/80 text-zinc-100' 
                : 'text-zinc-300' 
            }
            `}>
            {message.image && (
                <div className="mb-3">
                    <img src={message.image} alt="User Upload" className="rounded-lg max-h-60 w-auto border border-zinc-700/50" />
                </div>
            )}
            <div className="text-[15px] leading-7">
                {renderFormattedText(message.content)}
            </div>
            </div>
            
            {/* TTS Button (Visible on hover) */}
            {!isUser && (
                <button 
                    onClick={handleSpeak}
                    className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-zinc-300 p-1"
                >
                    <Volume2 size={14} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;

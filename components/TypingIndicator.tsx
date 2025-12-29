import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex w-full justify-start mb-6 pl-12">
      <div className="flex items-center space-x-1.5 px-2 py-2 opacity-50">
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
        <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
};

export default TypingIndicator;

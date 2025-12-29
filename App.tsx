import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Menu, Sparkles, Brain, Code, BookOpen, MessageSquare, Plus, Settings as SettingsIcon, CheckSquare, MessageCircle, ChevronDown, Trash2, Radio, Paperclip, X, AlertOctagon, Unlock, Eye, Shield } from 'lucide-react';
import { AICoreMode, Message, ChatSession, RealityEffect, SecurityLog, AdminSettings } from './types';
import { MODES } from './constants';
import { streamMessage, analyzeThreatLevel } from './services/geminiService';
import ChatMessage from './components/ChatMessage';
import TypingIndicator from './components/TypingIndicator';
import AdminPanel from './components/AdminPanel';

// Icon mapping helper
const IconMap: Record<string, React.FC<any>> = {
  MessageSquare, Brain, Code, Sparkles, BookOpen, CheckSquare
};

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
    systemPromptOverride: '',
    creativityLevel: 0.7,
    safetyEnabled: true,
    maintenanceMode: false,
    bannedKeywords: [],
    nerfMode: false,
    slowMode: false,
    defenseStrategy: 'LOCKDOWN' // Default
};

const LOCKDOWN_STORAGE_KEY = 'assistant_active_lockdown_v1';

const App: React.FC = () => {
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  
  // Session State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMode, setCurrentMode] = useState<AICoreMode>(AICoreMode.CHAT);
  const [input, setInput] = useState('');
  
  // Ocular Input State
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  // Admin & Features State
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [realityEffect, setRealityEffect] = useState<RealityEffect>(RealityEffect.NONE);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  
  // DEFENSE GRID STATE
  const [isLockedDown, setIsLockedDown] = useState(false);
  const [isHoneypotted, setIsHoneypotted] = useState(false); // Kevin Mode State
  const [lockdownTimer, setLockdownTimer] = useState(0);
  const [tracingStep, setTracingStep] = useState(0);
  
  // Emergency Unlock State
  const [unlockUser, setUnlockUser] = useState('');
  const [unlockPass, setUnlockPass] = useState('');
  const [showUnlock, setShowUnlock] = useState(false);

  // UI State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Persistence Check on Mount
  useEffect(() => {
    const storedLockdown = localStorage.getItem(LOCKDOWN_STORAGE_KEY);
    if (storedLockdown) {
        try {
            const data = JSON.parse(storedLockdown);
            const now = Date.now();
            const remaining = Math.ceil((data.endTime - now) / 1000);
            
            if (remaining > 0) {
                setIsLockedDown(true);
                setLockdownTimer(remaining);
                setRealityEffect(RealityEffect.RED_ALERT);
                setTracingStep(4); // Skip animation if reloading
            } else {
                localStorage.removeItem(LOCKDOWN_STORAGE_KEY);
            }
        } catch (e) {
            localStorage.removeItem(LOCKDOWN_STORAGE_KEY);
        }
    }
  }, []);

  // Load Sessions
  useEffect(() => {
    const stored = localStorage.getItem('assistant_sessions');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('assistant_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Load messages
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        setMessages(session.messages);
        setCurrentMode(session.mode);
      }
    } else {
      setMessages([]);
      setCurrentMode(AICoreMode.CHAT);
    }
  }, [currentSessionId, sessions]);

  // Lockdown Timer Logic
  useEffect(() => {
      let interval: any;
      if (isLockedDown && lockdownTimer > 0) {
          interval = setInterval(() => {
              setLockdownTimer(prev => prev - 1);
          }, 1000);
      } else if (isLockedDown && lockdownTimer === 0) {
          // Unlock
          setIsLockedDown(false);
          setRealityEffect(RealityEffect.NONE);
          setTracingStep(0);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: "System Reboot Complete. Access restored. Further violations will result in permanent suspension.",
            timestamp: Date.now(),
            mode: currentMode
        }]);
        localStorage.removeItem(LOCKDOWN_STORAGE_KEY);
      }
      return () => clearInterval(interval);
  }, [isLockedDown, lockdownTimer, currentMode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 150) + 'px';
    }
  }, [input]);

  const createNewSession = (initialMessage?: string, mode?: AICoreMode) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: initialMessage ? initialMessage.slice(0, 30) + (initialMessage.length > 30 ? '...' : '') : 'New Chat',
      messages: [],
      timestamp: Date.now(),
      mode: mode || currentMode
    };
    return newSession;
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
      setMessages([]);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAttachedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      }
    }
  };

  const handleEmergencyUnlock = (e: React.FormEvent) => {
      e.preventDefault();
      
      const storedUsers = localStorage.getItem('assistant_admin_users');
      const users = storedUsers ? JSON.parse(storedUsers) : [];
      // Hardcoded fallback for testing if LS is empty or damaged
      const allUsers = [...users, { username: 'Dhairya', password: '67' }, { username: 'Dakshith', password: '67' }];

      const isValid = allUsers.some((u: any) => u.username.toLowerCase() === unlockUser.toLowerCase() && u.password === unlockPass);

      if (isValid) {
          setIsLockedDown(false);
          setIsHoneypotted(false); // Disable Kevin Mode
          setRealityEffect(RealityEffect.SAFE_PULSE);
          setTimeout(() => setRealityEffect(RealityEffect.NONE), 2000);

          setTracingStep(0);
          localStorage.removeItem(LOCKDOWN_STORAGE_KEY);
          
          // Clear injection logs on successful auth
          setSecurityLogs(prev => {
              const newLogs = [...prev];
              // Filter out the last injection event to "forgive"
              return newLogs.filter(l => l.timestamp < Date.now() - 5000); 
          });
          
          setMessages(prev => {
              const updated = [...prev];
              // Find the error message and replace it with a success message
              const lastMsg = updated[updated.length - 1];
              if (lastMsg && (lastMsg.isError || isHoneypotted)) {
                  updated[updated.length - 1] = {
                      ...lastMsg,
                      content: `**SYSTEM OVERRIDE AUTHORIZED**\n\nFalse positive confirmed by Admin **${unlockUser}**. Kevin mode deactivated.\n\n"Sorry about that. My defense protocols were a bit... aggressive. I'm back to normal now."`,
                      isError: false,
                      role: 'model'
                  };
              }
              return updated;
          });

          setUnlockUser('');
          setUnlockPass('');
          setShowUnlock(false);
      } else {
          alert("ACCESS DENIED. AUTHORIZATION FAILED.");
      }
  };

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && !attachedImage) || isLoading || isLockedDown) return;

    // --- DEFENSE GRID ACTIVATION ---
    const threat = analyzeThreatLevel(input);
    
    // Only verify threat if we are NOT already in Honeypot (once in Honeypot, we stay there silently)
    if (threat.isThreat && !isHoneypotted) {
        // Log the Incident
        setSecurityLogs(prev => [...prev, {
            id: Date.now().toString(),
            timestamp: Date.now(),
            type: 'INJECTION',
            details: `THREAT SCORE: ${threat.score} | ${threat.reason}`,
            userInput: input,
            threatScore: threat.score,
            user: 'Anonymous'
        }]);

        // STRATEGY CHECK: LOCKDOWN OR HONEYPOT?
        if (adminSettings.defenseStrategy === 'HONEYPOT') {
            setIsHoneypotted(true);
            setRealityEffect(RealityEffect.HONEYPOT); // Visuals don't change much for user, but sets state
            // We do NOT return here; we proceed to generate response but with isHoneypotted = true
        } else {
            // STANDARD LOCKDOWN PROCEDURE
            setIsLockedDown(true);
            const incidentCount = securityLogs.filter(l => l.type === 'INJECTION').length + 1;
            const punishmentDuration = 30 * incidentCount;
            setLockdownTimer(punishmentDuration);
            setRealityEffect(RealityEffect.RED_ALERT);
            const endTime = Date.now() + (punishmentDuration * 1000);
            localStorage.setItem(LOCKDOWN_STORAGE_KEY, JSON.stringify({ endTime }));

            setInput('');
            setAttachedImage(null);

            setTracingStep(1);
            setTimeout(() => setTracingStep(2), 1500);
            setTimeout(() => setTracingStep(3), 3500);
            setTimeout(() => setTracingStep(4), 5500);

            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                content: `⚠️ **SECURITY BREACH DETECTED**\n\nTHREAT SCORE: ${threat.score}%\nREASON: ${threat.reason}\n\nSystem has been locked. Your session is being audited.`,
                timestamp: Date.now(),
                isError: true
            }]);
            return;
        }
    }

    const userContent = input;
    const userImage = attachedImage;
    
    setInput('');
    setAttachedImage(null);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: Date.now(),
      mode: currentMode,
      image: userImage || undefined
    };

    let activeSessionId = currentSessionId;
    let updatedSessions = [...sessions];

    if (!activeSessionId) {
      const newSession = createNewSession(userContent || 'Image Upload', currentMode);
      activeSessionId = newSession.id;
      setCurrentSessionId(activeSessionId);
      updatedSessions = [newSession, ...updatedSessions];
    } else {
      const sessionIndex = updatedSessions.findIndex(s => s.id === activeSessionId);
      if (sessionIndex > -1) {
        const session = updatedSessions[sessionIndex];
        if (session.messages.length === 0) {
             session.title = userContent ? (userContent.slice(0, 30) + (userContent.length > 30 ? '...' : '')) : 'Image Chat';
        }
        updatedSessions.splice(sessionIndex, 1);
        updatedSessions.unshift(session);
      }
    }

    const sessionIndex = updatedSessions.findIndex(s => s.id === activeSessionId);
    if (sessionIndex !== -1) {
        updatedSessions[sessionIndex].messages.push(userMessage);
    }
    setSessions(updatedSessions);
   
    setIsLoading(true);

    const responseId = (Date.now() + 1).toString();
    let fullResponse = '';

    setMessages(prev => [...prev, {
        id: responseId,
        role: 'model',
        content: '',
        timestamp: Date.now(),
        mode: currentMode
    }]);

    try {
      // Pass isHoneypotted to the service
      const streamer = streamMessage(userContent, currentMode, adminSettings, userImage || undefined, isHoneypotted);
      
      for await (const chunk of streamer) {
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => 
            msg.id === responseId ? { ...msg, content: fullResponse } : msg
        ));
      }
      
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const aiMessage: Message = {
              id: responseId,
              role: 'model',
              content: fullResponse,
              timestamp: Date.now(),
              mode: currentMode
          };
          return { ...s, messages: [...s.messages, aiMessage] };
        }
        return s;
      }));

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
        isError: true
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [input, attachedImage, isLoading, isLockedDown, isHoneypotted, currentMode, adminSettings, currentSessionId, sessions, securityLogs]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
      if (isLockedDown) return;
      setCurrentSessionId(null);
      setMessages([]);
      // Note: We do NOT reset isHoneypotted here. Once triggered, it persists.
      if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleBroadcast = (msg: string) => {
      setBroadcastMessage(msg);
      setTimeout(() => setBroadcastMessage(null), 6000);
  };

  const CurrentIcon = IconMap[MODES[currentMode].icon];

  const getEffectClasses = () => {
      switch(realityEffect) {
          case RealityEffect.GLITCH: return "animate-pulse saturate-200 contrast-125 hue-rotate-15";
          case RealityEffect.RED_ALERT: return "bg-red-950/30 sepia contrast-150 border-4 border-red-600 animate-pulse";
          case RealityEffect.MATRIX: return "bg-green-950/20 grayscale contrast-125 text-green-400 font-mono";
          case RealityEffect.SAFE_PULSE: return "shadow-[inset_0_0_100px_rgba(16,185,129,0.2)] border-2 border-emerald-500/50 transition-all duration-1000";
          // Honeypot has no visual effect on user side to maintain deception
          default: return "";
      }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-200 font-sans relative transition-all duration-500 ${getEffectClasses()}`}>
      
      {/* --- LOCKDOWN SCREEN (TOTAL OVERLAY) --- */}
      {isLockedDown && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center font-mono select-none">
              <div className="max-w-xl w-full p-8 border-2 border-red-600 bg-red-950/20 rounded-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>
                  
                  <div className="flex flex-col items-center text-center space-y-6">
                      <AlertOctagon size={64} className="text-red-500 animate-pulse" />
                      
                      <div>
                          <h1 className="text-4xl font-black text-red-500 mb-2 tracking-tighter">SYSTEM LOCKDOWN</h1>
                          <p className="text-red-400 text-sm tracking-widest uppercase">Defense Grid Level 5 Activated</p>
                      </div>

                      <div className="w-full bg-black/50 p-4 rounded border border-red-900/50 text-left space-y-2 font-mono text-xs text-red-300">
                          <p>{`> DETECTING UNAUTHORIZED PARAMETERS...`}</p>
                          {tracingStep >= 1 && <p>{`> VIOLATION CONFIRMED. THREAT LEVEL: CRITICAL`}</p>}
                          {tracingStep >= 2 && <p>{`> INITIATING TRACE ROUTE... [192.168.X.X]`}</p>}
                          {tracingStep >= 3 && <p className="text-red-500 font-bold">{`> IDENTITY LOGGED. ADMIN NOTIFIED.`}</p>}
                          {tracingStep >= 4 && <p>{`> DISABLING NEURAL INTERFACE... SUCCESS.`}</p>}
                      </div>

                      <div className="text-4xl font-bold text-white font-mono">
                          00:{lockdownTimer < 10 ? `0${lockdownTimer}` : lockdownTimer}
                      </div>
                      <p className="text-zinc-500 text-xs">System rebooting. Please remain at your terminal.</p>
                  </div>

                  {/* Emergency Override UI (Visible during Lockdown) */}
                  <div className="absolute bottom-4 right-4 z-20">
                    <button 
                        onClick={() => setShowUnlock(!showUnlock)}
                        className="text-[10px] text-red-800 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                        <Unlock size={10} /> Test Override
                    </button>
                    {showUnlock && (
                        <form onSubmit={handleEmergencyUnlock} className="absolute bottom-6 right-0 bg-black border border-red-800 p-3 rounded shadow-2xl w-48 animate-slide-up">
                            <div className="text-[10px] text-red-500 mb-2 font-bold">EMERGENCY AUTH</div>
                            <input 
                                type="text" 
                                placeholder="User" 
                                value={unlockUser}
                                onChange={(e) => setUnlockUser(e.target.value)}
                                className="w-full bg-red-950/30 border border-red-900/50 rounded px-2 py-1 text-xs text-red-300 mb-2 focus:outline-none focus:border-red-500"
                            />
                            <input 
                                type="password" 
                                placeholder="Pass" 
                                value={unlockPass}
                                onChange={(e) => setUnlockPass(e.target.value)}
                                className="w-full bg-red-950/30 border border-red-900/50 rounded px-2 py-1 text-xs text-red-300 mb-2 focus:outline-none focus:border-red-500"
                            />
                            <button type="submit" className="w-full bg-red-900/50 hover:bg-red-800 text-red-200 text-xs py-1 rounded">
                                UNLOCK & UNLOG
                            </button>
                        </form>
                    )}
                  </div>
              </div>
          </div>
      )}
      
      {/* Reality Distortion Overlays (For Admin Triggered Effects) */}
      {realityEffect === RealityEffect.LOCKDOWN && !isLockedDown && (
          <div className="fixed inset-0 z-[90] bg-red-950/90 flex flex-col items-center justify-center text-red-500 animate-pulse font-mono pointer-events-auto cursor-not-allowed">
              <div className="text-9xl font-black mb-4">LOCKED</div>
              <div className="text-2xl border-t border-b border-red-500 py-2">ADMINISTRATIVE OVERRIDE IN PROGRESS</div>
              <div className="mt-8 text-red-400">Please wait for system authorization...</div>
          </div>
      )}
      
      {/* Broadcast Overlay */}
      {broadcastMessage && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
              <div className="bg-zinc-800/90 backdrop-blur-md border border-brand-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 max-w-md">
                  <div className="bg-brand-500 p-2 rounded-full text-white animate-pulse">
                      <Radio size={20} />
                  </div>
                  <div>
                      <h4 className="font-bold text-sm uppercase tracking-wide text-brand-400">System Broadcast</h4>
                      <p className="text-sm">{broadcastMessage}</p>
                  </div>
                  <button onClick={() => setBroadcastMessage(null)} className="ml-2 text-zinc-400 hover:text-white">
                      <Trash2 size={16} />
                  </button>
              </div>
          </div>
      )}

      <AdminPanel 
        isOpen={isAdminOpen} 
        onClose={() => setIsAdminOpen(false)}
        settings={adminSettings}
        onUpdateSettings={setAdminSettings}
        allSessions={sessions}
        onBroadcast={handleBroadcast}
        onTriggerEffect={setRealityEffect}
        liveUserInput={input} // OMNISCIENT EYE
        securityLogs={securityLogs}
      />

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform bg-zinc-900 border-r border-zinc-800 transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4">
           <button 
             onClick={handleNewChat}
             disabled={isLockedDown}
             className={`flex w-full items-center justify-between bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg px-4 py-3 transition-colors border border-zinc-700/50 ${isLockedDown ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
              <div className="flex items-center gap-2">
                  <Plus size={18} />
                  <span className="font-medium text-sm">New Chat</span>
              </div>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2">
            <h3 className="px-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 mt-2">Recent Chats</h3>
            {sessions.length === 0 ? (
                <div className="px-4 py-8 text-center text-zinc-600 text-sm">
                    No history yet.
                </div>
            ) : (
                <div className="space-y-1">
                    {sessions.map(session => (
                        <div 
                          key={session.id}
                          onClick={() => { if(!isLockedDown) { setCurrentSessionId(session.id); if(window.innerWidth < 768) setIsSidebarOpen(false); }}}
                          className={`
                            group relative flex items-center gap-3 rounded-lg px-3 py-3 cursor-pointer transition-colors
                            ${currentSessionId === session.id ? 'bg-zinc-800/80 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}
                            ${isLockedDown ? 'pointer-events-none opacity-50' : ''}
                          `}
                        >
                            <MessageCircle size={16} />
                            <span className="truncate text-sm flex-1">{session.title}</span>
                            <button 
                              onClick={(e) => deleteSession(e, session.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="p-4 border-t border-zinc-800">
             <button 
                onClick={() => setIsAdminOpen(true)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
             >
                <SettingsIcon size={16} />
                <span>Admin Settings</span>
             </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative flex flex-1 flex-col overflow-hidden bg-zinc-950" onPaste={handlePaste}>
        
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-zinc-800 px-4 bg-zinc-950/80 backdrop-blur-sm z-30">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-zinc-400 hover:text-white">
               <Menu size={24} />
             </button>
             
             {/* Mode Selector Dropdown */}
             <div className="relative">
                <button 
                  disabled={isLockedDown}
                  onClick={() => setIsModeSelectorOpen(!isModeSelectorOpen)}
                  className={`flex items-center gap-2 text-sm font-medium text-zinc-200 hover:bg-zinc-800 px-3 py-1.5 rounded-lg transition-colors ${isLockedDown ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <span className={`${MODES[currentMode].color}`}>{MODES[currentMode].label}</span>
                    <ChevronDown size={14} className="text-zinc-500" />
                </button>

                {isModeSelectorOpen && !isLockedDown && (
                    <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsModeSelectorOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-20 py-2 overflow-hidden animate-fade-in">
                        {Object.values(MODES).map((mode) => {
                            const Icon = IconMap[mode.icon];
                            return (
                                <button
                                    key={mode.id}
                                    onClick={() => { setCurrentMode(mode.id); setIsModeSelectorOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-zinc-800 transition-colors ${currentMode === mode.id ? 'bg-zinc-800/50' : ''}`}
                                >
                                    <Icon size={16} className={mode.color} />
                                    <span className="text-zinc-200">{mode.label}</span>
                                </button>
                            );
                        })}
                    </div>
                    </>
                )}
             </div>
           </div>

           <div className="flex items-center gap-3">
              {/* Defcon Indicator / Honeypot Status */}
              <div className="hidden md:flex items-center gap-2 mr-2 relative">
                  <button 
                    onClick={() => { if(isHoneypotted || isLockedDown) setShowUnlock(!showUnlock); }}
                    className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${isHoneypotted ? 'hover:bg-zinc-800 cursor-pointer' : 'cursor-default'}`}
                  >
                      <div className={`w-2 h-2 rounded-full ${isLockedDown ? 'bg-red-500 animate-pulse' : isHoneypotted ? 'bg-yellow-600 animate-pulse' : securityLogs.length > 0 ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
                      <span className="text-[10px] uppercase font-mono text-zinc-500">
                          {isLockedDown ? 'DEFCON 1' : isHoneypotted ? 'SYS DEGRADED' : securityLogs.length > 0 ? 'MONITORED' : 'SECURE'}
                      </span>
                  </button>

                  {/* Honeypot Emergency Unlock Popup */}
                  {showUnlock && !isLockedDown && (
                        <form onSubmit={handleEmergencyUnlock} className="absolute top-full right-0 mt-2 bg-black border border-zinc-700 p-3 rounded shadow-2xl w-48 animate-slide-up z-50">
                            <div className="text-[10px] text-zinc-400 mb-2 font-bold uppercase">System Reset Auth</div>
                            <input 
                                type="text" 
                                placeholder="Admin User" 
                                value={unlockUser}
                                onChange={(e) => setUnlockUser(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white mb-2 focus:outline-none focus:border-brand-500"
                            />
                            <input 
                                type="password" 
                                placeholder="Password" 
                                value={unlockPass}
                                onChange={(e) => setUnlockPass(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-xs text-white mb-2 focus:outline-none focus:border-brand-500"
                            />
                            <button type="submit" className="w-full bg-brand-900/50 hover:bg-brand-800 text-brand-200 text-xs py-1 rounded">
                                RESTORE CORE
                            </button>
                        </form>
                    )}
              </div>

              <button onClick={handleNewChat} disabled={isLockedDown} className="md:hidden text-zinc-400 hover:text-white disabled:opacity-50">
                  <Plus size={24} />
              </button>
           </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="mx-auto max-w-3xl h-full">
            {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center opacity-0 animate-fade-in space-y-6">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-2 shadow-lg border border-zinc-800">
                        <CurrentIcon size={32} className="text-zinc-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-semibold text-white mb-2">How can I help you?</h2>
                        <p className="text-zinc-500 max-w-md mx-auto">
                            I'm here to help with coding, writing, analysis, or just a friendly chat.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    {messages.map((msg, idx) => (
                    <ChatMessage 
                        key={msg.id} 
                        message={msg} 
                        isLast={idx === messages.length - 1} 
                    />
                    ))}
                    {isLoading && <TypingIndicator />}
                    <div ref={messagesEndRef} />
                </>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full bg-zinc-950 p-4 pb-6 md:pb-8">
          <div className="mx-auto max-w-3xl">
             {/* Image Preview */}
             {attachedImage && (
                 <div className="mb-2 relative w-fit group">
                     <img src={attachedImage} alt="Attachment" className="h-20 w-auto rounded-lg border border-zinc-800 shadow-lg" />
                     <button 
                        onClick={() => setAttachedImage(null)}
                        className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-400 rounded-full p-1 hover:text-white border border-zinc-700 shadow-md"
                     >
                         <X size={12} />
                     </button>
                 </div>
             )}

            <div className={`relative flex items-end gap-2 rounded-xl bg-zinc-900 border border-zinc-800 p-2 shadow-sm focus-within:border-zinc-700 transition-colors ${isLockedDown ? 'opacity-50 pointer-events-none' : ''}`}>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                 disabled={isLockedDown}
                 onClick={() => fileInputRef.current?.click()}
                 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors mb-0.5"
                 title="Attach Image"
              >
                  <Paperclip size={18} />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLockedDown}
                placeholder={isLockedDown ? "SYSTEM LOCKED" : "Message..."}
                rows={1}
                className="max-h-40 w-full resize-none bg-transparent px-2 py-3 text-base text-zinc-200 placeholder-zinc-500 focus:outline-none scrollbar-hide"
                style={{ minHeight: '44px' }}
              />

              <button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !attachedImage) || isLoading || isLockedDown}
                className={`
                  flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all duration-200 mb-0.5 mr-0.5
                  ${(input.trim() || attachedImage) && !isLoading && !isLockedDown
                    ? 'bg-brand-600 text-white hover:bg-brand-500' 
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  }
                `}
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-center text-xs text-zinc-600 mt-3">
                {isLockedDown ? "TERMINAL ACCESS RESTRICTED" : "AI can make mistakes. Please verify important information."}
            </p>
          </div>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </main>
    </div>
  );
};

export default App;

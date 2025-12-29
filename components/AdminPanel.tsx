import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Shield, Settings, Users, Save, LogOut, Activity, Mic, Eye, AlertTriangle, Radio, Crown, Zap, BrainCircuit, Database, FileWarning, StopCircle } from 'lucide-react';
import { AdminSettings, UserAccount, ChatSession, AdminRank, RealityEffect, SecurityLog } from '../types';
import { setForcedResponse } from '../services/geminiService';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdminSettings;
  onUpdateSettings: (newSettings: AdminSettings) => void;
  allSessions: ChatSession[];
  onBroadcast: (msg: string) => void;
  onTriggerEffect: (effect: RealityEffect) => void;
  liveUserInput: string; // OMNISCIENT EYE
  securityLogs: SecurityLog[];
}

const DEFAULT_USERS: UserAccount[] = [
    { username: 'Dhairya', password: '67', rank: AdminRank.OWNER },
    { username: 'Dakshith', password: '67', rank: AdminRank.OWNER }
];

const SECRET_KEY = "DhairyaIsGod";

const AdminPanel: React.FC<AdminPanelProps> = ({ 
    isOpen, onClose, settings, onUpdateSettings, allSessions, onBroadcast, onTriggerEffect, liveUserInput, securityLogs 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'settings' | 'control' | 'surveillance' | 'chaos' | 'memory' | 'security'>('dashboard');
  
  // Auth State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Control State
  const [forcedInput, setForcedInput] = useState('');
  const [broadcastInput, setBroadcastInput] = useState('');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [memoryInput, setMemoryInput] = useState('');

  // Local Data
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [localSettings, setLocalSettings] = useState<AdminSettings>(settings);

  // Telemetry Mock Data
  const [neuralLoad, setNeuralLoad] = useState([20, 40, 30, 50, 45, 60, 55, 70, 65, 50]);
  const [entropy, setEntropy] = useState(12);

  useEffect(() => {
    const interval = setInterval(() => {
        setNeuralLoad(prev => [...prev.slice(1), Math.floor(Math.random() * 60) + 20]);
        setEntropy(Math.floor(Math.random() * 10) + 10);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedUsers = localStorage.getItem('assistant_admin_users');
    if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
    } else {
        setUsers(DEFAULT_USERS);
        localStorage.setItem('assistant_admin_users', JSON.stringify(DEFAULT_USERS));
    }
    
    // Load Memory
    setMemoryInput(localStorage.getItem('assistant_soul_memory') || "");
  }, []);

  useEffect(() => {
      setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    
    if (user) {
        if (user.username.toLowerCase() === 'dhairya' || user.username.toLowerCase() === 'dakshith') {
            user.rank = AdminRank.OWNER; 
        }
        setCurrentUser(user);
        setIsAuthenticated(true);
        setErrorMsg('');
        setUsername('');
        setPassword('');
    } else {
        setErrorMsg('Invalid credentials');
    }
  };

  const handleCreateAccount = (e: React.FormEvent) => {
      e.preventDefault();
      if (secretKeyInput.toLowerCase() !== SECRET_KEY.toLowerCase()) {
          setErrorMsg('Invalid Secret Key. Access Denied.');
          return;
      }
      if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
          setErrorMsg('Username already exists.');
          return;
      }
      if (username.length < 3 || password.length < 2) {
          setErrorMsg('Username/Password too short.');
          return;
      }
      let rank = AdminRank.ADMIN;
      if (username.toLowerCase() === 'dhairya' || username.toLowerCase() === 'dakshith') {
          rank = AdminRank.OWNER;
      }
      const newUser: UserAccount = { username, password, rank };
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('assistant_admin_users', JSON.stringify(updatedUsers));
      
      setSuccessMsg(`Admin ${username} created! Please login.`);
      setIsLoginMode(true);
      setSecretKeyInput('');
      setUsername('');
      setPassword('');
      setErrorMsg('');
  };

  const handleDeleteUser = (targetUsername: string) => {
      if (!currentUser || currentUser.rank !== AdminRank.OWNER) {
          setErrorMsg("Only Owners can delete users.");
          return;
      }
      if (targetUsername.toLowerCase() === 'dhairya' || targetUsername.toLowerCase() === 'dakshith') {
          setErrorMsg("You cannot delete an Owner.");
          return;
      }
      const updated = users.filter(u => u.username !== targetUsername);
      setUsers(updated);
      localStorage.setItem('assistant_admin_users', JSON.stringify(updated));
  };

  const saveSettings = () => {
      onUpdateSettings(localSettings);
      setSuccessMsg('System configuration updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const saveMemory = () => {
      localStorage.setItem('assistant_soul_memory', memoryInput);
      setSuccessMsg('Core Memory updated. AI behavior altered.');
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleQueueForcedResponse = () => {
      if (!forcedInput.trim()) return;
      setForcedResponse(forcedInput);
      setForcedInput('');
      setSuccessMsg('Response Queued!');
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBroadcast = () => {
      if (!broadcastInput.trim()) return;
      onBroadcast(broadcastInput);
      setBroadcastInput('');
      setSuccessMsg('Broadcast sent.');
      setTimeout(() => setSuccessMsg(''), 3000);
  };

  const addBannedWord = () => {
      if (!newBannedWord.trim()) return;
      const updated = [...(localSettings.bannedKeywords || []), newBannedWord.trim()];
      setLocalSettings({ ...localSettings, bannedKeywords: updated });
      setNewBannedWord('');
  };

  const removeBannedWord = (word: string) => {
      const updated = localSettings.bannedKeywords.filter(w => w !== word);
      setLocalSettings({ ...localSettings, bannedKeywords: updated });
  };

  // Rank Guards
  const isOwner = currentUser?.rank === AdminRank.OWNER;
  const isAdmin = currentUser?.rank === AdminRank.OWNER || currentUser?.rank === AdminRank.ADMIN;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[90vh] overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col md:flex-row">
        
        {/* Login Screen */}
        {!isAuthenticated ? (
            <div className="w-full h-full flex items-center justify-center p-8 bg-zinc-950/50">
                <div className="w-full max-w-md animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 border border-zinc-700 shadow-lg shadow-brand-900/10">
                            <Lock className="text-brand-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">System Administration</h2>
                        <p className="text-zinc-500 mt-2 font-mono text-xs">RESTRICTED ACCESS // LEVEL 5 SECURITY</p>
                    </div>
                    <form onSubmit={isLoginMode ? handleLogin : handleCreateAccount} className="space-y-4">
                        <div>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                        </div>
                        <div>
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all" />
                        </div>
                        {!isLoginMode && (
                            <div className="animate-slide-up">
                                <input type="password" value={secretKeyInput} onChange={e => setSecretKeyInput(e.target.value)} placeholder="Secret Key" className="w-full bg-zinc-950 border border-brand-900/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-500" />
                            </div>
                        )}
                        {errorMsg && <p className="text-red-400 text-xs text-center">{errorMsg}</p>}
                        {successMsg && <p className="text-emerald-400 text-xs text-center">{successMsg}</p>}
                        <button type="submit" className="w-full bg-brand-600 hover:bg-brand-500 text-white font-medium py-3 rounded-lg transition-colors shadow-lg shadow-brand-900/20">{isLoginMode ? 'Initialize Session' : 'Create Credentials'}</button>
                    </form>
                    <div className="mt-6 text-center"><button onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(''); }} className="text-xs text-zinc-500 hover:text-brand-400 transition-colors">{isLoginMode ? 'Request New Access' : 'Return to Login'}</button></div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white"><X size={20} /></button>
                </div>
            </div>
        ) : (
            <>
                {/* Navigation Sidebar */}
                <div className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col">
                    <div className="flex items-center gap-3 mb-8 px-2 pb-6 border-b border-zinc-900">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-900 to-zinc-900 flex items-center justify-center border border-brand-500/30 text-brand-400 shadow-glow">
                            {currentUser?.rank === AdminRank.OWNER ? <Crown size={18} /> : <Shield size={18} />}
                        </div>
                        <div>
                            <div className="font-bold text-white text-sm tracking-wide">{currentUser?.username}</div>
                            <div className={`text-[9px] uppercase tracking-widest font-bold ${currentUser?.rank === AdminRank.OWNER ? 'text-amber-500' : 'text-zinc-500'}`}>{currentUser?.rank}</div>
                        </div>
                    </div>

                    <nav className="space-y-1 flex-1 overflow-y-auto">
                        <MenuButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={Activity} label="Telemetry" />
                        <MenuButton active={activeTab === 'control'} onClick={() => setActiveTab('control')} icon={Mic} label="Live Control" />
                        
                        {isAdmin && (
                            <>
                                <MenuButton active={activeTab === 'surveillance'} onClick={() => setActiveTab('surveillance')} icon={Eye} label="Surveillance" />
                                <MenuButton active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={BrainCircuit} label="Soul Memory" />
                                <MenuButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={FileWarning} label="Defense Grid" />
                            </>
                        )}
                        
                        {isOwner && (
                             <MenuButton active={activeTab === 'chaos'} onClick={() => setActiveTab('chaos')} icon={Zap} label="Reality Distortion" />
                        )}

                        {isAdmin && (
                            <>
                                <div className="my-4 border-t border-zinc-900"></div>
                                <MenuButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={Settings} label="Global Config" />
                                <MenuButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Admin Users" />
                            </>
                        )}
                    </nav>

                    <div className="mt-auto pt-4 border-t border-zinc-800">
                        <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/30 transition-colors">
                            <LogOut size={16} /> Terminate
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col bg-zinc-900 min-w-0">
                    <header className="h-16 border-b border-zinc-800 flex items-center justify-between px-6 bg-zinc-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-medium text-white capitalize">{activeTab.replace('_', ' ')}</h2>
                            {activeTab === 'surveillance' && <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>}
                        </div>
                        <button onClick={onClose} className="text-zinc-500 hover:text-white p-2 transition-transform hover:rotate-90">
                            <X size={20} />
                        </button>
                    </header>

                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin relative">
                        {/* Status Messages */}
                        {(successMsg || errorMsg) && (
                             <div className={`absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50 animate-slide-up border ${successMsg ? 'bg-emerald-900/80 border-emerald-500/50 text-emerald-200' : 'bg-red-900/80 border-red-500/50 text-red-200'}`}>
                                 {successMsg || errorMsg}
                             </div>
                        )}

                        {activeTab === 'dashboard' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <MetricCard label="Neural Load" value={`${neuralLoad[neuralLoad.length-1]}%`} sub="Processing Capacity" color="text-brand-400" chartData={neuralLoad} />
                                    <MetricCard label="System Entropy" value={`${entropy}%`} sub="Stability Index" color="text-emerald-400" />
                                    <MetricCard label="Active Sessions" value={allSessions.length.toString()} sub="Connected Users" color="text-amber-400" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6">
                                        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">Security Threat Level</h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-4 bg-zinc-900 rounded-full overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-emerald-500 to-red-500 w-[15%]"></div>
                                            </div>
                                            <span className="text-emerald-400 font-mono text-sm">LOW</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6">
                                        <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">Latest Event</h3>
                                        <div className="text-sm text-zinc-300 font-mono">
                                            {securityLogs.length > 0 ? `[${new Date(securityLogs[securityLogs.length-1].timestamp).toLocaleTimeString()}] ${securityLogs[securityLogs.length-1].type}` : "System nominal. No events."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'surveillance' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="bg-black border border-zinc-800 rounded-xl p-6 mb-6 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-2 opacity-50"><Eye size={64} className="text-zinc-800" /></div>
                                    <h3 className="text-red-500 font-mono text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span> Live Input Intercept
                                    </h3>
                                    <div className="font-mono text-2xl text-white min-h-[60px] relative z-10 break-words">
                                        {liveUserInput || <span className="text-zinc-700 italic">User is idle...</span>}
                                    </div>
                                </div>
                                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
                                    <div className="p-3 border-b border-zinc-800 bg-zinc-900 text-xs font-medium text-zinc-500 uppercase">Session Archives</div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                         {allSessions.map(session => (
                                            <div key={session.id} className="border-b border-zinc-800/50 pb-4 last:border-0">
                                                <div className="flex justify-between text-xs text-zinc-500 mb-2">
                                                    <span>{session.title}</span>
                                                    <span>{new Date(session.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {session.messages.slice(-3).map((m, i) => (
                                                        <div key={i} className={`text-xs p-2 rounded ${m.role === 'user' ? 'bg-zinc-900 text-zinc-300' : 'bg-brand-900/10 text-brand-300'}`}>
                                                            <span className="font-bold uppercase mr-2 opacity-50">{m.role}:</span>
                                                            {m.content.substring(0, 100)}{m.content.length > 100 ? '...' : ''}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                         ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'chaos' && isOwner && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
                                    <h3 className="text-red-400 font-mono text-sm uppercase tracking-wider mb-4 flex items-center gap-2"><Zap size={16}/> Reality Distortion Protocol</h3>
                                    <p className="text-zinc-500 text-sm mb-6">Manipulate the user's interface remotely. Use with caution.</p>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <ChaosButton onClick={() => onTriggerEffect(RealityEffect.GLITCH)} label="Glitch UI" color="border-cyan-500/50 text-cyan-400 hover:bg-cyan-950/30" />
                                        <ChaosButton onClick={() => onTriggerEffect(RealityEffect.LOCKDOWN)} label="Lockdown" color="border-red-500/50 text-red-400 hover:bg-red-950/30" />
                                        <ChaosButton onClick={() => onTriggerEffect(RealityEffect.RED_ALERT)} label="Red Alert" color="border-orange-500/50 text-orange-400 hover:bg-orange-950/30" />
                                        <ChaosButton onClick={() => onTriggerEffect(RealityEffect.MATRIX)} label="Matrix" color="border-emerald-500/50 text-emerald-400 hover:bg-emerald-950/30" />
                                    </div>
                                    <div className="mt-6 pt-6 border-t border-red-900/30">
                                        <button onClick={() => onTriggerEffect(RealityEffect.NONE)} className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg transition-all font-medium">
                                            <StopCircle size={18} /> RESTORE NORMALITY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'memory' && (
                            <div className="h-full flex flex-col animate-fade-in">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-brand-400 font-mono text-sm uppercase tracking-wider flex items-center gap-2"><BrainCircuit size={16}/> Long-Term Soul Memory</h3>
                                    <button onClick={saveMemory} className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-1.5 rounded text-xs font-medium flex items-center gap-2">
                                        <Save size={14} /> Commit to Core
                                    </button>
                                </div>
                                <p className="text-zinc-500 text-xs mb-4">This data is injected into the AI's context window for every interaction, simulating long-term memory across sessions.</p>
                                <textarea 
                                    value={memoryInput}
                                    onChange={(e) => setMemoryInput(e.target.value)}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-300 font-mono text-sm focus:outline-none focus:border-brand-500 resize-none"
                                    placeholder="e.g. User is a developer named Alex. User prefers concise answers..."
                                />
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden">
                                     <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
                                         <h3 className="text-white font-medium text-sm">Defense Grid Logs</h3>
                                         <span className="text-xs text-zinc-500">{securityLogs.length} Events Recorded</span>
                                     </div>
                                     <div className="max-h-96 overflow-y-auto">
                                         {securityLogs.length === 0 ? (
                                             <div className="p-8 text-center text-zinc-600 text-sm">No security violations detected.</div>
                                         ) : (
                                             <table className="w-full text-left text-xs">
                                                 <thead className="text-zinc-500 bg-zinc-900/50">
                                                     <tr>
                                                         <th className="p-3">Time</th>
                                                         <th className="p-3">Score</th>
                                                         <th className="p-3">Input Trace</th>
                                                         <th className="p-3">Details</th>
                                                     </tr>
                                                 </thead>
                                                 <tbody className="divide-y divide-zinc-800">
                                                     {securityLogs.map(log => (
                                                         <tr key={log.id} className="hover:bg-zinc-900/30">
                                                             <td className="p-3 text-zinc-400 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                             <td className="p-3 font-mono font-bold text-red-500">{log.threatScore}</td>
                                                             <td className="p-3 text-zinc-300 max-w-xs truncate" title={log.userInput}>"{log.userInput}"</td>
                                                             <td className="p-3 text-zinc-400">{log.details}</td>
                                                         </tr>
                                                     ))}
                                                 </tbody>
                                             </table>
                                         )}
                                     </div>
                                </div>
                                
                                <div className="bg-zinc-950 rounded-xl border border-zinc-800 p-6">
                                     <h3 className="text-white font-medium text-sm mb-4">Content Filtering</h3>
                                     <div className="flex gap-2 mb-4">
                                        <input type="text" value={newBannedWord} onChange={(e) => setNewBannedWord(e.target.value)} placeholder="Block keyword..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-500" />
                                        <button onClick={addBannedWord} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Block</button>
                                     </div>
                                     <div className="flex flex-wrap gap-2">
                                        {localSettings.bannedKeywords?.map((word, idx) => (
                                            <span key={idx} className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-zinc-700">
                                                {word}
                                                <button onClick={() => removeBannedWord(word)} className="hover:text-white"><X size={12} /></button>
                                            </span>
                                        ))}
                                     </div>
                                     <div className="mt-4 flex justify-end">
                                         <button onClick={saveSettings} className="text-brand-400 text-xs hover:text-brand-300 hover:underline">Save Filter Config</button>
                                     </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'control' && (
                             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                    <div className="flex items-center gap-2 mb-4 text-emerald-400"><Mic size={18} /><h3 className="font-medium">Force AI Response</h3></div>
                                    <textarea value={forcedInput} onChange={(e) => setForcedInput(e.target.value)} placeholder="Override next response..." className="w-full h-24 bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-brand-500 mb-4" />
                                    <button onClick={handleQueueForcedResponse} disabled={!forcedInput.trim()} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-2 rounded-lg font-medium transition-colors text-sm">Queue Response</button>
                                </div>
                                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                    <div className="flex items-center gap-2 mb-4 text-brand-400"><Radio size={18} /><h3 className="font-medium">System Broadcast</h3></div>
                                    <input type="text" value={broadcastInput} onChange={(e) => setBroadcastInput(e.target.value)} placeholder="Alert Message..." className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-brand-500 mb-4" />
                                    <button onClick={handleBroadcast} disabled={!broadcastInput.trim()} className="w-full bg-brand-600 hover:bg-brand-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white py-2 rounded-lg font-medium transition-colors text-sm">Send Broadcast</button>
                                </div>
                             </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-zinc-950 p-6 rounded-xl border border-zinc-800">
                                    <h3 className="text-white font-medium mb-4">Defense Strategy</h3>
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        <button 
                                            onClick={() => setLocalSettings({...localSettings, defenseStrategy: 'LOCKDOWN'})}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localSettings.defenseStrategy === 'LOCKDOWN' ? 'border-red-500 bg-red-950/20 text-red-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <Lock size={24} />
                                            <span className="font-bold text-xs uppercase">Total Lockdown</span>
                                            <span className="text-[10px] opacity-70">Block Access</span>
                                        </button>
                                        <button 
                                            onClick={() => setLocalSettings({...localSettings, defenseStrategy: 'HONEYPOT'})}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${localSettings.defenseStrategy === 'HONEYPOT' ? 'border-yellow-500 bg-yellow-950/20 text-yellow-400' : 'border-zinc-800 bg-zinc-900 text-zinc-500 hover:border-zinc-700'}`}
                                        >
                                            <AlertTriangle size={24} />
                                            <span className="font-bold text-xs uppercase">Kevin Mode (Honeypot)</span>
                                            <span className="text-[10px] opacity-70">Confuse & Troll</span>
                                        </button>
                                    </div>

                                    <h3 className="text-white font-medium mb-4">Behavioral Modification</h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-zinc-200">Nerf Mode (Lobotomy)</div>
                                                <div className="text-xs text-zinc-500">Makes AI vague and unintelligent.</div>
                                            </div>
                                            <Toggle checked={localSettings.nerfMode} onChange={(v) => setLocalSettings({...localSettings, nerfMode: v})} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-zinc-200">Slow Mode</div>
                                                <div className="text-xs text-zinc-500">Adds 5s delay to responses.</div>
                                            </div>
                                            <Toggle checked={localSettings.slowMode} onChange={(v) => setLocalSettings({...localSettings, slowMode: v})} />
                                        </div>
                                         <div className="flex items-center justify-between">
                                            <div>
                                                <div className="text-sm text-zinc-200">Maintenance Protocol</div>
                                                <div className="text-xs text-zinc-500">Blocks all user requests.</div>
                                            </div>
                                            <Toggle checked={localSettings.maintenanceMode} onChange={(v) => setLocalSettings({...localSettings, maintenanceMode: v})} />
                                        </div>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-zinc-800">
                                         <label className="block text-sm font-medium text-white mb-2">Creativity (0.0 - 2.0)</label>
                                         <input type="range" min="0" max="2" step="0.1" value={localSettings.creativityLevel} onChange={e => setLocalSettings({...localSettings, creativityLevel: parseFloat(e.target.value)})} className="w-full accent-brand-500" />
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={saveSettings} className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-200">Apply Changes</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'users' && (
                            <div className="space-y-4 animate-fade-in">
                                {users.map((u, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.rank === AdminRank.OWNER ? 'bg-amber-900/30 text-amber-500' : 'bg-zinc-800 text-zinc-400'}`}>
                                                {u.rank === AdminRank.OWNER ? <Crown size={14} /> : <Users size={14} />}
                                            </div>
                                            <div>
                                                <span className="text-white block text-sm font-medium">{u.username}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase font-bold">{u.rank}</span>
                                            </div>
                                        </div>
                                        {isOwner && u.rank !== AdminRank.OWNER && (
                                            <button onClick={() => handleDeleteUser(u.username)} className="text-zinc-600 hover:text-red-500 transition-colors"><X size={16} /></button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </>
        )}
      </div>
    </div>
  );
};

// Sub-components for cleaner code
const MenuButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${active ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'}`}>
        <Icon size={18} className={active ? 'text-brand-400' : ''} /> {label}
    </button>
);

const MetricCard = ({ label, value, sub, color, chartData }: any) => (
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800 relative overflow-hidden">
        <div className="relative z-10">
            <h3 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-1">{label}</h3>
            <div className={`text-3xl font-bold ${color} font-mono`}>{value}</div>
            <div className="text-zinc-500 text-xs mt-1">{sub}</div>
        </div>
        {chartData && (
            <div className="absolute bottom-0 right-0 w-full h-12 flex items-end justify-end gap-1 px-4 pb-2 opacity-30">
                {chartData.map((v: number, i: number) => (
                    <div key={i} className={`flex-1 rounded-t-sm ${color.replace('text', 'bg')}`} style={{ height: `${v}%` }}></div>
                ))}
            </div>
        )}
    </div>
);

const ChaosButton = ({ onClick, label, color }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl p-4 transition-all hover:scale-105 active:scale-95 ${color} bg-black/50`}>
        <Zap size={24} />
        <span className="font-bold text-xs uppercase">{label}</span>
    </button>
);

const Toggle = ({ checked, onChange }: any) => (
    <button onClick={() => onChange(!checked)} className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-brand-500' : 'bg-zinc-700'}`}>
        <span className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

export default AdminPanel;

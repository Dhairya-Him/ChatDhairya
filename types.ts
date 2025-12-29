export enum AICoreMode {
  CHAT = 'CHAT',
  STUDY = 'STUDY',
  CODING = 'CODING',
  CREATIVE = 'CREATIVE',
  DEEP_THINKING = 'DEEP_THINKING',
  PRODUCTIVITY = 'PRODUCTIVITY'
}

export enum AdminRank {
  OWNER = 'OWNER', // Dhairya & Dakshith
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR'
}

export enum RealityEffect {
  NONE = 'NONE',
  GLITCH = 'GLITCH',
  LOCKDOWN = 'LOCKDOWN',
  RED_ALERT = 'RED_ALERT',
  MATRIX = 'MATRIX',
  SAFE_PULSE = 'SAFE_PULSE',
  HONEYPOT = 'HONEYPOT'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  mode?: AICoreMode;
  isError?: boolean;
  image?: string; // Base64 image
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
  mode: AICoreMode;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  currentMode: AICoreMode;
  apiKey: string | null;
}

export interface ModeConfig {
  id: AICoreMode;
  label: string;
  icon: string; // Lucide icon name
  description: string;
  systemInstruction: string;
  color: string;
}

// Admin & Settings Types
export interface AdminSettings {
  systemPromptOverride: string;
  creativityLevel: number; // 0.0 to 1.0 (Temperature)
  safetyEnabled: boolean;
  maintenanceMode: boolean;
  bannedKeywords: string[];
  nerfMode: boolean; // Makes AI dumb
  slowMode: boolean; // Delays response
  defenseStrategy: 'LOCKDOWN' | 'HONEYPOT';
}

export interface UserAccount {
  username: string;
  password: string; 
  rank: AdminRank;
}

export interface SecurityLog {
  id: string;
  timestamp: number;
  type: 'INJECTION' | 'BANNED_WORD' | 'SYSTEM_ERROR';
  details: string;
  userInput: string;
  threatScore: number; // 0-100
  user: string;
}
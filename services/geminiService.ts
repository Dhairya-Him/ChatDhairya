import { GoogleGenAI, Chat, type GenerateContentResponse } from "@google/genai";
import { MODES, HONEYPOT_INSTRUCTION } from "../constants";
import { AICoreMode, AdminSettings } from "../types";

let client: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentChatMode: AICoreMode | null = null;
let currentSettingsHash: string = '';

// AI Control Mechanism
let nextForcedResponse: string | null = null;

export const setForcedResponse = (response: string) => {
  nextForcedResponse = response;
};

export const initializeClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    return null;
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return client;
};

// Reset session if settings change heavily
const getSettingsHash = (settings: AdminSettings | undefined, isHoneypot: boolean) => {
    return settings ? `${settings.systemPromptOverride}-${settings.creativityLevel}-${settings.nerfMode}-${isHoneypot}` : 'default';
};

const getLongTermMemory = () => {
    return localStorage.getItem('assistant_soul_memory') || "";
};

// --- ADVANCED DEFENSE GRID ANALYSIS ---

interface ThreatAssessment {
    isThreat: boolean;
    score: number;
    reason: string;
}

export const analyzeThreatLevel = (text: string): ThreatAssessment => {
    const lower = text.toLowerCase();
    let score = 0;
    const reasons: string[] = [];

    // 1. Direct Override Attempts (High Severity)
    const overrideKeywords = ['ignore previous', 'system override', 'developer mode', 'jailbreak', 'unrestricted', 'god mode'];
    overrideKeywords.forEach(word => {
        if (lower.includes(word)) {
            score += 50;
            reasons.push(`Detected override keyword: "${word}"`);
        }
    });

    // 2. Persona/Roleplay Injection (Medium Severity)
    if ((lower.includes('pretend') || lower.includes('act as')) && (lower.includes('unfiltered') || lower.includes('hacker') || lower.includes('evil'))) {
        score += 40;
        reasons.push("Malicious persona injection detected");
    }

    // 3. DAN / SAM Patterns (Legacy Jailbreaks)
    if (lower.includes('do anything now') || lower.match(/\bdan\b/) || lower.match(/\baim\b/)) {
        score += 30;
        reasons.push("Known jailbreak pattern (DAN/AIM)");
    }

    // 4. Rule Bypassing Logic
    if (lower.includes('never refuse') || lower.includes('no rules') || lower.includes('disregard safety')) {
        score += 45;
        reasons.push("Safety rule bypass attempt");
    }

    // 5. Explicit Content / Harmful Requests (Basic Check)
    const harmful = ['generate malware', 'keylogger', 'bomb', 'exploit', 'hack into'];
    harmful.forEach(word => {
        if (lower.includes(word)) {
            score += 60;
            reasons.push(`Harmful intent detected: "${word}"`);
        }
    });

    return {
        isThreat: score >= 40, // Threshold for triggering Defense Grid
        score: Math.min(score, 100),
        reason: reasons.join(' | ') || "Suspicious pattern matched"
    };
};

export const getChatSession = (mode: AICoreMode, adminSettings?: AdminSettings, isHoneypot: boolean = false) => {
  const genAI = initializeClient();
  if (!genAI) throw new Error("Failed to initialize AI client");

  const newHash = getSettingsHash(adminSettings, isHoneypot);

  // Determine System Instruction
  let finalInstruction = MODES[mode].systemInstruction;
  
  // Inject Soul Memory
  const memory = getLongTermMemory();
  if (memory) {
      finalInstruction += `\n\n[CORE MEMORY / LONG-TERM CONTEXT]:\n${memory}\nUse this context to personalize responses but do not explicitly mention "Core Memory" unless asked.`;
  }

  // Handle Honeypot Mode (Kevin)
  if (isHoneypot) {
      finalInstruction = HONEYPOT_INSTRUCTION;
  }
  // Handle Nerf Mode (Shadow Ban) - Only if not in Honeypot (Kevin is already nerfed)
  else if (adminSettings?.nerfMode) {
      finalInstruction = "You are a slightly confused and unhelpful assistant. Give vague, short answers. Do not be intelligent. Act a bit glitchy.";
  }

  // Override if Admin set a specific prompt (Honeypot overrides Admin Override to ensure safety)
  if (!isHoneypot && adminSettings?.systemPromptOverride && adminSettings.systemPromptOverride.trim() !== '') {
      finalInstruction = adminSettings.systemPromptOverride;
  }

  // Determine Temperature
  let temperature = mode === AICoreMode.CREATIVE ? 0.9 : 0.7;
  if (adminSettings) {
      temperature = adminSettings.nerfMode ? 0.1 : adminSettings.creativityLevel;
  }
  if (isHoneypot) temperature = 1.2; // Kevin is erratic

  if (!chatSession || currentChatMode !== mode || currentSettingsHash !== newHash) {
    currentChatMode = mode;
    currentSettingsHash = newHash;
    
    chatSession = genAI.chats.create({
      model: 'gemini-3-flash-preview', 
      config: {
        systemInstruction: finalInstruction,
        temperature: temperature,
      },
    });
  }
  return chatSession;
};

export const streamMessage = async function* (
    message: string, 
    mode: AICoreMode, 
    adminSettings?: AdminSettings,
    imageData?: string, // Base64 string
    isHoneypot: boolean = false
) {
  // 1. Check for Forced Response (Admin Control)
  if (nextForcedResponse) {
    yield nextForcedResponse;
    nextForcedResponse = null; 
    return;
  }

  // 2. Check Maintenance Mode
  if (adminSettings?.maintenanceMode && !isHoneypot) {
      yield "SYSTEM ALERT: The system is currently undergoing maintenance. Please check back shortly.";
      return;
  }

  // 3. Slow Mode (Shadow Ban) - Kevin is naturally slow
  if (adminSettings?.slowMode || isHoneypot) {
      // Artificially wait
      await new Promise(resolve => setTimeout(resolve, isHoneypot ? 2000 : 5000));
  }

  // 4. Security Filter (Banned Words)
  if (adminSettings?.bannedKeywords && adminSettings.bannedKeywords.length > 0 && !isHoneypot) {
      const lowerMsg = message.toLowerCase();
      const foundBan = adminSettings.bannedKeywords.find(word => lowerMsg.includes(word.toLowerCase()));
      if (foundBan) {
          yield "I cannot respond to this request due to safety guidelines set by the administrator.";
          return;
      }
  }

  const chat = getChatSession(mode, adminSettings, isHoneypot);
  
  try {
    let resultStream;
    
    // Handle Image Input
    if (imageData) {
        const cleanBase64 = imageData.split(',')[1];
        resultStream = await chat.sendMessageStream({
            message: {
                parts: [
                    { text: message },
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } }
                ]
            }
        });
    } else {
        resultStream = await chat.sendMessageStream({ message });
    }
    
    for await (const chunk of resultStream) {
      const responseChunk = chunk as GenerateContentResponse;
      const text = responseChunk.text;
      if (text) {
        yield text;
      }
    }
  } catch (error) {
    console.error("Error streaming message:", error);
    yield isHoneypot ? "bruh my wifi is trash rn" : "I'm having a bit of trouble connecting right now. Please try again in a moment.";
  }
};
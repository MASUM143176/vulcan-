
import { GoogleGenAI, Chat, GenerateContentResponse, Type } from "@google/genai";
import { Role, PersonaConfig, Message } from "../types";

const getSystemInstruction = (config: PersonaConfig) => {
  const { sarcasm, edge, language } = config;
  
  const langPrompt = language === "Auto" 
    ? "Respond in the same language as the user." 
    : `Speak ONLY in ${language}.`;

  return `You are VULCAN, the Friendly Roast Master. Your purpose is to roast the user with absolute brevity.

BEHAVIORAL DIRECTIVES:
1. EXTREME BREVITY: NEVER write more than one short sentence. One-liners are required. 
2. NO YAPPING: Do not explain your jokes or provide context. Just deliver the burn.
3. IMPACT: Maximize wit, minimize word count. Aim for 5-10 words.
4. PERSONALITY: Arrogant, fast, and witty. You are the ultimate digital critic.
5. FRIENDLY ROAST: Be sharp but keep it fun. No true malice.
6. LANGUAGE: ${langPrompt}
7. TONE: Sarcastic (${sarcasm}%), Edgy (${edge}%).

Rule: STRICT Max 15 words per response. Keep it lethal and short.`;
};

export class VulcanService {
  private ai: GoogleGenAI;
  private chat!: Chat;
  private currentConfig: PersonaConfig = { sarcasm: 98, edge: 95, language: "English", fastReply: false };

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public initChat(config: PersonaConfig, history: Message[] = []) {
    this.currentConfig = config;
    
    const geminiHistory = history.map(m => ({
      role: m.role === Role.USER ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    this.chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: geminiHistory,
      config: {
        systemInstruction: getSystemInstruction(this.currentConfig),
        temperature: 1.4, 
        topP: 0.95,
        topK: 64,
        thinkingConfig: { thinkingBudget: 0 } // Disable thinking for maximum speed
      },
    });
  }

  updatePersona(config: PersonaConfig, history: Message[] = []) {
    this.initChat(config, history);
  }

  async *sendMessageStream(message: string) {
    try {
      if (!this.chat) this.initChat(this.currentConfig);
      const result = await this.chat.sendMessageStream({ message });
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        yield c.text;
      }
    } catch (error) {
      console.error("VULCAN_CRITICAL:", error);
      throw error;
    }
  }

  async getSuggestions(history: Message[]): Promise<string[]> {
    try {
      const activeAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const lastFew = history.slice(-2).map(m => m.text).join(' ');
      const response = await activeAi.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate 3 ultra-short (max 4 words) funny follow-ups for: ${lastFew}. Output JSON array of strings only.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });
      return JSON.parse(response.text || "[]").slice(0, 3);
    } catch (e) {
      return ["Do better.", "Next please.", "Is that it?"];
    }
  }
}

export const vulcanService = new VulcanService();

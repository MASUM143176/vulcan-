
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
}

export interface PersonaConfig {
  sarcasm: number;   
  edge: number;      
  language: string;  
  fastReply: boolean;
}

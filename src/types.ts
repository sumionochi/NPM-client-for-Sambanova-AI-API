export type ModelType = 
  | 'Llama-3.2-11B-Vision-Instruct'
  | 'Meta-Llama-3.1-8B-Instruct'
  | 'Meta-Llama-3.1-70B-Instruct'
  | 'Meta-Llama-3.1-405B-Instruct'
  | 'Meta-Llama-3.2-1B-Instruct'
  | 'Meta-Llama-3.2-3B-Instruct'
  | 'Llama-3.2-90B-Vision-Instruct';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

export interface MessageContent {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
  };
}

export interface ChatOptions {
  model?: ModelType;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  retry_count?: number;
  retry_delay?: number;
}

export interface APIResponse {
  id: string;
  choices: Array<{
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SambanovaError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SambanovaError';
  }
}
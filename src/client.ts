import { sleep, isVisionModel, validateMessage } from './utils';
import {
  ModelType,
  ChatMessage,
  ChatOptions,
  APIResponse,
  SambanovaError
} from './types';

export class SambanovaClient {
  private readonly baseUrl: string;
  private readonly defaultModel: ModelType;
  private readonly defaultRetryCount: number;
  private readonly defaultRetryDelay: number;

  constructor(
    private readonly apiKey: string,
    options: {
      baseUrl?: string;
      defaultModel?: ModelType;
      defaultRetryCount?: number;
      defaultRetryDelay?: number;
    } = {}
  ) {
    this.baseUrl = options.baseUrl || 'https://api.sambanova.ai/v1';
    this.defaultModel = options.defaultModel || 'Meta-Llama-3.2-3B-Instruct';
    this.defaultRetryCount = options.defaultRetryCount || 3;
    this.defaultRetryDelay = options.defaultRetryDelay || 1000;
  }

  private async makeRequest(
    endpoint: string,
    data: any,
    retryCount: number = this.defaultRetryCount
  ): Promise<APIResponse> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(data)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new SambanovaError(
            errorData.message || 'API request failed',
            response.status,
            errorData.code,
            errorData
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        if (attempt < retryCount) {
          await sleep(this.defaultRetryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  async chat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<APIResponse> {
    const model = options.model || this.defaultModel;
    
    messages.forEach(msg => validateMessage(msg, isVisionModel(model)));

    const payload = {
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      top_p: options.top_p ?? 0.1,
      max_tokens: options.max_tokens,
      stream: options.stream ?? false
    };

    return this.makeRequest(
      '/chat/completions',
      payload,
      options.retry_count
    );
  }

  async streamChat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<APIResponse, void, unknown> {
    const response = await this.chat(messages, { ...options, stream: true });
    yield* this.handleStreamResponse(response);
  }

  private async *handleStreamResponse(
    response: Response
  ): AsyncGenerator<APIResponse, void, unknown> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          yield data;
        }
      }
    }
  }
}
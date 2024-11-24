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
    retryCount: number = this.defaultRetryCount,
    stream: boolean = false
  ): Promise<APIResponse | Response> {
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

        if (stream) {
          return response;
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

    const response = await this.makeRequest(
      '/chat/completions',
      payload,
      options.retry_count,
      payload.stream
    );

    if (payload.stream && response instanceof Response) {
      throw new Error('Stream response received in chat method. Use streamChat instead.');
    }

    return response as APIResponse;
  }

  async *streamChat(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): AsyncGenerator<APIResponse, void, unknown> {
    const model = options.model || this.defaultModel;
    
    messages.forEach(msg => validateMessage(msg, isVisionModel(model)));

    const payload = {
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      top_p: options.top_p ?? 0.1,
      max_tokens: options.max_tokens,
      stream: true 
    };

    const response = await this.makeRequest(
      '/chat/completions',
      payload,
      options.retry_count,
      true 
    );

    // **Modified Check:**
    if (
      !response ||
      !('body' in response) ||
      typeof (response as any).body.getReader !== 'function'
    ) {
      throw new Error('Expected a streaming response');
    }

    yield* this.handleStreamResponse(response as Response);
  }

  private async *handleStreamResponse(
    response: Response
  ): AsyncGenerator<APIResponse, void, unknown> {
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      let lines = buffer.split('\n');
      
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('data: ')) {
          const dataStr = trimmedLine.slice(6);
          if (dataStr === '[DONE]') {
            return;
          }
          try {
            const data = JSON.parse(dataStr);
            yield data;
          } catch (e) {
            console.error('Failed to parse stream data:', e);
          }
        }
      }
    }

    // Processing any remaining buffer
    if (buffer.startsWith('data: ')) {
      const dataStr = buffer.slice(6);
      if (dataStr !== '[DONE]') {
        try {
          const data = JSON.parse(dataStr);
          yield data;
        } catch (e) {
          console.error('Failed to parse stream data:', e);
        }
      }
    }
  }
}

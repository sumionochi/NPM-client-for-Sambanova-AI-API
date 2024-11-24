import { sleep, isVisionModel, validateMessage } from './utils';
import {
  ModelType,
  ChatMessage,
  ChatOptions,
  APIResponse,
  SambanovaError
} from './types';

import { getBase64Image } from './utils';

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
  
    if (isVisionModel(model)) {
      for (const msg of messages) {
        if (Array.isArray(msg.content)) {
          for (const content of msg.content) {
            if (content.type === 'image_url' && content.image_url?.url) {
              try {
                content.image_url.url = await getBase64Image(content.image_url.url);
              } catch (error) {
                throw new SambanovaError(
                  `Failed to process image: ${error}`,
                  400,
                  'INVALID_IMAGE_FORMAT'
                );
              }
            }
          }
        }
      }
    }
  
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
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
  
    if (isVisionModel(model)) {
      for (const msg of messages) {
        if (Array.isArray(msg.content)) {
          for (const content of msg.content) {
            if (content.type === 'image_url' && content.image_url?.url) {
              try {
                content.image_url.url = await getBase64Image(content.image_url.url);
              } catch (error) {
                throw new SambanovaError(
                  `Failed to process image: ${error}`,
                  400,
                  'INVALID_IMAGE_FORMAT'
                );
              }
            }
          }
        }
      }
    }
  
    const payload = {
      model,
      messages,
      temperature: options.temperature ?? 0.1,
      top_p: options.top_p ?? 0.1,
      max_tokens: options.max_tokens,
      stream: true,
      stream_options: { include_usage: true } // Optional
    };
  
    const response = await this.makeRequest(
      '/chat/completions',
      payload,
      options.retry_count,
      true
    );
  
    if (
      !response ||
      !('body' in response) ||
      typeof (response as any).body.getReader !== 'function'
    ) {
      throw new Error('Expected a streaming response');
    }
  
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
  
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
  
      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const dataStr = line.trim().slice(6);
          if (dataStr === '[DONE]') return;
  
          try {
            const chunk = JSON.parse(dataStr);
            const content = chunk.choices?.[0]?.delta?.content;
  
            if (content) yield content;
          } catch (error) {
            console.error('Failed to parse stream data:', error);
          }
        }
      }
    }
  }
}

export { ChatMessage, ModelType, ChatOptions, MessageContent, APIResponse, SambanovaError } from './types';
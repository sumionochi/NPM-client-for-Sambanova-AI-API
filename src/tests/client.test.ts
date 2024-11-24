// src/__tests__/client.test.ts
import { SambanovaClient } from '../client';
import { SambanovaError } from '../types';

describe('SambanovaClient', () => {
  const client = new SambanovaClient('test-api-key');

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('chat', () => {
    it('should successfully make a text chat request', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: { role: 'assistant', content: 'Hello!' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.chat([
        { role: 'user', content: 'Hi!' }
      ]);

      expect(result).toEqual(mockResponse);
    });

    it('should handle vision model requests correctly', async () => {
      const mockResponse = {
        id: 'test-id',
        choices: [{
          message: { role: 'assistant', content: 'I see a cat in the image.' },
          finish_reason: 'stop'
        }],
        usage: { prompt_tokens: 20, completion_tokens: 8, total_tokens: 28 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.chat([
        {
          role: 'user',
          content: [
            { type: 'text', text: 'What do you see?' },
            { type: 'image_url', image_url: { url: 'base64...' } }
          ]
        }
      ], { model: 'Llama-3.2-11B-Vision-Instruct' });

      expect(result).toEqual(mockResponse);
    });

    it('should retry on failure', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ id: 'test-id' })
        });

      const result = await client.chat([
        { role: 'user', content: 'Hi!' }
      ], { retry_count: 3 });

      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ id: 'test-id' });
    });

    it('should throw SambanovaError on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          message: 'Invalid request',
          code: 'INVALID_REQUEST'
        })
      });

      await expect(client.chat([
        { role: 'user', content: 'Hi!' }
      ])).rejects.toThrow(SambanovaError);
    });
  });

  describe('streamChat', () => {
    it('should handle streaming responses', async () => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"id":"1"}\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"id":"2"}\n')
          })
          .mockResolvedValueOnce({ done: true })
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        body: { getReader: () => mockReader }
      });

      const responses = [];
      for await (const response of client.streamChat([
        { role: 'user', content: 'Hi!' }
      ])) {
        responses.push(response);
      }

      expect(responses).toHaveLength(2);
      expect(responses[0]).toEqual({ id: '1' });
      expect(responses[1]).toEqual({ id: '2' });
    });
  });
});
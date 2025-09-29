import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TelegramClient } from './client';

// Mock fetch globally
global.fetch = vi.fn();

describe('TelegramClient', () => {
  let client: TelegramClient;
  const mockFetch = fetch as any;

  beforeEach(() => {
    client = new TelegramClient('test-token');
    mockFetch.mockClear();
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const mockResponse = {
        ok: true,
        result: {
          message_id: 1,
          date: 1234567890,
          chat: { id: 123, type: 'private' },
          text: 'Test message'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      const result = await client.sendMessage(123, 'Test message');

      expect(result).toEqual(mockResponse.result);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: 123,
            text: 'Test message',
            parse_mode: 'Markdown'
          })
        })
      );
    });

    it('should show detailed Telegram API error message', async () => {
      const mockErrorResponse = {
        ok: false,
        error_code: 400,
        description: "Bad Request: can't parse entities: Character '_' is reserved and must be escaped with the preceding '\\'"
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => mockErrorResponse,
      } as unknown as Response);

      await expect(client.sendMessage(123, 'Test message with _invalid_ markdown')).rejects.toThrow(
        "Telegram API error 400: Bad Request: can't parse entities: Character '_' is reserved and must be escaped with the preceding '\\'"
      );
    });

    it('should handle HTTP error with Telegram API error details', async () => {
      const mockErrorResponse = {
        ok: false,
        error_code: 403,
        description: 'Forbidden: bot was blocked by the user'
      };

      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => mockErrorResponse,
      } as unknown as Response);

      await expect(client.sendMessage(123, 'Test message')).rejects.toThrow(
        'Telegram API error 403: Forbidden: bot was blocked by the user'
      );
    });

    it('should handle JSON parse error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => { throw new Error('Invalid JSON'); },
      } as unknown as Response);

      await expect(client.sendMessage(123, 'Test message')).rejects.toThrow(
        'Telegram API error: Failed to parse response. HTTP 500 Internal Server Error'
      );
    });

    it('should handle missing result in successful response', async () => {
      const mockResponse = {
        ok: true,
        result: null
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      await expect(client.sendMessage(123, 'Test message')).rejects.toThrow(
        'Telegram API error: Missing result in successful response'
      );
    });

    it('should use custom parse mode', async () => {
      const mockResponse = {
        ok: true,
        result: {
          message_id: 1,
          date: 1234567890,
          chat: { id: 123, type: 'private' },
          text: 'Test message'
        }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      } as unknown as Response);

      await client.sendMessage(123, 'Test message', { parseMode: 'HTML' });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-token/sendMessage',
        expect.objectContaining({
          body: JSON.stringify({
            chat_id: 123,
            text: 'Test message',
            parse_mode: 'HTML'
          })
        })
      );
    });
  });
}); 

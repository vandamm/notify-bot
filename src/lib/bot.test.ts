import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Bot } from './bot';
import { MessageParser } from './message-parsers/types';
import { Update } from './telegram/types';

describe('Bot', () => {
  let parser: MessageParser;

  beforeEach(() => {
    parser = {
      name: 'test',
      parse: vi.fn().mockReturnValue({ content: 'test', valid: true })
    };
  });

  it('should create bot with access token', () => {
    expect(() => new Bot('test-token', parser)).not.toThrow();
  });

  it('should throw error when access token is undefined', () => {
    expect(() => new Bot('', parser)).toThrow('Access token undefined');
  });

  it('should parse message using provided parser', () => {
    const bot = new Bot('test-token', parser);
    const message = { test: 'data' };
    
    bot.parseMessage(message);
    
    expect(parser.parse).toHaveBeenCalledWith(message);
  });

  describe('processUpdate with configuration messages', () => {
    const mockSendMessage = vi.fn();
    
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should use default configuration message when none provided', async () => {
      const bot = new Bot('test-token', parser);
      bot.sendMessage = mockSendMessage;

      const startUpdate: Update = {
        update_id: 1,
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 123, type: 'private' },
          text: '/start'
        }
      };

      await bot.processUpdate(startUpdate, 'https://test.com');

      expect(mockSendMessage).toHaveBeenCalledWith(123, expect.stringContaining('https://test.com/send-notifications/123'));
      expect(mockSendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Webhook Notifications Setup'));
    });

    it('should use custom configuration message when provided', async () => {
      const customMessage = 'Custom setup instructions: {{WEBHOOK_URL}}';
      const bot = new Bot('test-token', parser, customMessage);
      bot.sendMessage = mockSendMessage;

      const startUpdate: Update = {
        update_id: 1,
        message: {
          message_id: 1,
          date: Date.now(),
          chat: { id: 456, type: 'private' },
          text: '/start'
        }
      };

      await bot.processUpdate(startUpdate, 'https://example.com');

      expect(mockSendMessage).toHaveBeenCalledWith(456, 'Custom setup instructions: https://example.com/send-notifications/456');
    });
  });
});

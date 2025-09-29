import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleSendNotifications } from './send-notifications';

vi.mock('../lib/bot_repository');

import { getBotInstanceById } from '../lib/bot_repository';

describe('handleSendNotifications', () => {
  const mockGetBotInstanceById = getBotInstanceById as any;
  
  const mockEnv = {
    BOT_CONFIG: {
      get: vi.fn(),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('With chat ID from route', () => {
    it('should send notification successfully', async () => {
      const mockMessageBody = {
        game: '1830',
        action: 'turn_completed',
        player: 'John',
        link: 'https://example.com/game/123',
      };

      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockMessageBody)
      });

      const mockBot = {
        sendMessage: vi.fn(),
        processUpdate: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: '1830 turn completed by John',
          link: 'https://example.com/game/123',
          valid: true
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', '123456789');

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
      expect(mockBot.parseMessage).toHaveBeenCalledWith(mockMessageBody);
      expect(mockBot.sendMessage).toHaveBeenCalledWith(
        123456789,
        expect.stringContaining('1830')
      );
    });

    it('should handle invalid chat ID from route', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: '{}'
      });

      const mockBot = {
        parseMessage: vi.fn().mockReturnValue({
          content: 'test',
          valid: true
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', 'NaN');

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid chat ID');
    });
  });

  describe('With user ID from message metadata', () => {
    it('should send notification using user ID from message metadata when no chat ID in route', async () => {
      const mockMessageBody = {
        text: '<@139429205> This is a test notification from 18xx.games.'
      };

      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockMessageBody)
      });

      const mockBot = {
        sendMessage: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: 'This is a test notification from 18xx.games.',
          valid: true,
          metadata: {
            userId: '139429205',
            messageType: 'notification'
          }
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games');

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(139429205, 'This is a test notification from 18xx.games.');
    });

    it('should fallback to message metadata when route chat ID is invalid', async () => {
      const mockMessageBody = {
        text: '<@987654321> Another notification from 18xx.games.'
      };

      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockMessageBody)
      });

      const mockBot = {
        sendMessage: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: 'Another notification from 18xx.games.',
          valid: true,
          metadata: {
            userId: '987654321',
            messageType: 'notification'
          }
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', 'NaN');

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(987654321, 'Another notification from 18xx.games.');
    });

    it('should prefer route chat ID over message metadata when both are valid', async () => {
      const mockMessageBody = {
        text: '<@139429205> This is a test notification from 18xx.games.'
      };

      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(mockMessageBody)
      });

      const mockBot = {
        sendMessage: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: 'This is a test notification from 18xx.games.',
          valid: true,
          metadata: {
            userId: '139429205',
            messageType: 'notification'
          }
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', '555666777');

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
      expect(mockBot.sendMessage).toHaveBeenCalledWith(555666777, 'This is a test notification from 18xx.games.');
    });
  });

  describe('Plain text input handling', () => {
    it('should handle plain text input when JSON parsing fails', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        body: 'Test message!'
      });

      const mockBot = {
        sendMessage: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: 'Test message!',
          valid: true
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', '123456789');

      expect(response.status).toBe(200);
      expect(await response.text()).toBe('OK');
      expect(mockBot.parseMessage).toHaveBeenCalledWith({ text: 'Test message!' });
      expect(mockBot.sendMessage).toHaveBeenCalledWith(123456789, 'Test message!');
    });
  });

  describe('Error handling', () => {
    it('should handle invalid message format', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: '{}'
      });

      const mockBot = {
        sendMessage: vi.fn(),
        processUpdate: vi.fn(),
        parseMessage: vi.fn().mockReturnValue({
          content: 'Invalid format',
          valid: false
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', '123456789');

      expect(response.status).toBe(422);
      expect(await response.text()).toBe('Message has invalid format');
    });

    it('should handle missing chat ID when no metadata available', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: '{}'
      });

      const mockBot = {
        parseMessage: vi.fn().mockReturnValue({
          content: 'test message',
          valid: true,
          metadata: {}
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games');

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid chat ID');
    });

    it('should handle invalid user ID from message metadata', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: '{}'
      });

      const mockBot = {
        parseMessage: vi.fn().mockReturnValue({
          content: 'test message',
          valid: true,
          metadata: {
            userId: 'invalid-user-id'
          }
        })
      } as any;

      mockGetBotInstanceById.mockResolvedValue(mockBot);

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games');

      expect(response.status).toBe(400);
      expect(await response.text()).toBe('Invalid chat ID');
    });

    it('should handle errors', async () => {
      const mockRequest = new Request('https://example.com/test', {
        method: 'POST',
        body: 'invalid body that will cause parsing to fail'
      });

      const response = await handleSendNotifications(mockRequest, mockEnv, '18xx.games', '123456789');

      expect(response.status).toBe(500);
      expect(await response.text()).toBe('Internal server error');
    });
  });
}); 

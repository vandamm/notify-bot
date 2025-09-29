import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getBotInstanceById } from './bot_repository';

describe('Bot Repository', () => {
  const mockEnv = {
    BOT_CONFIG: {
      get: vi.fn(),
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBotInstanceById', () => {
    it('should return bot instance from KV storage', async () => {
      const mockBotConfig = {
        token: 'test-bot-token',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockEnv.BOT_CONFIG.get.mockResolvedValue(mockBotConfig);

      const bot = await getBotInstanceById('test-bot-1', mockEnv);

      expect(bot).toBeDefined();
      expect(mockEnv.BOT_CONFIG.get).toHaveBeenCalledWith('test-bot-1', {type: 'json'});
    });

    it('should return undefined if bot configuration not found', async () => {
      mockEnv.BOT_CONFIG.get.mockResolvedValue(null);

      const result = await getBotInstanceById('nonexistent', mockEnv);
      expect(result).toBeUndefined();
    });

    it('should return undefined if bot configuration has no token', async () => {
      const mockBotConfig = {
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockEnv.BOT_CONFIG.get.mockResolvedValue(mockBotConfig);

      const result = await getBotInstanceById('invalid-bot', mockEnv);
      expect(result).toBeUndefined();
    });

    it('should cache bot instances', async () => {
      const mockBotConfig = {
        token: 'test-bot-token',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockEnv.BOT_CONFIG.get.mockResolvedValue(mockBotConfig);

      const bot1 = await getBotInstanceById('cache-test-bot', mockEnv);
      const bot2 = await getBotInstanceById('cache-test-bot', mockEnv);

      expect(bot1).toBe(bot2);
      expect(mockEnv.BOT_CONFIG.get).toHaveBeenCalledTimes(1);
    });
  });
}); 

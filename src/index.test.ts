import { Env } from './types';

vi.mock('./lib/bot_repository', () => ({
  getBotInstanceById: vi.fn(),
}));

vi.mock('./routes/process-updates', () => ({
  handleProcessUpdates: vi.fn(),
}));

vi.mock('./routes/send-notifications', () => ({
  handleSendNotifications: vi.fn(),
}));

import { describe, it, expect, vi } from 'vitest';
import worker from './index';
import { getBotInstanceById } from './lib/bot_repository';
import { handleProcessUpdates } from './routes/process-updates';
import { handleSendNotifications } from './routes/send-notifications';

describe('Cloudflare Workers Handler', () => {
  let mockBot: any;
  let mockEnv: Env;
  let mockExecutionContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockBot = {
      processUpdate: vi.fn(),
      sendMessage: vi.fn(),
    };
    (getBotInstanceById as any).mockImplementation((botId: string) => {
      const knownBots = ['18xx.games', 'my-bot', 'test-bot'];
      return knownBots.includes(botId) ? Promise.resolve(mockBot) : Promise.resolve(undefined);
    });
    
    mockEnv = {
      BOT_CONFIG: {
        get: vi.fn(),
      } as any,
    };
    
    mockExecutionContext = {};

    (handleProcessUpdates as any).mockResolvedValue(new Response('OK', { status: 200 }));
    (handleSendNotifications as any).mockImplementation(async (request: Request, env: Env, botId: string, chatId?: number) => {
      const knownBots = ['18xx.games', 'my-bot', 'test-bot'];
      if (!knownBots.includes(botId)) {
        return new Response('Not found', { status: 404 });
      }
      return new Response('OK', { status: 200 });
    });
  });

  describe('POST /send-notifications/:chatId', () => {
    it('should call multi-bot handler with legacy bot ID', async () => {
      const request = new Request('https://ping.vansach.me/send-notifications/123456789', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Test notification',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /:botId/process-updates', () => {
    it('should call multi-bot process updates handler', async () => {
      const request = new Request('https://ping.vansach.me/my-bot/process-updates', {
        method: 'POST',
        body: JSON.stringify({
          update_id: 123,
          message: { message_id: 456, date: 1234567890, chat: { id: 789 } },
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /:botId/:chatId', () => {
    it('should call multi-bot send notifications handler', async () => {
      const request = new Request('https://ping.vansach.me/my-bot/123456789', {
        method: 'POST',
        body: JSON.stringify({
          text: 'Test notification',
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);

      expect(response.status).toBe(200);
    });
  });

  describe('POST /:botId/', () => {
    it('should call multi-bot send notifications handler without chat ID using trailing slash', async () => {
      const request = new Request('https://ping.vansach.me/test-bot/', {
        method: 'POST',
        body: JSON.stringify({
          text: '<@123> This notification uses trailing slash pattern.'
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);

      expect(response.status).toBe(200);
    });

    it('should call multi-bot send notifications handler without chat ID and trailing slash', async () => {
      const request = new Request('https://ping.vansach.me/test-bot', {
        method: 'POST',
        body: JSON.stringify({
          text: '<@123> This notification without trailing slash pattern.'
        }),
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);

      expect(response.status).toBe(200);
    });
  });

  describe('Invalid routes', () => {
    it('should return 404 for GET requests', async () => {
      const request = new Request('https://ping.vansach.me/process-updates', {
        method: 'GET',
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);
      expect(response.status).toBe(404);
    });

    it('should return 404 for unknown routes', async () => {
      const request = new Request('https://ping.vansach.me/unknown-route', {
        method: 'POST',
      });

      const response = await worker.fetch(request, mockEnv, mockExecutionContext);
      expect(response.status).toBe(404);
    });
  });
}); 

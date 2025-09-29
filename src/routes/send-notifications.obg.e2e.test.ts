import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleSendNotifications } from './send-notifications';

describe('E2E: OBG parser via send-notifications route', () => {
  const originalFetch = global.fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        result: {
          message_id: 1,
          date: 1234567890,
          chat: { id: 123456789, type: 'private' },
          text: 'placeholder'
        }
      })
    });
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('should parse form-encoded body and send message using obg parser', async () => {
    const mockEnv = {
      BOT_CONFIG: {
        get: vi.fn().mockResolvedValue({
          token: 'bottest-token',
          parser: 'obg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        })
      }
    } as any;

    const mockRequest = new Request('https://example.com/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'content=This+is+a+test+message+from+Online+Board+Gamers'
    });

    const response = await handleSendNotifications(mockRequest, mockEnv, 'obg-bot', '123456789');

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe('OK');


    expect((global as any).fetch).toHaveBeenCalled();
    const [, options] = ((global as any).fetch as any).mock.calls[0];
    const sentPayload = JSON.parse(options.body);
    expect(sentPayload.chat_id).toBe(123456789);
    expect(sentPayload.text).toBe('This is a test message from Online Board Gamers');
  });

  it('should return 422 when content param missing', async () => {
    const mockEnv = {
      BOT_CONFIG: {
        get: vi.fn().mockResolvedValue({
          token: 'bottest-token',
          parser: 'obg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        })
      }
    } as any;

    const mockRequest = new Request('https://example.com/test', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'foo=bar&baz=qux'
    });

    const response = await handleSendNotifications(mockRequest, mockEnv, 'obg-bot', '123456789');

    expect(response.status).toBe(422);
    expect(await response.text()).toBe('Message has invalid format');
  });
});




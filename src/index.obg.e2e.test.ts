import worker from './index';
import { Env } from './types';

jest.unmock('./lib/bot_repository');

describe('Router E2E: OBG form body', () => {
  const originalFetch = global.fetch as any;
  let mockEnv: Env;
  let mockExecutionContext: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn().mockResolvedValue({
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

    mockEnv = {
      BOT_CONFIG: {
        get: jest.fn().mockImplementation((botId: string) => {
          if (botId === 'obg-bot') {
            return Promise.resolve({
              token: 'bottest-token',
              parser: 'obg',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z'
            });
          }
          return Promise.resolve(undefined);
        })
      } as any,
    } as any;

    mockExecutionContext = {} as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('should accept form-encoded body and dispatch via obg parser', async () => {
    const request = new Request('https://ping.vansach.me/obg-bot/123456789', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: 'content=This+is+a+test+message+from+Online+Board+Gamers'
    });

    const response = await worker.fetch(request, mockEnv, mockExecutionContext);

    expect(response.status).toBe(200);
    expect((global as any).fetch).toHaveBeenCalled();
    const [, options] = ((global as any).fetch as jest.Mock).mock.calls[0];
    const payload = JSON.parse(options.body);
    expect(payload.chat_id).toBe(123456789);
    expect(payload.text).toBe('This is a test message from Online Board Gamers');
  });
});




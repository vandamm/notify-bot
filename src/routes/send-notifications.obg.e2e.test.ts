import { handleSendNotifications } from './send-notifications';

describe('E2E: OBG parser via send-notifications route', () => {
  const originalFetch = global.fetch as any;

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
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  it('should parse form-encoded body and send message using obg parser', async () => {
    const mockEnv = {
      BOT_CONFIG: {
        get: jest.fn().mockResolvedValue({
          token: 'bottest-token',
          parser: 'obg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        })
      }
    } as any;

    const mockRequest = {
      text: jest.fn().mockResolvedValue('content=This+is+a+test+message+from+Online+Board+Gamers'),
    } as any as Request;

    const response = await handleSendNotifications(mockRequest, mockEnv, 'obg-bot', '123456789');

    expect(response.status).toBe(200);
    const body = await response.text();
    expect(body).toBe('OK');

    expect(mockRequest.text).toHaveBeenCalled();

    expect((global as any).fetch).toHaveBeenCalled();
    const [, options] = ((global as any).fetch as jest.Mock).mock.calls[0];
    const sentPayload = JSON.parse(options.body);
    expect(sentPayload.chat_id).toBe(123456789);
    expect(sentPayload.text).toBe('This is a test message from Online Board Gamers');
  });

  it('should return 422 when content param missing', async () => {
    const mockEnv = {
      BOT_CONFIG: {
        get: jest.fn().mockResolvedValue({
          token: 'bottest-token',
          parser: 'obg',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z'
        })
      }
    } as any;

    const mockRequest = {
      text: jest.fn().mockResolvedValue('foo=bar&baz=qux'),
    } as any as Request;

    const response = await handleSendNotifications(mockRequest, mockEnv, 'obg-bot', '123456789');

    expect(response.status).toBe(422);
    expect(await response.text()).toBe('Message has invalid format');
  });
});




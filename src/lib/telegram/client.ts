import { TelegramApiResponse, Message } from './types';

export class TelegramClient {
  private token: string;
  private baseUrl: string;

  constructor(token: string) {
    this.token = token;
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async sendMessage(chatId: number, text: string, options: { parseMode?: string } = {}): Promise<Message> {
    const url = `${this.baseUrl}/sendMessage`;
    const body = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parseMode || 'Markdown',
      disable_web_page_preview: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let result: TelegramApiResponse<Message>;
    
    try {
      result = await response.json() as TelegramApiResponse<Message>;
    } catch (parseError) {
      throw new Error(`Telegram API error: Failed to parse response. HTTP ${response.status} ${response.statusText}`);
    }

    if (!response.ok || !result.ok) {
      const errorCode = result.error_code || response.status;
      const errorDescription = result.description || response.statusText || 'Unknown error';
      
      console.error({
        message: 'Telegram API error',
        chatId,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        errorCode,
        errorDescription,
        httpStatus: response.status,
        parseMode: options.parseMode || 'Markdown'
      });
      
      throw new Error(`Telegram API error ${errorCode}: ${errorDescription}`);
    }

    if (!result.result) {
      throw new Error('Telegram API error: Missing result in successful response');
    }

    return result.result;
  }
}
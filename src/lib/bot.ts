import { processConfigurationMessage, DEFAULT_CONFIGURATION_MESSAGE } from './templates';
import { MessageParser } from './message-parsers/types';
import { TelegramClient } from './telegram/client';
import { Update, Message } from './telegram/types';

export class Bot {
  private client: TelegramClient;
  private parser: MessageParser;
  private configurationMessage: string;

  constructor(accessToken: string, parser: MessageParser, configurationMessage: string = DEFAULT_CONFIGURATION_MESSAGE) {
    if (!accessToken) throw new Error('Access token undefined');

    this.client = new TelegramClient(accessToken);
    this.parser = parser;
    this.configurationMessage = configurationMessage;
  }

  async processUpdate(update: Update, baseUrl: string, botId?: string) {
    if (isStartMessage(update) && update.message) {
      const template = this.configurationMessage;
      const message = processConfigurationMessage(template, update.message.chat.id, baseUrl, botId);

      await this.sendMessage(update.message.chat.id, message);
    } else {
      console.warn({
        message: 'Unknown update type',
        update: JSON.stringify(update, null, 2),
      });
    }
  }

  async sendMessage(chatId: number, text: string, link?: string): Promise<Message> {
    return await this.client.sendMessage(chatId, text, {
      parseMode: 'Markdown',
      ...(link ? { linkPreviewUrl: link } : {}),
    });
  }

  parseMessage(message: object) {
    return this.parser.parse(message);
  }
}

function isStartMessage(update: Update): boolean {
  return update.message?.text?.toLowerCase().trim().startsWith('/start') ?? false;
}

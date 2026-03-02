import { MessageParser, ParsedMessage } from './types';

const CHAT_ID_PATTERN = /^<@(?<userId>\d+)> (?<text>.*)$/s;
const URL_PREFIX_PATTERN = /^(https?:\/\/\S+) - (.+)$/s;

export class DefaultParser implements MessageParser {
  name = 'default';

  parse(message: object): ParsedMessage {
    const rawContent = this.extractContent(message);
    let link = this.extractLink(message);

    let content = rawContent;
    if (!link) {
      const extracted = this.extractUrlFromContent(rawContent);
      if (extracted.url) {
        link = extracted.url;
        content = extracted.text;
      }
    }

    const { parsedContent, userId } = this.parseContentWithChatId(content);

    const metadata: any = { originalMessage: message };
    if (userId) {
      metadata.userId = userId;
    }

    return {
      content: parsedContent,
      link,
      valid: true,
      metadata
    };
  }

  private extractUrlFromContent(content: string): { text: string; url?: string } {
    const match = content.match(URL_PREFIX_PATTERN);
    if (match) {
      return { url: match[1], text: match[2] };
    }
    return { text: content };
  }

  private extractContent(message: object): string {
    if (typeof message === 'object' && message !== null) {
      const msg = message as any;
      
      if (typeof msg.text === 'string') {
        return msg.text;
      } else if (typeof msg.content === 'string') {
        return msg.content;
      } else if (typeof msg.message === 'string') {
        return msg.message;
      } else {
        return JSON.stringify(message);
      }
    } else {
      return String(message);
    }
  }

  private extractLink(message: object): string | undefined {
    if (typeof message === 'object' && message !== null) {
      const msg = message as any;
      
      if (typeof msg.link === 'string') {
        return msg.link;
      } else if (typeof msg.url === 'string') {
        return msg.url;
      }
    }
    
    return undefined;
  }

  private parseContentWithChatId(content: string): { parsedContent: string; userId?: string } {
    const chatIdMatch = content.match(CHAT_ID_PATTERN);
    if (chatIdMatch) {
      return {
        parsedContent: chatIdMatch.groups!.text,
        userId: chatIdMatch.groups!.userId
      };
    }
    
    return { parsedContent: content };
  }
} 
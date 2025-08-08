import { MessageParser, ParsedMessage } from './types';

interface IncomingChoochooMessage {
  text: string;
}

const CHOOCHOO_MESSAGE_PATTERN = /<@(?<userId>\d+)> (?<text>.*?)\[(?<title>.*?)\]\((?<link>https:\/\/www\.choochoo\.games\/.*?)\)/;

export class ChoochooParser implements MessageParser {
  name = 'choochoo';

  parse(message: object): ParsedMessage {
    if (!this.isValidMessage(message)) {
      return {
        content: 'Invalid message format',
        valid: false
      };
    }

    const match = message.text.match(CHOOCHOO_MESSAGE_PATTERN);
    if (!match) {
      return {
        content: 'Message format not recognized',
        valid: false
      };
    }

    const { userId, text, title, link } = match.groups!;

    const content = this.formatChoochooMessage({
      text: text.trim(),
      title
    });

    return {
      content,
      link,
      valid: true,
      metadata: {
        userId,
        text: text.trim(),
        title,
        messageType: 'choochoo',
        originalMessage: message
      }
    };
  }

  private isValidMessage(message: any): message is IncomingChoochooMessage {
    return message && typeof message.text === 'string';
  }

  private formatChoochooMessage(data: {
    text: string;
    title: string;
  }): string {
    return `${data.text} **${data.title}**`;
  }
}

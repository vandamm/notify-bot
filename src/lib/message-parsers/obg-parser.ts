import { MessageParser, ParsedMessage } from './types';

interface IncomingObgMessage {
  text: string;
}

export class ObgParser implements MessageParser {
  name = 'obg';

  parse(message: object): ParsedMessage {
    if (!this.isValidMessage(message)) {
      return {
        content: 'Invalid message format',
        valid: false
      };
    }

    const raw = message.text as string;
    const params = new URLSearchParams(raw);
    const content = params.get('content');

    if (!content) {
      return {
        content: 'Message format not recognized',
        valid: false
      };
    }

    return {
      content,
      valid: true,
      metadata: {
        messageType: 'obg',
        originalMessage: message
      }
    };
  }

  private isValidMessage(message: any): message is IncomingObgMessage {
    return message && typeof message.text === 'string';
  }
}




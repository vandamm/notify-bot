import { MessageParser, ParsedMessage } from './types';

interface IncomingObgMessage {
  content: string;
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
  
    return {
      content: message.content,
      valid: true,
      metadata: {
        messageType: 'obg',
        originalMessage: message
      }
    };
  }

  private isValidMessage(message: any): message is IncomingObgMessage {
    return message && typeof message.content === 'string';
  }
}




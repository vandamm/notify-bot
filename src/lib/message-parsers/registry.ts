import { MessageParser } from './types';
import { DefaultParser } from './default-parser';
import { EighteenxxParser } from './18xx-parser';
import { ChoochooParser } from './choochoo-parser';
import { ObgParser } from './obg-parser';

class ParserRegistry {
  private parsers = new Map<string, MessageParser>();

  constructor(...parsers: MessageParser[]) {
    parsers.forEach(parser => this.register(parser));
  }

  register(parser: MessageParser): void {
    this.parsers.set(parser.name, parser);
  }

  get(name: string): MessageParser {
    return this.parsers.get(name) || this.parsers.get('default')!;
  }

  list(): string[] {
    return Array.from(this.parsers.keys());
  }
}

export const parserRegistry = new ParserRegistry(
  new DefaultParser(),
  new EighteenxxParser(),
  new ChoochooParser(),
  new ObgParser(),
); 

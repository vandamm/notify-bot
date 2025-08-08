import { ChoochooParser } from './choochoo-parser';

describe('ChoochooParser', () => {
  let parser: ChoochooParser;

  beforeEach(() => {
    parser = new ChoochooParser();
  });

  describe('parse', () => {
    it('should parse valid choochoo notification message', () => {
      const message = {
        text: '<@139429205> Your turn in [Germany (Germany): Turn 4/6 - Select actions](https://www.choochoo.games/app/games/518)'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Your turn in **Germany (Germany): Turn 4/6 - Select actions**');
      expect(result.link).toBe('https://www.choochoo.games/app/games/518');
      expect(result.metadata).toEqual({
        userId: '139429205',
        text: 'Your turn in',
        title: 'Germany (Germany): Turn 4/6 - Select actions',
        messageType: 'choochoo',
        originalMessage: message
      });
    });

    it('should return invalid for non-choochoo message format', () => {
      const message = {
        text: 'Some other message format'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Message format not recognized');
    });

    it('should return invalid for message without text property', () => {
      const message = {};

      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Invalid message format');
    });

    it('should handle different choochoo game titles', () => {
      const message = {
        text: '<@123456> Game started in [My Custom Game: Turn 1/10](https://www.choochoo.games/app/games/999)'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Game started in **My Custom Game: Turn 1/10**');
      expect(result.link).toBe('https://www.choochoo.games/app/games/999');
    });
  });

  describe('name', () => {
    it('should return correct parser name', () => {
      expect(parser.name).toBe('choochoo');
    });
  });
});

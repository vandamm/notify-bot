import { describe, it, expect, beforeEach } from 'vitest';
import { EighteenxxParser } from './18xx-parser';

describe('EighteenxxParser', () => {
  let parser: EighteenxxParser;

  beforeEach(() => {
    parser = new EighteenxxParser();
  });

  it('should have correct name', () => {
    expect(parser.name).toBe('18xx');
  });

  describe('Game messages', () => {
    it('should parse valid 18xx message', () => {
      const message = {
        text: '<@U123456> has started their turn in 1830 "Testing Game" (Operating Round 2)\nhttps://18xx.games/game/12345'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('has started their turn in 1830 "Testing Game" (Operating Round 2)');
      expect(result.link).toBe('https://18xx.games/game/12345');
      expect(result.metadata?.userId).toBe('U123456');
      expect(result.metadata?.title).toBe('1830');
      expect(result.metadata?.description).toBe('Testing Game');
      expect(result.metadata?.round).toBe('Operating Round');
      expect(result.metadata?.turn).toBe(2);
      expect(result.metadata?.messageType).toBe('game');
    });

    it('should handle turn numbers correctly', () => {
      const message = {
        text: '<@U789> completed turn in 1889 "Long Game" (Stock Round 15)\nhttps://18xx.games/game/67890'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.metadata?.turn).toBe(15);
      expect(result.metadata?.messageType).toBe('game');
    });
  });

  describe('Notification messages', () => {
    it('should parse simple notification message', () => {
      const message = {
        text: '<@139429205> This is a test notification from 18xx.games.'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('This is a test notification from 18xx.games.');
      expect(result.link).toBeUndefined();
      expect(result.metadata?.userId).toBe('139429205');
      expect(result.metadata?.text).toBe('This is a test notification from 18xx.games.');
      expect(result.metadata?.messageType).toBe('notification');
    });

    it('should parse notification message without period', () => {
      const message = {
        text: '<@139429205> Another notification from 18xx.games'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Another notification from 18xx.games');
      expect(result.metadata?.userId).toBe('139429205');
      expect(result.metadata?.messageType).toBe('notification');
    });

    it('should parse notification with different user ID', () => {
      const message = {
        text: '<@987654321> Welcome message from 18xx.games.'
      };

      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Welcome message from 18xx.games.');
      expect(result.metadata?.userId).toBe('987654321');
      expect(result.metadata?.messageType).toBe('notification');
    });
  });

  describe('Error handling', () => {
    it('should reject invalid message format', () => {
      const message = { data: 'not a valid 18xx message' };
      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Invalid message format');
    });

    it('should reject message without text field', () => {
      const message = { content: 'some content' };
      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Invalid message format');
    });

    it('should reject message with wrong text pattern', () => {
      const message = { text: 'This is not a 18xx.games message' };
      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Message format not recognized');
    });

    it('should reject notification-like message without 18xx.games', () => {
      const message = { text: '<@139429205> This is just a regular mention' };
      const result = parser.parse(message);

      expect(result.valid).toBe(false);
      expect(result.content).toBe('Message format not recognized');
    });
  });
}); 

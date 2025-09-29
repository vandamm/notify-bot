import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultParser } from './default-parser';

describe('DefaultParser', () => {
  let parser: DefaultParser;

  beforeEach(() => {
    parser = new DefaultParser();
  });

  it('should have correct name', () => {
    expect(parser.name).toBe('default');
  });

  it('should parse text field', () => {
    const message = { text: 'Hello world' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('Hello world');
    expect(result.link).toBeUndefined();
    expect(result.metadata?.originalMessage).toBe(message);
  });

  it('should parse content field', () => {
    const message = { content: 'Test content' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('Test content');
  });

  it('should parse message field', () => {
    const message = { message: 'Test message' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('Test message');
  });

  it('should parse link field', () => {
    const message = { text: 'Hello', link: 'https://example.com' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('Hello');
    expect(result.link).toBe('https://example.com');
  });

  it('should parse url field as link', () => {
    const message = { text: 'Hello', url: 'https://example.com' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('Hello');
    expect(result.link).toBe('https://example.com');
  });

  it('should stringify object when no text fields found', () => {
    const message = { data: 'value', number: 42 };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('{"data":"value","number":42}');
  });

  it('should handle non-object input', () => {
    const result = parser.parse('simple string' as any);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('simple string');
  });

  describe('Chat ID pattern support', () => {
    it('should extract userId from text field with chatId pattern', () => {
      const message = { text: '<@123456789> This is a test message' };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('This is a test message');
      expect(result.metadata?.userId).toBe('123456789');
      expect(result.metadata?.originalMessage).toBe(message);
    });

    it('should extract userId from content field with chatId pattern', () => {
      const message = { content: '<@987654321> Another test message' };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Another test message');
      expect(result.metadata?.userId).toBe('987654321');
    });

    it('should extract userId from message field with chatId pattern', () => {
      const message = { message: '<@555666777> Yet another message' };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Yet another message');
      expect(result.metadata?.userId).toBe('555666777');
    });

    it('should extract userId from string input with chatId pattern', () => {
      const result = parser.parse('<@111222333> Direct string message' as any);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Direct string message');
      expect(result.metadata?.userId).toBe('111222333');
    });

    it('should not extract userId from partial chatId pattern', () => {
      const message = { text: '@123456789 Missing angle brackets' };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('@123456789 Missing angle brackets');
      expect(result.metadata?.userId).toBeUndefined();
    });

    it('should not extract userId from non-numeric chatId', () => {
      const message = { text: '<@invalid> Non-numeric user ID' };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('<@invalid> Non-numeric user ID');
      expect(result.metadata?.userId).toBeUndefined();
    });

    it('should handle chatId pattern with link', () => {
      const message = { 
        text: '<@444555666> Message with link', 
        link: 'https://example.com' 
      };
      const result = parser.parse(message);

      expect(result.valid).toBe(true);
      expect(result.content).toBe('Message with link');
      expect(result.link).toBe('https://example.com');
      expect(result.metadata?.userId).toBe('444555666');
    });
  });
}); 

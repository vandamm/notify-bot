import { describe, it, expect, beforeEach } from 'vitest';
import { ObgParser } from './obg-parser';

describe('ObgParser', () => {
  let parser: ObgParser;

  beforeEach(() => {
    parser = new ObgParser();
  });

  it('should have correct name', () => {
    expect(parser.name).toBe('obg');
  });

  it('should parse message with content field', () => {
    const message = { content: 'This is a test message from Online Board Gamers' };
    const result = parser.parse(message);

    expect(result.valid).toBe(true);
    expect(result.content).toBe('This is a test message from Online Board Gamers');
    expect(result.link).toBeUndefined();
    expect(result.metadata?.messageType).toBe('obg');
  });

  it('should return invalid for non-object input', () => {
    const result = parser.parse('content=Hello' as any);

    expect(result.valid).toBe(false);
    expect(result.content).toBe('Invalid message format');
  });

  it('should return invalid when content field missing', () => {
    const message = { foo: 'bar', baz: 'qux' };
    const result = parser.parse(message);

    expect(result.valid).toBe(false);
    expect(result.content).toBe('Invalid message format');
  });
});




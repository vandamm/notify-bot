import { parserRegistry } from './registry';

describe('ParserRegistry', () => {
  it('should have default parser', () => {
    const parser = parserRegistry.get('default');
    expect(parser.name).toBe('default');
  });

  it('should have 18xx parser', () => {
    const parser = parserRegistry.get('18xx');
    expect(parser.name).toBe('18xx');
  });

  it('should have choochoo parser', () => {
    const parser = parserRegistry.get('choochoo');
    expect(parser.name).toBe('choochoo');
  });

  it('should have obg parser', () => {
    const parser = parserRegistry.get('obg');
    expect(parser.name).toBe('obg');
  });

  it('should return default parser for unknown parser', () => {
    const parser = parserRegistry.get('unknown-parser');
    expect(parser.name).toBe('default');
  });

  it('should list all available parsers', () => {
    const parsers = parserRegistry.list();
    expect(parsers).toContain('default');
    expect(parsers).toContain('18xx');
    expect(parsers).toContain('choochoo');
    expect(parsers).toContain('obg');
    expect(parsers.length).toBeGreaterThanOrEqual(4);
  });
}); 

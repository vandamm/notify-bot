import { describe, it, expect } from 'vitest';
import { withLinkHandling } from './link-handler';
import { MessageParser } from './types';

function makeParser(content: string, link?: string): MessageParser {
  return {
    name: 'test',
    parse: () => ({ content, link, valid: true }),
  };
}

describe('withLinkHandling', () => {
  describe('URL extraction', () => {
    it('extracts leading URL with " - " separator and appends to content', () => {
      const parser = makeParser('https://rally-the-troops.com/game/42 - Wir sind das Volk! #42 - Your turn');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://rally-the-troops.com/game/42');
      expect(result.content).toBe('Wir sind das Volk! #42 - Your turn\nhttps://rally-the-troops.com/game/42');
    });

    it('extracts leading URL with space separator and appends to content', () => {
      const parser = makeParser('https://example.com/game/42 Your turn in 1830');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://example.com/game/42');
      expect(result.content).toBe('Your turn in 1830\nhttps://example.com/game/42');
    });

    it('extracts URL from the middle of content and appends to end', () => {
      const parser = makeParser('Your turn in https://example.com/game/42 now');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://example.com/game/42');
      expect(result.content).toBe('Your turn in now\nhttps://example.com/game/42');
    });

    it('extracts trailing URL and appends to content', () => {
      const parser = makeParser('Your turn in 1830 https://18xx.games/game/42');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://18xx.games/game/42');
      expect(result.content).toBe('Your turn in 1830\nhttps://18xx.games/game/42');
    });

    it('strips " - " separator before trailing URL and appends to content', () => {
      const parser = makeParser('Your turn in 1830 - https://18xx.games/game/42');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://18xx.games/game/42');
      expect(result.content).toBe('Your turn in 1830\nhttps://18xx.games/game/42');
    });

    it('strips " - " separator after leading URL and appends to content', () => {
      const parser = makeParser('https://18xx.games/game/42 - Your turn in 1830');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://18xx.games/game/42');
      expect(result.content).toBe('Your turn in 1830\nhttps://18xx.games/game/42');
    });

    it('does not extract when parser already provided a link', () => {
      const parser = makeParser('https://example.com/other Your turn', 'https://example.com/canonical');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://example.com/canonical');
      expect(result.content).toBe('https://example.com/other Your turn\nhttps://example.com/canonical');
    });

    it('does not extract when content has no URL', () => {
      const parser = makeParser('Your turn in 1830');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBeUndefined();
      expect(result.content).toBe('Your turn in 1830');
    });
  });

  describe('linkPreview=true', () => {
    it('includes link in content and keeps link for link_preview_options', () => {
      const parser = makeParser('Your turn in 1830', 'https://18xx.games/game/42');
      const result = withLinkHandling(parser, true).parse({});

      expect(result.link).toBe('https://18xx.games/game/42');
      expect(result.content).toBe('Your turn in 1830\nhttps://18xx.games/game/42');
    });
  });

  describe('linkPreview=false', () => {
    it('inlines parser-provided link into content', () => {
      const parser = makeParser('Your turn in 1830', 'https://18xx.games/game/42');
      const result = withLinkHandling(parser, false).parse({});

      expect(result.link).toBeUndefined();
      expect(result.content).toBe('Your turn in 1830\nhttps://18xx.games/game/42');
    });

    it('inlines extracted URL into content', () => {
      const parser = makeParser('https://rally-the-troops.com/game/42 - Wir sind das Volk! - Your turn');
      const result = withLinkHandling(parser, false).parse({});

      expect(result.link).toBeUndefined();
      expect(result.content).toBe('Wir sind das Volk! - Your turn\nhttps://rally-the-troops.com/game/42');
    });

    it('leaves content unchanged when no link present', () => {
      const parser = makeParser('Simple notification without a link');
      const result = withLinkHandling(parser, false).parse({});

      expect(result.link).toBeUndefined();
      expect(result.content).toBe('Simple notification without a link');
    });
  });
});

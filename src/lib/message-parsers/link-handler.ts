import { MessageParser, ParsedMessage } from './types';

const LEADING_URL_PATTERN = /^(https?:\/\/\S+)(?:\s+-\s+|\s+)([\s\S]*)$/;

function extractLeadingUrl(result: ParsedMessage): ParsedMessage {
  if (result.link) return result;

  const match = result.content.match(LEADING_URL_PATTERN);
  if (!match) return result;

  return { ...result, link: match[1], content: match[2].trim() };
}

export function withLinkHandling(parser: MessageParser, linkPreview: boolean): MessageParser {
  return {
    name: parser.name,
    parse(message: object): ParsedMessage {
      const result = extractLeadingUrl(parser.parse(message));

      if (!linkPreview && result.link) {
        return { ...result, content: `${result.content}\n${result.link}`, link: undefined };
      }

      return result;
    },
  };
}

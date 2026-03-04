import { MessageParser, ParsedMessage } from './types';

const URL_WITH_SEPARATOR = /(?:\s+-\s+)?https?:\/\/\S+(?:\s+-\s+)?/;

function extractUrl(result: ParsedMessage): ParsedMessage {
  if (result.link) return result;

  const match = result.content.match(URL_WITH_SEPARATOR);
  if (!match) return result;

  const urlMatch = match[0].match(/https?:\/\/\S+/)!;
  const url = urlMatch[0];
  const content = result.content.slice(0, match.index) + result.content.slice(match.index! + match[0].length);
  const cleaned = content.replace(/\s+/g, ' ').trim();

  return { ...result, link: url, content: cleaned };
}

export function withLinkHandling(parser: MessageParser): MessageParser {
  return {
    name: parser.name,
    parse(message: object): ParsedMessage {
      return extractUrl(parser.parse(message));
    },
  };
}

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

export function withLinkHandling(parser: MessageParser, linkPreview: boolean): MessageParser {
  return {
    name: parser.name,
    parse(message: object): ParsedMessage {
      const result = extractUrl(parser.parse(message));

      if (result.link) {
        // Always include the URL in the message text so users can see and click it.
        // When linkPreview is true, also keep result.link so it's passed as
        // link_preview_options to control the preview card.
        const contentWithLink = `${result.content}\n${result.link}`;
        return {
          ...result,
          content: contentWithLink,
          link: linkPreview ? result.link : undefined,
        };
      }

      return result;
    },
  };
}

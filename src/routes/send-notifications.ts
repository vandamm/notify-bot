import { getBotInstanceById } from '../lib/bot_repository';
import { Env } from '../types';
import { ParsedMessage } from '../lib/message-parsers/types';

const LEADING_URL_PATTERN = /^(https?:\/\/\S+)(?:\s+-\s+|\s+)([\s\S]*)$/;

function extractLeadingUrl(parsedMessage: ParsedMessage): ParsedMessage {
  if (parsedMessage.link) return parsedMessage;

  const match = parsedMessage.content.match(LEADING_URL_PATTERN);
  if (!match) return parsedMessage;

  return {
    ...parsedMessage,
    link: match[1],
    content: match[2].trim(),
  };
}

function resolveChatId(routeChatId?: number, parsedMessage?: ParsedMessage): number|undefined {
  if (routeChatId && !isNaN(routeChatId)) {
    return routeChatId;
  }

  if (parsedMessage?.metadata?.userId) {
    const userIdFromMessage = parseInt(parsedMessage.metadata.userId);
    if (!isNaN(userIdFromMessage)) {
      return userIdFromMessage;
    }
  }

  return undefined;
}

async function parseRequestBody(request: Request): Promise<object> {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      return formDataToObject(await request.formData());
    }
    if (contentType.includes('application/json')) {
      return await request.json();
    }
    
    const text = await request.text();
    if (!text.trim()) {
      return {};
    }
    
    try {
      return JSON.parse(text);
    } catch (error) {
      return { text };
    }
  } catch (error) {
    return {};
  }
}

export async function handleSendNotifications(request: Request, env: Env, botId: string, chatId?: string): Promise<Response> {
  try {
    const parsedChatId = chatId ? parseInt(chatId) : undefined;
    
    const bot = await getBotInstanceById(botId, env);
    if (!bot) {
      return new Response('Not found', { status: 404 });
    }

    const body = await parseRequestBody(request);
    const parsedMessage = extractLeadingUrl(bot.parseMessage(body as object));

    console.log({
      message: 'Notification',
      botId,
      chatId: parsedChatId,
      body,
      parsedMessage,
    })

    if (!parsedMessage.valid) {
      return new Response('Message has invalid format', { status: 422 });
    }

    const targetChatId = resolveChatId(parsedChatId, parsedMessage);
    if (!targetChatId) {
      return new Response('Invalid chat ID', { status: 400 });
    }

    await bot.sendMessage(targetChatId, parsedMessage.content, parsedMessage.link);

    return new Response('OK', { status: 200 });
  } catch (e) {
    const error = e as Error;
    
    console.error({
      message: 'Error sending notification',
      chatId,
      botId,
      error: error.message,
      stack: error.stack,
    });

    return new Response('Internal server error', { status: 500 });
  }
} 

function formDataToObject(formData: FormData): Record<string, string> {
  const result: Record<string, string> = {};
  
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      result[key] = value;
    }
  }
  
  return result;
}

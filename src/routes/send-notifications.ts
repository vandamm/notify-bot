import { getBotInstanceById } from '../lib/bot_repository';
import { notificationMessage } from '../lib/templates';
import { Env } from '../types';
import { ParsedMessage } from '../lib/message-parsers/types';

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
    const parsedMessage = bot.parseMessage(body as object);

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

    const messageText = parsedMessage.link 
      ? notificationMessage(parsedMessage.content, parsedMessage.link)
      : parsedMessage.content;

    await bot.sendMessage(targetChatId, messageText);

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

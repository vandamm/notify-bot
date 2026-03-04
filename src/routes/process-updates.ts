import { Update } from '../lib/telegram/types';
import { getBotInstanceById } from '../lib/bot_repository';
import { Env } from '../types';

export async function handleProcessUpdates(request: Request, env: Env, botId: string): Promise<Response> {
  try {
    const bot = await getBotInstanceById(botId, env);
    if (!bot) {
      return new Response('Not found', { status: 404 });
    }

    const update = await request.json() as Update;    
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    await bot.processUpdate(update, baseUrl, botId);

    return new Response('OK', { status: 200 });
  } catch (e) {
    const error = e as Error;
    console.error({
      message: 'Error processing updates',
      error,
    });

    return new Response('Internal server error', { status: 500 });
  }
} 

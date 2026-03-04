import { Bot } from './bot';
import { Env, BotConfig } from '../types';
import { parserRegistry } from './message-parsers/registry';
import { withLinkHandling } from './message-parsers/link-handler';

interface CachedBot {
  bot: Bot;
  cachedAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const botInstances = new Map<string, CachedBot>();

export async function getBotInstanceById(botId: string, env: Env): Promise<Bot|undefined> {
  const cached = botInstances.get(botId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.bot;
  }

  const config = await env.BOT_CONFIG.get<BotConfig>(botId, {type: 'json'});
  if (!config) {
    console.error({
      message: 'Bot configuration not found',
      botId,
    });
    return undefined;
  }

  if (!config.token) {  
    console.error({
      message: 'Bot token not found',
      botId,
    });
    return undefined;
  }

  const linkPreview = config.linkPreview !== false;
  const parser = withLinkHandling(parserRegistry.get(config.parser || 'default'), linkPreview);
  const bot = new Bot(config.token, parser, config.configurationMessage);
  botInstances.set(botId, { bot, cachedAt: Date.now() });

  return bot;
}



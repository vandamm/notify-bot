import { Bot } from './bot';
import { Env, BotConfig } from '../types';
import { parserRegistry } from './message-parsers/registry';

const botInstances = new Map<string, Bot>();

export async function getBotInstanceById(botId: string, env: Env): Promise<Bot|undefined> {
  if (botInstances.has(botId)) {
    return botInstances.get(botId)!;
  }

  const config: BotConfig = await env.BOT_CONFIG.get(botId, {type: 'json'});
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

  const parser = parserRegistry.get(config.parser || 'default');
  const linkPreview = config.linkPreview !== false;
  const bot = new Bot(config.token, parser, config.configurationMessage, linkPreview);
  botInstances.set(botId, bot);

  return bot;
}



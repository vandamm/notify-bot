import { Bot } from './bot';
import { Env, BotConfig } from '../types';
import { parserRegistry } from './message-parsers/registry';
import { withLinkHandling } from './message-parsers/link-handler';

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

  const linkPreview = config.linkPreview !== false;
  const parser = withLinkHandling(parserRegistry.get(config.parser || 'default'), linkPreview);
  const bot = new Bot(config.token, parser, config.configurationMessage);
  botInstances.set(botId, bot);

  return bot;
}



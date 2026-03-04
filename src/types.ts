export interface Env {
  BOT_CONFIG: KVNamespace;
}

export interface BotConfig {
  token: string;
  parser?: string;
  configurationMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export type CFArgs = [Env, ExecutionContext]; 

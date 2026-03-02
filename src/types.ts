export interface Env {
  BOT_CONFIG: KVNamespace;
}

export interface BotConfig {
  token: string;
  parser?: string;
  configurationMessage?: string;
  linkPreview?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CFArgs = [Env, ExecutionContext]; 

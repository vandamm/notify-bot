export const DEFAULT_CONFIGURATION_MESSAGE = `🔔 **Webhook Notifications Setup**

To receive notifications in this chat:

1. Copy this webhook URL: \`{{WEBHOOK_URL}}\`
2. Configure your notification source to send webhooks to this URL
3. Set any required User ID field to any value (e.g., "notifications")

✅ You're all set! Notifications will be delivered to this chat.`;

export function processConfigurationMessage(template: string, chatId: number, baseUrl: string): string {
  if (!baseUrl) throw new Error('Base URL is undefined');
  if (!template) throw new Error('Configuration message template is undefined');

  const webhookUrl = `${baseUrl}/send-notifications/${chatId.toString()}`;
  const webhookBaseUrl = `${baseUrl}/send-notifications`;
  const userId = chatId.toString();
  
  // Replace placeholders with values - no escaping needed for basic Markdown
  return template
    .replace(/\{\{WEBHOOK_URL\}\}/g, webhookUrl)
    .replace(/\{\{WEBHOOK_BASE_URL\}\}/g, webhookBaseUrl)
    .replace(/\{\{USER_ID\}\}/g, userId);
}

export function notificationMessage(text: string, link: string): string {
  // No link formatting to avoid Telegram popups
  return `${text}\n${link}`;
}

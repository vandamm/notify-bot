import { describe, it, expect } from 'vitest';
import {
  processConfigurationMessage,
  notificationMessage,
  DEFAULT_CONFIGURATION_MESSAGE,
} from "./templates";

describe("DEFAULT_CONFIGURATION_MESSAGE", () => {
  it("contains required placeholder", () => {
    expect(DEFAULT_CONFIGURATION_MESSAGE).toContain("{{WEBHOOK_URL}}");
  });

  it("uses Markdown formatting", () => {
    expect(DEFAULT_CONFIGURATION_MESSAGE).toContain("**");
    expect(DEFAULT_CONFIGURATION_MESSAGE).toContain("`");
  });
});

describe("notificationMessage", () => {
  it("combines text and link as Markdown inline link", () => {
    const result = notificationMessage("Hello world", "https://example.com");
    expect(result).toBe("[Hello world](https://example.com)");
  });

  it("formats game notification as inline link", () => {
    const result = notificationMessage(
      "Wir sind das Volk! #198359 (Westjj) - Your turn",
      "https://rally-the-troops.com/wir-sind-das-volk/play.html?game=198359&role=West"
    );
    expect(result).toBe(
      "[Wir sind das Volk! #198359 (Westjj) - Your turn](https://rally-the-troops.com/wir-sind-das-volk/play.html?game=198359&role=West)"
    );
  });
});

describe("processConfigurationMessage", () => {
  it("requires base URL", () => {
    expect(() => processConfigurationMessage("template", 1, "")).toThrow(
      "Base URL is undefined"
    );
  });

  it("requires template", () => {
    expect(() =>
      processConfigurationMessage("", 1, "https://it.com")
    ).toThrow("Configuration message template is undefined");
  });

  it("replaces single placeholder", () => {
    const template = "Use this URL: {{WEBHOOK_URL}}";
    const result = processConfigurationMessage(
      template,
      123,
      "https://example.com"
    );
    expect(result).toBe(
      "Use this URL: https://example.com/send-notifications/123"
    );
  });

  it("replaces multiple placeholders", () => {
    const template = "URL: {{WEBHOOK_URL}} and again: {{WEBHOOK_URL}}";
    const result = processConfigurationMessage(
      template,
      456,
      "https://it.com"
    );
    expect(result).toBe(
      "URL: https://it.com/send-notifications/456 and again: https://it.com/send-notifications/456"
    );
  });

  it("replaces WEBHOOK_BASE_URL placeholder", () => {
    const template = "Base URL: {{WEBHOOK_BASE_URL}}";
    const result = processConfigurationMessage(
      template,
      123,
      "https://example.com"
    );
    expect(result).toBe("Base URL: https://example.com/send-notifications");
  });

  it("replaces USER_ID placeholder", () => {
    const template = "Your ID: {{USER_ID}}";
    const result = processConfigurationMessage(
      template,
      789,
      "https://example.com"
    );
    expect(result).toBe("Your ID: 789");
  });

  it("replaces all three placeholders together", () => {
    const template =
      "Full URL: {{WEBHOOK_URL}}, Base: {{WEBHOOK_BASE_URL}}, ID: {{USER_ID}}";
    const result = processConfigurationMessage(
      template,
      456,
      "https://it.com"
    );
    expect(result).toBe(
      "Full URL: https://it.com/send-notifications/456, Base: https://it.com/send-notifications, ID: 456"
    );
  });

  it("handles template with no placeholders", () => {
    const template = "This is a message without placeholders";
    const result = processConfigurationMessage(
      template,
      789,
      "https://it.com"
    );
    expect(result).toBe("This is a message without placeholders");
  });

  it("processes complex custom configuration message with Markdown", () => {
    const template = `🎮 **Game Notifications Setup**

To receive notifications from 18xx.games:

1. Go to your [18xx.games profile page](https://18xx.games/profile)
2. Set these values:

*Turn/Message Notifications*: Webhook
*Webhook*: Custom
*Webhook URL*: \`{{WEBHOOK_URL}}\`
*Webhook User ID*: Type anything here, maybe "Hi"

🚀 You're all set! You'll receive notifications here when it's your turn.`;

    const result = processConfigurationMessage(
      template,
      123456789,
      "https://ping.vansach.me"
    );

    expect(result).toMatchInlineSnapshot(`
      "🎮 **Game Notifications Setup**

      To receive notifications from 18xx.games:

      1. Go to your [18xx.games profile page](https://18xx.games/profile)
      2. Set these values:

      *Turn/Message Notifications*: Webhook
      *Webhook*: Custom
      *Webhook URL*: \`https://ping.vansach.me/send-notifications/123456789\`
      *Webhook User ID*: Type anything here, maybe "Hi"

      🚀 You're all set! You'll receive notifications here when it's your turn."
    `);
  });

  it("processes template with all placeholders for flexible setup", () => {
    const template = `📬 **Advanced Webhook Setup**

Choose your setup method:

**Method 1 - Direct URL:**
Use: \`{{WEBHOOK_URL}}\`

**Method 2 - Separate fields:**
Webhook Base: \`{{WEBHOOK_BASE_URL}}\`
User ID: \`{{USER_ID}}\`

Both methods work the same way!`;

    const result = processConfigurationMessage(
      template,
      555,
      "https://api.example.com"
    );

    expect(result).toMatchInlineSnapshot(`
      "📬 **Advanced Webhook Setup**

      Choose your setup method:

      **Method 1 - Direct URL:**
      Use: \`https://api.example.com/send-notifications/555\`

      **Method 2 - Separate fields:**
      Webhook Base: \`https://api.example.com/send-notifications\`
      User ID: \`555\`

      Both methods work the same way!"
    `);
  });
});

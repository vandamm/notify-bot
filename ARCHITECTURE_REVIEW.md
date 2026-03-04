# Architecture & Code Quality Review

## Overall Assessment

This is a well-structured, small-scope Cloudflare Workers project. The architecture is clean and appropriate for the domain — a multi-tenant Telegram bot notification relay. The design patterns (Registry, Repository, Decorator) are well-chosen and not over-engineered.

---

## High Priority

### 1. Module-scoped bot cache never invalidates

**File:** `src/lib/bot_repository.ts:6`

```typescript
const botInstances = new Map<string, Bot>();
```

The `botInstances` map is module-scoped and never evicts entries. In Cloudflare Workers, module-scoped state persists across requests within the same isolate but is not shared across isolates. The issues:

- **Stale config**: If you update a bot's token or parser in KV, the cached instance still uses the old config until the isolate is recycled. There's no way to force a refresh.
- **No TTL**: Even a simple "re-check after N minutes" would prevent stale configs from persisting indefinitely.

**Suggestion**: Add a TTL-based cache or store the `updatedAt` timestamp and re-fetch from KV when it's been more than a few minutes. Alternatively, given the low volume of KV reads, consider removing the cache entirely — KV reads are fast from the edge.

### 2. Dead code: `src/lib/18xx_message.ts`

This file contains the legacy `Parsed18xxMessage` class that was replaced by `EighteenxxParser`. It's imported nowhere. It should be deleted to avoid confusion.

### 3. `strict: false` in `tsconfig.json`

Running without strict mode means you lose `strictNullChecks`, `noImplicitAny`, and other safety checks. This matters because:

- In `bot.ts:46`, `isStartMessage` accesses `update.message?.text` — without strict null checks, the `?.` chaining works but the compiler won't catch cases where you forget it.
- Parsers use `as any` casts freely (e.g., `default-parser.ts:28`), which strict mode would force you to handle more explicitly.

**Suggestion**: Enable `strict: true` and fix the resulting type errors. It's a small codebase — this would be straightforward.

---

## Medium Priority

### 4. Inconsistent Update type source

**Files:** `src/routes/process-updates.ts:1` vs `src/lib/telegram/types.ts:18`

The route handler imports `Update` from `typegram`, but `Bot.processUpdate()` uses the hand-rolled `Update` from `./telegram/types.ts`. These types may diverge. Pick one source of truth — either use `typegram` everywhere or maintain your own types, but not both.

### 5. Template URL uses legacy route pattern

**File:** `src/lib/templates.ts:15`

```typescript
const webhookUrl = `${baseUrl}/send-notifications/${chatId.toString()}`;
```

The configuration message always generates the legacy `/send-notifications/:chatId` URL, which is hardcoded to `botId = '18xx.games'` in the router. For multi-bot setups, the `/start` command gives users a URL that routes to the wrong bot. The template should generate `/${botId}/${chatId}` URLs instead.

**Suggestion**: Pass `botId` into `processConfigurationMessage` and generate the `/:botId/:chatId` URL format.

### 6. No request authentication or rate limiting

Any external caller can POST to `/:botId/:chatId` and trigger a Telegram message. Concerns:

- An attacker who guesses a valid `botId` and `chatId` can spam Telegram users.
- There's no webhook secret validation for incoming notifications.

**Suggestion**: Add a shared secret per bot (stored in KV alongside the token) and validate it via an `Authorization` header or query parameter.

### 7. Logging the full request body

**File:** `src/routes/send-notifications.ts:58-64`

```typescript
console.log({
  message: 'Notification',
  botId,
  chatId: parsedChatId,
  body,          // full incoming payload
  parsedMessage, // includes metadata.originalMessage (the full payload again)
})
```

This logs the entire incoming payload twice. In production, this could contain sensitive data and bloats log volume.

---

## Low Priority / Code Quality

### 8. `parseMode` always `'Markdown'` but configurable in interface

In `client.ts:17`, there's `options.parseMode || 'Markdown'` suggesting configurability, but `bot.ts:35` always passes `'Markdown'`. Either remove the configurability or expose it properly. Also consider `MarkdownV2` which is Telegram's recommended parse mode — classic Markdown has known escaping issues.

### 9. `resolveChatId` receives potentially-NaN value

```typescript
const parsedChatId = chatId ? parseInt(chatId) : undefined;
```

If `chatId` is `"abc"`, `parseInt` returns `NaN`, which flows through to `resolveChatId` and is caught by `!isNaN()`. It works but the control flow is unnecessarily subtle. Better to validate early and return 400 immediately.

### 10. `processUpdate` silently ignores non-`/start` messages

In `bot.ts:26-30`, unknown update types get `console.warn` but return `undefined`. The route returns 200 OK regardless. This is correct for Telegram webhook semantics (must return 200 to avoid retries), but worth a clarifying comment.

### 11. Parser interface could use generics for input type

All parsers accept `message: object` and immediately cast to `any`. A generic interface would be cleaner:

```typescript
interface MessageParser<T = unknown> {
  name: string;
  parse(message: T): ParsedMessage;
}
```

### 12. `formDataToObject` silently drops non-string values

In `send-notifications.ts:96-97`, `File` values from form data are silently dropped. This is fine for the use case but a debug log would help troubleshoot webhook integrations that send file attachments.

### 13. Package name mismatch

`package.json` still says `"name": "18xx-bot"` with a description about "A simple bot to send 18xx.games notifications to Telegram" — not updated for the multi-bot architecture.

---

## Architecture Strengths

- **Right-sized patterns**: Registry, Repository, and Decorator are all justified by the problem domain. Nothing is over-abstracted.
- **Clean separation**: Routes handle HTTP, `Bot` handles domain logic, parsers handle format translation, `TelegramClient` handles the API. Each layer has a single responsibility.
- **Extensibility**: Adding a new notification source is just: create a parser, register it, add a KV config entry.
- **Co-located tests**: Test files next to source files is practical for a project this size.
- **Backward compatibility**: Legacy routes preserved while adding multi-bot support.
- **Decorator for link handling**: Cleanly separates cross-cutting link preview logic from parser-specific logic.

---

## Summary of Recommended Actions

| Priority | Action |
|----------|--------|
| High | Delete dead `18xx_message.ts` |
| High | Add cache TTL or remove bot instance cache |
| High | Enable `strict: true` in tsconfig |
| Medium | Fix template URL to use multi-bot route format |
| Medium | Unify `Update` type source (typegram vs custom) |
| Medium | Add webhook authentication |
| Low | Validate chatId early in send-notifications |
| Low | Update package.json name/description |
| Low | Consider MarkdownV2 parse mode |

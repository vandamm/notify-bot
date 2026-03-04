# Architecture & Code Quality Review

*Reviewed against main branch (commit 657816b) on 2026-03-04.*

## Overall Assessment

This is a well-structured, small-scope Cloudflare Workers project. The architecture is clean and appropriate for the domain — a multi-tenant Telegram bot notification relay. The design patterns (Registry, Repository, Decorator) are well-chosen and not over-engineered.

---

## High Priority

### 1. Module-scoped bot cache never invalidates

**File:** `src/lib/bot_repository.ts:6`

```typescript
const botInstances = new Map<string, Bot>();
```

The `botInstances` map is module-scoped and never evicts entries. In Cloudflare Workers, module-scoped state persists across requests within the same isolate. If you update a bot's token or parser in KV, the cached instance still uses the old config until the isolate is recycled — and there's no way to force that.

**Suggestion**: Either add a TTL-based cache (check `updatedAt` from KV every few minutes), or remove the cache entirely — KV reads from the edge are fast and the volume is low.

### 2. Dead code: `src/lib/18xx_message.ts` and `src/lib/18xx_message.test.ts`

The legacy `Parsed18xxMessage` class was fully replaced by `EighteenxxParser` in `src/lib/message-parsers/18xx-parser.ts`. The old file is only imported by its own test. Both files should be deleted.

### 3. `strict: false` in `tsconfig.json`

Without strict mode, TypeScript misses null safety issues and implicit `any` types. Concrete example: `bot.ts:22` accesses `update.message.chat.id` without null checks (the `Update` type has `message?` as optional), but this compiles silently. With `strict: true`, the compiler would require a guard. The codebase is small enough that enabling strict mode would be straightforward.

---

## Medium Priority

### 4. Two different `Update` types in use

**Files:** `src/routes/process-updates.ts:1` imports `Update` from `typegram`; `src/lib/bot.ts:4` imports `Update` from `./telegram/types`.

These are structurally different types:
- **typegram**: `Update` is a union of 13+ specific update types. `message` is typed as `New & NonChannel & Message` with `from: User`, full `Chat`, etc.
- **local**: `Update` is a simple interface with `update_id: number` and an optional minimal `message`.

The route handler casts the request body as typegram's `Update`, then passes it to `Bot.processUpdate()` which expects the local `Update`. This works at runtime because the local type is a structural subset, but the types will silently diverge if either is updated.

**Suggestion**: Remove the local `Update` type and use `typegram` throughout, or (simpler) drop `typegram` entirely and keep the minimal local types — they're sufficient for the bot's current functionality.

### 5. Template URL uses legacy route pattern

**File:** `src/lib/templates.ts:15`

```typescript
const webhookUrl = `${baseUrl}/send-notifications/${chatId.toString()}`;
```

The `/send-notifications/:chatId` route is hardcoded to `botId = '18xx.games'` in the router (`index.ts:9`). For any other bot, the `/start` command gives users a webhook URL that routes to the wrong bot.

**Suggestion**: Pass `botId` into `processConfigurationMessage` and generate `/${botId}/${chatId}` URLs.

### 6. No request authentication

Any caller who knows (or guesses) a valid `botId` and `chatId` can POST to `/:botId/:chatId` and trigger a Telegram message to that user. There's no webhook secret, API key, or token validation on incoming notification requests.

**Suggestion**: Add a per-bot secret (stored in KV alongside the token) and validate it via an `Authorization` header or query parameter on the send-notifications endpoint.

### 7. Verbose logging of full payloads

**File:** `src/routes/send-notifications.ts:58-64`

The full incoming body is logged twice per request (once as `body`, once inside `parsedMessage.metadata.originalMessage`). This bloats Cloudflare log volume and may expose sensitive data.

**Suggestion**: Log only `botId`, `chatId`, `parsedMessage.valid`, and a truncated content preview.

---

## Low Priority / Code Quality

### 8. Consider MarkdownV2 parse mode

`bot.ts:35` hardcodes `parseMode: 'Markdown'` (legacy). Telegram recommends MarkdownV2 for new bots — it handles escaping more predictably. The `TelegramClient` already accepts `parseMode` as a configurable option, so this would be a one-line change.

### 9. Subtle NaN flow in chat ID resolution

In `send-notifications.ts:48`, `parseInt("abc")` returns `NaN`, which flows through to `resolveChatId` where it's caught by `!isNaN()`. This works but is unclear. Validate early and return 400 immediately for non-numeric chat IDs.

### 10. Package name mismatch

`package.json` still says `"name": "18xx-bot"` with a description about "A simple bot to send 18xx.games notifications to Telegram" — not updated to reflect the multi-bot architecture.

---

## Architecture Strengths

- **Right-sized patterns**: Registry, Repository, and Decorator are all justified by the problem domain without over-abstraction.
- **Clean separation of concerns**: Routes handle HTTP, `Bot` handles domain logic, parsers handle format translation, `TelegramClient` handles the API.
- **Extensibility**: Adding a new notification source = create a parser, register it, add a KV config entry.
- **Co-located tests**: Test files next to source files, practical for a project this size.
- **Backward compatibility**: Legacy routes preserved while adding multi-bot support.
- **Decorator for link handling**: Cross-cutting link preview logic cleanly separated from parser-specific logic.

---

## Summary of Recommended Actions

| Priority | Action | Effort |
|----------|--------|--------|
| High | Delete dead `18xx_message.ts` + its test | 1 min |
| High | Add cache TTL or remove bot instance cache | 15 min |
| High | Enable `strict: true` in tsconfig and fix type errors | 30 min |
| Medium | Unify `Update` type (drop one source) | 10 min |
| Medium | Fix template URL to use `/:botId/:chatId` format | 10 min |
| Medium | Add per-bot webhook authentication | 1 hr |
| Medium | Reduce log verbosity in send-notifications | 5 min |
| Low | Switch to MarkdownV2 parse mode | 5 min |
| Low | Validate chatId early in send-notifications | 5 min |
| Low | Update package.json name/description | 1 min |

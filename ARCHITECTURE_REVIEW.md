# Architecture & Code Quality Review

*Reviewed against main branch (commit 000978f) on 2026-03-04.*

## Overall Assessment

This is a well-structured, small-scope Cloudflare Workers project. The architecture is clean and appropriate for the domain — a multi-tenant Telegram bot notification relay. The design patterns (Registry, Repository, Decorator) are well-chosen and not over-engineered.

---

## Fixed Since Last Review

The following issues from the previous review have been addressed in main:

1. **Bot cache now has TTL** — `bot_repository.ts` uses a 5-minute TTL via `CachedBot` interface with `cachedAt` timestamp.
2. **Dead code deleted** — `18xx_message.ts` has been removed.
3. **Template URL supports multi-bot** — `processConfigurationMessage` now accepts `botId` and generates `/${botId}/${chatId}` URLs when provided.
4. **Update type unified** — `process-updates.ts` now imports `Update` from the local `../lib/telegram/types` instead of `typegram`, consistent with `bot.ts`.
5. **Null safety in processUpdate** — `bot.ts:20` now guards `update.message` before accessing `.chat.id`, and `isStartMessage` uses `?? false` for safe boolean coercion.

---

## Remaining Issues

### High Priority

#### 1. `strict: false` in `tsconfig.json`

Without strict mode, TypeScript misses implicit `any` types and other safety issues. The codebase is small — enabling `strict: true` would be straightforward and would catch bugs at compile time rather than runtime.

### Medium Priority

#### 2. No request authentication

Any caller who knows (or guesses) a valid `botId` and `chatId` can POST to `/:botId/:chatId` and trigger a Telegram message to that user. There's no webhook secret, API key, or token validation on incoming notification requests.

**Suggestion**: Add a per-bot secret (stored in KV alongside the token) and validate it via an `Authorization` header or query parameter.

#### 3. Verbose logging of full payloads

**File:** `src/routes/send-notifications.ts`

The full incoming body is logged twice per request (once as `body`, once inside `parsedMessage.metadata.originalMessage`). This bloats Cloudflare log volume and may expose sensitive data.

**Suggestion**: Log only `botId`, `chatId`, `parsedMessage.valid`, and a truncated content preview.

### Low Priority

#### 4. Consider MarkdownV2 parse mode

`bot.ts:35` hardcodes `parseMode: 'Markdown'` (legacy). Telegram recommends MarkdownV2 for new bots — it handles escaping more predictably.

#### 5. Subtle NaN flow in chat ID resolution

In `send-notifications.ts`, `parseInt("abc")` returns `NaN`, which flows through to `resolveChatId` where it's caught by `!isNaN()`. This works but is unclear. Validate early and return 400 for non-numeric chat IDs.

#### 6. Package name mismatch

`package.json` still says `"name": "18xx-bot"` — not updated for the multi-bot architecture.

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
| High | Enable `strict: true` in tsconfig and fix type errors | 30 min |
| Medium | Add per-bot webhook authentication | 1 hr |
| Medium | Reduce log verbosity in send-notifications | 5 min |
| Low | Switch to MarkdownV2 parse mode | 5 min |
| Low | Validate chatId early in send-notifications | 5 min |
| Low | Update package.json name/description | 1 min |

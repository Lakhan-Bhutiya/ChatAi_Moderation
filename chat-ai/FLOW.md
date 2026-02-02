# ChatAI – Code Flow & Architecture

This document explains how the ChatAI project works: every major file, what it does, and how it connects to the rest of the system.

---

## 1. High-Level Flow

```
┌─────────────┐     HTTP/WebSocket      ┌──────────────────┐     Redis Pub/Sub     ┌─────────────────────┐
│   Frontend  │ ◄─────────────────────► │  NestJS Backend  │ ◄───────────────────► │  Moderation Worker  │
│ (chat-ui)   │     (port 3000)         │   (port 3000)     │  moderation.message.* │  (ts-node process)   │
└─────────────┘                         └────────┬─────────┘                       └──────────┬──────────┘
                                                 │                                                    │
                                                 │ TypeORM                                            │ TypeORM
                                                 ▼                                                    ▼
                                        ┌──────────────────┐                                ┌──────────────────┐
                                        │  PostgreSQL      │                                │  PostgreSQL      │
                                        │  (port 5433)     │                                │  (same DB)       │
                                        └──────────────────┘                                └──────────────────┘
                                                 │
                                                 │ Redis (port 6380) for pub/sub + rate limit
                                                 ▼
                                        ┌──────────────────┐
                                        │  Redis           │
                                        └──────────────────┘
```

**Flow in short:**
1. User opens frontend → logs in (guest/signup/login) → gets JWT.
2. Frontend connects via WebSocket with JWT, joins a room, loads old messages via `GET /messages`.
3. User sends a message → backend saves it, emits `newMessage` to room, publishes to Redis `moderation.message.created`.
4. Moderation worker subscribes to that channel → samples by user tier → moderates (Llama or fallback) → updates message status → publishes `moderation.message.approved` or `moderation.message.deleted`.
5. Backend’s `MessageDeletedSubscriber` listens to those channels → calls `ChatGateway.broadcastRemoval` / `broadcastApproval` → frontend gets `messageRemoved` / `messageApproved` and updates UI.

---

## 2. Backend (NestJS) – Root & Config

### `src/main.ts`
- **What:** Entry point. Creates Nest app, enables CORS, listens on port 3000.
- **Used by:** Node when you run `npm run start` or `nest start`.

### `src/app.module.ts`
- **What:** Root module. Imports TypeORM config and all feature modules.
- **Imports:** TypeOrmModule (DB), MessagesModule, UsersModule, ChatModule, ModerationModule, ReputationModule, QueueModule.
- **Used by:** Nest bootstrap (main.ts).

### `src/database/typeorm.config.ts`
- **What:** TypeORM config: PostgreSQL (host, port 5433, user, password, DB name), `autoLoadEntities`, `synchronize: false`.
- **Used by:** AppModule via `TypeOrmModule.forRoot(typeOrmConfig)`.

---

## 3. Backend – Auth

### `src/modules/auth/auth.module.ts`
- **What:** Declares AuthModule: JwtModule, TypeOrmModule (User), AuthService, AuthController.
- **Used by:** AppModule.

### `src/modules/auth/auth.controller.ts`
- **What:** HTTP endpoints for auth.
  - `POST /auth/guest` → create guest user, return token.
  - `POST /auth/signup` → create user with password, return token.
  - `POST /auth/login` → validate credentials, return token.
  - `GET /auth/me` → return current user (tier, reputation, etc.) – protected by JwtAuthGuard.
- **Used by:** Frontend (login, signup, guest, and “me” for tier).

### `src/modules/auth/auth.service.ts`
- **What:** Business logic: createGuest(), signup(), login(), getCurrentUser(). Uses User repo and JwtService. Passwords hashed with bcryptjs. Sets initial tier/reputation for new users.
- **Used by:** AuthController.

### `src/modules/auth/jwt-auth.guard.ts`
- **What:** Guard that reads `Authorization: Bearer <token>`, verifies JWT, sets `req.user = { id }`.
- **Used by:** MessagesController, AuthController (GET /auth/me).

---

## 4. Backend – Users

### `src/modules/users/users.module.ts`
- **What:** Registers User entity with TypeORM.
- **Used by:** AppModule (and AuthModule uses User).

### `src/modules/users/entities/user.entity.ts`
- **What:** User table: id, username, password (nullable), reputationScore, tier (enum), cleanMessageCount, warningIssued, createdAt, updatedAt.
- **Used by:** Auth, Messages (relation on Message), Reputation, and moderation worker (same schema in worker).

---

## 5. Backend – Messages

### `src/modules/messages/messages.module.ts`
- **What:** Registers Message entity, MessagesService, MessagesController.
- **Used by:** AppModule.

### `src/modules/messages/messages.controller.ts`
- **What:** `GET /messages?roomId=...&limit=...&before=...` – returns room messages. Protected by JwtAuthGuard and rate-limit guards.
- **Used by:** Frontend when joining a room (load old chat).

### `src/modules/messages/messages.service.ts`
- **What:** `getRoomMessages(roomId, limit, before)` – query messages with status `approved` or `pending`, join `user`, order by createdAt, return oldest→newest. Excludes `removed`.
- **Used by:** MessagesController. Ensures “old chat” (approved + pending) shows when you load the room.

### `src/modules/messages/entities/message.entity.ts`
- **What:** Message table: id, userId, roomId, content, status (pending/approved/removed), deleted, severity, moderatedAt, createdAt; ManyToOne User.
- **Used by:** MessagesService, ChatGateway, Queue subscribers, moderation worker (mirrored entity).

---

## 6. Backend – Chat (WebSocket)

### `src/modules/chat/chat.module.ts`
- **What:** Imports TypeOrmModule (Message), AuthModule; provides ChatGateway.
- **Used by:** AppModule.

### `src/modules/chat/gateway/chat.gateway.ts`
- **What:** WebSocket gateway.
  - **handleConnection:** Validates JWT from `auth.token`, sets `client.data.userId`.
  - **joinRoom:** Client joins Socket.IO room by `roomId`.
  - **sendMessage:** Saves message to DB (pending), loads user relation, emits `newMessage` to room, publishes to Redis `moderation.message.created` with messageId, userId, roomId, content.
  - **broadcastRemoval(event):** Emits `messageRemoved` to room (from Redis events).
  - **broadcastApproval(messageId, roomId):** Emits `messageApproved` to room.
- **Used by:** Frontend (all real-time chat and moderation updates).

---

## 7. Backend – Moderation (Queue Producer)

### `src/modules/moderation/moderation.module.ts`
- **What:** Provides ModerationQueueProducer (BullMQ queue – optional path; main flow uses Redis pub/sub).
- **Used by:** AppModule.

### `src/modules/moderation/moderation.queue.producer.ts`
- **What:** BullMQ queue producer for moderation jobs (Redis port 6380). Can enqueue jobs; current flow uses Redis pub/sub from ChatGateway instead.
- **Used by:** ModerationModule; optional if you switch to queue-based moderation.

---

## 8. Backend – Reputation

### `src/modules/reputation/reputation.module.ts`
- **What:** Reputation-related constants/interfaces; tier enum. No controller; used conceptually and in worker.
- **Used by:** AppModule.

---

## 9. Backend – Queue (Redis Subscribers)

### `src/queue/queue.module.ts`
- **What:** Imports ChatModule, provides MessageDeletedSubscriber.
- **Used by:** AppModule.

### `src/queue/subscribers/message-deleted.subscriber.ts`
- **What:** Subscribes to Redis (port 6380) channels: `moderation.message.deleted`, `moderation.message.approved`. On message, parses payload and calls:
  - `moderation.message.deleted` → `chatGateway.broadcastRemoval(event)`.
  - `moderation.message.approved` → `chatGateway.broadcastApproval(messageId, roomId)`.
- **Used by:** QueueModule. This is what pushes moderation results from worker back to clients.

---

## 10. Backend – Common

### `src/common/redis/redis.client.ts`
- **What:** Creates shared Redis clients: `redis`, `redisSub`, `redisPub` (port 6380). Used for pub/sub and rate limiting.
- **Used by:** ChatGateway (redisPub), MessageDeletedSubscriber (redisSub), rate-limit guards.

### `src/common/guards/http-rate-limit.guard.ts`, `redis-http-rate-limit.guard.ts`
- **What:** HTTP rate limiting for API routes (e.g. messages).
- **Used by:** MessagesController.

---

## 11. Moderation Worker (Standalone Process)

Runs with: `cd apps/moderation-worker && npm run start` (ts-node).

### `apps/moderation-worker/src/main.ts`
- **What:** Boots worker: initializes WorkerDataSource (Postgres), creates BatchBuffer and MessageCreatedSubscriber, calls `subscriber.start()`.
- **Used by:** Entry point for the worker process.

### `apps/moderation-worker/src/db.ts`
- **What:** TypeORM DataSource for worker: same Postgres (port 5433), entities Message and User (worker’s copies).
- **Used by:** main.ts.

### `apps/moderation-worker/src/redis.client.ts`, `pubsub.ts`
- **What:** Redis connection (port 6380) for subscriber and publisher.
- **Used by:** MessageCreatedSubscriber (redisSub), BatchBuffer (redisPub).

### `apps/moderation-worker/src/message-created.subscriber.ts`
- **What:** Subscribes to `moderation.message.created`. On payload (messageId):
  1. Loads message and user from DB.
  2. Ensures user has tier; gets sampling rate: trusted 25%, neutral 50%, suspect 100%.
  3. If `shouldSample(rate)` → adds message to BatchBuffer (real moderation).
  4. Else → auto-approves message, updates DB, increments cleanMessageCount/reward, publishes `moderation.message.approved`.
- **Used by:** main.ts. This decides which messages go to the model and which are auto-approved.

### `apps/moderation-worker/src/sampling.util.ts`
- **What:** `shouldSample(rate: number): boolean` – e.g. rate 0.25 => 25% true (random).
- **Used by:** MessageCreatedSubscriber.

### `apps/moderation-worker/src/moderation-batch.buffer.ts`
- **What:** Buffer of messages; flush on interval (5000 ms). On flush:
  - For each message: call `moderateContent(content)` (Llama or fallback).
  - If SAFE: set status approved, update user (clean count, reward), publish `moderation.message.approved`.
  - If MINOR/MAJOR: set status removed, apply reputation penalty, publish `moderation.message.deleted`.
- **Used by:** main.ts, MessageCreatedSubscriber.

### `apps/moderation-worker/src/moderation-engine.ts`
- **What:** `moderateContent(content)`:
  - Calls Llama with a human-like moderation prompt (jokes, context, etc.).
  - Parses response for SAFE/MINOR/MAJOR.
  - On error or unparseable: uses `fallbackModeration(content)` (keyword-based MAJOR/MINOR/SAFE).
- **Used by:** BatchBuffer during flush.

### `apps/moderation-worker/src/llama.client.ts`
- **What:** `callLocalLlama(prompt, systemPrompt)` – HTTP POST to Ollama (e.g. `http://localhost:11434/api/generate`), model `phi3:mini`. Returns model response text.
- **Used by:** moderation-engine.ts.

### `apps/moderation-worker/src/reputation.util.ts`, `reputation.constants.ts`
- **What:** Tier from score (e.g. 80+ trusted, 40–79 neutral, &lt;40 suspect); REPUTATION_LIMITS, CLEAN_REWARD_THRESHOLD, PENALTY (MINOR, MAJOR).
- **Used by:** MessageCreatedSubscriber, BatchBuffer, moderation-batch.buffer.

### `apps/moderation-worker/src/message.entity.ts`, `user.entity.ts`
- **What:** Worker’s copy of Message and User entities (same schema as backend).
- **Used by:** db.ts, repositories in worker.

---

## 12. Frontend (chat-ui)

### `chat-ui/index.html`
- **What:** Structure: header (status, login/signup/logout, tier), auth modals, room selector, chat area (room info, messages list, input). Scripts: Socket.IO CDN, app.js.
- **Used by:** Browser; app.js binds to these elements.

### `chat-ui/app.js`
- **What:** All frontend logic:
  - **Auth:** guestLogin(), login(), signup(), logout(), updateUserUI(), refreshUserInfo() (GET /auth/me for tier).
  - **Socket:** connectSocket(), listeners for connect, newMessage, messageApproved, messageRemoved, rateLimit.
  - **Room:** joinRoom(roomId) – GET /messages?roomId=... with Bearer token, then render messages with addMessage(); leaveRoom().
  - **Messages:** addMessage(..., msgUsername), updateMessageStatus(); getStatusIcon, formatTime, escapeHtml, scrollToBottom.
  - **UI:** updateConnectionStatus(), showNotification(), showError().
- **Used by:** index.html. This is why “old chat” shows: joinRoom() loads messages from GET /messages and the backend now returns both approved and pending.

### `chat-ui/style.css`
- **What:** Styles for layout, header, auth, modals, room selector, messages, input, tier display, notifications.
- **Used by:** index.html.

---

## 13. Data Flow Summary

| Step | Where | What |
|------|--------|------|
| 1. User opens app | Frontend | Loads index.html, app.js runs, guestLogin() or login/signup. |
| 2. Token + socket | Frontend → Backend | JWT stored; Socket.IO connect with auth.token. |
| 3. Join room | Frontend → Backend | Socket emit `joinRoom`; HTTP GET /messages?roomId=... (old chat). |
| 4. Send message | Frontend → ChatGateway | Socket emit `sendMessage`. |
| 5. Save + broadcast | ChatGateway | Save message (pending), emit `newMessage` to room, publish Redis `moderation.message.created`. |
| 6. Worker receives | MessageCreatedSubscriber | On Redis message, load message+user, sample by tier, add to buffer or auto-approve. |
| 7. Moderation | BatchBuffer + moderation-engine | Llama or fallback → SAFE/MINOR/MAJOR; update DB, user reputation. |
| 8. Notify backend | Worker → Redis | Publish `moderation.message.approved` or `moderation.message.deleted`. |
| 9. Backend → clients | MessageDeletedSubscriber → ChatGateway | Subscribe to those channels; broadcastRemoval / broadcastApproval. |
| 10. UI update | Frontend | On messageApproved / messageRemoved, update message status and optionally refresh user tier. |

---

## 14. Fix: Old Chat Not Showing

- **Cause:** Previously only messages with status `approved` were returned, so pending messages (and rooms where nothing was approved yet) looked empty.
- **Change:** `MessagesService.getRoomMessages()` now returns messages with status **approved** or **pending** (removed still excluded). So when you join a room, you see all non-removed history, including messages still in moderation.
- **Files:** `src/modules/messages/messages.service.ts`.

---

## 15. Quick File Reference

| File | Role |
|------|------|
| `src/main.ts` | Nest entry, CORS, listen 3000 |
| `src/app.module.ts` | Root module imports |
| `src/database/typeorm.config.ts` | Postgres config |
| `src/modules/auth/*` | Guest/signup/login/me, JWT |
| `src/modules/users/entities/user.entity.ts` | User schema |
| `src/modules/messages/*` | GET /messages, getRoomMessages (approved + pending) |
| `src/modules/chat/gateway/chat.gateway.ts` | WebSocket: joinRoom, sendMessage, broadcast* |
| `src/queue/subscribers/message-deleted.subscriber.ts` | Redis → broadcastRemoval/broadcastApproval |
| `src/common/redis/redis.client.ts` | Redis clients |
| `apps/moderation-worker/src/main.ts` | Worker entry |
| `apps/moderation-worker/src/message-created.subscriber.ts` | Redis subscribe, sampling, buffer or auto-approve |
| `apps/moderation-worker/src/moderation-batch.buffer.ts` | Flush batch, call moderation, update DB, publish |
| `apps/moderation-worker/src/moderation-engine.ts` | Llama + fallback moderation |
| `apps/moderation-worker/src/llama.client.ts` | Ollama API call |
| `chat-ui/index.html` | Page structure |
| `chat-ui/app.js` | Auth, socket, room, messages, UI |
| `chat-ui/style.css` | Styles |

This is the full flow and role of each file; old chat now loads because approved and pending messages are both returned from `getRoomMessages`.

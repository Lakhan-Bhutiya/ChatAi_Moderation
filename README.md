#  ChatAI: Distributed AI Moderation Communication Protocol

> **Status:** `STABLE` | **Architecture:** `DISTRIBUTED MESA` | **Moderation:** `TRUE-BATCH AI`

Welcome to **ChatAI**, a high-performance, real-time communication platform built for a generation that demands both speed and safety. This isn't just a chat app; it's a living ecosystem governed by a **Distributed AI Moderation Engine**.

---

##  System Architecture (The "Nerdy" Stuff)

The system is split into two specialized micro-clusters:

1.  **The Nexus (Main API)**: A NestJS-powered hub handling real-time WebSockets, JWT Authentication, and  Postgres persistence.
2.  **The Arbiter (Moderation Worker)**: A standalone TypeScript process that consumes messages from a Redis pipeline and analyzes them using **Groq-LP (Llama 3)**.

### The Data Flow
`User` --[Socket.io]--> `NEXUS` --[Redis Pub/Sub]--> `ARBITER` --[Groq API]--> `NEXUS` --[Socket.io]--> `Everyone`

---

##  Core Security Protocols

### 1. The Blacklist (Redis-Backed)
When a user terminates their session, their JWT is instantly broadcasted to a **Redis Blacklist**. Our `JwtAuthGuard` performs O(1) lookups on every single request. If you're on the list, you're out.

### 2. Adaptive Rate Limiting
Built-in Protection against DDoS and Spam.
- **Spam Detection**: 5 messages / 10 seconds.
- **Auto-Mute**: Exceed the limit and the system triggers an automatic **60-second cooldown** (stored in Postgres `timestamptz` to prevent timezone drift).

---

## The Reputation Economy

We believe in **Automated Governance**. Every user has a `ReputationScore` [0-100].

| Tier | Status | AI Sampling Rate | Perks |
| :--- | :--- | :--- | :--- |
| ⭐ **Trusted** | `Score >= 80` | **25%** | Ultra-low latency, rare checks. |
| ⚖️ **Neutral** | `Score 40-79` | **50%** | Standard balance. |
| ⚠️ **Suspect** | `Score < 40` | **100%** | Every byte is watched by AI. |

- **Reward**: 10 clean messages = `+1 Rep`.
- **Penalty**: Minor toxic = `-5 Rep`, Major threat = `-15 to -30 Rep`.

---

##  The Stack

- **Runtime**: Node.js (v20+)
- **Frame**: NestJS (Monolith-First)
- **Real-time**: Socket.io (Engine.IO v4)
- **Database**: PostgreSQL (Persistence) + Redis (Memory/Messaging)
- **AI Brain**: Groq (Llama 8B/70B)
- **UI**: Vanilla JS (The "Purist" way)

---

## 🛠️ Deployment / Development

### Initial Handshake (Setup)
```bash
# 1. Start the Memory Grid (Redis)
docker-compose up -d redis

# 2. Fire up the Core API
cd chat-ai
npm run start:dev

# 3. Awaken the Arbiter (The Worker)
cd apps/moderation-worker
npm start
```

### Headless Acces
Don't want to use the UI? Use the diagnostic script to connect directly via terminal:
```bash
node test-socket.js
```

---

##  Standard Operating Procedures (Best Practices)
- **Graceful Degradation**: If the AI (Groq) fails, the system automatically falls back to a **RegEx-based Safety Net**.
- **True Batching**: We don't call the AI for every message. We buffer messages and send them in bursts every 5 seconds to minimize API costs and maximize throughput.

---

> Built by a Nerd for Nerds.

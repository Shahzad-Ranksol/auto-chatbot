# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start server (port 3000 by default)
node server/index.js

# Manual API testing
curl -X POST http://localhost:3000/chatbot/create \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "businessInfo": "We sell shoes"}'

curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"chatbotId": "<id>", "message": "What do you sell?"}'
```

## Architecture

Three-layer design:

1. **Express backend** (`server/`) — REST API serving both the API endpoints and the widget script as a static file
2. **JSON file database** (`server/db.json`) — Stores chatbot configs keyed by ID; no ORM, raw JSON read/write
3. **Vanilla JS widget** (`widget/chatbot.js`) — Served at `/chatbot.js`; reads its own `data-id` attribute from the injecting `<script>` tag to know which chatbot config to load

The widget is stateless — it fetches config and sends messages to the backend on every load. No localStorage or session persistence.

## API Contracts

**POST /chatbot/create** — `{ name, businessInfo }` → `{ id, script }` where `script` is the ready-to-embed `<script>` tag

**GET /chatbot/:id** → `{ id, name, businessInfo, createdAt }`

**POST /chat** — `{ chatbotId, message }` → `{ reply, chatbotId, timestamp }`

## AI Integration

By default `server/routes/chat.js` returns a mock/echo response. To enable OpenAI:

1. Set `OPENAI_API_KEY` in `.env`
2. In `chat.js`, replace the mock response with `generateAIResponse(message, businessInfo)` from `../openai.js`

The prompt template in `openai.js` should ground the model in `businessInfo` and reply as a customer service agent for that business.

## Environment Variables

```
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=sk-...   # optional
```

## Current Limitations (MVP)

- No auth — any caller can create or access any chatbot
- `db.json` is not safe for concurrent writes or production scale
- No chat history stored
- CORS is set to wildcard for broad widget compatibility

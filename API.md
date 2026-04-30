# API Reference

Base URL: `http://localhost:3000` (or your deployed domain)

All protected endpoints require:
```
Authorization: Bearer <token>
```

---

## Rate Limits

| Endpoint group | Limit |
|----------------|-------|
| `/auth/*` | 20 requests / 15 minutes |
| `/chat` | 30 requests / minute |
| `/api/*` | 60 requests / minute |

---

## Auth

### POST /auth/register

Create a new user account.

**Request**
```json
{ "name": "Jane Smith", "email": "jane@example.com", "password": "secret123" }
```

**Response `201`**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Jane Smith", "email": "jane@example.com" } }
```

**Errors:** `400` validation failed · `409` email already registered

---

### POST /auth/login

**Request**
```json
{ "email": "jane@example.com", "password": "secret123" }
```

**Response `200`**
```json
{ "token": "<jwt>", "user": { "id": 1, "name": "Jane Smith", "email": "jane@example.com", "is_admin": 0 } }
```

**Errors:** `400` missing fields · `401` invalid credentials

---

## Chatbots

All endpoints require authentication.

### GET /api/chatbots

List the authenticated user's chatbots.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "name": "Support Bot",
    "website_url": "https://example.com",
    "icon": "🤖",
    "created_at": "2026-01-01T00:00:00.000Z",
    "message_count": 42
  }
]
```

---

### POST /api/chatbots

Create a chatbot. Send as `multipart/form-data`.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Chatbot display name |
| `websiteUrl` | string | No | Reference URL |
| `knowledgeBase` | string | No | Plain text knowledge base |
| `file` | file | No | PDF, CSV, or TXT (max 10 MB) |
| `iconFile` | file | No | PNG, JPG, GIF, WEBP (max 10 MB) |
| `icon` | string | No | Emoji icon (ignored if `iconFile` provided) |

**Response `201`**
```json
{
  "id": "uuid",
  "name": "Support Bot",
  "icon": "🤖",
  "script": "<script>(function(){...})();</script>"
}
```

---

### GET /api/chatbots/:id

Get a single chatbot including its knowledge base.

**Response `200`** — full chatbot object including `knowledge_base` field.

---

### PUT /api/chatbots/:id

Update a chatbot. Same fields as POST. Uploading a new file appends its content to the existing knowledge base.

**Response `200`**
```json
{ "success": true }
```

---

### DELETE /api/chatbots/:id

Delete a chatbot and all its messages.

**Response `200`**
```json
{ "success": true }
```

---

### GET /api/chatbots/:id/messages

Get the last 100 messages for a chatbot.

**Response `200`**
```json
[
  {
    "id": 1,
    "user_message": "What are your hours?",
    "bot_reply": "We are open Monday–Friday 9am–5pm.",
    "created_at": "2026-01-01T12:00:00.000Z"
  }
]
```

---

### DELETE /api/chatbots/:id/messages

Clear all messages for a chatbot.

**Response `200`**
```json
{ "success": true }
```

---

### GET /api/chatbots/:id/script

Download a self-contained HTML file with the embed script. Returns as a file attachment.

---

## Chat

### POST /chat

Send a message to a chatbot. No authentication required (used by the widget).

**Request**
```json
{ "chatbotId": "uuid", "message": "What are your business hours?" }
```

**Response `200`**
```json
{ "reply": "We are open Monday–Friday 9am–5pm.", "chatbotId": "uuid", "timestamp": "2026-01-01T12:00:00.000Z" }
```

**Errors:** `404` chatbot not found · `429` rate limit exceeded

---

## Public

### GET /chatbot/:id

Get public chatbot info (used by the embedded widget). No authentication required.

**Response `200`**
```json
{ "id": "uuid", "name": "Support Bot", "icon": "🤖" }
```

---

## Settings

All endpoints require authentication.

### GET /api/settings

Get the current user's profile.

**Response `200`**
```json
{
  "id": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "ai_provider": "openai",
  "ai_key_preview": "••••••••sk3X",
  "has_ai_key": true,
  "created_at": "2026-01-01T00:00:00.000Z"
}
```

---

### PUT /api/settings/profile

Update display name.

**Request**
```json
{ "name": "Jane Smith" }
```

**Response `200`**
```json
{ "success": true }
```

---

### PUT /api/settings/email

Change email address.

**Request**
```json
{ "email": "new@example.com", "currentPassword": "secret123" }
```

---

### PUT /api/settings/password

Change password.

**Request**
```json
{ "currentPassword": "secret123", "newPassword": "newsecret456" }
```

---

### PUT /api/settings/ai

Configure AI provider.

**Request**
```json
{ "provider": "openai", "key": "sk-..." }
```

`provider` must be one of: `"none"` · `"openai"` · `"gemini"`

---

## Admin

All endpoints require authentication and `is_admin = 1`.

### GET /api/admin/users

List all users.

**Response `200`**
```json
[
  {
    "id": 1,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "ai_provider": "openai",
    "is_admin": 1,
    "has_ai_key": true,
    "chatbot_count": 3,
    "message_count": 127,
    "created_at": "2026-01-01T00:00:00.000Z"
  }
]
```

---

### POST /api/admin/users

Create a new user account.

**Request**
```json
{ "name": "New User", "email": "user@example.com", "password": "password123" }
```

---

### DELETE /api/admin/users/:id

Delete a user and all their data.

**Errors:** `400` cannot delete yourself · `400` cannot delete another admin · `404` not found

---

## Utility

### GET /health

**Response `200`**
```json
{ "status": "ok", "version": "2.0.0" }
```

---

### GET /api/config

Returns the server's configured public base URL.

**Response `200`**
```json
{ "baseUrl": "https://yourdomain.com/chatbot-pro" }
```

---

## Install

### GET /install

Returns the admin setup form HTML if not yet installed. Returns "Already installed" page if `installed.lock` exists or users table has rows.

---

### POST /install

Create the first admin account.

**Request**
```json
{ "name": "Admin", "email": "admin@example.com", "password": "secret123" }
```

**Response `200`**
```json
{ "success": true, "message": "Admin account created. Redirecting to login…", "loginUrl": "/login.html" }
```

**Errors:** `400` already installed · `400` validation failed · `409` email exists

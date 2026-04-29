# Installation Guide

## Requirements

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Node.js | 18.x | 20.x recommended |
| npm | 9.x | Bundled with Node.js |
| Disk space | 50 MB | Plus space for uploaded files |

**No database setup required.** AutoChatbot uses SQLite — the database file is created automatically at `data/autochatbot.db` when the server starts. To back up your data, copy that file.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the server listens on |
| `NODE_ENV` | No | `development` | Set to `production` for live deployments |
| `BASE_URL` | No | Auto-detected | Full public URL e.g. `https://yourdomain.com`. Required if behind a reverse proxy with a sub-path |
| `JWT_SECRET` | **Yes** | _(none)_ | Random string for JWT signing. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OPENAI_API_KEY` | No | _(none)_ | Server-wide OpenAI fallback key |
| `GOOGLE_API_KEY` | No | _(none)_ | Server-wide Google Gemini fallback key |

---

## Manual Installation

### Linux / macOS

```bash
# 1. Clone or extract the project files
git clone https://github.com/your-username/autochatbot.git
cd autochatbot

# 2. Install Node.js dependencies
npm install

# 3. Create and configure environment file
cp .env.example .env
nano .env   # Set JWT_SECRET (required) and any optional keys

# 4. Start the server
npm start

# 5. Open the installer
open http://localhost:3000/install
```

### Windows

```powershell
# 1. Extract files, open PowerShell in the project folder

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env
notepad .env   # Set JWT_SECRET

# 4. Start the server
npm start
```

Open `http://localhost:3000/install` in your browser.

---

## cPanel Shared Hosting

1. **Upload files** to your hosting account (e.g. `~/auto-chatbot/`)
2. **Create `.env`** in the project root:
   ```
   JWT_SECRET=your-random-string-here
   BASE_URL=https://yourdomain.com/auto-chatbot
   ```
3. **Set up Node.js App** in cPanel:
   - Application root: `auto-chatbot`
   - Application startup file: `server/index.js`
   - Node.js version: 18+
4. **Install dependencies** via cPanel terminal: `npm install`
5. **Start the app** and visit `https://yourdomain.com/auto-chatbot/install`

> **Note:** The app automatically strips the `/auto-chatbot` path prefix added by cPanel's reverse proxy, so all routes work correctly.

---

## Docker

### Prerequisites
- Docker Engine 20.10+
- Docker Compose v2

### Setup

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — set JWT_SECRET

# 2. Build and start
docker compose up --build -d

# 3. Open the installer
open http://localhost:3000/install
```

The SQLite database is stored in a named Docker volume (`data`) and persists across container restarts.

### Stop / Restart

```bash
docker compose down        # Stop (data preserved)
docker compose down -v     # Stop and delete all data
docker compose restart app # Restart app only
```

---

## First-Run Setup

After starting the server, visit `/install` in your browser:

1. Fill in your **name**, **email address**, and **password**
2. Click **Create Admin Account**
3. You'll be redirected to the login page automatically
4. Log in and start creating chatbots

> The `/install` route is permanently disabled after the first admin account is created (a `installed.lock` file is written to the project root). To re-run setup, delete that file.

---

## Upgrading

```bash
git pull origin main
npm install
npm start   # Schema changes apply automatically on startup
```

The database schema uses `CREATE TABLE IF NOT EXISTS`, so re-running on an existing database is always safe.

---

## Uninstalling

```bash
# Remove the database and project files
rm -rf /path/to/autochatbot
```

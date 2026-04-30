# Installation Guide

## Requirements

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| Node.js | 18.x | 20.x recommended |
| MySQL | 8.0 | MariaDB 10.6+ also works |
| npm | 9.x | Bundled with Node.js |
| Disk space | 50 MB | Plus space for uploaded files |

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | Port the server listens on |
| `NODE_ENV` | No | `development` | Set to `production` for live deployments |
| `BASE_URL` | No | Auto-detected | Full public URL e.g. `https://yourdomain.com`. Required if behind a reverse proxy with a sub-path |
| `DB_HOST` | Yes | `localhost` | MySQL host |
| `DB_USER` | Yes | `root` | MySQL username |
| `DB_PASSWORD` | Yes | _(empty)_ | MySQL password |
| `DB_NAME` | Yes | `chatbot_pro` | MySQL database name |
| `JWT_SECRET` | Yes | _(none)_ | Random string for JWT signing. Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `OPENAI_API_KEY` | No | _(none)_ | Server-wide OpenAI fallback key |
| `GOOGLE_API_KEY` | No | _(none)_ | Server-wide Google Gemini fallback key |

---

## Manual Installation

### Linux / macOS

```bash
# 1. Clone or extract the project files
git clone https://github.com/your-username/chatbot_pro.git
cd chatbot_pro

# 2. Install Node.js dependencies
npm install

# 3. Create and configure environment file
cp .env.example .env
nano .env   # or use any text editor

# 4. Create the MySQL database and user
mysql -u root -p
```

```sql
CREATE DATABASE chatbot_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot'@'localhost' IDENTIFIED BY 'your-password';
GRANT ALL PRIVILEGES ON chatbot_pro.* TO 'chatbot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# 5. Start the server
npm start

# 6. Open the installer
open http://localhost:3000/install
```

### Windows

```powershell
# 1. Extract files, open PowerShell in the project folder

# 2. Install dependencies
npm install

# 3. Configure environment
Copy-Item .env.example .env
notepad .env

# 4. Create MySQL database (using MySQL Workbench or command line)
mysql -u root -p -e "CREATE DATABASE chatbot_pro CHARACTER SET utf8mb4;"

# 5. Start the server
npm start
```

Open `http://localhost:3000/install` in your browser.

---

## cPanel Shared Hosting

1. **Upload files** to your hosting account (e.g. `~/chatbot-pro/`)
2. **Create MySQL database** via cPanel → MySQL Databases
3. **Create `.env`** in the project root with correct DB credentials and:
   ```
   BASE_URL=https://yourdomain.com/chatbot-pro
   ```
4. **Set up Node.js App** in cPanel:
   - Application root: `chatbot-pro`
   - Application startup file: `server/index.js`
   - Node.js version: 18+
5. **Install dependencies** via cPanel terminal: `npm install`
6. **Start the app** and visit `https://yourdomain.com/chatbot-pro/install`

> **Note:** The app automatically strips the `/chatbot-pro` path prefix added by cPanel's reverse proxy, so all routes work correctly.

---

## Docker

### Prerequisites
- Docker Engine 20.10+
- Docker Compose v2

### Setup

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, JWT_SECRET

# 2. Build and start
docker compose up --build -d

# 3. Open the installer
open http://localhost:3000/install
```

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

> The `/install` route is permanently disabled after the first admin account is created (a `installed.lock` file is written to the project root). To re-run setup, delete that file and clear the `users` table.

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
# Drop the database
mysql -u root -p -e "DROP DATABASE chatbot_pro;"

# Remove project files
rm -rf /path/to/chatbot_pro
```

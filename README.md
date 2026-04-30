# 🤖 ChatBot Pro

**ChatBot Pro** is a self-hosted, multi-tenant chatbot SaaS platform. Create AI-powered chatbots trained on your own content and embed them on any website with a single `<script>` tag.

![Node.js](https://img.shields.io/badge/Node.js-≥18-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-Extended-orange)

---

## Features

- **Multi-tenant** — each user manages their own chatbots independently
- **AI-powered** — supports OpenAI GPT-4o-mini, Google Gemini 2.0 Flash, or built-in keyword matching (no API key required)
- **Knowledge base** — upload PDF, CSV, or TXT files to train your chatbot on custom content
- **Embeddable widget** — paste one `<script>` tag into any website or CMS
- **Custom branding** — set chatbot name, emoji or image icon
- **Admin panel** — manage all users and accounts from a central dashboard
- **Rate limiting & security** — Helmet, CORS, JWT auth, bcrypt passwords
- **Docker ready** — one-command setup with Docker Compose

---

## Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | ≥ 18 |
| MySQL | 8.0 |
| npm | ≥ 9 |
| Disk space | ~50 MB |

---

## Quick Start (Manual)

```bash
# 1. Clone the repository
git clone https://github.com/your-username/chatbot_pro.git
cd chatbot_pro

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env — set DB credentials and JWT_SECRET at minimum

# 4. Start the server
npm start

# 5. Open the installer in your browser
open http://localhost:3000/install
```

---

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — set DB_USER, DB_PASSWORD, JWT_SECRET

docker compose up --build
```

Then open `http://localhost:3000/install` to create your admin account.

---

## Documentation

| Document | Description |
|----------|-------------|
| [INSTALLATION.md](INSTALLATION.md) | Detailed setup for all platforms |
| [USAGE.md](USAGE.md) | Dashboard walkthrough and feature guide |
| [API.md](API.md) | REST API reference with examples |
| [FAQ.md](FAQ.md) | Common issues and troubleshooting |
| [CHANGELOG.md](CHANGELOG.md) | Version history |

---

## Support

For support, open an issue on CodeCanyon or contact the author via the item page.

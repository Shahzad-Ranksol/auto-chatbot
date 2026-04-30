# Changelog

All notable changes to ChatBot Pro are documented here.

## [2.0.0] — 2026-04-28

### Added
- Multi-tenant SaaS architecture with JWT authentication (7-day tokens)
- Admin panel for managing all user accounts
- OpenAI GPT-4o-mini integration (per-user or server-wide API key)
- Google Gemini 2.0 Flash integration (per-user API key)
- Built-in echo bot — keyword-matching fallback requiring no API key
- Knowledge base support: upload PDF, CSV, or TXT files (up to 10 MB)
- Custom chatbot icon: emoji presets + image upload (PNG, JPG, GIF, WEBP)
- Embeddable JavaScript widget with floating chat button (bundling-proof inline loader)
- Rate limiting: auth (20/15min), chat (30/min), API (60/min)
- Auto-installer at `/install` — creates first admin account, writes lock file
- Automatic database schema initialization on server startup
- Docker Compose setup with MySQL 8 healthcheck and named volumes
- File-based server logging with timestamps (`server.log`)
- cPanel reverse proxy support (automatic `/chatbot-pro` prefix stripping)
- `Cross-Origin-Resource-Policy: cross-origin` header for widget embedding on external sites

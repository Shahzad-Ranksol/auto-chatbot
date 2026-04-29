# Changelog

All notable changes to AutoChatbot are documented here.

## [2.1.0] — 2026-04-29

### Changed
- **Replaced MySQL with SQLite** — no database server, phpMyAdmin, or DB credentials required
- Database file auto-created at `data/autochatbot.db` on first startup
- Removed `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` from `.env.example`
- Simplified Docker Compose: single container, no MySQL service or healthcheck
- Simplified installer: `createTables()` is now synchronous, no connection pool needed
- Updated `INSTALLATION.md`: removed all MySQL/phpMyAdmin setup steps

### Removed
- `mysql2` dependency (replaced by `better-sqlite3`)

---

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
- cPanel reverse proxy support (automatic `/auto-chatbot` prefix stripping)
- `Cross-Origin-Resource-Policy: cross-origin` header for widget embedding on external sites

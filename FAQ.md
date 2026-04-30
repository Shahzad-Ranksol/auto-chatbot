# Frequently Asked Questions

## Installation

**Q: I see a blank page or CSS is missing after install.**

Set `BASE_URL` in your `.env` to match your public domain exactly — including any sub-path. For example:
```
BASE_URL=https://yourdomain.com/chatbot-pro
```
Make sure there is no trailing slash. Restart the server after changing `.env`.

---

**Q: Login fails with "Invalid email or password".**

1. Confirm the database is running and the credentials in `.env` are correct
2. Verify your admin account was created: `mysql -u root -p chatbot_pro -e "SELECT email, is_admin FROM users;"`
3. If the table is empty, delete `installed.lock` and visit `/install` again

---

**Q: I forgot the admin password. How do I reset it?**

Run this in MySQL (replace values as needed):
```sql
UPDATE users
SET password_hash = '$2a$10$REPLACE_WITH_BCRYPT_HASH'
WHERE email = 'admin@example.com';
```

To generate a bcrypt hash for a new password:
```bash
node -e "require('bcryptjs').hash('newpassword', 10, (e,h) => console.log(h))"
```

---

**Q: The install page says "Already installed" but I haven't set it up yet.**

Delete the lock file at the project root:
```bash
rm installed.lock
```
Then visit `/install` again.

---

## Widget & Embedding

**Q: The chat widget is not appearing on my website.**

1. Confirm the script tag is correctly placed before `</body>`
2. Open browser DevTools → Console and look for errors
3. Make sure the script `src` URL points to your correct domain (not `localhost`)
4. If using WordPress, paste the snippet in a plugin set to **HTML Snippet** mode (not "JavaScript") in the **footer**

---

**Q: I get `ERR_BLOCKED_BY_RESPONSE.NotSameOrigin` in the browser console.**

Your server's Helmet configuration is blocking cross-origin loading. Ensure `server/index.js` includes:
```js
app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
```
Restart the server after the change.

---

**Q: The widget shows "Connection error. Please try again."**

The widget cannot reach your server. Check:
1. Your server is running and accessible from the internet
2. `BASE_URL` is set correctly in `.env`
3. No firewall is blocking port 3000 (or your configured PORT)

---

## AI Configuration

**Q: The chatbot just echoes back keywords instead of giving real answers.**

No AI provider is configured. Go to **Settings → AI Configuration**, select OpenAI or Gemini, and enter a valid API key.

---

**Q: I saved my OpenAI key but the bot still uses echo mode.**

1. Verify the key starts with `sk-` and has active billing on your OpenAI account
2. Check `server.log` for any AI-related error messages
3. Try removing and re-entering the key in Settings

---

**Q: How do I use Gemini instead of OpenAI?**

In **Settings → AI Configuration**, select **Google Gemini** and enter your Google AI Studio API key (starts with `AIza`). Get a free key at [aistudio.google.com](https://aistudio.google.com).

---

## Docker

**Q: The app container exits immediately when using Docker Compose.**

The database healthcheck takes 30 seconds on first run. Check logs:
```bash
docker compose logs app
docker compose logs db
```
If the db is not ready, wait and run `docker compose up` again. If the error persists, check your `DB_PASSWORD` in `.env`.

---

## cPanel / Shared Hosting

**Q: I get a 404 on all routes on cPanel.**

1. Confirm `BASE_URL=https://yourdomain.com/chatbot-pro` is set in `.env` (no trailing slash)
2. Verify the Node.js app startup file is `server/index.js`
3. Ensure the app is started (green status in cPanel Node.js manager)
4. The app automatically handles the `/chatbot-pro` prefix — do not configure URL rewriting for this path

---

**Q: File uploads fail on cPanel.**

Check that the `uploads/` and `public/uploads/icons/` directories exist and are writable:
```bash
mkdir -p ~/chatbot-pro/uploads
mkdir -p ~/chatbot-pro/public/uploads/icons
chmod 755 ~/chatbot-pro/uploads ~/chatbot-pro/public/uploads/icons
```

---

## Data & Maintenance

**Q: How do I back up my data?**

```bash
mysqldump -u root -p chatbot_pro > chatbot_pro_backup_$(date +%Y%m%d).sql
```

To restore:
```bash
mysql -u root -p chatbot_pro < chatbot_pro_backup_20260101.sql
```

**Uploaded icon files** are stored in `public/uploads/icons/` — back up this folder separately.

---

**Q: How do I update to a new version?**

```bash
git pull origin main
npm install
npm start   # Schema updates apply automatically
```

No manual database migrations needed — the schema uses `CREATE TABLE IF NOT EXISTS` so existing data is always preserved.

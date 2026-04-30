# Database Setup Guide

ChatBot Pro requires one empty MySQL database. The tables are created **automatically** by the installer — you never need to run SQL manually.

---

## cPanel Shared Hosting (Most Common)

1. Log into **cPanel**
2. Go to **MySQL Databases**
3. Under **Create New Database** — enter a name (e.g. `chatbot_pro`) → click **Create Database**
4. Under **MySQL Users** → **Add New User** — enter a username and strong password → click **Create User**
5. Under **Add User to Database** — select the user and database you just created → click **Add**
6. On the privileges screen → check **ALL PRIVILEGES** → click **Make Changes**
7. Note the full database name and username — on cPanel they are prefixed with your account name:
   - Database: `youraccount_chatbot_pro`
   - Username: `youraccount_dbuser`
8. Add these to your `.env` file:
   ```
   DB_HOST=localhost
   DB_USER=youraccount_dbuser
   DB_PASSWORD=your-password
   DB_NAME=youraccount_chatbot_pro
   ```

---

## VPS / Linux Server

```bash
# Log into MySQL as root
mysql -u root -p

# Run these commands:
CREATE DATABASE chatbot_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'chatbot'@'localhost' IDENTIFIED BY 'your-strong-password';
GRANT ALL PRIVILEGES ON chatbot_pro.* TO 'chatbot'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Add to `.env`:
```
DB_HOST=localhost
DB_USER=chatbot
DB_PASSWORD=your-strong-password
DB_NAME=chatbot_pro
```

---

## Windows (Local Development)

1. Open **MySQL Workbench** or **HeidiSQL**
2. Connect to your local MySQL server
3. Run:
   ```sql
   CREATE DATABASE chatbot_pro CHARACTER SET utf8mb4;
   ```
4. Add to `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-mysql-root-password
   DB_NAME=chatbot_pro
   ```

---

## Docker

No setup needed — Docker Compose creates the MySQL database automatically.

```bash
cp .env.example .env
# Edit .env — set JWT_SECRET only
docker compose up --build
```

---

## After Database Setup

Once your `.env` has the correct DB credentials:

1. Start the server (`npm start` or via cPanel Node.js App)
2. Visit `http://yoursite.com/install`
3. Fill in your name, email, and password
4. The installer creates all tables automatically and logs you in

> **Tip:** If you see a "Database Connection Error" on the install page, double-check your `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` values in `.env`.

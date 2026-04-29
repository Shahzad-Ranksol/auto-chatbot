# Usage Guide

## Logging In

Navigate to `/login.html` (or `/auto-chatbot/login.html` on cPanel deployments). Enter the email and password you created during setup.

---

## Dashboard Overview

After logging in you land on the **Dashboard**, which shows:

- **Your chatbots** — listed as cards with name, icon, message count, and action buttons
- **New Chatbot** button — top right, opens the creation form
- **Settings** link — top navigation, takes you to profile and AI configuration
- **Logout** — clears your session and returns to the login page

---

## Creating a Chatbot

1. Click **New Chatbot** in the top-right corner
2. Fill in the form:
   - **Name** _(required)_ — displayed in the chat widget header
   - **Website URL** _(optional)_ — used for reference only
   - **Icon** — choose from emoji presets or upload a custom image (PNG, JPG, GIF, WEBP, max 10 MB)
   - **Knowledge Base** — paste text, or upload a PDF, CSV, or TXT file. This is what the chatbot uses to answer questions.
3. Click **Create Chatbot**
4. The embed script is shown immediately after creation

---

## Editing a Chatbot

Click the **Edit** (pencil) icon on any chatbot card. You can update the name, URL, icon, and knowledge base. Uploading a new file appends its content to the existing knowledge base.

---

## Deleting a Chatbot

Click the **Delete** (trash) icon on the chatbot card and confirm. This permanently deletes the chatbot and all its conversation history.

---

## Embedding the Widget

1. Click the **Code** (`</>`) icon on the chatbot card to open the embed dialog
2. Copy the `<script>` snippet
3. Paste it into the `<body>` of your website's HTML — ideally just before `</body>`

**WordPress:** Use a header/footer plugin (e.g. WPCode Lite) set to **HTML Snippet** mode and paste into the **Footer** section.

**HTML site:** Paste directly into your page template.

The widget loads a floating chat button in the bottom-right corner of the page. It works on any website regardless of framework.

---

## Testing the Widget

Click the **Test** (beaker) icon on the chatbot card. This opens a live preview page where you can interact with the widget before embedding it on your site.

---

## Chat History

Click the **History** (clock) icon on the chatbot card to view the last 100 conversations. You can also **Clear History** from this view, which deletes all stored messages for that chatbot.

---

## AI Configuration

Go to **Settings → AI Configuration** to set your AI provider:

| Provider | Model | What you need |
|----------|-------|---------------|
| **None (Echo Bot)** | Built-in keyword matcher | Nothing — works out of the box |
| **OpenAI** | GPT-4o-mini | An OpenAI API key (`sk-...`) |
| **Google Gemini** | Gemini 2.0 Flash | A Google AI Studio API key (`AIza...`) |

- Your API key is stored securely and only the last 4 characters are shown after saving
- If no key is configured, the chatbot uses the built-in echo bot, which searches your knowledge base for relevant answers
- The server admin can also configure a server-wide fallback key via `OPENAI_API_KEY` or `GOOGLE_API_KEY` in `.env`

---

## Profile Settings

Go to **Settings → Profile** to:

- Update your **display name**
- Change your **email address** (requires current password)
- Change your **password** (requires current password)

---

## Admin Panel

Available only to admin users. Go to **Settings → Admin Panel** to:

- **View all users** — see name, email, AI provider, chatbot count, and message count
- **Create a user** — add new accounts manually
- **Delete a user** — removes the user and all their chatbots and messages (irreversible)

> Admins cannot delete their own account or other admin accounts from this panel.

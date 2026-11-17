# Asad Tech Assistant

General AI assistant chat site — "Kuch bhi poocho". Standalone site, separate from the Asad Tools store.

## Stack

- React + Vite, plain CSS (no UI libraries)
- Vercel serverless function `api/chat.js` → Google Gemini (`gemini-3-flash-preview`)

## Run locally

```bash
npm install
npm run dev
```

## Deploy (Vercel)

1. Push this folder to a GitHub repo and import it in Vercel (framework: Vite).
2. In Vercel → Project Settings → Environment Variables, add:
   - `GEMINI_API_KEY` = your Google AI Studio API key (Production)
3. Deploy. No key is stored in the code — the API returns `assistant_not_configured` (503) if the variable is missing.

## Notes

- No login in v1 — open chat.
- Caps: last 10 messages, 500 chars per message, 4000 total chars; temperature 0.7, maxOutputTokens 500.
- The assistant answers in the user's own language (Roman Urdu or English).
- Made by Asad Tech.

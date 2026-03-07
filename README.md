# Loan Tracker (Supabase + Vercel)

This app is now connected to Supabase (Auth + Postgres) instead of localStorage.

## 1) Supabase setup

1. Create a new Supabase project.
2. In Supabase dashboard, open SQL Editor.
3. Run the SQL from `supabase-schema.sql`.
4. In Authentication settings, disable email confirmation if you want instant login after signup (optional).

## 2) App config

1. Open `supabase-config.js`.
2. Set:
   - `window.SUPABASE_URL`
   - `window.SUPABASE_ANON_KEY`

You can copy values from Supabase Project Settings -> API.

## 3) Run locally

Because this is a static app, run any static server from project root:

- Python: `python3 -m http.server 8080`
- Then open `http://localhost:8080`

## 4) Deploy on Vercel

1. Push this project to GitHub.
2. Import repo into Vercel.
3. Framework preset: `Other`.
4. Add environment variable `GEMINI_API_KEY` in Vercel Project Settings -> Environment Variables.
5. Deploy (no build command needed).

Important: keep `supabase-config.js` with your actual keys in deployment.

## 6) AI Copilot (Gemini)

- The dashboard Copilot now calls `/api/copilot` (Vercel serverless function).
- The serverless function uses Google Gemini via `GEMINI_API_KEY`.
- If Gemini is unavailable, the app falls back to offline rule-based suggestions.

## 5) Deploy alternatives

- Netlify: drag/drop or connect GitHub (static site).
- Cloudflare Pages: connect GitHub and deploy as static.

## Notes

- Supabase anon key is safe for client-side use with proper RLS policies.
- Each user can only access their own loans due to row-level security.
- If you already created the table earlier, rerun `supabase-schema.sql` to add newer columns (`currency_code`, `annual_rate`, `processing_fee`, `deduction_day`, `late_fee_per_day`, `grace_days`).

# Car Pasand Kar Diya 🚗

A conversational car advisor that helps Indian buyers narrow down their next car. You fill in a quick preferences form (budget, fuel type, body style), chat with an AI advisor, and get a shortlist of 3 cars with reasoning — all in one session.

Built as an MVP in ~2.5 hours to test one hypothesis: can Gemini reliably act as a car-buying copilot if you give it a structured catalogue and user preferences?

## What it does

1. **Preferences form** — budget (lakhs), fuel type, transmission, seating, body type.
2. **AI chat** — sends preferences + full car catalogue to Gemini 2.5 Pro, which returns exactly 3 car picks as structured JSON.
3. **Shortlist view** — displays the 3 recommended cars with specs, pros/cons, and the AI's reasoning.

Session state is persisted in Postgres so the flow survives page refreshes.

## What I intentionally cut

No auth, no user reviews, no image uploads, no side-by-side comparison table, no real-time pricing, no favorites/save. Every one of these is a good idea; none of them were needed to validate the core loop.

## Tech stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React + Vite + Tailwind | Fast to scaffold, hot reload, utility CSS |
| Backend | FastAPI (Python) | Async-ready, auto docs, quick to wire |
| Database | PostgreSQL on Railway | One-click Postgres, free tier, no ops |
| AI | Google Gemini 2.5 Pro | Free tier, `response_mime_type="application/json"` for structured output |
| Hosting | Vercel (frontend), Railway (backend + DB) | Zero-config deploys from Git |

## What AI built vs. what I built manually

**Delegated to AI prompts:** `models.py`, `seed.py` (30+ cars with realistic specs), all CRUD endpoints, and the entire React frontend.

**Manual work:**
- Fixing CORS middleware config (AI kept setting `allow_origins` wrong for Vercel)
- Writing a robust JSON parser for Gemini responses (it wraps JSON in markdown fences despite `response_mime_type`)
- Wiring `session_id` through the full create → chat → shortlist flow
- Writing test assertions in `test_main.py`

## Where AI helped most / got in the way

**Helped most:** Boilerplate elimination was massive — going from zero to a seeded database with 30+ realistic Indian-market cars in minutes instead of hours. Scaffolding React components from a description saved at least an hour.

**Got in the way:** Gemini kept wrapping JSON in ` ```json ` blocks even with `application/json` mime type set. Frontend state wiring across the three-step flow (form → chat → shortlist) needed several manual passes to get right.

## Next 4 hours

- [ ] Add car images (static URLs or generated)
- [ ] Save shortlist to a user account
- [ ] Compare 2 cars side by side
- [ ] Pull real pricing data from CarDekho API
- [ ] Add dealer contact CTA on shortlist cards

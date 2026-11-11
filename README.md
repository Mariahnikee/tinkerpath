# TinkerPath

Website and learning platform for a paid tech, coding and AI education business for ages 7–16.
"TinkerPath" is a working name. A web search found no kids' tech product using it, but check
domain availability (.com, .ng, .africa) and the CAC business name register before committing.

## Run it

Needs Node.js 22.13 or newer. No install step is required for the site itself.

```bash
npm start
```

Open http://localhost:3000. Everything runs in **demo mode** with no keys: payments are simulated
and clearly labelled, emails go to http://localhost:3000/dev/outbox, and the AI Lab uses
pre-written practice replies.

## What's in it

| Area | Where |
|---|---|
| Marketing pages (home, programmes, pricing, AI & safety, about, contact, policies) | `src/pages.js`, `public/css/styles.css` |
| Parent onboarding (child → recommendation & plan → account → verify → pay) | `/start`, `public/js/start.js` |
| Parent dashboard (progress, learning, AI Lab log, PIN, enrolment, support) | `/parent`, `public/js/parent.js` |
| Student dashboard and lesson player | `/learn`, `/learn/lesson/:id`, `public/js/learn.js`, `lesson.js`, `activities.js` |
| Free sample lesson (no login) | `/try` |
| Curriculum: 3 age paths, 18 sample lessons | `src/content.js` |

Lesson activity types: reading, quiz, sorting, ordering, grid coding puzzle (with loops),
train-a-model, prompt-writing missions, spot-the-AI-mistake, live HTML/CSS editor, mini project.

## Status

Frontend scope for now. The server code that exists (`server.js`, `src/`) serves the pages and
demo data and was exercised only through the UI flows below. It is not production-reviewed.

Checked in the browser (desktop and 375px mobile): homepage and public pages, full onboarding
including email confirmation via the dev outbox, demo checkout, parent dashboard, setting a
student PIN, student login, lesson completion with badges, grid puzzle, prompt mission (including
a blocked personal-detail prompt), train-a-model, spot-the-mistake, and the code editor.

Not done or not verified:
- **Payments:** Paystack is wired but untested; needs `PAYSTACK_SECRET_KEY` (test key first) and a webhook URL pointing to `/api/paystack/webhook`.
- **Email:** needs `RESEND_API_KEY` and a verified sending domain.
- **Live AI:** needs `ANTHROPIC_API_KEY` and `npm install @anthropic-ai/sdk`; untested. Off by default; ages 10+ and parent opt-in only.
- No automated tests yet.
- Policy pages are drafts: have them reviewed against the Nigeria Data Protection Act 2023 before taking customers.
- Replace illustrations with real (consented) photos of sessions when you have them.

See `docs/RESEARCH.md` for the market research and the reasoning behind prices and age bands.

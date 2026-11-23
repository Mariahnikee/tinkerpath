# TinkerPath — Developer Brief

**Understand it. Use it. Create with it.**

## What is TinkerPath?

A technology education platform for children aged 7–16. Kids learn computer fundamentals, coding, AI, creative technology and digital safety through short, interactive lessons. A supervised AI helper supports their learning, and parents see their progress in a dashboard.

- **Live prototype:** https://tinkerpath.onrender.com
- **Repo:** https://github.com/Mariahnikee/tinkerpath

## What we're building in two weeks (HNG MVP)

A working end-to-end product:

1. **Parent sign-up** and child profiles (nickname and age group only)
2. **Student login** with a learner name and PIN (no child email)
3. **Learning paths** for three age groups: 7–9, 10–12 and 13–16
4. **Lessons** in Computer Fundamentals, Coding and AI, with quizzes and interactive activities
5. **AI learning companion:** answers questions about the current lesson, inside strict safety limits
6. **Progress tracking:** lessons completed, scores, badges
7. **Parent dashboard:** progress plus a log of every AI conversation

**Out of scope:** payments, live classes, mobile apps.

## What already exists

The prototype already works end to end. It has a marketing site, onboarding, student and parent dashboards, a lesson player with 10 activity types, 27 sample lessons, a guided lesson helper, and AI safety filters. We'll reuse its **lesson content, activity designs and visual style** as the starting point.

Prototype stack: Node.js (no frameworks), SQLite, plain HTML/CSS/JS.

## Proposed MVP stack

| Layer | Choice |
|---|---|
| Frontend | React / Next.js |
| Backend | Node.js (Express or NestJS) or Python (FastAPI or Django), REST API |
| Database | PostgreSQL |
| AI | Hosted LLM API, called **only** from the backend |
| Hosting | Render, Railway or Vercel |

Final choices will be agreed with the team on day 1.

## Where you fit

**Frontend**
- Student dashboard, lesson player and interactive activities (quizzes, sorting, coding puzzles, a live HTML editor)
- Parent dashboard and onboarding flow
- Mobile-friendly and accessible UI

**Backend**
- Auth for parents (email and password) and students (learner name and PIN)
- Data model for users, children, lessons and progress, plus the API for them
- Rate limiting, logging and deployment

**AI/ML**
- The AI companion: prompts, lesson context, fallback mode when AI is off
- Safety layer: personal-information and topic filters on input and output, daily limits
- Testing the filters with unsafe prompts

## Non-negotiables (child safety)

- **No identifying child data:** no surname, birth date, school, photo or email.
- **AI keys stay on the server.** Children never get direct access to a general-purpose chatbot.
- **Every AI message is filtered and logged** where the parent can see it.
- **Live AI is for ages 10+ only,** and only when a parent turns it on.
- **Keep it simple:** no unnecessary dependencies; ship working features over clever ones.

## Timeline

- **Week 1:** setup, auth and profiles, learning paths, lesson player, lesson content
- **Week 2:** AI companion and safety layer, parent dashboard, testing, deploy, demo

## Run the prototype locally

Requires Node.js 22.13 or later. No install step.

```bash
git clone https://github.com/Mariahnikee/tinkerpath.git
cd tinkerpath
npm start
```

Open http://localhost:3000. Everything runs in demo mode: no real payments, and emails appear at `/dev/outbox`.

## Want to join?

Send a short message with your role (frontend, backend or AI/ML), your experience, and a GitHub profile or portfolio to **[add contact email or HNG channel]**.

For the full product picture, see `TINKERPATH_PRODUCT_BRIEF.md` in the repo.

# TinkerPath — HNG Presentation Notes

Internal working notes to accompany `TINKERPATH_PRODUCT_BRIEF.md`: website audit, changes made, the two-week roadmap, and a presentation outline.

---

## 1. Website audit (November 2026)

### What works well
- **Clear first impression.** The homepage explains the product within seconds: headline, two calls to action (enrol, free lesson), and a product preview.
- **Real, working journeys.** Parent onboarding, student login, lessons, badges and the parent dashboard all function in the prototype.
- **Distinctive interactive lessons.** Ten activity types, including a grid coding puzzle, training a mini AI model, and spotting AI mistakes.
- **Safety is visible.** A dedicated AI and safety page, minimal child data, and a parent-visible AI log.
- **Honest presentation.** No fake testimonials or numbers; demo features are labelled as demos.
- **Consistent visual identity** and responsive layout on desktop and phone.

### Gaps against the product vision
| Gap | Impact | Addressed |
|---|---|---|
| Homepage read mainly as "coding and AI classes" | Undersold computer literacy, creative technology and safety | **Yes**: messaging and learning areas updated |
| Learning areas on the site didn't match the five official areas | Inconsistent story between website and pitch | **Yes**: five areas plus critical thinking |
| Student and parent experiences only implied | Visitors had to infer what each user gets | **Yes**: new "For learners / For parents" section |
| Programmes page didn't show which learning area each module covers | Harder to see the breadth of the curriculum | **Yes**: learning-area tags on modules |
| Computer Fundamentals has very little content (1–2 lessons) | Weakest area against the vision | No: MVP content work |
| No AI learning companion inside lessons (only the prompt-practice AI Lab) | Key vision feature missing | No: MVP feature |
| Hosted site has demo mode switched off | New parents can't confirm their email or enrol on the live site | **Needs one step in Render** (see below) |
| Contact form emails go to a placeholder address and aren't delivered | Collaborator messages would be lost | No: set a real support email before sharing widely |
| Policy pages are drafts | Not ready for real customers | No: legal review |
| No automated tests | Risk of regressions as the team grows | No: MVP week 2 |

### Fix before the presentation: turn on demo mode on Render
In the Render dashboard, open the **tinkerpath** service → **Environment** → **Add environment variable**: key `DEMO_MODE`, value `true` → **Save changes** (Render redeploys automatically). Alternatively, open the Blueprint and click **Manual sync**. After that, new sign-ups can confirm their email via `/dev/outbox` and use the demo checkout.

---

## 2. Targeted website improvements made

Messaging only. No redesign, no features removed.

1. **Homepage hero:** repositioned from "online tech and AI classes" to technology education across computers, coding, AI, creative technology and digital safety. Added the tagline "Understand it. Use it. Create with it."
2. **"What they learn":** the six cards now match the five learning areas (Computer Fundamentals, Coding & Programming, Artificial Intelligence, Creative Technology, Digital Safety) plus critical thinking.
3. **New "For learners / For parents" section** on the homepage, stating what each user gets.
4. **Programmes page:** learning-area tags on each module, and an intro listing the five areas.
5. **Page description and footer** updated to the broader positioning.

---

## 3. Two-week MVP roadmap

Ten working days. Assumes a small team with frontend, backend, AI, design and content contributors working in parallel.

### Week 1: foundations and core learning

| Day | Product and design | Frontend | Backend | AI | Content |
|---|---|---|---|---|---|
| 1 | Confirm scope, user stories, success criteria | Project setup, design tokens from prototype | Repo, database schema, API outline | Choose AI provider, define safety rules | Agree lesson format and template |
| 2 | Wireframes for key screens | Layout, navigation, auth screens | Parent auth, child profiles, student PIN login | Draft companion instructions and filter lists | Map existing 18 lessons to areas; list gaps |
| 3 | Review onboarding flow | Onboarding and recommendation | Learning paths and lessons API | Build safety layer (filters, limits, logging) | Write Computer Fundamentals lessons |
| 4 | Usability check with 2–3 people | Lesson player and quiz | Progress tracking API | Connect AI service behind the safety layer | Write Coding lessons |
| 5 | Mid-point review and demo | Activities (reuse prototype designs) | Seed content and demo accounts | Test filters with safe and unsafe prompts | Write AI lessons |

### Week 2: companion, parents and polish

| Day | Product and design | Frontend | Backend | AI | Content |
|---|---|---|---|---|---|
| 6 | Parent dashboard review | Student dashboard (next lesson, badges) | Parent dashboard API | Companion inside lessons (hints, explanations) | Review lessons by age group |
| 7 | Copy and accessibility review | Parent dashboard | AI log and parent controls API | Fallback guided mode when AI is off | Write quizzes and projects |
| 8 | Safety review | Companion chat interface | Error handling, rate limits | Red-team testing of safety layer | Final content edits |
| 9 | Full journey testing | Fixes; mobile and accessibility | Deployment, environment setup | Tune instructions from test results | Load content into production |
| 10 | Demo script and rehearsal | Final polish | Monitoring, demo data | Safety summary for the demo | Lesson walkthrough for presenters |

**Definition of done:** a parent can sign up and create a child profile; the child completes lessons in three areas with quizzes and activities; the AI companion answers lesson questions and blocks personal information; the parent sees progress and the AI log.

**Main risks:** content takes longer than code (start it on day 1); AI safety needs testing time (build the safety layer before the chat interface); scope creep (payments and live sessions stay out).

---

## 4. Presentation outline (10–12 minutes)

1. **Hook (1 min).** "Our children use technology every day. How many of them understand it?" Children are surrounded by apps and AI, but few learn how it works or how to create with it.
2. **The problem (1.5 min).** Passive consumption; AI before AI literacy; general chatbots not built for kids; fragmented options; parents can't see progress.
3. **The solution (1.5 min).** TinkerPath: one platform combining computer literacy, coding, AI, creative technology and digital safety. Tagline: *Understand it. Use it. Create with it.*
4. **Live demo (4 min).** Show the prototype:
   - Homepage and the five learning areas.
   - Free sample lesson at `/try` (no login needed).
   - A Makers lesson: train the AI sorter and show how it gets the tricky shapes wrong.
   - AI Lab: a vague prompt vs a strong prompt; then a prompt with a name in it, blocked by the safety filter.
   - Parent dashboard: progress and the AI activity log.
5. **Child safety (1 min).** Minimal data, parent consent, age-based AI access, filters both ways, full parent visibility, and our honest position that safeguards reduce risk but can't remove it.
6. **What's built vs what's next (1 min).** Working prototype today; two-week MVP adds the AI learning companion, a fuller curriculum and reliable progress tracking.
7. **Two-week plan (1 min).** Week 1: foundations and lessons. Week 2: companion, parent dashboard, polish.
8. **Call to collaborate (1 min).** Roles we need: frontend, backend, AI/ML, UI/UX, educators, child-safety specialists, product, QA. How to get involved.

**Demo tips**
- Open the site 5 minutes before presenting: Render's free plan sleeps and the first load takes 30–60 seconds.
- Prepare a demo parent and student account in advance (after turning on demo mode). Note that demo data resets when the server restarts.
- Have screenshots ready as a backup in case of connection problems.

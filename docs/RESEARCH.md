# Research notes and product decisions

Researched November 2026. **Verified** means a source said it; **Assumption** means my judgement, to test with parents.

## Reference site
- **Verified:** stem-a-girl.shecodeafrica.org renders client-side; its readable content is the headline "Equipping Girls to Shape Tomorrow's STEM Innovations" and a line about hands-on learning and club activities. It is a free, girls-focused community programme.
- **Decision:** borrow the hands-on, club-style framing; differ by being paid, inclusive of all genders, age-banded, and parent-facing (dashboard, transparent pricing).

## Competitor pricing (Nigeria), from provider websites, some pages dated
- earlySTEMer: self-paced from ₦25,000/month; group ₦45,000 and 1:1 ₦75,000 per 10-class session. ([earlystemer.com](https://earlystemer.com/))
- Kidz Tech: 1:1 ₦50,000–₦100,000/month; group from ₦40,000/term. ([kidztech.edubeta.net.ng](https://kidztech.edubeta.net.ng/online-coding-classes-for-kids-in-nigeria/))
- 9jacodekids: private plans about ₦84,500–₦101,400/month. ([9jacodekids.com](https://www.9jacodekids.com/online-coding-classes-for-kids-in-nigeria/))
- Parachictacademy: ₦35,000–₦100,000/month; 10% sibling discount. ([parachictacademy.com.ng](https://parachictacademy.com.ng/online-coding-classes-for-children/))
- Tynker (international, self-paced): family plans covering up to three children, sold quarterly, yearly or lifetime; figures differ between sources. ([tynker.com/pricing](https://www.tynker.com/pricing))

## Starting prices (hypotheses, not market facts)
| Plan | Price | Why |
|---|---|---|
| Self-paced | ₦15,000/month | Below earlySTEMer's ₦25k self-paced, to lower the first yes |
| Guided (recommended) | ₦30,000/month | Adds a weekly live group session; below typical 1:1 prices |
| Guided term | ₦80,000 / 12 weeks | About 11% saving and less churn |
| Siblings | 10% off | A common local practice (Parachictacademy does it) |

Validate with your first parents: ask what they pay now and offer two price points.

## Payments
- **Verified:** Paystack local fee is 1.5% + ₦100, capped at ₦2,000, with the ₦100 waived under ₦2,500. ([paystack.com/pricing](https://paystack.com/pricing))
- **Verified:** subscriptions work by passing a plan code to transaction initialize ([Paystack docs](https://paystack.com/docs/payments/subscriptions/)). Webhooks are signed with HMAC-SHA512 of the raw body (third-party guides; confirm in Paystack's docs).

## Age bands
- **Verified (secondary source):** Scratch is commonly listed for ages 8–16 and ScratchJr for 5–7.
- **Verified:** Common Sense Media recommends no AI chatbots for ages 5 and under and adult supervision for ages 6–12. ([commonsensemedia.org](https://www.commonsensemedia.org/press-releases/googles-gemini-platforms-for-kids-and-teens-pose-risks-despite-added-filters-common-sense-media-reports))
- **Decision:** Explorers 7–9 (no live AI), Makers 10–12, Creators 13–16. Starting at 7 rather than 5 because lessons need some independent reading.

## Child safety and data
- **Verified:** Nigeria Data Protection Act 2023, s.31: a child is under 18, and processing their data needs parent or guardian consent, with age and consent verification. Commentaries disagree on s.31(5) about ages 13+. ([Aluko & Oyebode](https://aluko-oyebode.com/insights/child-data-protection-in-nigeria/))
- **Verified:** UNICEF's guidance on AI and children covers safety by design, data protection, transparency and child participation. ([unicef.org](https://www.unicef.org/innocenti/reports/policy-guidance-ai-children))
- **Decision:** parent-created accounts with a consent checkbox, child nickname and age band only, generated learner names with a parent-set PIN, live AI off by default, and every AI message visible to the parent.

## What parents look for
- **Verified (thin evidence):** privacy of children's data is a key concern ([Google survey, 2021](https://www.money9.com/news/technology/online-classes-google-survey-highlights-concerns-of-parents-6861.html)). A sponsored survey found parents want recorded classes and live help from instructors.
- **Assumption:** visible progress, clear prices and honest outcomes build trust. That's why the site has no testimonials, student numbers or badges we don't have yet. Add real testimonials once you have them, with permission.

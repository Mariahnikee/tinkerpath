'use strict';
const fs = require('node:fs');
const path = require('node:path');

// Minimal .env loader (no dependency). Existing environment variables win.
function loadEnv(file = path.join(__dirname, '..', '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let val = m[2];
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = val;
  }
}
loadEnv();

const env = process.env;
const isProd = env.NODE_ENV === 'production';

const config = {
  brand: 'TinkerPath',
  port: Number(env.PORT || 3000),
  appUrl: (env.APP_URL || env.RENDER_EXTERNAL_URL || `http://localhost:${env.PORT || 3000}`).replace(/\/$/, ''),
  isProd,
  dbPath: env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'tinkerpath.db'),
  supportEmail: env.SUPPORT_EMAIL || 'hello@example.com',
  emailFrom: env.EMAIL_FROM || 'TinkerPath <hello@example.com>',
  resendKey: env.RESEND_API_KEY || '',
  paystackSecret: env.PAYSTACK_SECRET_KEY || '',
  paystackPlans: { selfpaced: env.PAYSTACK_PLAN_SELFPACED || '', guided: env.PAYSTACK_PLAN_GUIDED || '' },
  anthropicKey: env.ANTHROPIC_API_KEY || '',
  aiModel: env.AI_MODEL || 'claude-opus-5-5',
  aiDailyLimit: Number(env.AI_DAILY_LIMIT || 20),
  siblingDiscount: 0.1,
};

config.paymentsLive = Boolean(config.paystackSecret);
// Demo mode: on by default outside production, or forced on with DEMO_MODE=true (e.g. a hosted demo).
config.demoMode = env.DEMO_MODE === 'true' || (!isProd && env.DEMO_MODE !== 'false');
config.demoPayments = !config.paymentsLive && config.demoMode;
// The test inbox at /dev/outbox is only available in demo mode when no email provider is set.
config.devOutbox = config.demoMode && !config.resendKey;

// Starting prices are HYPOTHESES to validate with parents (see docs/RESEARCH.md), not market facts.
const PLANS = {
  selfpaced: {
    id: 'selfpaced',
    name: 'Self-paced',
    priceNGN: 15000,
    interval: 'month',
    days: 30,
    blurb: 'All lessons for your child’s age group, at their own pace.',
    features: ['Full learning path for one age group', 'Quizzes, activities and projects', 'AI Lab practice activities', 'Parent dashboard and weekly email updates'],
  },
  guided: {
    id: 'guided',
    name: 'Guided',
    priceNGN: 30000,
    interval: 'month',
    days: 30,
    recommended: true,
    blurb: 'Self-paced lessons plus a weekly live small-group session with a tutor.',
    features: ['Everything in Self-paced', 'Weekly 60-minute live group session (max 8 learners)', 'Written tutor feedback on projects', 'Supervised live AI Lab (ages 10+, parent opt-in)'],
  },
  term: {
    id: 'term',
    name: 'Guided term',
    priceNGN: 80000,
    interval: 'once',
    days: 84,
    blurb: 'Twelve weeks of the Guided plan, paid once.',
    features: ['Everything in Guided, for 12 weeks', 'Pay once, no renewal to manage', 'End-of-term project showcase', 'Certificate of completion'],
  },
};

const AGE_BANDS = {
  explorers: { id: 'explorers', name: 'Explorers', ages: '7–9', color: 'sun' },
  makers: { id: 'makers', name: 'Makers', ages: '10–12', color: 'lagoon' },
  creators: { id: 'creators', name: 'Creators', ages: '13–16', color: 'violet' },
};

function priceFor(planId, { siblingIndex = 0 } = {}) {
  const plan = PLANS[planId];
  if (!plan) return null;
  const discount = siblingIndex > 0 ? config.siblingDiscount : 0;
  return Math.round(plan.priceNGN * (1 - discount));
}

module.exports = { config, PLANS, AGE_BANDS, priceFor };

'use strict';
const crypto = require('node:crypto');
const { q } = require('./db');
const { config, PLANS, priceFor } = require('./config');
const { sendEmail, templates } = require('./email');
const { TRACKS } = require('./content');

const naira = (kobo) => `₦${(kobo / 100).toLocaleString('en-NG')}`;
const dateLabel = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/** Rule-based recommendation. Transparent on purpose so parents can see why. */
function recommend({ age_band, experience, goals = [], interests = [] }) {
  const track = TRACKS[age_band] ? age_band : 'makers';
  const reasons = [`${TRACKS[track].name} (${TRACKS[track].ages}) matches your child’s age group.`];
  let plan = 'guided';
  if (experience === 'confident' && !goals.includes('confidence')) {
    plan = 'selfpaced';
    reasons.push('Your child already has some confidence with tech, so Self-paced may be enough. You can switch to Guided any time.');
  } else {
    reasons.push('Guided adds a weekly live session with a tutor, which helps most beginners stay motivated.');
  }
  if (interests.includes('ai')) reasons.push('Their interest in AI is covered by the supervised AI Lab module.');
  if (interests.includes('games')) reasons.push(track === 'creators' ? 'Games: Creators build interactive web pages, a step towards web games.' : 'Games: the path includes puzzles and game design.');
  return { track, plan, reasons };
}

function siblingIndex(parentId, childId) {
  const kids = q.all('SELECT id FROM children WHERE parent_id = ? ORDER BY id', parentId);
  return Math.max(0, kids.findIndex((k) => k.id === childId));
}

function newReference() { return `TP-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`.toUpperCase(); }

function createPendingEnrolment(parentId, childId, planId) {
  const amountNGN = priceFor(planId, { siblingIndex: siblingIndex(parentId, childId) });
  const reference = newReference();
  const info = q.run('INSERT INTO enrolments (parent_id, child_id, plan_id, status, amount_kobo, reference, provider) VALUES (?,?,?,?,?,?,?)',
    parentId, childId, planId, 'pending', amountNGN * 100, reference, config.paymentsLive ? 'paystack' : 'demo');
  q.run('INSERT INTO payments (enrolment_id, reference, provider, amount_kobo, status) VALUES (?,?,?,?,?)',
    info.lastInsertRowid, reference, config.paymentsLive ? 'paystack' : 'demo', amountNGN * 100, 'initialized');
  return q.get('SELECT * FROM enrolments WHERE id = ?', info.lastInsertRowid);
}

/** Marks an enrolment paid (or demo) and extends access. Idempotent per payment reference. */
async function activate(enrolmentId, { reference, status = 'active', provider }) {
  const e = q.get('SELECT * FROM enrolments WHERE id = ?', enrolmentId);
  if (!e) return null;
  const pay = q.get('SELECT * FROM payments WHERE reference = ?', reference);
  if (pay && pay.verified_at) return e; // already processed
  const plan = PLANS[e.plan_id];
  const base = e.period_end && e.period_end > new Date().toISOString() ? new Date(e.period_end) : new Date();
  const periodEnd = new Date(base.getTime() + plan.days * 864e5).toISOString();
  q.tx(() => {
    if (pay) q.run("UPDATE payments SET status = 'success', verified_at = datetime('now') WHERE reference = ?", reference);
    else q.run("INSERT INTO payments (enrolment_id, reference, provider, amount_kobo, status, verified_at) VALUES (?,?,?,?, 'success', datetime('now'))", e.id, reference, provider || e.provider, e.amount_kobo);
    q.run("UPDATE enrolments SET status = ?, paid_at = datetime('now'), period_end = ?, reminder_sent_at = NULL WHERE id = ?", status, periodEnd, e.id);
  });
  const parent = q.get('SELECT * FROM parents WHERE id = ?', e.parent_id);
  const child = q.get('SELECT * FROM children WHERE id = ?', e.child_id);
  if (status === 'active') {
    const [s, b] = templates.enrolled(parent.name, child.nickname, plan.name, naira(e.amount_kobo), dateLabel(periodEnd), `${config.appUrl}/learn/login`);
    await sendEmail(parent.email, s, b);
  }
  return q.get('SELECT * FROM enrolments WHERE id = ?', e.id);
}

function activeEnrolment(childId) {
  return q.get("SELECT * FROM enrolments WHERE child_id = ? AND status IN ('active','demo','cancelled') AND period_end > ? ORDER BY period_end DESC LIMIT 1", childId, new Date().toISOString()) || null;
}

module.exports = { recommend, createPendingEnrolment, activate, activeEnrolment, naira, dateLabel, newReference };

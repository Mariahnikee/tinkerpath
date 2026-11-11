'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { config, PLANS, AGE_BANDS } = require('./src/config');
const { q, getDb } = require('./src/db');
const auth = require('./src/auth');
const { sendEmail, templates } = require('./src/email');
const paystack = require('./src/paystack');
const ai = require('./src/ai');
const { TRACKS, LESSON_MAP, BADGES, trackLessons, nextLesson } = require('./src/content');
const enrol = require('./src/enrolment');
const pages = require('./src/pages');
const { runJobs } = require('./src/jobs');

const PUBLIC = path.join(__dirname, 'public');
const MIME = { '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webp': 'image/webp', '.json': 'application/json' };

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src 'self'; connect-src 'self'; form-action 'self' https://checkout.paystack.com; base-uri 'self'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
const json = (res, status, data, headers) => send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
const html = (res, status, body, headers) => send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
const redirect = (res, location, headers = {}) => send(res, 303, '', { Location: location, ...headers });

function readBody(req, limit = 100_000) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new HttpError(413, 'Request too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function jsonBody(req) {
  const raw = await readBody(req);
  if (!raw.length) return {};
  try { return JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid JSON'); }
}

// CSRF defence: SameSite=Lax cookies + JSON-only API + same-origin check on writes.
function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

const str = (v, max = 200) => String(v ?? '').trim().slice(0, max);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INTERESTS = ['games', 'websites', 'ai', 'art', 'stories', 'science', 'music', 'robotics'];
const GOALS = ['curiosity', 'school', 'confidence', 'career', 'build'];

function requireParent(req) { const p = auth.currentUser(req, 'parent'); if (!p) throw new HttpError(401, 'Please log in.'); return p; }
function requireStudent(req) { const s = auth.currentUser(req, 'student'); if (!s) throw new HttpError(401, 'Please log in.'); return s; }
function ownChild(parent, id) { const c = q.get('SELECT * FROM children WHERE id = ? AND parent_id = ?', Number(id), parent.id); if (!c) throw new HttpError(404, 'Child not found.'); return c; }

function validateChild(c = {}) {
  const nickname = str(c.nickname, 30).replace(/[<>]/g, '');
  if (!nickname) throw new HttpError(400, 'Please add a first name or nickname for your child.');
  if (!AGE_BANDS[c.age_band]) throw new HttpError(400, 'Please choose an age group.');
  return {
    nickname, age_band: c.age_band,
    interests: JSON.stringify((Array.isArray(c.interests) ? c.interests : []).filter((i) => INTERESTS.includes(i))),
    experience: ['none', 'some', 'confident'].includes(c.experience) ? c.experience : 'none',
    goals: JSON.stringify((Array.isArray(c.goals) ? c.goals : []).filter((g) => GOALS.includes(g))),
  };
}

function insertChild(parentId, c, plan = 'guided') {
  const info = q.run('INSERT INTO children (parent_id, nickname, age_band, interests, experience, goals, login_name, preferred_plan) VALUES (?,?,?,?,?,?,?,?)',
    parentId, c.nickname, c.age_band, c.interests, c.experience, c.goals, auth.newLoginName(), PLANS[plan] ? plan : 'guided');
  return Number(info.lastInsertRowid);
}

async function sendVerification(parent) {
  const token = auth.createEmailToken(parent.id, 'verify', 48);
  const [s, b] = templates.verify(parent.name, `${config.appUrl}/verify?token=${token}`);
  return sendEmail(parent.email, s, b);
}

function childSummary(c) {
  const done = q.all('SELECT lesson_id, score, completed_at FROM progress WHERE child_id = ? ORDER BY completed_at', c.id);
  const lessons = trackLessons(c.age_band);
  const doneSet = new Set(done.map((d) => d.lesson_id));
  const next = nextLesson(c.age_band, doneSet);
  const e = enrol.activeEnrolment(c.id);
  const latest = q.get('SELECT * FROM enrolments WHERE child_id = ? ORDER BY id DESC LIMIT 1', c.id);
  return {
    id: c.id, nickname: c.nickname, age_band: c.age_band, track: TRACKS[c.age_band].name, ages: TRACKS[c.age_band].ages,
    login_name: c.login_name, preferred_plan: c.preferred_plan, has_pin: Boolean(c.pin_hash), ai_live_enabled: Boolean(c.ai_live_enabled),
    ai_status: ai.aiStatus(c), last_active_at: c.last_active_at,
    interests: JSON.parse(c.interests), experience: c.experience, goals: JSON.parse(c.goals),
    lessons_total: lessons.length, lessons_done: lessons.filter((l) => doneSet.has(l.id)).length,
    next_lesson: next && { id: next.id, title: next.title },
    access: e ? { status: e.status, plan: PLANS[e.plan_id].name, plan_id: e.plan_id, period_end: e.period_end, enrolment_id: e.id, subscription: Boolean(e.subscription_code) } : null,
    latest_enrolment: latest && { id: latest.id, status: latest.status, plan_id: latest.plan_id, plan: PLANS[latest.plan_id].name, amount: enrol.naira(latest.amount_kobo), period_end: latest.period_end },
  };
}

function studentState(child) {
  const doneRows = q.all('SELECT lesson_id, score FROM progress WHERE child_id = ?', child.id);
  const done = new Set(doneRows.map((r) => r.lesson_id));
  const access = enrol.activeEnrolment(child.id);
  const track = TRACKS[child.age_band];
  const next = nextLesson(child.age_band, done);
  return {
    child: { nickname: child.nickname, age_band: child.age_band, login_name: child.login_name },
    access: Boolean(access), demo: access?.status === 'demo',
    track: { id: track.id, name: track.name, ages: track.ages, tagline: track.tagline },
    modules: track.modules.map((m) => ({ id: m.id, title: m.title, why: m.why, lessons: m.lessons.map((id) => {
      const l = LESSON_MAP[id]; return { id, title: l.title, summary: l.summary, minutes: l.minutes, done: done.has(id), next: next?.id === id };
    }) })),
    next: next && { id: next.id, title: next.title, summary: next.summary, minutes: next.minutes },
    done: done.size, total: trackLessons(child.age_band).length,
    badges: q.all('SELECT badge_id, earned_at FROM badges WHERE child_id = ? ORDER BY earned_at', child.id).map((b) => ({ ...BADGES[b.badge_id], earned_at: b.earned_at })).filter((b) => b.id),
    projects: q.all('SELECT lesson_id, content, created_at FROM projects WHERE child_id = ? ORDER BY id DESC LIMIT 10', child.id).map((p) => ({ ...p, lesson: LESSON_MAP[p.lesson_id]?.title })),
    ai: ai.aiStatus(child),
  };
}

function awardBadges(child, lesson, { score, max, strongPrompt, perfectSpot }) {
  const earned = [];
  const give = (id) => { if (BADGES[id] && q.run('INSERT OR IGNORE INTO badges (child_id, badge_id) VALUES (?,?)', child.id, id).changes) earned.push(BADGES[id]); };
  if (q.get('SELECT COUNT(*) AS n FROM progress WHERE child_id = ?', child.id).n === 1) give('first-steps');
  if (lesson.badge === 'safety-star' || lesson.badge === 'builder') give(lesson.badge);
  if (lesson.badge === 'prompt-pro' && strongPrompt) give('prompt-pro');
  if (lesson.badge === 'fact-checker' && perfectSpot) give('fact-checker');
  const mod = TRACKS[lesson.track].modules.find((m) => m.id === lesson.module);
  const done = new Set(q.all('SELECT lesson_id FROM progress WHERE child_id = ?', child.id).map((r) => r.lesson_id));
  if (mod.lessons.every((id) => done.has(id))) give(`module-${mod.id}`);
  return earned;
}

async function startCheckout(parent, child, planId) {
  if (!PLANS[planId]) throw new HttpError(400, 'Please choose a plan.');
  const p = q.get('SELECT * FROM parents WHERE id = ?', parent.id);
  if (!p.email_verified_at) throw new HttpError(403, 'Please confirm your email address first. Check your inbox for our link.');
  if (!config.paymentsLive && !config.demoPayments) throw new HttpError(503, 'Payments are not set up yet. Please contact us.');
  const e = enrol.createPendingEnrolment(parent.id, child.id, planId);
  if (!config.paymentsLive) return { url: `/checkout/demo?reference=${encodeURIComponent(e.reference)}`, demo: true };
  const plan = PLANS[planId].interval === 'month' ? config.paystackPlans[planId] : '';
  try {
    const data = await paystack.initializeTransaction({
      email: p.email, amountKobo: e.amount_kobo, reference: e.reference, plan: plan || undefined,
      callbackUrl: `${config.appUrl}/payment/callback`, metadata: { enrolment_id: e.id, child_id: child.id, plan_id: planId },
    });
    return { url: data.authorization_url, demo: false };
  } catch (err) {
    q.run("UPDATE payments SET status = 'init-failed' WHERE reference = ?", e.reference);
    console.error('[paystack] initialize failed:', err.message);
    throw new HttpError(502, 'We couldn’t reach the payment provider. Please try again in a minute.');
  }
}

/** Verifies a Paystack payment with the API and activates the matching enrolment. */
async function verifyAndActivate(reference) {
  const e = q.get('SELECT * FROM enrolments WHERE reference = ?', reference);
  if (!e) return { ok: false, reason: 'unknown-reference' };
  const data = await paystack.verifyTransaction(reference);
  if (data.status !== 'success') return { ok: false, reason: data.status };
  if (Number(data.amount) < e.amount_kobo || data.currency !== 'NGN') return { ok: false, reason: 'amount-mismatch' };
  await enrol.activate(e.id, { reference, provider: 'paystack' });
  return { ok: true };
}

async function handleWebhook(req, res) {
  const raw = await readBody(req, 1_000_000);
  if (!paystack.isValidSignature(raw, req.headers['x-paystack-signature'])) return json(res, 401, { error: 'bad signature' });
  let evt; try { evt = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { error: 'bad json' }); }
  const d = evt.data || {};
  q.run('INSERT INTO webhook_events (event, reference) VALUES (?,?)', String(evt.event), d.reference || d.subscription_code || null);
  try {
    if (evt.event === 'charge.success' && d.reference) {
      const known = q.get('SELECT id FROM enrolments WHERE reference = ?', d.reference);
      if (known) await verifyAndActivate(d.reference);
      else if (d.plan?.plan_code && d.customer?.email) {
        // Subscription renewal: Paystack creates a new reference. Verify, then extend the matching enrolment.
        const v = await paystack.verifyTransaction(d.reference);
        const planId = Object.keys(config.paystackPlans).find((k) => config.paystackPlans[k] === d.plan.plan_code);
        const e = planId && q.get(`SELECT e.* FROM enrolments e JOIN parents p ON p.id = e.parent_id WHERE lower(p.email) = lower(?) AND e.plan_id = ? AND e.status IN ('active','expired') ORDER BY e.id DESC LIMIT 1`, d.customer.email, planId);
        if (v.status === 'success' && e) await enrol.activate(e.id, { reference: d.reference, provider: 'paystack' });
      }
    } else if (evt.event === 'subscription.create' && d.subscription_code && d.customer?.email) {
      const planId = Object.keys(config.paystackPlans).find((k) => config.paystackPlans[k] === d.plan?.plan_code);
      if (planId) q.run(`UPDATE enrolments SET subscription_code = ? WHERE id = (SELECT e.id FROM enrolments e JOIN parents p ON p.id = e.parent_id WHERE lower(p.email) = lower(?) AND e.plan_id = ? AND e.subscription_code IS NULL ORDER BY e.id DESC LIMIT 1)`, d.subscription_code, d.customer.email, planId);
    } else if (evt.event === 'subscription.disable' || evt.event === 'subscription.not_renew') {
      q.run("UPDATE enrolments SET status = 'cancelled' WHERE subscription_code = ? AND status = 'active'", d.subscription_code);
    }
  } catch (err) {
    console.error('[webhook] processing error:', err.message);
    return json(res, 500, { error: 'retry' }); // Paystack retries non-200 responses
  }
  return json(res, 200, { received: true });
}

// ----------------------------------------------------------------------------------------------
const routes = [];
const route = (method, pattern, handler) => routes.push({ method, re: new RegExp(`^${pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`), handler });

// Pages
for (const [p, fn] of Object.entries({ '/': 'home', '/programmes': 'programmes', '/safety': 'safety', '/pricing': 'pricing', '/about': 'about', '/contact': 'contact', '/privacy': 'privacy', '/terms': 'terms', '/safeguarding': 'safeguarding', '/refunds': 'refunds' })) {
  route('GET', p, (req, res) => html(res, 200, pages[fn]({ parent: auth.currentUser(req, 'parent') })));
}
route('GET', '/start', (req, res) => html(res, 200, pages.start({ parent: auth.currentUser(req, 'parent') })));
route('GET', '/login', (req, res, { url }) => auth.currentUser(req, 'parent') ? redirect(res, '/parent') : html(res, 200, pages.login({ next: url.searchParams.get('next') })));
route('GET', '/forgot', (req, res) => html(res, 200, pages.forgot()));
route('GET', '/reset', (req, res, { url }) => html(res, 200, pages.reset({ token: url.searchParams.get('token') || '' })));
route('GET', '/verify', (req, res, { url }) => {
  const parentId = auth.consumeEmailToken(url.searchParams.get('token'), 'verify');
  if (!parentId) return html(res, 400, pages.message({ title: 'This link has expired', body: 'Your confirmation link is invalid or has already been used. Log in to request a new one.', cta: ['/login', 'Log in'] }));
  q.run("UPDATE parents SET email_verified_at = COALESCE(email_verified_at, datetime('now')) WHERE id = ?", parentId);
  const token = auth.createSession('parent', parentId);
  return redirect(res, '/parent?verified=1', { 'Set-Cookie': auth.sessionCookie('parent', token) });
});
route('GET', '/parent', (req, res) => auth.currentUser(req, 'parent') ? html(res, 200, pages.parentApp()) : redirect(res, '/login?next=/parent'));
route('GET', '/learn/login', (req, res) => auth.currentUser(req, 'student') ? redirect(res, '/learn') : html(res, 200, pages.studentLogin()));
route('GET', '/learn', (req, res) => auth.currentUser(req, 'student') ? html(res, 200, pages.studentApp()) : redirect(res, '/learn/login'));
route('GET', '/learn/lesson/:id', (req, res, { params }) => {
  if (!auth.currentUser(req, 'student')) return redirect(res, '/learn/login');
  if (!LESSON_MAP[params.id]) return html(res, 404, pages.notFound());
  return html(res, 200, pages.lessonApp({ lessonId: params.id }));
});
route('GET', '/try', (req, res) => html(res, 200, pages.lessonApp({ lessonId: 'e2-1', taster: true })));
route('GET', '/checkout/demo', (req, res, { url }) => {
  if (!config.demoPayments) return html(res, 404, pages.notFound());
  const parent = auth.currentUser(req, 'parent'); if (!parent) return redirect(res, '/login?next=/parent');
  const e = q.get('SELECT e.*, c.nickname FROM enrolments e JOIN children c ON c.id = e.child_id WHERE e.reference = ? AND e.parent_id = ?', url.searchParams.get('reference'), parent.id);
  if (!e) return html(res, 404, pages.notFound());
  return html(res, 200, pages.demoCheckout({ e, plan: PLANS[e.plan_id], amount: enrol.naira(e.amount_kobo) }));
});
route('GET', '/payment/callback', async (req, res, { url }) => {
  const reference = url.searchParams.get('reference') || url.searchParams.get('trxref');
  if (!reference || !config.paymentsLive) return redirect(res, '/parent?paid=error');
  try {
    const r = await verifyAndActivate(reference);
    return redirect(res, r.ok ? '/parent?paid=1' : `/parent?paid=${r.reason === 'abandoned' ? 'cancelled' : 'pending'}`);
  } catch (err) {
    console.error('[paystack] verify failed:', err.message);
    return redirect(res, '/parent?paid=pending'); // webhook will still activate it if the payment succeeded
  }
});
route('GET', '/dev/outbox', (req, res) => {
  if (config.isProd) return html(res, 404, pages.notFound());
  return html(res, 200, pages.outbox({ emails: q.all('SELECT * FROM outbox ORDER BY id DESC LIMIT 30') }));
});

// Public API
route('POST', '/api/recommend', async (req, res) => json(res, 200, enrol.recommend(await jsonBody(req))));
route('GET', '/api/plans', (req, res) => json(res, 200, { plans: Object.values(PLANS), siblingDiscount: config.siblingDiscount, demoPayments: config.demoPayments, tracks: Object.values(TRACKS).map(({ id, name, ages, tagline, summary, outcomes }) => ({ id, name, ages, tagline, summary, outcomes })) }));
route('GET', '/api/lessons/taster', (req, res) => json(res, 200, { lesson: Object.values(LESSON_MAP).find((l) => l.taster) }));
route('POST', '/api/support', async (req, res) => {
  const b = await jsonBody(req); const parent = auth.currentUser(req, 'parent');
  const email = str(parent?.email || b.email, 200); const message = str(b.message, 3000); const topic = str(b.topic, 80) || 'General question';
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (message.length < 5) throw new HttpError(400, 'Please write a short message.');
  if (!auth.rateLimit(`support:${req.socket.remoteAddress}`, 5, 36e5)) throw new HttpError(429, 'Too many messages. Please try again later.');
  q.run('INSERT INTO support_requests (parent_id, name, email, topic, message) VALUES (?,?,?,?,?)', parent?.id || null, str(parent?.name || b.name, 80), email, topic, message);
  const [s, body] = templates.supportAck(parent?.name || str(b.name, 80), topic);
  await sendEmail(email, s, body);
  await sendEmail(config.supportEmail, `[Support] ${topic}`, `From: ${email}\n\n${message}`);
  json(res, 200, { ok: true });
});

// Parent auth
route('POST', '/api/signup', async (req, res) => {
  const b = await jsonBody(req);
  const name = str(b.parent?.name, 80); const email = str(b.parent?.email, 200).toLowerCase(); const password = String(b.parent?.password || '');
  if (!name) throw new HttpError(400, 'Please enter your name.');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (password.length < 8) throw new HttpError(400, 'Use a password with at least 8 characters.');
  if (!b.parent?.consent) throw new HttpError(400, 'Please confirm you are the parent or guardian and agree to the terms.');
  if (!auth.rateLimit(`signup:${req.socket.remoteAddress}`, 10, 36e5)) throw new HttpError(429, 'Too many attempts. Please try again later.');
  const child = validateChild(b.child);
  if (q.get('SELECT 1 FROM parents WHERE email = ?', email)) throw new HttpError(409, 'An account with this email already exists. Please log in instead.');
  const planId = PLANS[b.plan] ? b.plan : 'guided';
  const parentId = q.tx(() => {
    const info = q.run("INSERT INTO parents (email, name, password_hash, consent_at) VALUES (?,?,?, datetime('now'))", email, name, auth.hashSecret(password));
    insertChild(Number(info.lastInsertRowid), child, planId);
    return Number(info.lastInsertRowid);
  });
  const mail = await sendVerification({ id: parentId, name, email });
  const token = auth.createSession('parent', parentId);
  json(res, 201, { ok: true, plan: planId, emailSent: mail.ok, devOutbox: mail.via === 'dev-outbox' && !config.isProd }, { 'Set-Cookie': auth.sessionCookie('parent', token) });
});
route('POST', '/api/login', async (req, res) => {
  const b = await jsonBody(req); const email = str(b.email, 200).toLowerCase();
  if (!auth.rateLimit(`login:${email}`, 8, 15 * 6e4)) throw new HttpError(429, 'Too many attempts. Please wait 15 minutes or reset your password.');
  const p = q.get('SELECT * FROM parents WHERE email = ?', email);
  if (!p || !auth.verifySecret(String(b.password || ''), p.password_hash)) throw new HttpError(401, 'That email and password don’t match.');
  auth.clearRateLimit(`login:${email}`);
  json(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie('parent', auth.createSession('parent', p.id)) });
});
route('POST', '/api/logout', (req, res) => { auth.destroySession(req, 'parent'); json(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie('parent', '') }); });
route('POST', '/api/forgot', async (req, res) => {
  const b = await jsonBody(req); const email = str(b.email, 200).toLowerCase();
  if (!auth.rateLimit(`forgot:${req.socket.remoteAddress}`, 5, 36e5)) throw new HttpError(429, 'Too many requests. Try again later.');
  const p = q.get('SELECT * FROM parents WHERE email = ?', email);
  if (p) { const t = auth.createEmailToken(p.id, 'reset', 1); const [s, body] = templates.reset(p.name, `${config.appUrl}/reset?token=${t}`); await sendEmail(p.email, s, body); }
  json(res, 200, { ok: true }); // same response either way, so emails can't be enumerated
});
route('POST', '/api/reset', async (req, res) => {
  const b = await jsonBody(req);
  if (String(b.password || '').length < 8) throw new HttpError(400, 'Use a password with at least 8 characters.');
  const parentId = auth.consumeEmailToken(b.token, 'reset');
  if (!parentId) throw new HttpError(400, 'This reset link is invalid or has expired.');
  q.run('UPDATE parents SET password_hash = ? WHERE id = ?', auth.hashSecret(b.password), parentId);
  q.run("DELETE FROM sessions WHERE user_type = 'parent' AND user_id = ?", parentId);
  json(res, 200, { ok: true });
});
route('POST', '/api/resend-verification', async (req, res) => {
  const p = requireParent(req);
  if (p.email_verified_at) return json(res, 200, { ok: true, already: true });
  if (!auth.rateLimit(`verify:${p.id}`, 3, 36e5)) throw new HttpError(429, 'We’ve sent a few already. Please check your spam folder or try later.');
  const mail = await sendVerification(p);
  json(res, 200, { ok: mail.ok, devOutbox: mail.via === 'dev-outbox' && !config.isProd });
});

// Parent dashboard API
route('GET', '/api/me', (req, res) => {
  const p = requireParent(req);
  const kids = q.all('SELECT * FROM children WHERE parent_id = ? ORDER BY id', p.id);
  json(res, 200, { parent: { name: p.name, email: p.email, verified: Boolean(p.email_verified_at), weekly_updates: Boolean(p.weekly_updates) }, children: kids.map(childSummary), plans: Object.values(PLANS), demoPayments: config.demoPayments, paymentsLive: config.paymentsLive, aiConfigured: Boolean(config.anthropicKey), siblingDiscount: config.siblingDiscount });
});
route('POST', '/api/settings', async (req, res) => {
  const p = requireParent(req); const b = await jsonBody(req);
  q.run('UPDATE parents SET weekly_updates = ? WHERE id = ?', b.weekly_updates ? 1 : 0, p.id);
  json(res, 200, { ok: true });
});
route('POST', '/api/children', async (req, res) => {
  const p = requireParent(req); const body = await jsonBody(req); const c = validateChild(body);
  if (q.get('SELECT COUNT(*) AS n FROM children WHERE parent_id = ?', p.id).n >= 6) throw new HttpError(400, 'Please contact us to add more than 6 children.');
  json(res, 201, { ok: true, id: insertChild(p.id, c, body.plan) });
});
route('GET', '/api/children/:id/report', (req, res, { params }) => {
  const p = requireParent(req); const c = ownChild(p, params.id);
  const s = studentState(c);
  json(res, 200, {
    ...s, summary: childSummary(c),
    completed: q.all('SELECT lesson_id, score, completed_at FROM progress WHERE child_id = ? ORDER BY completed_at DESC', c.id).map((r) => ({ ...r, title: LESSON_MAP[r.lesson_id]?.title })),
    ai_logs: q.all('SELECT mode, prompt, response, flagged, reason, created_at FROM ai_logs WHERE child_id = ? ORDER BY id DESC LIMIT 50', c.id),
    outcomes: TRACKS[c.age_band].outcomes,
  });
});
route('POST', '/api/children/:id/pin', async (req, res, { params }) => {
  const p = requireParent(req); const c = ownChild(p, params.id); const b = await jsonBody(req);
  if (!/^\d{4}$/.test(String(b.pin || ''))) throw new HttpError(400, 'The PIN must be exactly 4 digits.');
  if (/^(\d)\1{3}$|^1234$|^0000$/.test(b.pin)) throw new HttpError(400, 'Choose a PIN that is harder to guess than that.');
  q.run('UPDATE children SET pin_hash = ? WHERE id = ?', auth.hashSecret(b.pin), c.id);
  q.run("DELETE FROM sessions WHERE user_type = 'student' AND user_id = ?", c.id);
  json(res, 200, { ok: true, login_name: c.login_name });
});
route('POST', '/api/children/:id/settings', async (req, res, { params }) => {
  const p = requireParent(req); const c = ownChild(p, params.id); const b = await jsonBody(req);
  if (b.ai_live_enabled && c.age_band === 'explorers') throw new HttpError(400, 'Live AI is not available for ages 7–9. Explorers use guided AI activities only.');
  q.run('UPDATE children SET ai_live_enabled = ? WHERE id = ?', b.ai_live_enabled ? 1 : 0, c.id);
  json(res, 200, { ok: true });
});
route('DELETE', '/api/children/:id', (req, res, { params }) => {
  const p = requireParent(req); const c = ownChild(p, params.id);
  if (enrol.activeEnrolment(c.id)) throw new HttpError(400, 'This child has an active enrolment. Cancel it first, or contact us.');
  q.run('DELETE FROM children WHERE id = ?', c.id);
  json(res, 200, { ok: true });
});
route('POST', '/api/checkout', async (req, res) => {
  const p = requireParent(req); const b = await jsonBody(req); const c = ownChild(p, b.child_id);
  json(res, 200, await startCheckout(p, c, b.plan));
});
route('POST', '/api/demo/complete', async (req, res) => {
  if (!config.demoPayments) throw new HttpError(404, 'Not found');
  const p = requireParent(req); const b = await jsonBody(req);
  const e = q.get("SELECT * FROM enrolments WHERE reference = ? AND parent_id = ? AND provider = 'demo'", str(b.reference), p.id);
  if (!e) throw new HttpError(404, 'Checkout not found.');
  await enrol.activate(e.id, { reference: e.reference, status: 'demo', provider: 'demo' });
  json(res, 200, { ok: true });
});
route('POST', '/api/enrolments/:id/cancel', (req, res, { params }) => {
  const p = requireParent(req);
  const e = q.get('SELECT * FROM enrolments WHERE id = ? AND parent_id = ?', Number(params.id), p.id);
  if (!e) throw new HttpError(404, 'Enrolment not found.');
  if (e.subscription_code) throw new HttpError(400, 'This is an auto-renewing subscription. Use "Manage subscription" to cancel it with Paystack.');
  if (e.status === 'pending') q.run("UPDATE enrolments SET status = 'cancelled', period_end = datetime('now') WHERE id = ?", e.id);
  else q.run("UPDATE enrolments SET status = 'cancelled' WHERE id = ? AND status IN ('active','demo')", e.id);
  json(res, 200, { ok: true, message: 'Cancelled. Access continues until the end of the paid period and won’t renew.' });
});
route('GET', '/api/enrolments/:id/manage', async (req, res, { params }) => {
  const p = requireParent(req);
  const e = q.get('SELECT * FROM enrolments WHERE id = ? AND parent_id = ?', Number(params.id), p.id);
  if (!e?.subscription_code || !config.paymentsLive) throw new HttpError(400, 'No subscription to manage.');
  const data = await paystack.subscriptionManageLink(e.subscription_code);
  json(res, 200, { url: data.link });
});
route('POST', '/api/paystack/webhook', handleWebhook);

// Student API
route('POST', '/api/student/login', async (req, res) => {
  const b = await jsonBody(req); const login = str(b.login_name, 40).toLowerCase();
  if (!auth.rateLimit(`pin:${login}`, 5, 15 * 6e4)) throw new HttpError(429, 'Too many tries. Ask your parent to help, or wait 15 minutes.');
  const c = q.get('SELECT * FROM children WHERE login_name = ?', login);
  if (!c || !c.pin_hash || !auth.verifySecret(String(b.pin || ''), c.pin_hash)) throw new HttpError(401, 'That name and PIN don’t match. Check with your parent.');
  auth.clearRateLimit(`pin:${login}`);
  q.run("UPDATE children SET last_active_at = datetime('now') WHERE id = ?", c.id);
  json(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie('student', auth.createSession('student', c.id)) });
});
route('POST', '/api/student/logout', (req, res) => { auth.destroySession(req, 'student'); json(res, 200, { ok: true }, { 'Set-Cookie': auth.sessionCookie('student', '') }); });
route('GET', '/api/student/me', (req, res) => json(res, 200, studentState(requireStudent(req))));
route('GET', '/api/student/lessons/:id', (req, res, { params }) => {
  const s = requireStudent(req); const l = LESSON_MAP[params.id];
  if (!l) throw new HttpError(404, 'Lesson not found.');
  if (!l.taster && (l.track !== s.age_band || !enrol.activeEnrolment(s.id))) throw new HttpError(403, 'This lesson isn’t unlocked for you yet.');
  const track = trackLessons(s.age_band); const idx = track.findIndex((x) => x.id === l.id);
  const after = idx >= 0 ? track[idx + 1] : track[0];
  json(res, 200, { lesson: l, next: after ? { id: after.id, title: after.title } : null, done: Boolean(q.get('SELECT 1 FROM progress WHERE child_id = ? AND lesson_id = ?', s.id, l.id)) });
});
route('POST', '/api/student/lessons/:id/complete', async (req, res, { params }) => {
  const s = requireStudent(req); const l = LESSON_MAP[params.id]; const b = await jsonBody(req);
  if (!l) throw new HttpError(404, 'Lesson not found.');
  if (!l.taster && (l.track !== s.age_band || !enrol.activeEnrolment(s.id))) throw new HttpError(403, 'This lesson isn’t unlocked for you yet.');
  const max = Math.max(0, Math.min(50, Number(b.max) || 0)); const score = Math.max(0, Math.min(max, Number(b.score) || 0));
  q.run(`INSERT INTO progress (child_id, lesson_id, score) VALUES (?,?,?) ON CONFLICT(child_id, lesson_id) DO UPDATE SET score = MAX(score, excluded.score)`, s.id, l.id, max ? Math.round((score / max) * 100) : null);
  q.run("UPDATE children SET last_active_at = datetime('now') WHERE id = ?", s.id);
  json(res, 200, { ok: true, badges: awardBadges(s, l, { score, max, strongPrompt: Boolean(b.strongPrompt), perfectSpot: Boolean(b.perfectSpot) }) });
});
route('POST', '/api/student/projects', async (req, res) => {
  const s = requireStudent(req); const b = await jsonBody(req); const l = LESSON_MAP[b.lesson_id];
  if (!l) throw new HttpError(404, 'Lesson not found.');
  const content = str(b.content, 2000);
  if (content.length < 10) throw new HttpError(400, 'Write a bit more before you submit.');
  const check = ai.checkText(content);
  if (!check.ok && check.category === 'personal-info') throw new HttpError(400, check.message.replace('Never share personal details with an AI.', 'Keep personal details out of your projects.'));
  q.run('INSERT INTO projects (child_id, lesson_id, content) VALUES (?,?,?)', s.id, l.id, content);
  json(res, 201, { ok: true });
});
route('POST', '/api/student/ai', async (req, res) => {
  const s = requireStudent(req); const b = await jsonBody(req);
  const lesson = LESSON_MAP[b.lesson_id]; const step = lesson?.steps.find((x) => x.type === 'prompt' && x.mission.id === b.mission_id);
  if (!auth.rateLimit(`ai:${s.id}`, 30, 6e4)) throw new HttpError(429, 'Slow down a little! Try again in a minute.');
  json(res, 200, await ai.handlePrompt(s, str(b.prompt, 1000), step?.mission));
});

// ----------------------------------------------------------------------------------------------
function serveStatic(req, res, pathname) {
  const file = path.normalize(path.join(PUBLIC, pathname.replace(/^\/assets\//, '')));
  if (!file.startsWith(PUBLIC + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) return false;
  send(res, 200, fs.readFileSync(file), { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': config.isProd ? 'public, max-age=86400' : 'no-cache' });
  return true;
}

async function handler(req, res) {
  const url = new URL(req.url, config.appUrl);
  try {
    if (req.method === 'GET' && url.pathname.startsWith('/assets/') && serveStatic(req, res, url.pathname)) return;
    if (req.method === 'GET' && url.pathname === '/favicon.ico') return serveStatic(req, res, '/assets/img/favicon.svg') || send(res, 404, '');
    if (req.method !== 'GET' && url.pathname !== '/api/paystack/webhook' && !checkOrigin(req)) throw new HttpError(403, 'Cross-site request blocked.');
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (m) return await r.handler(req, res, { url, params: m.groups || {} });
    }
    if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' });
    return html(res, 404, pages.notFound());
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    if (url.pathname.startsWith('/api/')) return json(res, status, { error: status >= 500 ? 'Something went wrong on our side. Please try again.' : err.message });
    return html(res, status, pages.message({ title: 'Something went wrong', body: 'Please try again. If it keeps happening, contact us.', cta: ['/', 'Go home'] }));
  }
}

function createServer() { getDb(); return http.createServer(handler); }

if (require.main === module) {
  const server = createServer();
  server.listen(config.port, () => {
    console.log(`${config.brand} running at ${config.appUrl}`);
    console.log(`  payments: ${config.paymentsLive ? 'Paystack (live keys present)' : config.demoPayments ? 'DEMO checkout (no real money)' : 'not configured'}`);
    console.log(`  email:    ${config.resendKey ? 'Resend' : 'dev outbox at /dev/outbox'}`);
    console.log(`  AI Lab:   ${config.anthropicKey ? `live (${config.aiModel}) for opted-in learners 10+` : 'practice mode only'}`);
  });
  const tick = () => runJobs().catch((e) => console.error('[jobs]', e.message));
  setTimeout(tick, 10_000); setInterval(tick, 36e5).unref();
}

module.exports = { createServer };

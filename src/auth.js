'use strict';
const crypto = require('node:crypto');
const { q } = require('./db');
const { config } = require('./config');

const SESSION_DAYS = { parent: 30, student: 14 };
const COOKIE = { parent: 'tp_parent', student: 'tp_student' };

function hashSecret(secret) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(String(secret), salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function verifySecret(secret, stored) {
  if (!stored) return false;
  const [scheme, saltHex, keyHex] = stored.split('$');
  if (scheme !== 'scrypt') return false;
  const key = crypto.scryptSync(String(secret), Buffer.from(saltHex, 'hex'), 64, { N: 16384, r: 8, p: 1 });
  const expected = Buffer.from(keyHex, 'hex');
  return expected.length === key.length && crypto.timingSafeEqual(expected, key);
}

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');

function isoIn(ms) { return new Date(Date.now() + ms).toISOString(); }

function createSession(userType, userId) {
  const token = randomToken();
  q.run('INSERT INTO sessions (token_hash, user_type, user_id, expires_at) VALUES (?,?,?,?)',
    sha256(token), userType, userId, isoIn(SESSION_DAYS[userType] * 864e5));
  return token;
}

function sessionCookie(userType, token) {
  const maxAge = token ? SESSION_DAYS[userType] * 86400 : 0;
  const secure = config.appUrl.startsWith('https://') ? '; Secure' : '';
  return `${COOKIE[userType]}=${token || ''}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

function parseCookies(req) {
  const out = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function currentUser(req, userType) {
  const token = parseCookies(req)[COOKIE[userType]];
  if (!token) return null;
  const s = q.get('SELECT * FROM sessions WHERE token_hash = ? AND user_type = ?', sha256(token), userType);
  if (!s || s.expires_at < new Date().toISOString()) return null;
  if (userType === 'parent') return q.get('SELECT id, email, name, email_verified_at, weekly_updates, created_at FROM parents WHERE id = ?', s.user_id) || null;
  return q.get('SELECT id, parent_id, nickname, age_band, login_name, ai_live_enabled FROM children WHERE id = ?', s.user_id) || null;
}

function destroySession(req, userType) {
  const token = parseCookies(req)[COOKIE[userType]];
  if (token) q.run('DELETE FROM sessions WHERE token_hash = ?', sha256(token));
}

function createEmailToken(parentId, purpose, hours = 48) {
  const token = randomToken();
  q.run('INSERT INTO email_tokens (token_hash, parent_id, purpose, expires_at) VALUES (?,?,?,?)', sha256(token), parentId, purpose, isoIn(hours * 36e5));
  return token;
}

function consumeEmailToken(token, purpose) {
  const row = q.get('SELECT * FROM email_tokens WHERE token_hash = ? AND purpose = ?', sha256(String(token || '')), purpose);
  if (!row || row.used_at || row.expires_at < new Date().toISOString()) return null;
  q.run("UPDATE email_tokens SET used_at = datetime('now') WHERE token_hash = ?", row.token_hash);
  return row.parent_id;
}

// In-memory attempt limiter (per process). Good enough for a single small server.
const attempts = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const rec = attempts.get(key) || { count: 0, reset: now + windowMs };
  if (now > rec.reset) { rec.count = 0; rec.reset = now + windowMs; }
  rec.count += 1;
  attempts.set(key, rec);
  return rec.count <= max;
}
function clearRateLimit(key) { attempts.delete(key); }

// Friendly, non-identifying student login names, e.g. "comet-482".
const WORDS = ['comet', 'river', 'maple', 'pixel', 'orbit', 'coral', 'ember', 'cedar', 'nova', 'delta', 'lotus', 'flint', 'aurora', 'baobab', 'harmattan', 'kola', 'mango', 'savanna', 'zest', 'quartz'];
function newLoginName() {
  for (let i = 0; i < 50; i++) {
    const name = `${WORDS[crypto.randomInt(WORDS.length)]}-${crypto.randomInt(100, 1000)}`;
    if (!q.get('SELECT 1 FROM children WHERE login_name = ?', name)) return name;
  }
  return `learner-${crypto.randomInt(10000, 99999)}`;
}

module.exports = {
  hashSecret, verifySecret, sha256, randomToken, createSession, sessionCookie, parseCookies, currentUser,
  destroySession, createEmailToken, consumeEmailToken, rateLimit, clearRateLimit, newLoginName, COOKIE,
};

'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { config } = require('./config');

let db;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified_at TEXT,
  consent_at TEXT NOT NULL,
  weekly_updates INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_type TEXT NOT NULL CHECK (user_type IN ('parent','student')),
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS email_tokens (
  token_hash TEXT PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

-- Children: nickname and age band only. No surname, date of birth, email, school or photo.
CREATE TABLE IF NOT EXISTS children (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  age_band TEXT NOT NULL,
  interests TEXT NOT NULL DEFAULT '[]',
  experience TEXT NOT NULL DEFAULT 'none',
  goals TEXT NOT NULL DEFAULT '[]',
  login_name TEXT NOT NULL UNIQUE,
  pin_hash TEXT,
  ai_live_enabled INTEGER NOT NULL DEFAULT 0,
  preferred_plan TEXT NOT NULL DEFAULT 'guided',
  last_active_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS enrolments (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','demo','cancelled','expired')),
  amount_kobo INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  reference TEXT UNIQUE,
  provider TEXT,
  paid_at TEXT,
  period_end TEXT,
  subscription_code TEXT,
  reminder_sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY,
  enrolment_id INTEGER NOT NULL REFERENCES enrolments(id) ON DELETE CASCADE,
  reference TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  amount_kobo INTEGER NOT NULL,
  status TEXT NOT NULL,
  verified_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS progress (
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  score INTEGER,
  completed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (child_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS badges (
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (child_id, badge_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_logs (
  id INTEGER PRIMARY KEY,
  child_id INTEGER NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT,
  flagged INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS outbox (
  id INTEGER PRIMARY KEY,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  sent_via TEXT NOT NULL,
  error TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS support_requests (
  id INTEGER PRIMARY KEY,
  parent_id INTEGER REFERENCES parents(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id INTEGER PRIMARY KEY,
  event TEXT NOT NULL,
  reference TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_runs (
  job TEXT NOT NULL,
  key TEXT NOT NULL,
  ran_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (job, key)
);
`;

function getDb() {
  if (db) return db;
  const file = config.dbPath;
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

// Small helpers so route code stays readable.
const q = {
  get: (sql, ...p) => getDb().prepare(sql).get(...p),
  all: (sql, ...p) => getDb().prepare(sql).all(...p),
  run: (sql, ...p) => getDb().prepare(sql).run(...p),
  tx(fn) {
    const d = getDb();
    d.exec('BEGIN');
    try { const r = fn(); d.exec('COMMIT'); return r; } catch (e) { d.exec('ROLLBACK'); throw e; }
  },
};

function closeDb() { if (db) { db.close(); db = undefined; } }

module.exports = { getDb, q, closeDb };

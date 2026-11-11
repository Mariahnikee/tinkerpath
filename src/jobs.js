'use strict';
const { q } = require('./db');
const { config, PLANS } = require('./config');
const { sendEmail, templates } = require('./email');
const { LESSON_MAP } = require('./content');
const { dateLabel } = require('./enrolment');

/*
 * Lightweight automation. Runs hourly inside the server (and via `npm run jobs`).
 * Each job records what it did in job_runs so nothing is sent twice.
 */

async function renewalReminders(now = new Date()) {
  const soon = new Date(now.getTime() + 3 * 864e5).toISOString();
  const rows = q.all(`SELECT e.*, p.name AS parent_name, p.email, c.nickname FROM enrolments e
    JOIN parents p ON p.id = e.parent_id JOIN children c ON c.id = e.child_id
    WHERE e.status = 'active' AND e.subscription_code IS NULL AND e.reminder_sent_at IS NULL
      AND e.period_end > ? AND e.period_end <= ?`, now.toISOString(), soon);
  for (const r of rows) {
    const [s, b] = templates.reminder(r.parent_name, r.nickname, PLANS[r.plan_id].name, dateLabel(r.period_end), `${config.appUrl}/parent`);
    const res = await sendEmail(r.email, s, b);
    if (res.ok) q.run("UPDATE enrolments SET reminder_sent_at = datetime('now') WHERE id = ?", r.id);
  }
  q.run("UPDATE enrolments SET status = 'expired' WHERE status IN ('active','cancelled') AND period_end <= ?", now.toISOString());
  return rows.length;
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${Math.ceil(((t - y) / 864e5 + 1) / 7)}`;
}

async function weeklyUpdates(now = new Date()) {
  const week = isoWeek(now);
  const since = new Date(now.getTime() - 7 * 864e5).toISOString().replace('T', ' ').slice(0, 19);
  const parents = q.all('SELECT * FROM parents WHERE weekly_updates = 1 AND email_verified_at IS NOT NULL');
  let sent = 0;
  for (const p of parents) {
    if (q.get('SELECT 1 FROM job_runs WHERE job = ? AND key = ?', 'weekly', `${week}:${p.id}`)) continue;
    const kids = q.all('SELECT * FROM children WHERE parent_id = ?', p.id);
    for (const c of kids) {
      const done = q.all('SELECT lesson_id FROM progress WHERE child_id = ? AND completed_at >= ?', c.id, since);
      const projects = q.get('SELECT COUNT(*) AS n FROM projects WHERE child_id = ? AND created_at >= ?', c.id, since).n;
      const flagged = q.get('SELECT COUNT(*) AS n FROM ai_logs WHERE child_id = ? AND flagged = 1 AND created_at >= ?', c.id, since).n;
      if (!done.length && !projects && !flagged) continue;
      const lines = [
        done.length ? `Lessons completed (${done.length}):\n${done.map((d) => `  - ${LESSON_MAP[d.lesson_id]?.title || d.lesson_id}`).join('\n')}` : 'No lessons completed this week.',
        `Projects submitted: ${projects}`,
        flagged ? `AI Lab messages flagged by our filters: ${flagged} (please review them in your dashboard)` : 'No AI Lab messages were flagged.',
      ];
      const [s, b] = templates.weekly(p.name, c.nickname, lines.join('\n'), `${config.appUrl}/parent`);
      if ((await sendEmail(p.email, s, b)).ok) sent++;
    }
    q.run('INSERT OR IGNORE INTO job_runs (job, key) VALUES (?, ?)', 'weekly', `${week}:${p.id}`);
  }
  return sent;
}

async function runJobs(now = new Date()) {
  const reminders = await renewalReminders(now);
  // Weekly summaries go out on Sundays (local server time).
  const weekly = now.getDay() === 0 ? await weeklyUpdates(now) : 0;
  return { reminders, weekly };
}

module.exports = { runJobs, renewalReminders, weeklyUpdates };

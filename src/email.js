'use strict';
const { q } = require('./db');
const { config } = require('./config');

/**
 * Sends an email through Resend when RESEND_API_KEY is set.
 * Otherwise stores it in the dev outbox (viewable at /dev/outbox outside production).
 * Returns { ok, via } and never claims success for a provider call that failed.
 */
async function sendEmail(to, subject, body) {
  if (config.resendKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${config.resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: config.emailFrom, to: [to], subject, text: body }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
      q.run('INSERT INTO outbox (to_email, subject, body, sent_via) VALUES (?,?,?,?)', to, subject, body, 'resend');
      return { ok: true, via: 'resend' };
    } catch (err) {
      q.run('INSERT INTO outbox (to_email, subject, body, sent_via, error) VALUES (?,?,?,?,?)', to, subject, body, 'resend-failed', String(err.message));
      console.error('[email] send failed:', err.message);
      return { ok: false, via: 'resend', error: err.message };
    }
  }
  q.run('INSERT INTO outbox (to_email, subject, body, sent_via) VALUES (?,?,?,?)', to, subject, body, 'dev-outbox');
  if (!config.isProd) console.log(`[email:dev-outbox] to=${to} subject="${subject}"`);
  return { ok: true, via: 'dev-outbox' };
}

const sign = `\n\n— The ${config.brand} team\n${config.appUrl}\nQuestions? Reply to this email or write to ${config.supportEmail}.`;

const templates = {
  verify: (name, link) => [`Confirm your email for ${config.brand}`,
    `Hi ${name},\n\nPlease confirm your email address so we can send enrolment and progress updates:\n\n${link}\n\nThis link expires in 48 hours. If you did not sign up, you can ignore this email.${sign}`],
  reset: (name, link) => [`Reset your ${config.brand} password`,
    `Hi ${name},\n\nUse this link to set a new password (valid for 1 hour):\n\n${link}\n\nIf you did not ask for this, ignore this email; your password stays the same.${sign}`],
  enrolled: (name, child, plan, amount, periodEnd, loginUrl) => [`${child} is enrolled in ${config.brand}`,
    `Hi ${name},\n\nPayment received and confirmed with our payment provider. ${child} is enrolled on the ${plan} plan.\n\nAmount: ${amount}\nAccess until: ${periodEnd}\n\nNext step: open your parent dashboard, set ${child}'s 4-digit PIN, and they can start at ${loginUrl}.${sign}`],
  reminder: (name, child, plan, periodEnd, link) => [`${child}'s ${config.brand} access ends on ${periodEnd}`,
    `Hi ${name},\n\n${child}'s ${plan} access ends on ${periodEnd}. To keep their progress going, renew from your dashboard:\n\n${link}\n\nIf you'd rather pause, no action is needed. Progress is kept for 12 months.${sign}`],
  weekly: (name, child, summary, link) => [`${child}'s week on ${config.brand}`,
    `Hi ${name},\n\nHere is what ${child} did this week:\n\n${summary}\n\nSee details, projects and AI Lab activity in your dashboard:\n${link}\n\nTo stop weekly updates, switch them off in your dashboard settings.${sign}`],
  supportAck: (name, topic) => [`We got your message: ${topic}`,
    `Hi ${name || 'there'},\n\nThanks for getting in touch. We reply within 2 working days.${sign}`],
};

module.exports = { sendEmail, templates };

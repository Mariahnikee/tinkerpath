'use strict';
const crypto = require('node:crypto');
const { config } = require('./config');

const API = 'https://api.paystack.co';

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${config.paystackSecret}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status === false) {
    const err = new Error(json.message || `Paystack error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json.data;
}

/** Starts a hosted Paystack checkout. Amount is in kobo. Returns { authorization_url, reference }. */
function initializeTransaction({ email, amountKobo, reference, callbackUrl, metadata, plan }) {
  const body = { email, amount: amountKobo, currency: 'NGN', reference, callback_url: callbackUrl, metadata };
  if (plan) body.plan = plan; // Paystack charges the plan amount and creates the subscription
  return call('POST', '/transaction/initialize', body);
}

/** Server-side source of truth for a payment. Never trust the browser redirect alone. */
function verifyTransaction(reference) {
  return call('GET', `/transaction/verify/${encodeURIComponent(reference)}`);
}

function subscriptionManageLink(code) {
  return call('GET', `/subscription/${encodeURIComponent(code)}/manage/link`);
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
function isValidSignature(rawBody, signature, secret = config.paystackSecret) {
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { initializeTransaction, verifyTransaction, subscriptionManageLink, isValidSignature };

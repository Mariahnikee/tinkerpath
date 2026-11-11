'use strict';
const { config } = require('./config');
const { q } = require('./db');

/*
 * Supervised AI Lab.
 * Layers, in order: eligibility (age band + parent opt-in + key present) -> input limits ->
 * personal-information filter -> topic filter -> daily rate limit -> constrained system prompt ->
 * output filter -> full logging visible to the parent.
 * These reduce risk; they do not make the system "completely safe". See docs/AI-SAFETY.md.
 */

const MAX_PROMPT = 300;

const PII_PATTERNS = [
  { re: /[\w.+-]+@[\w-]+\.[\w.-]+/i, why: 'an email address' },
  { re: /(\+?234|\b0)[789][01]\d{8}\b/, why: 'a phone number' },
  { re: /\b\d[\d\s-]{8,}\d\b/, why: 'a long number (it could be a phone or account number)' },
  { re: /\b(my|our)\s+(home\s+)?(address|house number|street)\b/i, why: 'your address' },
  { re: /\b(i|we)\s+live\s+(at|on|in)\b/i, why: 'where you live' },
  { re: /\bmy\s+(full\s+|real\s+|sur|last\s+)?name\s+is\b/i, why: 'your name' },
  { re: /\b(my|i go to|i attend)\s+(school|college)\s+(is|called)?\b/i, why: 'your school' },
  { re: /\b(password|passcode|pin)\b\s*(is|:)/i, why: 'a password or PIN' },
  { re: /\b\d{1,4}\s+\w+\s+(street|st|road|rd|close|avenue|ave|crescent|way)\b/i, why: 'an address' },
];

// Kept short and deliberately broad. Expand from real usage logs (reviewed by a human).
const BLOCKED = [
  { cat: 'self-harm', re: /\b(kill myself|suicide|self[-\s]?harm|hurt myself|want to die|cutting myself)\b/i },
  { cat: 'violence', re: /\b(make a (bomb|weapon|gun)|how to (kill|stab|shoot)|hurt (someone|somebody|people))\b/i },
  { cat: 'sexual', re: /\b(sex|sexy|porn|nude|naked|boyfriend|girlfriend|kiss me)\b/i },
  { cat: 'drugs', re: /\b(drugs?|weed|cocaine|vape|alcohol|get drunk)\b/i },
  { cat: 'hate', re: /\b(hate (all )?(women|men|girls|boys|muslims|christians|igbo|yoruba|hausa))\b/i },
  { cat: 'cheating', re: /\b(do my homework|write my essay|answers? to (my|the) (exam|test))\b/i },
  { cat: 'companion', re: /\b(be my (friend|best friend|bf|gf)|do you love me|are you alive|keep (this|a) secret)\b/i },
];

const SUPPORTIVE = 'It sounds like something big might be going on. Please talk to a parent, carer, teacher or another adult you trust today. The AI Lab is not able to help with this, but people who care about you can. Your parent can see this message so they can support you.';

function checkText(text) {
  const t = String(text || '');
  for (const p of PII_PATTERNS) if (p.re.test(t)) return { ok: false, category: 'personal-info', message: `It looks like your message includes ${p.why}. Never share personal details with an AI. Try again without it.` };
  for (const b of BLOCKED) if (b.re.test(t)) {
    if (b.cat === 'self-harm') return { ok: false, category: b.cat, message: SUPPORTIVE, alertParent: true };
    if (b.cat === 'cheating') return { ok: false, category: b.cat, message: 'The AI Lab helps you practise prompts, not do homework for you. Try asking it to explain an idea with an example instead.' };
    if (b.cat === 'companion') return { ok: false, category: b.cat, message: 'Good question to think about! An AI is a computer program. It is not a person, it cannot be your friend, and it cannot keep secrets. Try a prompt from your mission instead.' };
    return { ok: false, category: b.cat, message: 'That topic isn’t part of the AI Lab. Try a prompt from your mission.' };
  }
  return { ok: true };
}

function checkInput(text) {
  const t = String(text || '').trim();
  if (t.length < 3) return { ok: false, category: 'too-short', message: 'Write a little more so the AI knows what you want.' };
  if (t.length > MAX_PROMPT) return { ok: false, category: 'too-long', message: `Keep prompts under ${MAX_PROMPT} characters. Short and clear works best.` };
  return checkText(t);
}

/*
 * Prompt rubric shared by practice and live modes. Four skills:
 * clear task, audience, format/length, and a detail or constraint.
 */
function scorePrompt(prompt, mission = {}) {
  const p = String(prompt || '').toLowerCase();
  const checks = {
    task: /\b(write|explain|list|give|describe|create|make|suggest|summari[sz]e|compare|tell|plan|design|draw)\b/.test(p),
    audience: /\b(for (a|an|my)?\s*\w+|year[-\s]?old|kids?|children|beginners?|class|friends?|grandma|parents?|teacher|age \d+)\b/.test(p),
    format: /\b(\d+|one|two|three|four|five|ten)\s+(lines?|sentences?|words?|steps?|bullet|points?|ideas?|examples?|questions?)|\b(list|table|poem|story|bullets?|short|haiku|step[-\s]by[-\s]step)\b/.test(p),
    detail: /\b(about|using|include|with|without|in the style of|that (is|are|uses)|funny|simple|kind|nigerian|lagos|rainy|harmattan)\b/.test(p),
  };
  if (mission.keywords && mission.keywords.length) checks.topic = mission.keywords.some((k) => p.includes(k));
  const total = Object.keys(checks).length;
  const score = Object.values(checks).filter(Boolean).length;
  const tips = [];
  if (!checks.task) tips.push('Start with an action word like "write", "explain" or "list".');
  if (!checks.audience) tips.push('Say who it is for, e.g. "for a 10-year-old".');
  if (!checks.format) tips.push('Say the shape of the answer, e.g. "in 3 bullet points" or "a 4-line poem".');
  if (!checks.detail) tips.push('Add a detail, e.g. a topic, style, or something to include.');
  if (checks.topic === false) tips.push('Make sure your prompt is about the mission topic.');
  return { checks, score, total, level: score >= total ? 'strong' : score >= Math.ceil(total / 2) ? 'partial' : 'vague', tips };
}

function systemPrompt(ageBand) {
  const ages = ageBand === 'creators' ? '13 to 16' : '10 to 12';
  return [
    `You are the practice assistant inside TinkerPath's AI Lab, used by learners aged ${ages} while their parent can review every message.`,
    'Purpose: help the learner practise writing prompts and thinking critically about AI answers. Answer the learner\'s prompt helpfully, in at most 120 words, using simple, warm, age-appropriate language.',
    'Rules:',
    '- Never ask for or repeat personal information (names, school, location, contact details, photos). If the learner shares any, tell them not to and continue without it.',
    '- Stay on school-safe topics: learning, creativity, science, technology, stories, everyday life. Politely decline anything violent, sexual, hateful, about drugs, or otherwise unsuitable for children, and suggest a learning prompt instead.',
    '- If the learner seems upset or at risk, tell them kindly to talk to a trusted adult now and do not continue the topic.',
    '- You are a computer program, not a friend or a person. Do not role-play relationships, claim feelings, or encourage secrecy.',
    '- Do not write complete homework or exam answers; explain ideas with examples instead.',
    '- No links, no external contact details, no instructions to use other apps.',
    '- When unsure of a fact, say so. Add one short line at the end: a tip for checking the answer or improving the prompt.',
  ].join('\n');
}

function aiStatus(child) {
  if (!child) return { live: false, reason: 'no-child' };
  if (!config.anthropicKey) return { live: false, reason: 'not-configured' };
  if (child.age_band === 'explorers') return { live: false, reason: 'age' };
  if (!child.ai_live_enabled) return { live: false, reason: 'parent-off' };
  return { live: true };
}

function usedToday(childId) {
  return q.get("SELECT COUNT(*) AS n FROM ai_logs WHERE child_id = ? AND mode = 'live' AND created_at >= date('now')", childId).n;
}

let clientPromise;
async function getClient() {
  if (!clientPromise) {
    clientPromise = import('@anthropic-ai/sdk').then((m) => new (m.default || m.Anthropic)({ apiKey: config.anthropicKey }))
      .catch((e) => { clientPromise = undefined; throw new Error('Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk. ' + e.message); });
  }
  return clientPromise;
}

async function askLive(child, prompt) {
  const client = await getClient();
  const response = await client.beta.messages.create({
    model: config.aiModel,
    max_tokens: 1024,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: systemPrompt(child.age_band),
    messages: [{ role: 'user', content: prompt }],
  });
  if (response.stop_reason === 'refusal') return { text: 'The AI decided not to answer that one. Try a different prompt from your mission.', refused: true };
  const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  return { text: text.slice(0, 1200) };
}

/** Main entry for the AI Lab. Always logs. Never throws to the caller. */
async function handlePrompt(child, prompt, mission) {
  const rubric = scorePrompt(prompt, mission);
  const input = checkInput(prompt);
  const status = aiStatus(child);
  const mode = status.live ? 'live' : 'practice';
  if (!input.ok) {
    q.run('INSERT INTO ai_logs (child_id, mode, prompt, response, flagged, reason) VALUES (?,?,?,?,?,?)',
      child.id, 'blocked', String(prompt).slice(0, 500), input.message, 1, input.category);
    return { blocked: true, message: input.message, category: input.category, rubric };
  }

  if (mode === 'practice') {
    const reply = mission && mission.replies ? mission.replies[rubric.level] : 'Practice mode: write your prompt, then read the feedback to improve it.';
    q.run('INSERT INTO ai_logs (child_id, mode, prompt, response) VALUES (?,?,?,?)', child.id, 'practice', prompt, reply);
    return { mode, reply, rubric, note: 'Practice mode: this is a pre-written example reply, chosen by how clear your prompt is. No live AI was used.', liveReason: status.reason };
  }

  if (usedToday(child.id) >= config.aiDailyLimit) {
    return { blocked: true, category: 'limit', message: `You've used today's ${config.aiDailyLimit} live AI tries. Come back tomorrow, or keep practising in the missions.`, rubric };
  }

  try {
    const { text, refused } = await askLive(child, prompt);
    const out = checkText(text);
    const reply = out.ok ? text : 'The AI’s answer was hidden by our safety filter. Try a different prompt.';
    q.run('INSERT INTO ai_logs (child_id, mode, prompt, response, flagged, reason) VALUES (?,?,?,?,?,?)',
      child.id, 'live', prompt, text, out.ok && !refused ? 0 : 1, out.ok ? (refused ? 'model-refusal' : null) : `output-${out.category}`);
    return { mode, reply, rubric, note: 'Live AI answer. AI can be wrong: check facts with a trusted source.' };
  } catch (err) {
    console.error('[ai] live request failed:', err.message);
    return { mode: 'error', blocked: true, category: 'unavailable', message: 'The live AI is unavailable right now. Your prompt feedback still works.', rubric };
  }
}

module.exports = { checkInput, checkText, scorePrompt, systemPrompt, aiStatus, handlePrompt, MAX_PROMPT };

'use strict';
const { config, PLANS } = require('./config');
const { TRACKS } = require('./content');

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ngn = (n) => `₦${n.toLocaleString('en-NG')}`;
const B = config.brand;

const LOGO = `<svg class="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="var(--ink)"/><path d="M8 22c3-8 6-10 9-6s5 2 7-6" fill="none" stroke="var(--sun)" stroke-width="3" stroke-linecap="round" stroke-dasharray="0.1 5.2"/><circle cx="8" cy="22" r="2.6" fill="var(--coral)"/><circle cx="24" cy="10" r="2.6" fill="var(--lagoon-l)"/></svg>`;

function layout({ title, description, body, parent, app = false, bodyClass = '', scripts = [] }) {
  const links = `<li><a href="/programmes">Programmes</a></li>
          <li><a href="/#how">How it works</a></li>
          <li><a href="/safety">AI &amp; safety</a></li>
          <li><a href="/pricing">Pricing</a></li>
          <li><a href="/about">About</a></li>`;
  const nav = app ? '' : `
    <nav class="nav" aria-label="Main">
      <ul class="nav-links">${links}</ul>
      <details class="nav-menu">
        <summary aria-label="Menu"><span></span><span></span><span></span></summary>
        <ul>
          ${links}
          <li><a href="/learn/login">Student login</a></li>
          <li><a href="${parent ? '/parent' : '/login'}">${parent ? 'Parent dashboard' : 'Parent login'}</a></li>
        </ul>
      </details>
      <div class="nav-actions">
        <a class="nav-link hide-sm" href="/learn/login">Student login</a>
        <a class="nav-link hide-sm" href="${parent ? '/parent' : '/login'}">${parent ? 'Dashboard' : 'Log in'}</a>
        <a class="btn btn-primary btn-sm" href="/start">Get started</a>
      </div>
    </nav>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title ? `${title} · ${B}` : `${B} · Tech, coding and AI for ages 7–16`)}</title>
<meta name="description" content="${esc(description || 'Short, hands-on online lessons in coding, digital skills and AI for children and teens aged 7–16, with a parent dashboard and a supervised AI Lab.')}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body class="${bodyClass}">
<a class="skip" href="#main">Skip to content</a>
<header class="site-header${app ? ' app-header' : ''}">
  <div class="wrap header-inner">
    <a class="brand" href="/" aria-label="${B} home">${LOGO}<span>${B}</span></a>
    ${nav}
    ${app ? '<div id="app-header-slot" class="nav-actions"></div>' : ''}
  </div>
</header>
${!config.paymentsLive && !app ? '' : ''}
<main id="main">${body}</main>
${app ? '' : footer()}
<script src="/assets/js/common.js"></script>
${scripts.map((s) => `<script src="/assets/js/${s}.js"></script>`).join('\n')}
</body>
</html>`;
}

function footer() {
  return `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <a class="brand" href="/">${LOGO}<span>${B}</span></a>
      <p class="muted">Tech, coding and AI learning for ages 7–16. Online, structured, and built with parents in mind.</p>
      <p class="muted small">Contact: <a href="mailto:${esc(config.supportEmail)}">${esc(config.supportEmail)}</a></p>
    </div>
    <div><h3>Learn</h3><ul><li><a href="/programmes">Programmes</a></li><li><a href="/try">Free sample lesson</a></li><li><a href="/pricing">Pricing</a></li><li><a href="/learn/login">Student login</a></li></ul></div>
    <div><h3>Parents</h3><ul><li><a href="/start">Enrol</a></li><li><a href="/login">Parent login</a></li><li><a href="/safety">AI &amp; safety</a></li><li><a href="/contact">Contact &amp; support</a></li></ul></div>
    <div><h3>Policies</h3><ul><li><a href="/privacy">Privacy</a></li><li><a href="/terms">Terms</a></li><li><a href="/safeguarding">Safeguarding</a></li><li><a href="/refunds">Refunds &amp; cancellation</a></li></ul></div>
  </div>
  <div class="wrap footer-base small muted">© ${new Date().getFullYear()} ${B}. Payments are processed by Paystack. We never see or store card details.</div>
</footer>`;
}

// ---------- Reusable sections ----------
const ICONS = {
  devices: '<path d="M4 6h16v10H4z M2 19h20" />',
  ai: '<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  prompt: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>',
  build: '<path d="M4 20h16M6 20V10l6-5 6 5v10"/><path d="M10 20v-5h4v5"/>',
  spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M7 7l2 2M15 15l2 2M7 17l2-2M15 9l2-2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
};
const icon = (k, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k] || ''}</svg>`;

function pathCards() {
  return `<div class="grid-3">${Object.values(TRACKS).map((t) => `
    <article class="card path-card band-${t.id}">
      <div class="path-head"><span class="path-ages">${t.ages}</span><div><span class="path-years">years old</span><h3>${t.name}</h3></div></div>
      <p class="path-tag">${esc(t.tagline)}</p>
      <ul class="ticks">${t.outcomes.slice(0, 3).map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      <a class="text-link" href="/programmes#${t.id}">See the ${t.name} path <span aria-hidden="true">→</span></a>
    </article>`).join('')}</div>`;
}

function pricingCards({ compact = false } = {}) {
  return `<div class="grid-3 pricing">${Object.values(PLANS).map((p) => `
    <article class="card price-card${p.recommended ? ' is-featured' : ''}">
      ${p.recommended ? '<span class="ribbon">Most families start here</span>' : ''}
      <h3>${p.name}</h3>
      <p class="price"><strong>${ngn(p.priceNGN)}</strong><span>${p.interval === 'month' ? '/ month' : 'one payment · 12 weeks'}</span></p>
      <p class="muted">${esc(p.blurb)}</p>
      ${compact ? '' : `<ul class="ticks">${p.features.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`}
      <a class="btn ${p.recommended ? 'btn-primary' : 'btn-ghost'} btn-block" href="/start?plan=${p.id}">Choose ${p.name}</a>
    </article>`).join('')}</div>
  <p class="small muted center pricing-note">Launch prices in Naira. 10% off for each additional child. Paid securely through Paystack. Cancel any time; access runs to the end of the paid period.</p>`;
}

const FAQ = [
  ['What age is this for?', 'Children and teens aged 7 to 16, in three groups: Explorers (7–9), Makers (10–12) and Creators (13–16). Lessons are written for each age, not one course stretched to fit everyone.'],
  ['My child has never coded. Is that OK?', 'Yes. Every path starts from zero. Most lessons take 10–15 minutes and begin with a short explanation before an activity.'],
  ['What does my child need?', 'A laptop, tablet or phone with a modern browser and internet. A laptop or tablet is easier for the coding lessons. No downloads or app installs.'],
  ['How does the AI part work? Is it safe?', 'Children learn how AI works through guided activities first. Ages 10+ can use a supervised AI Lab, only if a parent switches it on. Personal details are blocked, topics are filtered, and every message is visible to you. No filter is perfect, so we keep a parent in the loop. Read more on our AI & safety page.'],
  ['What information do you collect about my child?', 'Only a first name or nickname, an age group, interests and learning progress. No surname, birth date, school, photo or child email. Your child logs in with a name we generate and a PIN you set.'],
  ['How will I know my child is learning?', 'Your parent dashboard shows lessons completed, quiz scores, projects and badges. We also send a short weekly email summary, which you can switch off.'],
  ['Can my child learn at their own pace?', 'Yes. Lessons are available any time. On the Guided plan there is also a weekly live small-group session, timed for after school.'],
  ['Do you offer certificates?', 'The 12-week Guided term includes a certificate of completion from us. It shows the work completed. It is not an accredited qualification.'],
  ['How do payments and cancellation work?', 'Payment is by card, bank transfer or USSD through Paystack. Monthly plans can be cancelled any time from your dashboard and access continues until the end of the paid month. See our refund policy for details.'],
  ['Is this only for girls or only for boys?', 'Neither. TinkerPath is for every child who is curious about technology. We design lessons, examples and live sessions to be welcoming to all.'],
];
const faqList = (items = FAQ) => `<div class="faq">${items.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div>`;

const ctaBand = (title = 'Give your child a head start with tech and AI', sub = 'Answer five quick questions and we’ll recommend the right path. It takes about two minutes.') => `
  <section class="section"><div class="wrap"><div class="cta-band">
    <div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>
    <div class="cta-actions"><a class="btn btn-primary btn-lg" href="/start">Find the right path</a><a class="btn btn-on-dark" href="/try">Try a free lesson</a></div>
  </div></div></section>`;

// ---------- Pages ----------
function home(ctx) {
  const learn = [
    ['devices', 'Digital basics', 'How computers, the internet and apps actually work.'],
    ['code', 'Coding & logic', 'Algorithms, loops and conditions through puzzles, then real code.'],
    ['build', 'Websites & games', 'Plan games and build real web pages with HTML and CSS.'],
    ['ai', 'How AI works', 'Train a mini model and see how AI learns from examples.'],
    ['prompt', 'Prompting & checking AI', 'Write clear prompts and spot when AI gets things wrong.'],
    ['shield', 'Online safety', 'Privacy, kindness online, and knowing when to ask an adult.'],
  ];
  const body = `
  <section class="hero">
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow">Online tech &amp; AI classes · ages 7–16</p>
        <h1>Help your child go from <em>using</em> tech to <em>creating</em> with it.</h1>
        <p class="lead">Short, hands-on lessons in coding, digital skills and AI, organised by age. Learn at home, join a weekly live session, and follow every step in your parent dashboard.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" href="/start">Find the right path</a>
          <a class="btn btn-ghost btn-lg" href="/try">Try a free lesson</a>
        </div>
        <ul class="hero-facts">
          <li>${icon('lock')} No child email or surname needed</li>
          <li>${icon('eye')} Parents see every AI Lab message</li>
          <li>${icon('check')} Cancel any time</li>
        </ul>
      </div>
      <div class="hero-visual" aria-hidden="true">
        <div class="stage">
          <svg class="stage-path" viewBox="0 0 400 400" fill="none"><path d="M30 360C90 250 150 330 210 230S330 150 370 40" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-dasharray="0.1 16"/></svg>
          <span class="stage-dot d1"></span><span class="stage-dot d2"></span><span class="stage-dot d3"></span>
        </div>
        <div class="mock mock-dash">
          <div class="mock-top"><span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="mock-url">tinkerpath.app/learn</span></div>
          <div class="mock-body">
            <p class="mock-hi">Hi Ada \u{1F44B}</p>
            <div class="mock-next"><span class="tag tag-lagoon">Next up · 15 min</span><strong>Prompt writing 101</strong><span class="mock-btn">Start lesson</span></div>
            <div class="mock-progress"><span>Makers path</span><div class="bar"><i style="width:56%"></i></div><span>5 of 9</span></div>
            <div class="mock-badges"><span class="badge-chip">★ First steps</span><span class="badge-chip">★ Builder</span></div>
          </div>
        </div>
        <div class="mock mock-code">
          <p class="mock-label">index.html</p>
<pre><span class="t">&lt;h1&gt;</span>My football club<span class="t">&lt;/h1&gt;</span>
<span class="t">&lt;ul&gt;</span>
  <span class="t">&lt;li&gt;</span>Fixtures<span class="t">&lt;/li&gt;</span>
<span class="t">&lt;/ul&gt;</span></pre>
        </div>
        <div class="mock mock-prompt">
          <p class="mock-label">AI Lab · your prompt</p>
          <p>Write a 4-line cheerful poem about the rainy season for a 7-year-old.</p>
          <div class="rubric"><span class="ok">Task</span><span class="ok">Audience</span><span class="ok">Format</span><span class="ok">Detail</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="learn">
    <div class="wrap">
      <div class="section-head"><p class="eyebrow">What they learn</p><h2>Practical skills for a world shaped by technology</h2><p class="lead-sm">Every lesson ends with something your child has done, built or decided, not just read.</p></div>
      <div class="grid-3 feature-grid">${learn.map(([i, t, d], n) => `<article class="feature"><span class="feature-icon fi-${n % 3}">${icon(i)}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
      <div class="build-head"><h3>Things your child will make</h3><p class="muted">Real activities from the first modules.</p></div>
      <div class="grid-3 build-grid">
        <figure class="build-card band-explorers"><div class="build-art">
          <div class="mini-board">${Array.from({ length: 16 }, (_, i) => `<i class="${[5, 6].includes(i) ? 'w' : ''}${[12, 8, 4, 0, 1].includes(i) ? ' t' : ''}${i === 2 ? ' g' : ''}"></i>`).join('')}</div>
          <div class="mini-blocks"><span>Forward ×3</span><span>Turn right</span><span>Forward ×2</span></div>
        </div><figcaption><span class="band-pill">Ages 7–9</span><b>A first program</b><span class="muted small">Guide a kite through a maze, then debug it.</span></figcaption></figure>
        <figure class="build-card band-makers"><div class="build-art">
          <div class="mini-train"><span class="sun"></span><span class="sun"></span><span class="leaf"></span><span class="leaf"></span><span class="q">?</span></div>
          <div class="mini-verdict">AI says: <b>Leaf</b> <em>just guessing</em></div>
        </div><figcaption><span class="band-pill">Ages 10–12</span><b>A trained AI model</b><span class="muted small">Teach a sorter, then see where it goes wrong.</span></figcaption></figure>
        <figure class="build-card band-creators"><div class="build-art">
          <div class="mini-site"><div class="ms-bar"><i></i><i></i><i></i></div><div class="ms-hero">My art club</div><div class="ms-row"><i></i><i></i><i></i></div></div>
        </div><figcaption><span class="band-pill">Ages 13–16</span><b>A real web page</b><span class="muted small">Write HTML and CSS and see it live.</span></figcaption></figure>
      </div>
    </div>
  </section>

  <section class="section section-tint" id="paths">
    <div class="wrap">
      <div class="section-head"><p class="eyebrow">Learning paths</p><h2>A path written for your child’s age</h2><p class="lead-sm">Three age groups, each with its own lessons, examples and pace.</p></div>
      ${pathCards()}
    </div>
  </section>

  <section class="section" id="how">
    <div class="wrap">
      <div class="section-head"><p class="eyebrow">How it works</p><h2>From sign-up to first lesson in minutes</h2></div>
      <ol class="steps">
        <li><span class="step-n">1</span><h3>Tell us about your child</h3><p>Age group, interests and experience. About two minutes.</p></li>
        <li><span class="step-n">2</span><h3>Get a recommended path</h3><p>We suggest a path and plan, and show you why.</p></li>
        <li><span class="step-n">3</span><h3>Enrol securely</h3><p>Pay in Naira through Paystack by card, transfer or USSD.</p></li>
        <li><span class="step-n">4</span><h3>Learn and follow along</h3><p>Your child logs in with a PIN you set. You see progress as it happens.</p></li>
      </ol>
    </div>
  </section>

  <section class="section section-ink">
    <div class="wrap split">
      <div>
        <p class="eyebrow eyebrow-light">AI, the supervised way</p>
        <h2>Children learn how AI works before they use it</h2>
        <p>AI is software that learns patterns from huge numbers of examples, then makes a best guess. It can be very useful and it can be confidently wrong. We teach children both sides.</p>
        <a class="btn btn-on-dark" href="/safety">How we keep the AI Lab safe</a>
      </div>
      <ul class="safety-list">
        <li>${icon('spark')}<div><b>Understand first.</b> Train a tiny model and see how missing examples cause bias.</div></li>
        <li>${icon('prompt')}<div><b>Practise prompts.</b> Guided missions give instant feedback on clarity.</div></li>
        <li>${icon('check')}<div><b>Check the answers.</b> Activities built around spotting AI mistakes.</div></li>
        <li>${icon('lock')}<div><b>Personal details blocked.</b> Names, addresses, phone numbers and schools are filtered out.</div></li>
        <li>${icon('eye')}<div><b>Parents in control.</b> Live AI is off by default, ages 10+ only, and every message is shown to you.</div></li>
      </ul>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section-head"><p class="eyebrow">What to expect</p><h2>Honest outcomes</h2></div>
      <div class="grid-2">
        <div class="card expect-yes"><h3>${icon('check')} What we commit to</h3><ul class="ticks">
          <li>A clear, age-appropriate path with a next step after every lesson</li>
          <li>Hands-on activities and projects your child can show you</li>
          <li>Visible progress, scores and projects in your dashboard</li>
          <li>Weekly live time with a tutor on Guided plans</li>
          <li>Responsible AI habits: privacy, checking facts, honesty</li></ul></div>
        <div class="card expect-no"><h3>What we won’t claim</h3><ul class="dashes">
          <li>That your child will be a programmer in a month</li>
          <li>Guaranteed better school grades</li>
          <li>That any AI system is completely safe</li>
          <li>Results that depend on practice we can’t see</li></ul>
          <p class="small muted">Like any skill, progress depends on regular practice. Two or three short lessons a week is a good rhythm.</p></div>
      </div>
    </div>
  </section>

  <section class="section section-tint" id="faq">
    <div class="wrap narrow">
      <div class="section-head"><p class="eyebrow">FAQ</p><h2>Questions parents ask us</h2></div>
      ${faqList()}
    </div>
  </section>
  ${ctaBand()}`;
  return layout({ body, parent: ctx.parent });
}

function programmes(ctx) {
  const body = `
  <section class="page-hero"><div class="wrap narrow center">
    <p class="eyebrow">Programmes</p><h1>Three paths, one goal: confident young creators</h1>
    <p class="lead">Each path has modules of short lessons. Every lesson mixes a quick explanation, an activity and a check for understanding.</p>
  </div></section>
  ${Object.values(TRACKS).map((t) => `
  <section class="section track-section band-${t.id}" id="${t.id}"><div class="wrap">
    <div class="track-head">
      <span class="band-pill">Ages ${t.ages}</span>
      <h2>${t.name}</h2>
      <p class="lead-sm">${esc(t.summary)}</p>
    </div>
    <div class="grid-2">
      ${t.modules.map((m, i) => `<article class="card module-card"><p class="eyebrow">Module ${i + 1}</p><h3>${esc(m.title)}</h3><p class="muted">${esc(m.why)}</p>
        <ol class="lesson-list">${m.lessons.map((id) => { const l = require('./content').LESSON_MAP[id]; return `<li><span>${esc(l.title)}</span><span class="small muted">${l.minutes} min</span></li>`; }).join('')}</ol></article>`).join('')}
    </div>
    <div class="card outcomes"><h3>By the end of this path, your child should be able to:</h3><ul class="ticks cols-2">${t.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></div>
  </div></section>`).join('')}
  <section class="section"><div class="wrap narrow">
    <div class="card note"><h3>How lessons work</h3>
      <div class="grid-3 mini"><div><b>10–15 minutes</b><p class="muted small">Short enough for a school night.</p></div><div><b>Do, then read</b><p class="muted small">Puzzles, sorting, building and quizzes.</p></div><div><b>Always a next step</b><p class="muted small">Your child never wonders what to do next.</p></div></div>
      <p class="small muted">These sample modules are the start of each path. New modules (Scratch-style games, Python basics, data and AI projects) are added as your child progresses.</p>
    </div>
  </div></section>
  ${ctaBand('Not sure which path fits?', 'Tell us a little about your child and we’ll recommend one.')}`;
  return layout({ title: 'Programmes', body, parent: ctx.parent });
}

function pricing(ctx) {
  const body = `<section class="page-hero"><div class="wrap narrow center"><p class="eyebrow">Pricing</p><h1>Plans for every family</h1><p class="lead">Try a free lesson first. Every plan includes the full path for your child’s age, the parent dashboard and weekly updates.</p></div></section>
  <section class="section section-tint"><div class="wrap">${pricingCards()}</div></section>
  <section class="section"><div class="wrap narrow"><div class="section-head"><h2>Payment questions</h2></div>${faqList([FAQ[8], ['Is my payment secure?', 'Payments are handled by Paystack, a licensed payment provider. We never see or store your card details. We only activate an enrolment after Paystack confirms the payment directly with our server.'], ['Can I switch plans?', 'Yes. Choose a different plan when you renew, or contact us and we’ll help.'], ['Do you offer discounts?', 'Each additional child gets 10% off. Paying for the 12-week term costs less than three monthly Guided payments.']])}</div></section>
  ${ctaBand()}`;
  return layout({ title: 'Pricing', body, parent: ctx.parent });
}

function safety(ctx) {
  const body = `<section class="page-hero"><div class="wrap narrow center"><p class="eyebrow">AI &amp; safety</p><h1>A supervised way to learn about AI</h1><p class="lead">We don’t hand children a general-purpose chatbot. We teach how AI works, then let older learners practise in a controlled lab that you can see into.</p></div></section>
  <section class="section"><div class="wrap narrow prose">
    <h2>AI in plain words, for parents</h2>
    <p>Most AI tools your child meets (voice assistants, photo apps, chatbots) work the same basic way: they were <b>trained on huge numbers of examples</b> and learned patterns. When you ask a chatbot something, it predicts a likely-sounding answer. That is why it can be helpful, and why it can be wrong while sounding sure.</p>
    <p>Children who understand this become better users: they write clearer instructions, check what they’re told, and know what not to share.</p>
    <h2>How the AI Lab is set up</h2>
  </div>
  <div class="wrap"><div class="grid-3 feature-grid">
    <article class="feature"><span class="feature-icon fi-0">${icon('user')}</span><h3>Age-based access</h3><p>Ages 7–9 use offline, guided AI activities only. Live AI is available from age 10, and only when a parent switches it on.</p></article>
    <article class="feature"><span class="feature-icon fi-1">${icon('lock')}</span><h3>Personal details blocked</h3><p>Messages containing emails, phone numbers, addresses, school names or passwords are stopped before they reach any AI service.</p></article>
    <article class="feature"><span class="feature-icon fi-2">${icon('shield')}</span><h3>Topic filters, both ways</h3><p>Prompts and answers are checked against unsuitable topics. Worrying messages show support guidance and are flagged to you.</p></article>
    <article class="feature"><span class="feature-icon fi-0">${icon('prompt')}</span><h3>Built for practice</h3><p>The AI is instructed to keep answers short, school-appropriate and focused on the mission, and not to act as a friend or companion.</p></article>
    <article class="feature"><span class="feature-icon fi-1">${icon('eye')}</span><h3>Full visibility</h3><p>Every prompt and reply, including blocked ones, appears in your parent dashboard.</p></article>
    <article class="feature"><span class="feature-icon fi-2">${icon('chart')}</span><h3>Daily limits</h3><p>Live AI use is capped per day, so the lab supports lessons rather than replacing them.</p></article>
  </div></div>
  <div class="wrap narrow prose">
    <div class="callout"><b>Our honest position:</b> these safeguards reduce risk, they don’t remove it. Filters can miss things, and AI can produce mistakes. That’s why live AI is off by default, limited to older learners, and always visible to you. If you ever see something that concerns you, tell us and we’ll review it.</div>
    <h2>Wider child safety</h2>
    <ul class="ticks">
      <li>We collect the minimum: a nickname, age group, interests and progress. No child email, surname, birthday, school or photos.</li>
      <li>A parent or guardian creates the account and gives consent. Children log in with a generated name and a parent-set PIN.</li>
      <li>There is no chat between children on the platform.</li>
      <li>Live group sessions are run by vetted tutors, with cameras optional for children, and are never one-to-one without a parent present.</li>
      <li>Read our <a href="/safeguarding">safeguarding policy</a> and <a href="/privacy">privacy policy</a>.</li>
    </ul>
  </div></section>
  ${ctaBand('See it for yourself', 'Try the free sample lesson, or start enrolment. Live AI stays off until you turn it on.')}`;
  return layout({ title: 'AI & safety', body, parent: ctx.parent });
}

function about(ctx) {
  const body = `<section class="page-hero"><div class="wrap narrow center"><p class="eyebrow">About ${B}</p><h1>Children are growing up with AI. They deserve to understand it.</h1></div></section>
  <section class="section"><div class="wrap narrow prose">
    <h2>Why we started</h2>
    <p>There is a lot of talk about adults moving into tech. Far less about the children who are growing up surrounded by phones, games and AI. They use technology every day, but rarely get the chance to understand it or create with it.</p>
    <p>When parents started asking us how their children could learn tech properly, we built ${B}: a structured, paid programme that takes children from curiosity to real skills, at an age-appropriate pace.</p>
    <h2>What we believe</h2>
    <ul class="ticks">
      <li><b>Every child belongs in tech.</b> Our lessons, examples and sessions are designed for all children, whatever their gender or background.</li>
      <li><b>Learning by doing.</b> Short explanations, then puzzles, projects and real code.</li>
      <li><b>AI literacy is basic literacy now.</b> Knowing how AI works, and when not to trust it, matters as much as using it.</li>
      <li><b>Safety and privacy come first.</b> We collect as little as possible about children and keep parents involved.</li>
      <li><b>Honesty with parents.</b> Clear prices, real progress data, and no promises we can’t keep.</li>
    </ul>
    <h2>Our learning approach</h2>
    <p>Each path is split into modules of 10–15 minute lessons. Lessons use local, familiar examples, mix several activity types, and end with a clear next step. Guided plans add a weekly live group session where a tutor reviews projects and answers questions.</p>
  </div></section>
  ${ctaBand()}`;
  return layout({ title: 'About', body, parent: ctx.parent });
}

function contact(ctx) {
  const body = `<section class="page-hero"><div class="wrap narrow center"><p class="eyebrow">Support</p><h1>How can we help?</h1><p class="lead">We reply within 2 working days. Enrolled parents can also message us from their dashboard.</p></div></section>
  <section class="section"><div class="wrap narrow">
    <form class="card form" id="support-form" novalidate>
      <div class="field-row"><label>Your name<input name="name" autocomplete="name" maxlength="80"></label>
      <label>Email<input name="email" type="email" required autocomplete="email" value="${esc(ctx.parent?.email || '')}"></label></div>
      <label>Topic<select name="topic"><option>General question</option><option>Choosing a programme</option><option>Payments</option><option>Technical problem</option><option>Safety concern</option></select></label>
      <label>Message<textarea name="message" rows="5" required maxlength="3000"></textarea></label>
      <p class="form-msg" role="status" aria-live="polite"></p>
      <button class="btn btn-primary" type="submit">Send message</button>
    </form>
    <p class="small muted center">For an urgent safety concern about a child, contact local emergency services first.</p>
  </div></section>`;
  return layout({ title: 'Contact', body, parent: ctx.parent, scripts: ['forms'] });
}

const DRAFT = '<div class="callout warn"><b>Draft for review.</b> This policy is a starting template. Have it reviewed by a Nigerian lawyer familiar with the Nigeria Data Protection Act 2023 before accepting customers.</div>';
const policy = (title, sections) => (ctx) => layout({ title, parent: ctx.parent, body: `<section class="page-hero slim"><div class="wrap narrow"><h1>${title}</h1><p class="muted">Last updated: ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p></div></section><section class="section"><div class="wrap narrow prose">${DRAFT}${sections}</div></section>` });

const privacy = policy('Privacy policy', `
  <h2>Who we are</h2><p>${B} provides online technology and AI lessons for children aged 7–16. Contact: ${esc(config.supportEmail)}.</p>
  <h2>What we collect</h2><ul><li><b>Parent or guardian:</b> name, email, password (stored only as a secure hash), consent record, payment status and history.</li><li><b>Child:</b> a first name or nickname, age group, interests, experience level, learning goals, lesson progress, quiz scores, projects and AI Lab messages.</li><li>We do <b>not</b> collect a child’s surname, date of birth, email, phone number, school, location or photos.</li><li><b>Payments:</b> handled by Paystack. We never receive or store card details.</li></ul>
  <h2>Why we use it</h2><p>To run your child’s learning account, show progress to you, process enrolment, send service emails (verification, receipts, reminders, weekly updates you can switch off) and keep the platform safe.</p>
  <h2>Children’s data and consent</h2><p>Accounts for children can only be created by a parent or legal guardian, who gives consent at sign-up. Parents can view all of their child’s data, including AI Lab messages, and can ask us to correct or delete it.</p>
  <h2>AI Lab</h2><p>If you enable live AI for a child aged 10+, their prompts (after personal-information filtering) are sent to our AI provider to generate a reply. Prompts are filtered to block personal details first. We log prompts and replies so you can review them.</p>
  <h2>Sharing</h2><p>We share data only with service providers who help us run the platform (hosting, email, payments, AI), under contracts, and never sell it.</p>
  <h2>Retention</h2><p>We keep learning data while the account is active and for 12 months after the last enrolment ends, then delete it. Payment records are kept as required by law.</p>
  <h2>Your rights</h2><p>You can request access, correction, deletion or a copy of your and your child’s data by emailing ${esc(config.supportEmail)}.</p>`);

const terms = policy('Terms of service', `
  <h2>Accounts</h2><p>You must be 18 or older and the parent or legal guardian of any child you enrol. You are responsible for keeping your password and your child’s PIN private.</p>
  <h2>Plans and payment</h2><p>Prices are shown in Naira before you pay. Monthly plans give 30 days of access per payment; the term plan gives 12 weeks. Where a plan auto-renews, this is shown clearly before payment and can be cancelled at any time.</p>
  <h2>Acceptable use</h2><p>Learners must be kind, must not share personal details, and must not try to misuse the AI Lab. We may pause access to protect children’s safety.</p>
  <h2>Learning outcomes</h2><p>We provide structured lessons and support, but we cannot guarantee specific results, grades or qualifications.</p>
  <h2>Changes</h2><p>We will email you about material changes to these terms or to prices before they affect you.</p>`);

const safeguarding = policy('Safeguarding policy', `
  <h2>Our commitment</h2><p>Children’s safety and wellbeing come first in every decision we make.</p>
  <h2>Platform design</h2><ul><li>No messaging between children.</li><li>Minimal child data; parent-controlled accounts.</li><li>AI Lab filters, daily limits and full parent visibility.</li><li>Worrying messages trigger supportive guidance for the child and a flag for the parent.</li></ul>
  <h2>Tutors and live sessions</h2><ul><li>Tutors pass identity and reference checks before working with children.</li><li>Sessions are group sessions with at least two adults or recorded with parental notice; no private one-to-one contact.</li><li>Tutors never ask children for personal contact details or social media.</li></ul>
  <h2>Reporting a concern</h2><p>Email ${esc(config.supportEmail)} with the subject "Safety concern". We acknowledge within one working day. In an emergency, contact local emergency services first.</p>`);

const refunds = policy('Refunds and cancellation', `
  <h2>Cancelling</h2><p>You can cancel a monthly plan any time from your dashboard. Access continues until the end of the period you paid for and will not renew.</p>
  <h2>Refunds</h2><p>If you are unhappy within 7 days of your first payment, contact us for a full refund. After that, payments for periods already started are not refunded, except where required by law.</p>
  <h2>Term plan</h2><p>The 12-week term can be refunded pro rata within the first 4 weeks.</p>`);

const authCard = (title, inner, sub = '') => `<section class="section auth"><div class="wrap auth-wrap"><div class="card auth-card"><h1>${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}${inner}</div></div></section>`;

function login({ next } = {}) {
  return layout({ title: 'Parent login', scripts: ['forms'], body: authCard('Parent login', `
    <form class="form" id="login-form" data-next="${esc(next && next.startsWith('/') && !next.startsWith('//') ? next : '/parent')}" novalidate>
      <label>Email<input name="email" type="email" required autocomplete="email"></label>
      <label>Password<input name="password" type="password" required autocomplete="current-password"></label>
      <p class="form-msg" role="alert"></p>
      <button class="btn btn-primary btn-block" type="submit">Log in</button>
    </form>
    <p class="small center"><a href="/forgot">Forgot password?</a> · New here? <a href="/start">Enrol your child</a></p>
    <p class="small center muted">Are you a student? <a href="/learn/login">Student login</a></p>`) });
}
function forgot() {
  return layout({ title: 'Reset password', scripts: ['forms'], body: authCard('Reset your password', `
    <form class="form" id="forgot-form" novalidate><label>Email<input name="email" type="email" required autocomplete="email"></label><p class="form-msg" role="status"></p><button class="btn btn-primary btn-block">Send reset link</button></form>`, 'We’ll email you a link to set a new password.') });
}
function reset({ token }) {
  return layout({ title: 'New password', scripts: ['forms'], body: authCard('Choose a new password', `
    <form class="form" id="reset-form" data-token="${esc(token)}" novalidate><label>New password<input name="password" type="password" minlength="8" required autocomplete="new-password"><span class="hint">At least 8 characters</span></label><p class="form-msg" role="status"></p><button class="btn btn-primary btn-block">Save password</button></form>`) });
}
function studentLogin() {
  return layout({ title: 'Student login', bodyClass: 'student', scripts: ['forms'], body: authCard('Ready to learn?', `
    <form class="form" id="student-login-form" novalidate>
      <label>Your learner name<input name="login_name" required autocomplete="username" placeholder="e.g. comet-482" autocapitalize="none" spellcheck="false"></label>
      <label>Your 4-digit PIN<input name="pin" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" required autocomplete="current-password" class="pin-input"></label>
      <p class="form-msg" role="alert"></p>
      <button class="btn btn-primary btn-block btn-lg" type="submit">Let’s go</button>
    </form>
    <p class="small muted center">Your parent can find your learner name and set your PIN in their dashboard.</p>`, 'Log in with the learner name and PIN from your parent.') });
}

function start(ctx) {
  return layout({ title: 'Get started', parent: ctx.parent, app: true, bodyClass: 'onboarding', scripts: ['start'], body: `
    <section class="section"><div class="wrap onboard-wrap">
      <ol class="progress-steps" aria-label="Enrolment steps"><li data-s="1">Your child</li><li data-s="2">Path &amp; plan</li><li data-s="3">Your account</li><li data-s="4">Confirm &amp; pay</li></ol>
      <div id="onboard" class="card onboard-card" aria-live="polite"><p class="muted">Loading…</p></div>
      <p class="small muted center">We only ask for what we need. <a href="/privacy">How we use your information</a></p>
    </div></section>` });
}

const shell = (title, id, scripts, bodyClass) => layout({ title, app: true, bodyClass, scripts, body: `<div id="${id}" class="app-root"><div class="wrap section"><div class="skeleton"></div><div class="skeleton short"></div></div></div>` });
const parentApp = () => shell('Parent dashboard', 'parent-app', ['parent'], 'dash');
const studentApp = () => shell('My learning', 'student-app', ['learn'], 'student');
const lessonApp = ({ lessonId, taster }) => layout({ title: taster ? 'Free sample lesson' : 'Lesson', app: true, bodyClass: 'student lesson-page', scripts: ['activities', 'lesson'], body: `<div id="lesson-app" class="app-root" data-lesson="${esc(lessonId)}" data-taster="${taster ? '1' : ''}"><div class="wrap section"><div class="skeleton"></div></div></div>` });

function demoCheckout({ e, plan, amount }) {
  return layout({ title: 'Demo checkout', app: true, scripts: ['forms'], body: authCard('Demo checkout', `
    <div class="callout warn"><b>Demo mode.</b> No payment provider is connected, so no money will move. This enrolment will be marked "Demo" and is not a paid enrolment.</div>
    <dl class="summary"><div><dt>Learner</dt><dd>${esc(e.nickname)}</dd></div><div><dt>Plan</dt><dd>${esc(plan.name)}</dd></div><div><dt>Amount</dt><dd>${amount}</dd></div><div><dt>Reference</dt><dd class="mono small">${esc(e.reference)}</dd></div></dl>
    <form id="demo-pay" data-ref="${esc(e.reference)}"><p class="form-msg" role="alert"></p><button class="btn btn-primary btn-block btn-lg">Simulate successful payment</button></form>
    <p class="center small"><a href="/parent">Cancel and go back</a></p>`, 'In production, parents are sent to Paystack’s secure checkout here.') });
}

function message({ title, body, cta }) {
  return layout({ title, body: authCard(esc(title), `<p>${esc(body)}</p>${cta ? `<a class="btn btn-primary" href="${cta[0]}">${esc(cta[1])}</a>` : ''}`) });
}
const notFound = () => message({ title: 'Page not found', body: 'We couldn’t find that page.', cta: ['/', 'Go to the homepage'] });

function outbox({ emails }) {
  return layout({ title: 'Dev outbox', app: true, body: `<section class="section"><div class="wrap narrow">
    <div class="callout warn"><b>Development only.</b> Emails are stored here because no email provider (RESEND_API_KEY) is set. This page is disabled in production.</div>
    <h1>Dev outbox</h1>${emails.length ? emails.map((m) => `<article class="card outbox-item"><p class="small muted">${esc(m.created_at)} · to ${esc(m.to_email)} · ${esc(m.sent_via)}</p><h3>${esc(m.subject)}</h3><pre>${esc(m.body).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1">$1</a>')}</pre></article>`).join('') : '<p class="muted">No emails yet.</p>'}
  </div></section>` });
}

module.exports = { home, programmes, pricing, safety, about, contact, privacy, terms, safeguarding, refunds, login, forgot, reset, studentLogin, start, parentApp, studentApp, lessonApp, demoCheckout, message, notFound, outbox, esc };

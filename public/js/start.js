'use strict';
/* Parent onboarding: child -> recommendation & plan -> account -> verify & pay. */
(() => {
  const { api, esc, naira, setMsg } = window.TP;
  const root = document.getElementById('onboard');
  const KEY = 'tp_onboarding';
  const params = new URLSearchParams(location.search);

  const AGES = [
    { id: 'explorers', name: 'Explorers', ages: '7–9', desc: 'Puzzles, first AI ideas, online safety' },
    { id: 'makers', name: 'Makers', ages: '10–12', desc: 'Loops, game design, how AI learns' },
    { id: 'creators', name: 'Creators', ages: '13–16', desc: 'Real HTML/CSS, prompts, responsible AI' },
  ];
  const INTERESTS = [['games', 'Games'], ['websites', 'Websites'], ['ai', 'AI'], ['art', 'Art & design'], ['stories', 'Stories'], ['science', 'Science'], ['music', 'Music'], ['robotics', 'Gadgets']];
  const EXPERIENCE = [['none', 'New to this', 'Hasn’t tried coding yet'], ['some', 'A little', 'Has tried a coding app or class'], ['confident', 'Confident', 'Codes or builds things already']];
  const GOALS = [['curiosity', 'Explore a new interest'], ['school', 'Support schoolwork'], ['confidence', 'Build confidence'], ['build', 'Build real projects'], ['career', 'Prepare for future careers']];

  let state = { step: 1, child: { nickname: '', age_band: '', interests: [], experience: 'none', goals: [] }, plan: params.get('plan') || '' };
  try { Object.assign(state, JSON.parse(sessionStorage.getItem(KEY) || '{}')); } catch {}
  if (params.get('plan')) state.plan = params.get('plan');
  let plans = []; let me = null;
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

  function stepper() {
    document.querySelectorAll('.progress-steps li').forEach((li) => {
      const s = Number(li.dataset.s);
      li.classList.toggle('is-done', s < state.step); li.classList.toggle('is-current', s === state.step);
      if (s === state.step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
    });
  }

  const radio = (name, value, checked, inner) => `<label class="option"><input type="radio" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${inner}</span></label>`;
  const checkbox = (name, value, checked, label) => `<label class="option"><input type="checkbox" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${esc(label)}</span></label>`;

  function render() {
    stepper();
    window.scrollTo({ top: 0 });
    if (state.step === 1) return step1();
    if (state.step === 2) return step2();
    if (state.step === 3) return me ? step3Existing() : step3();
    return step4();
  }

  function step1() {
    const c = state.child;
    root.innerHTML = `<form id="f1" novalidate>
      <h2>Tell us about your child</h2>
      <p class="muted">Five quick questions to recommend the right path. Nothing here identifies your child.</p>
      <fieldset class="q"><legend>How old is your child?</legend><div class="options">${AGES.map((a) => radio('age_band', a.id, c.age_band === a.id, `<b>${a.ages}</b>${a.name}<small>${a.desc}</small>`)).join('')}</div></fieldset>
      <fieldset class="q"><legend>What are they into? <span class="hint">(choose any)</span></legend><div class="chips">${INTERESTS.map(([v, l]) => checkbox('interests', v, c.interests.includes(v), l)).join('')}</div></fieldset>
      <fieldset class="q"><legend>Any coding or tech experience?</legend><div class="options">${EXPERIENCE.map(([v, l, d]) => radio('experience', v, c.experience === v, `<b>${l}</b><small>${d}</small>`)).join('')}</div></fieldset>
      <fieldset class="q"><legend>What would you like them to get from it? <span class="hint">(choose any)</span></legend><div class="chips">${GOALS.map(([v, l]) => checkbox('goals', v, c.goals.includes(v), l)).join('')}</div></fieldset>
      <label class="q">What should we call them?<span class="hint">A first name or nickname only. We never need a surname.</span><input name="nickname" maxlength="30" autocomplete="off" value="${esc(c.nickname)}" placeholder="e.g. Ada"></label>
      <p class="form-msg" role="alert"></p>
      <div class="onboard-actions"><a class="btn btn-quiet" href="/">Cancel</a><button class="btn btn-primary" type="submit">See our recommendation</button></div>
    </form>`;
    root.querySelector('#f1').addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(ev.target); const msg = root.querySelector('.form-msg');
      const child = { nickname: String(f.get('nickname') || '').trim(), age_band: f.get('age_band') || '', interests: f.getAll('interests'), experience: f.get('experience') || 'none', goals: f.getAll('goals') };
      if (!child.age_band) return setMsg(msg, 'Please choose your child’s age group.');
      if (!child.nickname) { root.querySelector('[name=nickname]').setAttribute('aria-invalid', 'true'); return setMsg(msg, 'Please add a first name or nickname.'); }
      state.child = child;
      try { state.rec = await api('/api/recommend', { method: 'POST', body: child }); } catch (e) { return setMsg(msg, e.message); }
      if (!state.plan) state.plan = state.rec.plan;
      state.step = 2; save(); render(); root.scrollIntoView({ block: 'start' });
    });
  }

  function step2() {
    const rec = state.rec || { track: state.child.age_band, plan: 'guided', reasons: [] };
    const a = AGES.find((x) => x.id === rec.track) || AGES[1];
    root.innerHTML = `<form id="f2" novalidate>
      <h2>Our recommendation for ${esc(state.child.nickname)}</h2>
      <div class="rec band-${a.id}"><span class="band-pill">Ages ${a.ages}</span><h3>${a.name} path</h3><p class="muted" style="margin:0">${a.desc}</p><ul>${rec.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
      <fieldset class="q plan-pick"><legend>Choose a plan</legend><div class="options">${plans.map((p) => radio('plan', p.id, state.plan === p.id, `<b>${esc(p.name)}${p.id === rec.plan ? ' · recommended' : ''}</b><span class="price"><strong>${naira(p.priceNGN)}</strong><small>${p.interval === 'month' ? '/ month' : 'once, 12 weeks'}</small></span><small>${esc(p.blurb)}</small>`)).join('')}</div></fieldset>
      <p class="small muted">Prices in Naira, paid securely with Paystack. Cancel any time. You can try a <a href="/try" target="_blank" rel="noopener">free sample lesson</a> first.</p>
      <p class="form-msg" role="alert"></p>
      <div class="onboard-actions"><button class="btn btn-quiet" type="button" data-back>Back</button><button class="btn btn-primary" type="submit">Continue</button></div>
    </form>`;
    root.querySelector('[data-back]').onclick = () => { state.step = 1; save(); render(); };
    root.querySelector('#f2').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const plan = new FormData(ev.target).get('plan');
      if (!plan) return setMsg(root.querySelector('.form-msg'), 'Please choose a plan.');
      state.plan = plan; state.step = 3; save(); render();
    });
  }

  function step3() {
    const plan = plans.find((p) => p.id === state.plan);
    root.innerHTML = `<form id="f3" class="form" novalidate>
      <div><h2>Create your parent account</h2><p class="muted" style="margin:0">You’ll use this to pay, see progress and manage settings. Your child gets their own simple login.</p></div>
      <label>Your name<input name="name" required autocomplete="name" maxlength="80"></label>
      <label>Email<input name="email" type="email" required autocomplete="email"><span class="hint">For your receipt, progress updates and login.</span></label>
      <label>Password<input name="password" type="password" required minlength="8" autocomplete="new-password"><span class="hint">At least 8 characters.</span></label>
      <label class="check"><input type="checkbox" name="consent" required><span>I am ${esc(state.child.nickname)}’s parent or legal guardian, I consent to ${esc(state.child.nickname)} using TinkerPath, and I agree to the <a href="/terms" target="_blank">terms</a> and <a href="/privacy" target="_blank">privacy policy</a>.</span></label>
      <p class="small muted" style="margin:0">Selected: <b>${esc(plan?.name || '')}</b> for ${esc(state.child.nickname)}. You’ll confirm and pay after verifying your email.</p>
      <p class="form-msg" role="alert"></p>
      <div class="onboard-actions"><button class="btn btn-quiet" type="button" data-back>Back</button><button class="btn btn-primary" type="submit">Create account</button></div>
      <p class="small center" style="margin:0">Already have an account? <a href="/login?next=/start">Log in</a></p>
    </form>`;
    root.querySelector('[data-back]').onclick = () => { state.step = 2; save(); render(); };
    const form = root.querySelector('#f3');
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const f = new FormData(form); const msg = form.querySelector('.form-msg'); const btn = form.querySelector('[type=submit]');
      const parent = { name: f.get('name'), email: f.get('email'), password: f.get('password'), consent: f.get('consent') === 'on' };
      if (!parent.name || !parent.email) return setMsg(msg, 'Please enter your name and email.');
      if (String(parent.password).length < 8) return setMsg(msg, 'Use a password with at least 8 characters.');
      if (!parent.consent) return setMsg(msg, 'Please tick the consent box to continue.');
      btn.disabled = true; btn.textContent = 'Creating account…';
      try {
        const r = await api('/api/signup', { method: 'POST', body: { parent, child: state.child, plan: state.plan } });
        state.email = parent.email; state.devOutbox = r.devOutbox; state.emailSent = r.emailSent; state.step = 4; save(); render();
      } catch (e) { setMsg(msg, e.message); btn.disabled = false; btn.textContent = 'Create account'; }
    });
  }

  // Logged-in parent adding another child.
  function step3Existing() {
    const plan = plans.find((p) => p.id === state.plan);
    root.innerHTML = `<div><h2>Add ${esc(state.child.nickname)} to your account</h2>
      <p class="muted">You’re logged in as ${esc(me.parent.email)}. ${me.children.length ? `As a sibling, ${esc(state.child.nickname)} gets 10% off.` : ''}</p>
      <p>Plan: <b>${esc(plan?.name || '')}</b></p><p class="form-msg" role="alert"></p>
      <div class="onboard-actions"><button class="btn btn-quiet" type="button" data-back>Back</button><button class="btn btn-primary" data-go>Add and continue to payment</button></div></div>`;
    root.querySelector('[data-back]').onclick = () => { state.step = 2; save(); render(); };
    root.querySelector('[data-go]').onclick = async (ev) => {
      const msg = root.querySelector('.form-msg'); ev.target.disabled = true;
      try {
        const r = await api('/api/children', { method: 'POST', body: { ...state.child, plan: state.plan } });
        sessionStorage.removeItem(KEY);
        if (!me.parent.verified) { location.href = '/parent'; return; }
        const c = await api('/api/checkout', { method: 'POST', body: { child_id: r.id, plan: state.plan } });
        location.href = c.url;
      } catch (e) { setMsg(msg, e.message); ev.target.disabled = false; }
    };
  }

  function step4() {
    root.innerHTML = `<div>
      <h2>Check your email</h2>
      <p>We sent a confirmation link to <b>${esc(state.email || 'your email')}</b>. Open it to confirm your address, then you’ll go straight to payment.</p>
      ${state.devOutbox ? '<div class="callout warn"><b>Development mode:</b> no email provider is connected, so the email is in the <a href="/dev/outbox" target="_blank">dev outbox</a>.</div>' : ''}
      ${state.emailSent === false ? '<div class="callout bad">We couldn’t send the email just now. Use "Resend email" below.</div>' : ''}
      <p class="form-msg" role="status"></p>
      <div class="onboard-actions"><button class="btn btn-quiet" data-resend>Resend email</button><button class="btn btn-primary" data-check>I’ve confirmed, continue</button></div>
      <p class="small muted">Can’t find it? Check your spam folder. The link works for 48 hours.</p></div>`;
    const msg = root.querySelector('.form-msg');
    root.querySelector('[data-resend]').onclick = async () => {
      try { const r = await api('/api/resend-verification', { method: 'POST' }); setMsg(msg, r.already ? 'Your email is already confirmed.' : 'Sent again. It can take a minute to arrive.', 'success'); } catch (e) { setMsg(msg, e.message); }
    };
    root.querySelector('[data-check]').onclick = async () => {
      try {
        const m = await api('/api/me');
        if (!m.parent.verified) return setMsg(msg, 'We haven’t seen the confirmation yet. Click the link in the email, then try again.');
        sessionStorage.removeItem(KEY); location.href = '/parent?verified=1';
      } catch (e) { setMsg(msg, e.message); }
    };
  }

  (async () => {
    try {
      plans = (await api('/api/plans')).plans;
      me = await api('/api/me').catch(() => null);
      if (me && state.step === 4) { state.step = 4; }
      render();
    } catch (e) { root.innerHTML = `<p class="feedback bad">${esc(e.message)}</p>`; }
  })();
})();

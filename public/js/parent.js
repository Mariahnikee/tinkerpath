'use strict';
/* Parent dashboard */
(() => {
  const { api, esc, toast, fmtDate, setMsg, naira } = window.TP;
  const root = document.getElementById('parent-app');
  const params = new URLSearchParams(location.search);
  let me; let report; let currentId = Number(params.get('child')) || null; let tab = params.get('tab') || 'overview';

  document.getElementById('app-header-slot').innerHTML = '<a class="nav-link hide-sm" href="/learn/login">Student login</a><button class="btn btn-quiet btn-sm" id="logout">Log out</button>';
  document.getElementById('logout').onclick = async () => { await api('/api/logout', { method: 'POST' }).catch(() => {}); location.href = '/'; };

  const STATUS = { active: ['Active', 'ok'], demo: ['Demo enrolment (not paid)', 'warn'], cancelled: ['Cancelled, ends soon', 'warn'], pending: ['Awaiting payment', 'warn'], expired: ['Expired', 'bad'] };

  function banners() {
    const out = [];
    const paid = params.get('paid');
    if (params.get('verified')) out.push(['ok', 'Email confirmed. Thank you!']);
    if (paid === '1') out.push(['ok', 'Payment confirmed with Paystack. Enrolment is active and a receipt is on its way.']);
    if (paid === 'demo') out.push(['warn', 'Demo enrolment created. No real payment was taken; this unlocks lessons for testing only.']);
    if (paid === 'pending') out.push(['info', 'We’re waiting for Paystack to confirm your payment. This usually takes a moment. Refresh shortly; if you were charged, access will unlock automatically.']);
    if (paid === 'cancelled') out.push(['warn', 'Payment was not completed. You can try again below.']);
    if (paid === 'error') out.push(['bad', 'We couldn’t confirm that payment. If you were charged, contact us with the reference from your Paystack receipt.']);
    let html = out.map(([k, t]) => `<div class="banner ${k}" role="status"><p>${esc(t)}</p></div>`).join('');
    if (!me.parent.verified) html += `<div class="banner warn"><p><b>Please confirm your email.</b> We sent a link to ${esc(me.parent.email)}. You’ll need it to enrol.${me.demoPayments ? ' (Dev: see the <a href="/dev/outbox" target="_blank">outbox</a>.)' : ''}</p><button class="btn btn-quiet btn-sm" id="resend">Resend email</button></div>`;
    if (me.demoPayments) html += '<div class="banner info"><p><b>Demo mode:</b> payments are simulated because Paystack keys are not configured.</p></div>';
    return html;
  }

  function enrolCard(c) {
    const pick = c.latest_enrolment?.plan_id && c.latest_enrolment.status !== 'expired' ? c.latest_enrolment.plan_id : c.preferred_plan;
    const sib = me.children.findIndex((k) => k.id === c.id) > 0;
    const expired = c.latest_enrolment?.status === 'expired';
    return `<section class="card">
      <h2>${expired ? `Renew ${esc(c.nickname)}’s access` : `Complete ${esc(c.nickname)}’s enrolment`}</h2>
      <p class="muted">${expired ? 'Their progress is saved. Renew to pick up where they left off.' : `${esc(c.nickname)} is set up on the ${esc(c.track)} path (${esc(c.ages)}). Choose a plan to unlock lessons.`}</p>
      <form id="pay-form" class="form">
        <div class="options plan-pick">${me.plans.map((p) => `<label class="option"><input type="radio" name="plan" value="${p.id}" ${p.id === pick ? 'checked' : ''}><span><b>${esc(p.name)}</b><span class="price"><strong>${naira(Math.round(p.priceNGN * (sib ? 1 - me.siblingDiscount : 1)))}</strong><small>${p.interval === 'month' ? '/ month' : 'once, 12 weeks'}</small></span><small>${esc(p.blurb)}</small></span></label>`).join('')}</div>
        ${sib ? '<p class="small muted" style="margin:0">Sibling price: 10% off.</p>' : ''}
        <p class="form-msg" role="alert"></p>
        <button class="btn btn-primary btn-lg" ${me.parent.verified ? '' : 'disabled'}>${me.paymentsLive ? 'Pay securely with Paystack' : 'Continue to demo checkout'}</button>
        ${me.parent.verified ? '' : '<p class="small muted" style="margin:0">Confirm your email first (see the yellow banner above).</p>'}
      </form></section>`;
  }

  function accessCard(c) {
    return `<section class="card"><h3>${esc(c.nickname)}’s login</h3>
      <p class="access-box">Learner name: <code>${esc(c.login_name)}</code></p>
      <p class="small muted">${c.has_pin ? 'A PIN is set. Set a new one below if it’s forgotten.' : 'Set a 4-digit PIN so they can log in at <b>/learn/login</b>.'}</p>
      <form id="pin-form" class="inline-form"><label>${c.has_pin ? 'New PIN' : 'PIN'}<input name="pin" inputmode="numeric" pattern="\\d{4}" maxlength="4" required autocomplete="off" class="pin-input"></label><button class="btn btn-primary">${c.has_pin ? 'Update PIN' : 'Set PIN'}</button></form>
      <p class="form-msg" role="status"></p>
      <p class="small muted">Tip: write the learner name and PIN down together. Don’t use a birthday.</p></section>`;
  }

  function overview(c) {
    if (!c.access) return enrolCard(c) + `<div style="height:20px"></div>` + accessCard(c);
    const r = report;
    return `<div class="stats">
        <div class="stat"><b>${c.lessons_done}/${c.lessons_total}</b><span>lessons completed</span></div>
        <div class="stat"><b>${r.badges.length}</b><span>badges earned</span></div>
        <div class="stat"><b>${r.projects.length}</b><span>projects submitted</span></div>
        <div class="stat"><b>${c.last_active_at ? fmtDate(c.last_active_at) : '—'}</b><span>last active</span></div>
      </div>
      <div class="dash-grid">
        <div class="grid-stack" style="display:grid;gap:20px">
          <section class="card"><h3>Up next</h3>${c.next_lesson ? `<p><b>${esc(c.next_lesson.title)}</b></p><p class="muted small">Encourage ${esc(c.nickname)} to do 2–3 lessons a week. Short and regular beats long and rare.</p>` : `<p>${esc(c.nickname)} has finished the current path. New modules are on the way.</p>`}</section>
          <section class="card"><h3>Recently completed</h3>${r.completed.length ? `<ul class="list">${r.completed.slice(0, 6).map((l) => `<li><span>${esc(l.title)}</span><span class="pill ${l.score >= 70 ? 'ok' : l.score == null ? '' : 'warn'}">${l.score == null ? 'Done' : `${l.score}%`}</span></li>`).join('')}</ul>` : `<div class="empty"><b>No lessons yet</b>Once ${esc(c.nickname)} completes a lesson, it shows here.</div>`}</section>
          <section class="card"><h3>Projects</h3>${r.projects.length ? r.projects.map((p) => `<p class="small muted" style="margin:0 0 4px">${esc(p.lesson)} · ${fmtDate(p.created_at)}</p><div class="project">${esc(p.content)}</div>`).join('') : `<div class="empty"><b>No projects yet</b>Projects appear here when submitted.</div>`}</section>
        </div>
        <div style="display:grid;gap:20px">
          ${accessCard(c)}
          <section class="card"><h3>Badges</h3>${r.badges.length ? `<div class="badges">${r.badges.map((b) => `<span class="badge"><span class="badge-medal">★</span><span>${esc(b.name)}<small>${esc(b.desc)}</small></span></span>`).join('')}</div>` : '<p class="muted small">Badges are earned by finishing lessons, modules and challenges.</p>'}</section>
        </div>
      </div>`;
  }

  function learning(c) {
    const r = report;
    return `<section class="card" style="margin-bottom:20px"><h2>What ${esc(c.nickname)} is learning</h2><p class="muted">${esc(r.track.name)} path, ages ${esc(r.track.ages)}: ${esc(r.track.tagline)}.</p>
      <h3>By the end of this path, ${esc(c.nickname)} should be able to:</h3><ul class="ticks">${r.outcomes.map((o) => `<li>${esc(o)}</li>`).join('')}</ul></section>
      <div class="grid-2">${r.modules.map((m) => `<section class="card"><h3>${esc(m.title)}</h3><p class="small muted">Why it matters: ${esc(m.why)}</p>
        <ul class="list">${m.lessons.map((l) => `<li><span>${esc(l.title)}<br><span class="small muted">${esc(l.summary)}</span></span><span class="pill ${l.done ? 'ok' : l.next ? 'info' : ''}">${l.done ? 'Done' : l.next ? 'Next' : `${l.minutes} min`}</span></li>`).join('')}</ul></section>`).join('')}</div>`;
  }

  function aiTab(c) {
    const r = report; const s = c.ai_status;
    const reason = { 'not-configured': 'Live AI isn’t connected on this server yet. Practice missions still work and are logged here.', age: 'Live AI is not offered for ages 7–9. Explorers learn about AI through guided, offline activities.', 'parent-off': 'Live AI is off. Practice missions still work.' }[s.reason];
    return `<div class="dash-grid"><section class="card"><h2>AI Lab activity</h2><p class="muted small">Every prompt ${esc(c.nickname)} writes in the AI Lab, including ones our filters blocked.</p>
        ${r.ai_logs.length ? r.ai_logs.map((l) => `<div class="logbox ${l.flagged ? 'flag' : ''}"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><span class="pill ${l.flagged ? 'bad' : l.mode === 'live' ? 'info' : ''}">${l.flagged ? `Flagged: ${esc(l.reason || '')}` : l.mode === 'live' ? 'Live AI' : 'Practice'}</span><span class="small muted">${fmtDate(l.created_at)}</span></div>
          <p><b>Prompt:</b> ${esc(l.prompt)}</p>${l.response ? `<p class="small"><b>${l.flagged ? 'Shown to learner' : 'Reply'}:</b> ${esc(l.response)}</p>` : ''}</div>`).join('') : '<div class="empty"><b>No AI Lab activity yet</b>Prompts appear here once your child tries a mission.</div>'}
      </section>
      <section class="card"><h3>Live AI access</h3>
        <label class="toggle"><span>Allow supervised live AI for ${esc(c.nickname)}</span><input type="checkbox" id="ai-toggle" ${c.ai_live_enabled ? 'checked' : ''} ${c.age_band === 'explorers' ? 'disabled' : ''}></label>
        <p class="small muted">${esc(reason || 'Live AI is on. Replies come from an external AI service after our filters. Daily limit applies.')}</p>
        <div class="callout small">Personal details are blocked before sending, topics are filtered both ways, and replies are kept short. Filters reduce risk but can’t catch everything, so please glance at this log now and then. <a href="/safety">How the AI Lab works</a></div>
      </section></div>`;
  }

  function account(c) {
    const e = c.latest_enrolment; const a = c.access;
    const st = STATUS[e?.status] || ['Not enrolled', ''];
    return `<div class="dash-grid"><div style="display:grid;gap:20px">
      <section class="card"><h2>Enrolment</h2>${e ? `<dl class="kv"><dt>Learner</dt><dd>${esc(c.nickname)}</dd><dt>Plan</dt><dd>${esc(e.plan)}</dd><dt>Amount</dt><dd>${esc(e.amount)}</dd><dt>Status</dt><dd><span class="pill ${st[1]}">${st[0]}</span></dd>${a ? `<dt>Access until</dt><dd>${fmtDate(a.period_end)}</dd>` : ''}<dt>Renewal</dt><dd>${a?.subscription ? 'Renews automatically via Paystack' : 'Does not auto-renew; we email you 3 days before it ends'}</dd></dl>
        <div style="display:flex;gap:10px;flex-wrap:wrap">${a?.subscription ? '<button class="btn btn-quiet" id="manage-sub">Manage subscription</button>' : ''}${a && !a.subscription && a.status !== 'cancelled' ? '<button class="btn btn-danger" id="cancel-enrol">Cancel enrolment</button>' : ''}${!a || a.status === 'cancelled' ? '<button class="btn btn-primary" data-tab="overview">Renew or enrol</button>' : ''}</div>
        <p class="form-msg" id="enrol-msg" role="status"></p>` : '<p class="muted">No enrolment yet.</p>'}</section>
      <section class="card"><h3>Need help?</h3><form id="help-form" class="form"><label>Topic<select name="topic"><option>Question about lessons</option><option>Payments or billing</option><option>Technical problem</option><option>Safety concern</option></select></label><label>Message<textarea name="message" rows="4" required maxlength="3000"></textarea></label><p class="form-msg" role="status"></p><button class="btn btn-primary">Send to support</button></form></section>
    </div><div style="display:grid;gap:20px">
      <section class="card"><h3>Email updates</h3><label class="toggle"><span>Weekly progress email</span><input type="checkbox" id="weekly-toggle" ${me.parent.weekly_updates ? 'checked' : ''}></label><p class="small muted">Sent on Sundays when there’s activity to report.</p></section>
      <section class="card"><h3>Safety &amp; policies</h3><ul class="list"><li><a href="/safety">How we keep AI learning safe</a></li><li><a href="/safeguarding">Safeguarding policy</a></li><li><a href="/privacy">Privacy and your child’s data</a></li><li><a href="/refunds">Refunds and cancellation</a></li></ul></section>
      ${!a ? `<section class="card"><h3>Remove ${esc(c.nickname)}</h3><p class="small muted">Deletes this learner profile and all their progress.</p><button class="btn btn-danger" id="remove-child">Remove learner</button></section>` : ''}
    </div></div>`;
  }

  async function load() {
    me = await api('/api/me');
    if (!me.children.length) { currentId = null; report = null; return render(); }
    if (!me.children.some((c) => c.id === currentId)) currentId = me.children[0].id;
    report = await api(`/api/children/${currentId}/report`);
    render();
  }

  function render() {
    const c = me.children.find((k) => k.id === currentId);
    const tabs = [['overview', 'Overview'], ['learning', 'Learning'], ['ai', 'AI Lab'], ['account', 'Account']];
    root.innerHTML = `<div class="wrap section" style="padding-top:32px">
      <div class="dash-head"><div><p class="eyebrow">Parent dashboard</p><h1>Hi ${esc(me.parent.name.split(' ')[0])}</h1></div><a class="btn btn-quiet btn-sm" href="/start">+ Add a child</a></div>
      ${banners()}
      ${!c ? `<div class="empty"><b>No learners yet</b><p>Add your child to get a recommended path.</p><a class="btn btn-primary" href="/start">Add a child</a></div>` : `
      ${me.children.length > 1 ? `<div class="child-switch" role="group" aria-label="Choose child">${me.children.map((k) => `<button data-child="${k.id}" aria-pressed="${k.id === c.id}">${esc(k.nickname)} <span class="small">· ${esc(k.track)}</span></button>`).join('')}</div>` : ''}
      <div class="child-head band-${c.age_band}"><span class="avatar" aria-hidden="true">${esc(c.nickname.charAt(0).toUpperCase())}</span><div><h2>${esc(c.nickname)}</h2><p class="small muted">${esc(c.track)} path \u00b7 ages ${esc(c.ages)} \u00b7 learner name <b>${esc(c.login_name)}</b></p></div><span class="pill ${c.access ? (c.access.status === 'active' ? 'ok' : 'warn') : 'warn'}">${c.access ? (STATUS[c.access.status] || ['Active'])[0] : 'Not enrolled yet'}</span></div>
      <div class="tabs" role="tablist">${tabs.map(([id, l]) => `<button role="tab" data-tab="${id}" aria-selected="${tab === id}">${l}</button>`).join('')}</div>
      <div role="tabpanel">${tab === 'learning' ? learning(c) : tab === 'ai' ? aiTab(c) : tab === 'account' ? account(c) : overview(c)}</div>`}
    </div>`;
    bind(c);
  }

  function bind(c) {
    const $ = (s) => root.querySelector(s);
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; history.replaceState(null, '', `/parent?tab=${tab}&child=${currentId}`); render(); }));
    root.querySelectorAll('[data-child]').forEach((b) => b.addEventListener('click', async () => { currentId = Number(b.dataset.child); report = await api(`/api/children/${currentId}/report`); render(); }));
    $('#resend')?.addEventListener('click', async (ev) => { try { await api('/api/resend-verification', { method: 'POST' }); toast('Confirmation email sent.'); ev.target.disabled = true; } catch (e) { toast(e.message); } });
    $('#pay-form')?.addEventListener('submit', async (ev) => {
      ev.preventDefault(); const msg = ev.target.querySelector('.form-msg'); const btn = ev.target.querySelector('button');
      const plan = new FormData(ev.target).get('plan'); if (!plan) return setMsg(msg, 'Please choose a plan.');
      btn.disabled = true; btn.textContent = 'Opening secure checkout…';
      try { const r = await api('/api/checkout', { method: 'POST', body: { child_id: c.id, plan } }); location.href = r.url; }
      catch (e) { setMsg(msg, e.message); btn.disabled = false; btn.textContent = 'Try again'; }
    });
    $('#pin-form')?.addEventListener('submit', async (ev) => {
      ev.preventDefault(); const msg = ev.target.parentElement.querySelector('.form-msg');
      try { await api(`/api/children/${c.id}/pin`, { method: 'POST', body: { pin: new FormData(ev.target).get('pin') } }); toast(`PIN saved. ${c.nickname} can log in as ${c.login_name}.`); await load(); }
      catch (e) { setMsg(msg, e.message); }
    });
    $('#ai-toggle')?.addEventListener('change', async (ev) => {
      try { await api(`/api/children/${c.id}/settings`, { method: 'POST', body: { ai_live_enabled: ev.target.checked } }); toast(ev.target.checked ? 'Live AI enabled.' : 'Live AI turned off.'); await load(); }
      catch (e) { ev.target.checked = !ev.target.checked; toast(e.message); }
    });
    $('#weekly-toggle')?.addEventListener('change', async (ev) => { try { await api('/api/settings', { method: 'POST', body: { weekly_updates: ev.target.checked } }); toast('Saved.'); me.parent.weekly_updates = ev.target.checked; } catch (e) { toast(e.message); } });
    $('#cancel-enrol')?.addEventListener('click', async () => {
      if (!confirm(`Cancel ${c.nickname}'s enrolment? Access continues until the end of the paid period.`)) return;
      try { const r = await api(`/api/enrolments/${c.access.enrolment_id}/cancel`, { method: 'POST' }); toast(r.message, 5000); await load(); } catch (e) { setMsg($('#enrol-msg'), e.message); }
    });
    $('#manage-sub')?.addEventListener('click', async () => { try { const r = await api(`/api/enrolments/${c.access.enrolment_id}/manage`); location.href = r.url; } catch (e) { setMsg($('#enrol-msg'), e.message); } });
    $('#remove-child')?.addEventListener('click', async () => {
      if (!confirm(`Remove ${c.nickname} and delete their progress? This can't be undone.`)) return;
      try { await api(`/api/children/${c.id}`, { method: 'DELETE' }); toast('Learner removed.'); currentId = null; await load(); } catch (e) { toast(e.message); }
    });
    $('#help-form')?.addEventListener('submit', async (ev) => {
      ev.preventDefault(); const msg = ev.target.querySelector('.form-msg'); const d = Object.fromEntries(new FormData(ev.target));
      try { await api('/api/support', { method: 'POST', body: d }); ev.target.reset(); setMsg(msg, 'Sent. We’ll reply by email within 2 working days.', 'success'); } catch (e) { setMsg(msg, e.message); }
    });
  }

  load().catch((e) => {
    if (e.status === 401) { location.href = '/login?next=/parent'; return; }
    root.innerHTML = `<div class="wrap section"><div class="banner bad"><p>${esc(e.message)}</p><button class="btn btn-quiet btn-sm" id="retry">Retry</button></div></div>`;
    root.querySelector('#retry').addEventListener('click', () => location.reload());
  });
})();

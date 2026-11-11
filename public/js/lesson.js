'use strict';
/* Lesson player: one step at a time, with a clear next step at the end. */
(() => {
  const { api, esc } = window.TP;
  const root = document.getElementById('lesson-app');
  const lessonId = root.dataset.lesson; const taster = Boolean(root.dataset.taster);
  const GRADED = ['quiz', 'sort', 'order', 'spot'];
  const slot = document.getElementById('app-header-slot');
  slot.innerHTML = taster ? '<a class="btn btn-primary btn-sm" href="/start">Enrol</a>' : '<a class="btn btn-quiet btn-sm" href="/learn">My path</a>';

  let lesson, next, i = 0; const results = []; const flags = {};

  function shell() {
    root.innerHTML = `<div class="wrap"><div class="lesson-shell band-${lesson.track}">
      ${taster ? '<div class="banner info"><p><b>Free sample lesson.</b> Progress isn’t saved. <a href="/start">Enrol</a> to unlock the full path.</p></div>' : ''}
      <div class="lesson-top"><div><h1 class="eyebrow" style="margin:0;font-family:var(--font)">${esc(lesson.title)}</h1></div><div class="step-dots" aria-hidden="true">${lesson.steps.map(() => '<i></i>').join('')}</div><span class="small muted" data-count></span></div>
      <section class="step-card" data-step tabindex="-1"></section>
      <div class="lesson-nav"><button class="btn btn-quiet" data-back>Back</button><button class="btn btn-primary" data-next disabled>Next</button></div>
    </div></div>`;
    root.querySelector('[data-back]').addEventListener('click', () => { if (i > 0) { i--; show(); } });
    root.querySelector('[data-next]').addEventListener('click', () => { if (i < lesson.steps.length - 1) { i++; show(); } else finish(); });
  }

  function show() {
    const step = lesson.steps[i]; const card = root.querySelector('[data-step]'); const nextBtn = root.querySelector('[data-next]');
    root.querySelectorAll('.step-dots i').forEach((d, k) => { d.className = k < i ? 'on' : k === i ? 'cur' : ''; });
    root.querySelector('[data-count]').textContent = `${i + 1} / ${lesson.steps.length}`;
    root.querySelector('[data-back]').disabled = i === 0;
    nextBtn.textContent = i === lesson.steps.length - 1 ? 'Finish lesson' : 'Next';
    nextBtn.disabled = !results[i];
    const ctx = { lessonId, taster, complete: (r) => {
      if (!results[i]) results[i] = { graded: GRADED.includes(step.type), correct: Boolean(r.correct) };
      if (r.strongPrompt) flags.strongPrompt = true; if (r.perfectSpot) flags.perfectSpot = true;
      nextBtn.disabled = false;
    } };
    if (results[i] && step.type !== 'read') { /* revisiting a finished step keeps Next enabled */ }
    window.Activities[step.type](card, step, ctx);
    if (results[i]) nextBtn.disabled = false;
    card.focus({ preventScroll: true }); window.scrollTo({ top: 0 });
  }

  async function finish() {
    const graded = results.filter((r) => r && r.graded); const score = graded.filter((r) => r.correct).length;
    const card = root.querySelector('[data-step]'); const nav = root.querySelector('.lesson-nav');
    let badges = []; let saveError = '';
    if (!taster) { try { badges = (await api(`/api/student/lessons/${lessonId}/complete`, { method: 'POST', body: { score, max: graded.length, ...flags } })).badges; } catch (e) { saveError = e.message; } }
    root.querySelectorAll('.step-dots i').forEach((d) => { d.className = 'on'; });
    nav.innerHTML = '';
    card.innerHTML = `<div class="done-screen"><div class="big" aria-hidden="true"><span>\u2605</span></div><h2>Lesson complete!</h2>
      ${graded.length ? `<p class="lead-sm">You got <b>${score} of ${graded.length}</b> checks right first time.</p>` : ''}
      ${saveError ? `<div class="feedback bad">We couldn’t save your progress: ${esc(saveError)} <button class="btn btn-quiet btn-sm" data-retry>Try again</button></div>` : ''}
      ${badges.length ? `<p><b>New badge${badges.length > 1 ? 's' : ''}!</b></p><div class="badges">${badges.map((b) => `<span class="badge"><span class="badge-medal">★</span><span>${esc(b.name)}<small>${esc(b.desc)}</small></span></span>`).join('')}</div>` : ''}
      ${taster ? `<p>That’s a taste of how ${'TinkerPath'} lessons work: short, hands-on, and always with a next step.</p><div class="palette" style="justify-content:center"><a class="btn btn-primary btn-lg" href="/start">Find your child’s path</a><a class="btn btn-quiet" href="/programmes">See all programmes</a></div>`
        : next ? `<p class="muted">Up next: <b>${esc(next.title)}</b></p><div class="palette" style="justify-content:center"><a class="btn btn-primary btn-lg" href="/learn/lesson/${next.id}">Next lesson</a><a class="btn btn-quiet" href="/learn">Back to my path</a></div>`
        : '<p>You’ve reached the end of this path!</p><a class="btn btn-primary btn-lg" href="/learn">Back to my path</a>'}</div>`;
    card.querySelector('[data-retry]')?.addEventListener('click', finish);
    card.focus();
  }

  (async () => {
    try {
      const data = taster ? await api('/api/lessons/taster') : await api(`/api/student/lessons/${lessonId}`);
      lesson = data.lesson; next = data.next; shell(); show();
    } catch (e) {
      if (e.status === 401) { location.href = '/learn/login'; return; }
      root.innerHTML = `<div class="wrap section"><div class="banner ${e.status === 403 ? 'warn' : 'bad'}"><p>${esc(e.message)}</p><a class="btn btn-quiet btn-sm" href="/learn">Back to my path</a></div></div>`;
    }
  })();
})();

'use strict';
/*
 * Interactive lesson activities. Each renderer receives (el, step, ctx) and calls
 * ctx.complete({ correct, strongPrompt, perfectSpot }) once the learner may move on.
 */
window.Activities = (() => {
  const { esc, md, api } = window.TP;

  const VIS = {
    devices: '<rect x="8" y="14" width="40" height="28" rx="3"/><path d="M4 48h48"/><rect x="50" y="22" width="12" height="22" rx="2"/>',
    recipe: '<rect x="14" y="8" width="36" height="48" rx="4"/><path d="M22 20h20M22 30h20M22 40h12"/><circle cx="19" cy="20" r="0.5"/>',
    grid: '<rect x="8" y="8" width="48" height="48" rx="4"/><path d="M24 8v48M40 8v48M8 24h48M8 40h48"/><path d="M16 48l0-16 16 0 0-16" stroke-dasharray="3 3"/>',
    pattern: '<circle cx="16" cy="16" r="6"/><circle cx="32" cy="16" r="6"/><circle cx="48" cy="16" r="6"/><rect x="10" y="36" width="12" height="12"/><rect x="26" y="36" width="12" height="12"/><path d="M48 36v12M42 42h12" />',
    shield: '<path d="M32 6l20 8v14c0 14-9 22-20 26C21 50 12 42 12 28V14z"/><path d="M24 30l6 6 11-12"/>',
    loop: '<path d="M44 20a16 16 0 10 4 16"/><path d="M48 12v10H38"/>',
    branch: '<path d="M32 54V34M32 34L16 18M32 34l16-16"/><circle cx="16" cy="14" r="4"/><circle cx="48" cy="14" r="4"/>',
    game: '<rect x="6" y="20" width="52" height="28" rx="12"/><path d="M18 28v12M12 34h12"/><circle cx="42" cy="30" r="2"/><circle cx="48" cy="38" r="2"/>',
    prompt: '<path d="M8 12h48v30H24l-12 10V42H8z"/><path d="M18 24h28M18 32h18"/>',
    check: '<circle cx="28" cy="28" r="16"/><path d="M40 40l14 14"/><path d="M21 28l5 5 9-10"/>',
    web: '<circle cx="32" cy="32" r="22"/><path d="M10 32h44M32 10c8 8 8 36 0 44M32 10c-8 8-8 36 0 44"/>',
    code: '<path d="M22 20L10 32l12 12M42 20l12 12-12 12M36 14l-8 36"/>',
    predict: '<path d="M8 20h18M8 32h26M8 44h14"/><rect x="38" y="36" width="18" height="12" rx="3" stroke-dasharray="3 3"/>',
  };
  const visual = (k) => k && VIS[k] ? `<div class="visual" aria-hidden="true"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${VIS[k]}</svg></div>` : '';
  const fb = (el, kind, text) => { let f = el.querySelector('.feedback'); if (!f) { f = document.createElement('div'); f.setAttribute('role', 'status'); el.appendChild(f); } f.className = `feedback ${kind}`; f.innerHTML = text; };
  const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  function read(el, s, ctx) {
    el.innerHTML = `<p class="step-kind">Learn</p>${visual(s.visual)}<h2>${esc(s.title)}</h2><div class="read-body">${s.body.map((p) => `<p>${md(p)}</p>`).join('')}</div>`;
    ctx.complete({});
  }

  function quiz(el, s, ctx) {
    el.innerHTML = `<p class="step-kind">Quick check</p><h2>${esc(s.question)}</h2><div class="answers">${s.options.map((o, i) => `<button class="answer" data-i="${i}"><span class="key">${'ABCD'[i]}</span>${esc(o)}</button>`).join('')}</div>`;
    let first = true;
    el.querySelectorAll('.answer').forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i); const ok = i === s.answer;
      if (ok) {
        el.querySelectorAll('.answer').forEach((x) => { x.disabled = true; });
        b.classList.add('correct'); fb(el, 'ok', `<b>${first ? 'Correct!' : 'You got it!'}</b> ${esc(s.explain)}`);
        ctx.complete({ correct: first });
      } else { b.classList.add('wrong'); b.disabled = true; first = false; fb(el, 'bad', 'Not quite. Have another go.'); }
    }));
  }

  function sort(el, s, ctx) {
    const items = shuffle(s.items.map((it, i) => ({ ...it, i })));
    const picks = {};
    el.innerHTML = `<p class="step-kind">Sort it</p><h2>${esc(s.title)}</h2><p class="muted">${esc(s.prompt)}</p>
      <div>${items.map((it) => `<div class="sort-item" data-i="${it.i}"><span>${esc(it.text)}</span><span class="seg" role="group" aria-label="${esc(it.text)}">${s.buckets.map((b, bi) => `<button type="button" data-b="${bi}" aria-pressed="false">${esc(b)}</button>`).join('')}</span></div>`).join('')}</div>
      <button class="btn btn-primary" data-check>Check my answers</button>`;
    el.querySelectorAll('.sort-item').forEach((row) => row.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      picks[row.dataset.i] = Number(b.dataset.b);
      row.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      row.classList.remove('correct', 'wrong');
    })));
    let tries = 0;
    el.querySelector('[data-check]').addEventListener('click', () => {
      if (Object.keys(picks).length < s.items.length) return fb(el, 'info', 'Choose an answer for every item first.');
      tries++; let right = 0;
      el.querySelectorAll('.sort-item').forEach((row) => { const ok = picks[row.dataset.i] === s.items[row.dataset.i].bucket; row.classList.toggle('correct', ok); row.classList.toggle('wrong', !ok); if (ok) right++; });
      if (right === s.items.length) { fb(el, 'ok', `<b>All ${right} correct!</b> Great sorting.`); ctx.complete({ correct: tries === 1 }); }
      else { fb(el, 'bad', `${right} of ${s.items.length} correct. Change the red ones and check again.`); if (tries >= 3) ctx.complete({ correct: false }); }
    });
  }

  function order(el, s, ctx) {
    let list = shuffle(s.items.map((t, i) => ({ t, i })));
    if (list.every((x, k) => x.i === k)) list = list.reverse();
    let tries = 0;
    const draw = () => {
      el.innerHTML = `<p class="step-kind">Put in order</p><h2>${esc(s.title)}</h2><p class="muted">${esc(s.prompt)} Use the arrows to move steps.</p>
        <div>${list.map((x, k) => `<div class="order-item" data-k="${k}"><span class="n">${k + 1}</span><span class="t">${esc(x.t)}</span><button class="icon-btn" data-up="${k}" aria-label="Move up" ${k === 0 ? 'disabled' : ''}>↑</button><button class="icon-btn" data-down="${k}" aria-label="Move down" ${k === list.length - 1 ? 'disabled' : ''}>↓</button></div>`).join('')}</div>
        <button class="btn btn-primary" data-check>Check order</button>`;
      el.querySelectorAll('[data-up]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.up); [list[k - 1], list[k]] = [list[k], list[k - 1]]; draw(); el.querySelector(`[data-up="${k - 1}"]`)?.focus(); }));
      el.querySelectorAll('[data-down]').forEach((b) => b.addEventListener('click', () => { const k = Number(b.dataset.down); [list[k + 1], list[k]] = [list[k], list[k + 1]]; draw(); el.querySelector(`[data-down="${k + 1}"]`)?.focus(); }));
      el.querySelector('[data-check]').addEventListener('click', () => {
        tries++; let right = 0;
        el.querySelectorAll('.order-item').forEach((row) => { const k = Number(row.dataset.k); const ok = list[k].i === k; row.classList.add(ok ? 'correct' : 'wrong'); if (ok) right++; });
        if (right === list.length) { fb(el, 'ok', '<b>Perfect order!</b> That’s exactly how an algorithm works.'); ctx.complete({ correct: tries === 1 }); }
        else { fb(el, 'bad', `${right} of ${list.length} in the right place. Move the red steps and try again.`); if (tries >= 3) ctx.complete({ correct: false }); }
      });
    };
    draw();
  }

  const DIRS = ['up', 'right', 'down', 'left'];
  const MOVE = { up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] };
  function grid(el, s, ctx) {
    const prog = []; let busy = false; let fails = 0;
    const isWall = (x, y) => s.walls.some(([a, b]) => a === x && b === y);
    el.innerHTML = `<p class="step-kind">Code it</p><h2>${esc(s.title)}</h2>
      <p class="muted">Build a program to move the kite to the star. It starts facing ${s.dir}.${s.maxBlocks ? ` Use ${s.maxBlocks} blocks or fewer, so you’ll need repeats!` : ''}</p>
      <div class="grid-game"><div class="board" style="grid-template-columns:repeat(${s.size},1fr)" aria-label="Puzzle grid">${Array.from({ length: s.size * s.size }, (_, n) => { const x = n % s.size; const y = Math.floor(n / s.size); return `<div class="cell ${isWall(x, y) ? 'wall' : ''} ${x === s.goal[0] && y === s.goal[1] ? 'goal' : ''}" data-x="${x}" data-y="${y}"></div>`; }).join('')}</div>
      <div><div class="palette">${s.allowRepeat ? '<label class="repeat-pick">Repeat <select data-rep><option>1</option><option>2</option><option>3</option><option>4</option></select>×</label>' : ''}<button class="btn btn-ghost" data-cmd="F">Forward</button><button class="btn btn-ghost" data-cmd="L">Turn left</button><button class="btn btn-ghost" data-cmd="R">Turn right</button></div>
      <div class="program" aria-live="polite" aria-label="Your program"></div>
      <div class="palette"><button class="btn btn-primary" data-run>▶ Run</button><button class="btn btn-quiet" data-undo>Undo</button><button class="btn btn-quiet" data-clear>Clear</button></div></div></div>`;
    const board = el.querySelector('.board'); const progEl = el.querySelector('.program');
    const NAMES = { F: 'Forward', L: 'Turn left', R: 'Turn right' };
    const kite = (d) => `<svg class="kite" viewBox="0 0 24 24" style="transform:rotate(${DIRS.indexOf(d) * 90}deg)" aria-label="kite facing ${d}"><path d="M12 2l7 9-7 11-7-11z" fill="#c2410c"/><path d="M12 2v20M5 11h14" stroke="#fff" stroke-width="1.2"/></svg>`;
    const place = (x, y, d, trail = []) => { board.querySelectorAll('.cell').forEach((c) => { const cx = Number(c.dataset.x); const cy = Number(c.dataset.y); c.classList.toggle('trail', trail.some(([a, b]) => a === cx && b === cy)); c.innerHTML = cx === x && cy === y ? kite(d) : ''; }); };
    const drawProg = () => { progEl.innerHTML = prog.length ? prog.map((p) => `<span class="blk">${NAMES[p.c]}${p.n > 1 ? ` ×${p.n}` : ''}</span>`).join('') : '<span class="muted small">Tap the commands above to add steps.</span>'; };
    place(s.start[0], s.start[1], s.dir); drawProg();
    el.querySelectorAll('[data-cmd]').forEach((b) => b.addEventListener('click', () => { if (busy) return; const n = Number(el.querySelector('[data-rep]')?.value || 1); prog.push({ c: b.dataset.cmd, n }); drawProg(); }));
    el.querySelector('[data-undo]').addEventListener('click', () => { if (!busy) { prog.pop(); drawProg(); } });
    el.querySelector('[data-clear]').addEventListener('click', () => { if (!busy) { prog.length = 0; drawProg(); place(s.start[0], s.start[1], s.dir); el.querySelector('.feedback')?.remove(); } });
    el.querySelector('[data-run]').addEventListener('click', async () => {
      if (busy || !prog.length) return fb(el, 'info', 'Add some commands first.');
      if (s.maxBlocks && prog.length > s.maxBlocks) return fb(el, 'info', `That’s ${prog.length} blocks. Can you do it in ${s.maxBlocks} or fewer? Try using Repeat.`);
      busy = true; let [x, y] = s.start; let d = s.dir; const trail = [[x, y]];
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches; const wait = () => new Promise((r) => setTimeout(r, reduce ? 0 : 280));
      place(x, y, d, trail);
      for (const p of prog) for (let k = 0; k < p.n; k++) {
        if (p.c === 'L') d = DIRS[(DIRS.indexOf(d) + 3) % 4];
        else if (p.c === 'R') d = DIRS[(DIRS.indexOf(d) + 1) % 4];
        else { const nx = x + MOVE[d][0]; const ny = y + MOVE[d][1];
          if (nx < 0 || ny < 0 || nx >= s.size || ny >= s.size || isWall(nx, ny)) { await wait(); busy = false; fails++; fb(el, 'bad', '<b>Bump!</b> The kite hit a wall or the edge. Find the step that went wrong, fix it, and run again. That’s debugging!'); if (fails >= 4) ctx.complete({}); return; }
          x = nx; y = ny; trail.push([x, y]); }
        place(x, y, d, trail); await wait();
      }
      busy = false;
      if (x === s.goal[0] && y === s.goal[1]) { fb(el, 'ok', `<b>You reached the star!</b> Your program used ${prog.length} blocks.`); ctx.complete({}); }
      else { fails++; fb(el, 'bad', 'So close! The kite stopped before the star. Add or change steps and run again.'); if (fails >= 4) ctx.complete({}); }
    });
  }

  const COLORS = { yellow: '#f5c518', orange: '#f28c28', green: '#3a9d4f', brown: '#8a5a2b', red: '#d64545' };
  const shapeSvg = (it) => `<svg viewBox="0 0 48 48" aria-hidden="true">${it.shape === 'round' ? `<circle cx="24" cy="24" r="16" fill="${COLORS[it.color]}"/>` : `<path d="M24 4C38 14 38 34 24 44 10 34 10 14 24 4z" fill="${COLORS[it.color]}"/><path d="M24 8v34" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>`}</svg>`;
  function train(el, s, ctx) {
    const labels = {};
    el.innerHTML = `<p class="step-kind">Train an AI</p><h2>${esc(s.title)}</h2><p class="muted">1. Label each training picture. 2. Press Train &amp; test to see what your AI learned.</p>
      <div class="shapes">${s.examples.map((e, i) => `<div class="shape-card" data-i="${i}">${shapeSvg(e)}<span class="small">${e.color} · ${e.shape}</span><span class="seg" role="group" aria-label="Label for ${e.color} ${e.shape} shape">${s.labels.map((l, li) => `<button type="button" data-l="${li}" aria-pressed="false">${esc(l)}</button>`).join('')}</span></div>`).join('')}</div>
      <p style="margin-top:16px"><button class="btn btn-primary" data-train>Train &amp; test</button></p><div data-results></div>`;
    el.querySelectorAll('.shape-card').forEach((card) => card.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { labels[card.dataset.i] = Number(b.dataset.l); card.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); })));
    el.querySelector('[data-train]').addEventListener('click', () => {
      if (Object.keys(labels).length < s.examples.length) return fb(el, 'info', 'Label every training picture first. The AI can only learn from labelled examples.');
      const data = s.examples.map((e, i) => ({ ...e, label: labels[i] }));
      const predict = (t) => { const sims = data.map((d) => (d.color === t.color ? 1 : 0) + (d.shape === t.shape ? 1 : 0)); const best = Math.max(...sims); const votes = [0, 0]; data.forEach((d, i) => { if (sims[i] === best) votes[d.label]++; }); return { label: votes[0] >= votes[1] ? 0 : 1, sure: best === 2 && Math.min(...votes) === 0 }; };
      el.querySelector('[data-results]').innerHTML = `<h3>Testing on pictures it has never seen</h3><div class="shapes">${s.tests.map((t) => { const p = predict(t); return `<div class="shape-card ${t.tricky ? 'tricky' : ''}">${shapeSvg(t)}<span class="small">${t.color} · ${t.shape}</span><b>AI says: ${esc(s.labels[p.label])}</b><span class="small muted">${p.sure ? 'Confident' : 'Just guessing'}</span></div>`; }).join('')}</div>`;
      fb(el, 'info', esc(s.lesson)); ctx.complete({});
    });
  }

  function prompt(el, s, ctx) {
    const m = s.mission;
    el.innerHTML = `<p class="step-kind">AI Lab</p><h2>${esc(s.title)}</h2>
      <div class="mission"><b>Your mission:</b> ${esc(m.goal)}</div>
      <div class="prompt-box"><label>Your prompt<textarea rows="3" maxlength="300" data-p placeholder="Type your prompt here…"></textarea></label><div class="counter"><span data-n>0</span>/300</div></div>
      <p class="small muted">Never include your name, school, address or other personal details in a prompt.</p>
      <div class="palette"><button class="btn btn-primary" data-send>Send prompt</button><button class="btn btn-quiet" data-ex>Show an example</button></div><div data-out></div>`;
    const ta = el.querySelector('[data-p]');
    ta.addEventListener('input', () => { el.querySelector('[data-n]').textContent = ta.value.length; });
    el.querySelector('[data-ex]').addEventListener('click', (ev) => { fb(el, 'info', `<b>Example strong prompt:</b> ${esc(m.example)}<br><span class="small">Try writing your own version, with your own details.</span>`); ev.target.disabled = true; });
    el.querySelector('[data-send]').addEventListener('click', async (ev) => {
      const text = ta.value.trim(); if (!text) return fb(el, 'info', 'Write a prompt first.');
      ev.target.disabled = true; ev.target.textContent = 'Thinking…';
      try {
        const r = ctx.taster ? { mode: 'practice', rubric: localRubric(text), reply: '(Log in to try AI Lab missions.)' } : await api('/api/student/ai', { method: 'POST', body: { prompt: text, lesson_id: ctx.lessonId, mission_id: m.id } });
        const rb = r.rubric; const names = { task: 'Task', audience: 'Audience', format: 'Format', detail: 'Detail', topic: 'On topic' };
        el.querySelector('[data-out]').innerHTML = `<div class="rubric" style="margin-top:14px">${Object.entries(rb.checks).map(([k, v]) => `<span class="${v ? 'ok' : ''}">${names[k]}</span>`).join('')}</div>
          ${rb.tips.length ? `<ul class="small" style="margin:10px 0 0">${rb.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="small" style="margin:10px 0 0"><b>Strong prompt!</b> It has every part.</p>'}
          ${r.blocked ? `<div class="feedback bad" style="margin-top:12px">${esc(r.message)}</div>` : `<div class="ai-reply"><span class="who">${r.mode === 'live' ? 'Live AI reply' : 'Example AI reply (practice mode)'}</span>${esc(r.reply)}</div><p class="small muted" style="margin-top:8px">${esc(r.note || '')}</p>`}`;
        el.querySelector(':scope > .feedback')?.remove();
        if (!r.blocked) ctx.complete({ strongPrompt: rb.level === 'strong' });
      } catch (e) { fb(el, 'bad', esc(e.message)); }
      finally { ev.target.disabled = false; ev.target.textContent = 'Try again'; }
    });
  }
  // Mirror of the server rubric for the public taster (no server call needed).
  function localRubric(p) { p = p.toLowerCase(); const checks = { task: /\b(write|explain|list|give|describe|create|make)\b/.test(p), audience: /\bfor\b|year[-\s]?old|kids?/.test(p), format: /\d+\s+(lines?|sentences?|bullet|points?)|\b(list|poem|story|short)\b/.test(p), detail: /\b(about|using|with|funny|simple)\b/.test(p) }; return { checks, tips: [], level: Object.values(checks).every(Boolean) ? 'strong' : 'partial' }; }

  function spot(el, s, ctx) {
    el.innerHTML = `<p class="step-kind">Fact check</p><h2>${esc(s.title)}</h2><p class="muted">${esc(s.prompt)}</p><div class="ai-reply" style="background:none;padding:0"><span class="who">AI answer</span>${s.sentences.map((x, i) => `<button class="sentence" data-i="${i}" aria-pressed="false">${esc(x.text)}</button>`).join('')}</div><button class="btn btn-primary" data-check>Check</button>`;
    el.querySelectorAll('.sentence').forEach((b) => b.addEventListener('click', () => { if (!b.dataset.locked) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }));
    let tries = 0;
    el.querySelector('[data-check]').addEventListener('click', (ev) => {
      tries++; let right = 0;
      el.querySelectorAll('.sentence').forEach((b) => { const x = s.sentences[b.dataset.i]; const picked = b.getAttribute('aria-pressed') === 'true'; b.classList.remove('correct', 'wrong'); if (picked === x.wrong) right++; if (picked && x.wrong) b.classList.add('correct'); else if (picked !== x.wrong) b.classList.add('wrong'); });
      if (right === s.sentences.length) {
        el.querySelectorAll('.sentence').forEach((b) => { const x = s.sentences[b.dataset.i]; b.dataset.locked = '1'; if (x.wrong) b.insertAdjacentHTML('beforeend', `<span class="fix">${esc(x.fix)}</span>`); });
        ev.target.remove(); fb(el, 'ok', '<b>Sharp eyes!</b> You found every problem. AI can sound sure and still be wrong.'); ctx.complete({ correct: tries === 1, perfectSpot: tries === 1 });
      } else { fb(el, 'bad', 'Not quite. Red means that choice needs another look. Think: which facts could you check in a textbook?'); if (tries >= 3) ctx.complete({ correct: false }); }
    });
  }

  function code(el, s, ctx) {
    el.innerHTML = `<p class="step-kind">Code it</p><h2>${esc(s.title)}</h2><p>${esc(s.instructions)}</p>
      <div class="code-wrap"><label>Your code<textarea spellcheck="false" autocapitalize="off" data-code>${esc(s.starter)}</textarea></label><label>Preview<iframe sandbox="" title="Preview of your page"></iframe></label></div>
      <p style="margin-top:12px"><button class="btn btn-primary" data-check>Check my code</button> <button class="btn btn-quiet" data-reset>Reset</button></p>`;
    const ta = el.querySelector('[data-code]'); const frame = el.querySelector('iframe');
    let t; const update = () => { frame.srcdoc = ta.value; };
    ta.addEventListener('input', () => { clearTimeout(t); t = setTimeout(update, 250); });
    ta.addEventListener('keydown', (e) => { if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const i = ta.selectionStart; ta.setRangeText('  ', i, ta.selectionEnd, 'end'); } });
    el.querySelector('[data-reset]').addEventListener('click', () => { ta.value = s.starter; update(); });
    let tries = 0;
    el.querySelector('[data-check]').addEventListener('click', () => {
      tries++; const miss = s.checks.filter((c) => !new RegExp(c.re, 'i').test(ta.value));
      if (!miss.length) { fb(el, 'ok', '<b>It works!</b> You just wrote real web code.'); ctx.complete({}); }
      else { fb(el, 'bad', `Almost! ${esc(miss[0].hint)}`); if (tries >= 4) ctx.complete({}); }
    });
    update();
  }

  function project(el, s, ctx) {
    el.innerHTML = `<p class="step-kind">Mini project</p><h2>${esc(s.title)}</h2><p>${esc(s.brief)}</p>
      <label>Your work<textarea rows="7" maxlength="2000" data-w placeholder="${esc(s.placeholder)}"></textarea></label>
      <p class="small muted">Your parent can see your projects. Keep personal details out.</p>
      <p><button class="btn btn-primary" data-save>${ctx.taster ? 'Done' : 'Submit project'}</button> <button class="btn btn-quiet" data-skip>Skip for now</button></p>`;
    el.querySelector('[data-skip]').addEventListener('click', () => { fb(el, 'info', 'Skipped. You can come back to this lesson any time.'); ctx.complete({}); });
    el.querySelector('[data-save]').addEventListener('click', async (ev) => {
      const content = el.querySelector('[data-w]').value.trim();
      if (content.length < 10) return fb(el, 'info', 'Write a little more first.');
      if (ctx.taster) { fb(el, 'ok', 'Nice work!'); return ctx.complete({}); }
      ev.target.disabled = true;
      try { await api('/api/student/projects', { method: 'POST', body: { lesson_id: ctx.lessonId, content } }); fb(el, 'ok', '<b>Project saved!</b> Your parent can see it in their dashboard.'); ctx.complete({}); }
      catch (e) { fb(el, 'bad', esc(e.message)); ev.target.disabled = false; }
    });
  }

  return { read, quiz, sort, order, grid, train, prompt, spot, code, project };
})();

'use strict';
/* Student dashboard */
(() => {
  const { api, esc } = window.TP;
  const root = document.getElementById('student-app');
  document.getElementById('app-header-slot').innerHTML = '<button class="btn btn-quiet btn-sm" id="logout">Log out</button>';
  document.getElementById('logout').onclick = async () => { await api('/api/student/logout', { method: 'POST' }).catch(() => {}); location.href = '/learn/login'; };

  function render(s) {
    const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
    const locked = !s.access;
    root.innerHTML = `<div class="wrap section band-${s.track.id}" style="padding-top:32px"><div class="learn-greet"><div><p class="eyebrow" style="margin-bottom:4px">${s.done ? 'Welcome back' : 'Welcome'}</p><h1>Hi ${esc(s.child.nickname)} <span aria-hidden="true">\u{1F44B}</span></h1></div><span class="band-pill">${esc(s.track.name)} \u00b7 ages ${esc(s.track.ages)}</span></div>
      ${s.demo ? '<div class="banner warn"><p>Demo account: lessons are unlocked for testing.</p></div>' : ''}
      <div class="learn-hero">
        ${locked ? `<div class="next-card"><span class="tag">Almost there</span><h2>Your path is ready</h2><p>Your ${esc(s.track.name)} path is ready. Ask your parent to finish enrolling you, then all your lessons unlock.</p><a class="btn btn-on-dark" href="/try">Try a free lesson now</a></div>`
          : s.next ? `<div class="next-card"><span class="tag">Next up · ${s.next.minutes} min</span><h2>${esc(s.next.title)}</h2><p>${esc(s.next.summary)}</p><a class="btn btn-primary btn-lg" href="/learn/lesson/${s.next.id}">${s.done ? 'Continue' : 'Start your first lesson'}</a></div>`
          : `<div class="next-card"><span class="tag">Path complete</span><h2>Amazing work, ${esc(s.child.nickname)}!</h2><p>You finished every lesson in this path. Replay any lesson below. New modules are coming soon.</p></div>`}
        <div class="card progress-card"><div class="ring" style="--p:${pct}" data-label="${pct}%" role="img" aria-label="${pct}% complete"></div><div><p class="eyebrow" style="margin-bottom:4px">Your progress</p><h3 style="margin:0">${s.done} of ${s.total} lessons</h3><p class="small muted" style="margin:6px 0 0">${esc(s.track.tagline)}</p></div></div>
      </div>
      <h2>Your path</h2>
      <div class="path">${s.modules.map((m, i) => `<section class="module"><h3><span class="band-pill">Module ${i + 1}</span> ${esc(m.title)}</h3>
        <div class="lesson-tiles">${m.lessons.map((l, li) => locked ? `<div class="lesson-tile" aria-disabled="true"><span class="status">\u{1F512} Locked</span><b>${esc(l.title)}</b><span class="small muted">${esc(l.summary)}</span></div>`
          : `<a class="lesson-tile ${l.done ? 'done' : ''} ${l.next ? 'next' : ''}" href="/learn/lesson/${l.id}"><span class="tile-top"><span class="tile-n">${l.done ? '\u2713' : li + 1}</span><span class="status">${l.done ? 'Done' : l.next ? 'Next up' : `${l.minutes} min`}</span></span><b>${esc(l.title)}</b><span class="small muted">${esc(l.summary)}</span></a>`).join('')}</div></section>`).join('')}</div>
      <div class="grid-2" style="margin-top:32px">
        <section class="card"><h3>Your badges</h3>${s.badges.length ? `<div class="badges">${s.badges.map((b) => `<span class="badge"><span class="badge-medal">★</span><span>${esc(b.name)}<small>${esc(b.desc)}</small></span></span>`).join('')}</div>` : '<div class="empty"><b>No badges yet</b>Finish your first lesson to earn one!</div>'}</section>
        <section class="card"><h3>Your projects</h3>${s.projects.length ? s.projects.slice(0, 3).map((p) => `<p class="small muted" style="margin:0 0 4px">${esc(p.lesson)}</p><div class="project">${esc(p.content)}</div>`).join('') : '<div class="empty"><b>No projects yet</b>Some lessons end with a mini project. They show up here.</div>'}</section>
      </div>
      <p class="small muted center" style="margin-top:32px">Remember: never share your full name, address, school or passwords online. If something online worries you, tell a trusted adult.</p>
    </div>`;
  }

  api('/api/student/me').then(render).catch((e) => {
    if (e.status === 401) { location.href = '/learn/login'; return; }
    root.innerHTML = `<div class="wrap section"><div class="banner bad"><p>${esc(e.message)}</p></div></div>`;
  });
})();

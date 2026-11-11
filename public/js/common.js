'use strict';
/* Shared helpers for every page. No framework; small and readable. */
window.TP = (() => {
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  async function api(path, { method = 'GET', body } = {}) {
    let res;
    try {
      res = await fetch(path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined, credentials: 'same-origin' });
    } catch {
      throw new Error('You seem to be offline. Check your connection and try again.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { const e = new Error(data.error || 'Something went wrong. Please try again.'); e.status = res.status; throw e; }
    return data;
  }

  function toast(msg, ms = 3200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  function setMsg(el, text, kind = 'error') { if (!el) return; el.textContent = text || ''; el.className = `form-msg ${text ? kind : ''}`; }

  /** Wraps a submit handler with busy state and error display. */
  function onSubmit(form, fn) {
    if (!form) return;
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const btn = form.querySelector('button[type="submit"], button:not([type])');
      const msg = form.querySelector('.form-msg');
      setMsg(msg, '');
      const label = btn && btn.textContent;
      if (btn) { btn.disabled = true; btn.textContent = 'Please wait…'; }
      try { await fn(Object.fromEntries(new FormData(form)), msg); }
      catch (err) { setMsg(msg, err.message); }
      finally { if (btn && document.body.contains(btn)) { btn.disabled = false; btn.textContent = label; } }
    });
  }

  const fmtDate = (iso) => iso ? new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const naira = (n) => '₦' + Number(n).toLocaleString('en-NG');
  const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');

  return { esc, api, toast, setMsg, onSubmit, fmtDate, naira, md };
})();

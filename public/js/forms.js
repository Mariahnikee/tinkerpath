'use strict';
(() => {
  const { api, onSubmit, setMsg } = window.TP;
  const $ = (s) => document.querySelector(s);

  onSubmit($('#login-form'), async (d) => {
    if (!d.email || !d.password) throw new Error('Enter your email and password.');
    await api('/api/login', { method: 'POST', body: d });
    location.href = $('#login-form').dataset.next || '/parent';
  });

  onSubmit($('#forgot-form'), async (d, msg) => {
    if (!d.email) throw new Error('Enter your email address.');
    await api('/api/forgot', { method: 'POST', body: d });
    setMsg(msg, 'If an account exists for that email, a reset link is on its way.', 'success');
  });

  onSubmit($('#reset-form'), async (d, msg) => {
    await api('/api/reset', { method: 'POST', body: { ...d, token: $('#reset-form').dataset.token } });
    setMsg(msg, 'Password updated. Taking you to log in…', 'success');
    setTimeout(() => { location.href = '/login'; }, 1200);
  });

  onSubmit($('#student-login-form'), async (d) => {
    if (!d.login_name || !/^\d{4}$/.test(d.pin || '')) throw new Error('Enter your learner name and 4-digit PIN.');
    await api('/api/student/login', { method: 'POST', body: d });
    location.href = '/learn';
  });

  onSubmit($('#support-form'), async (d, msg) => {
    await api('/api/support', { method: 'POST', body: d });
    $('#support-form').reset();
    setMsg(msg, 'Thanks! Your message was sent. We’ll reply by email within 2 working days.', 'success');
  });

  onSubmit($('#demo-pay'), async () => {
    await api('/api/demo/complete', { method: 'POST', body: { reference: $('#demo-pay').dataset.ref } });
    location.href = '/parent?paid=demo';
  });
})();

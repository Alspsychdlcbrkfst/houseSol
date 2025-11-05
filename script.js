// Mobile nav toggle
const body = document.body;
const toggle = document.querySelector('.nav-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Elevation on scroll
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY || window.pageYOffset;
  if (y > 8 && lastY <= 8) body.classList.add('is-scrolled');
  if (y <= 8 && lastY > 8) body.classList.remove('is-scrolled');
  lastY = y;
};
window.addEventListener('scroll', onScroll);
onScroll();

// Reveal on view
const revealEls = Array.from(document.querySelectorAll('.section, .card, .case, .quote, .about-card'));
revealEls.forEach(el => el.setAttribute('data-reveal', ''));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, {threshold: 0.15});
revealEls.forEach(el => io.observe(el));

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ============================================================
   CONTACT FORM — Formspree (AJAX). NO mailto anywhere.
   Requires: <form class="form" action="https://formspree.io/f/mdkpqgyp" data-ajax>
============================================================ */
const form = document.querySelector('.form[data-ajax]');
if (form) {
  const btn = form.querySelector('button[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const failureEl = form.querySelector('.form-failure');

  // Ensure there is no legacy handler on submit button or form
  form.removeAttribute('onsubmit');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Honeypot (spam trap)
    const hp = (form.querySelector('input[name="company"]')?.value || '').trim();
    if (hp) return;

    // Basic validation
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const budget = form.budget.value;
    const message = form.message.value.trim();
    const consent = document.getElementById('consent')?.checked;

    const setErr = (id, msg) => {
      const field = document.getElementById(id);
      const small = field?.closest('.field')?.querySelector('.error');
      if (small) small.textContent = msg;
    };
    form.querySelectorAll('.error').forEach(s => (s.textContent = ''));
    successEl.hidden = true;
    failureEl.hidden = true;

    let ok = true;
    if (!name) { setErr('name', 'Please enter your name.'); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email.'); ok = false; }
    if (!budget) { setErr('budget', 'Select a budget.'); ok = false; }
    if (!message || message.length < 12) { setErr('message', 'Tell us a bit more (12+ chars).'); ok = false; }
    if (!consent) { alert('Please agree to the privacy policy.'); ok = false; }

    if (!ok) return;

    // Send
    btn.disabled = true;
    const prev = btn.textContent;
    btn.textContent = 'Sending…';

    try {
      const endpoint = form.getAttribute('action'); // e.g. https://formspree.io/f/mdkpqgyp
      if (!/^https:\/\/formspree\.io\/f\//.test(endpoint)) throw new Error('Form endpoint missing/invalid.');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, budget, message, source: 'house sol — GitHub Pages' })
      });

      if (res.ok) {
        successEl.hidden = false;
        form.reset();
      } else {
        let details = '';
        try { details = (await res.json())?.errors?.[0]?.message || ''; } catch {}
        failureEl.textContent = details ? `Submission failed: ${details}` : 'Hmm, something went wrong. Please try again.';
        failureEl.hidden = false;
      }
    } catch (err) {
      failureEl.textContent = err?.message || 'Network error. Please try again.';
      failureEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = prev;
    }
  });
}

/* --------- HARD GUARANTEE: remove any mailto handlers --------- */
// If some legacy code tries to assign window.location to mailto, stop it.
(function guardAgainstMailto() {
  const origAssign = window.location.assign;
  window.location.assign = function(url) {
    if (typeof url === 'string' && url.trim().startsWith('mailto:')) {
      console.warn('Blocked legacy mailto redirect from JS. Update your code.');
      return; // block
    }
    return origAssign.call(window.location, url);
  };
})();

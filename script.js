/* ================================================================
   house sol — main JavaScript
   Handles: navigation, scroll effects, reveal animations,
   and Formspree-powered contact form submission.
================================================================ */

// ---------- Navigation ----------
const body = document.body;
const toggle = document.querySelector('.nav-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// ---------- Header elevation ----------
let lastY = 0;
const onScroll = () => {
  const y = window.scrollY || window.pageYOffset;
  if (y > 8 && lastY <= 8) body.classList.add('is-scrolled');
  if (y <= 8 && lastY > 8) body.classList.remove('is-scrolled');
  lastY = y;
};
window.addEventListener('scroll', onScroll);
onScroll();

// ---------- Section reveal ----------
const revealEls = Array.from(document.querySelectorAll('.section, .card, .case, .quote, .about-card'));
revealEls.forEach(el => el.setAttribute('data-reveal', ''));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) e.target.classList.add('revealed');
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

// ---- Hero fade + subtle parallax on scroll ----
const heroEl = document.querySelector('.hero');
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateHeroEffects() {
  if (!heroEl || prefersReduced) return;

  const rect = heroEl.getBoundingClientRect();
  const viewportTop = Math.max(0, -rect.top);          // how much we've scrolled into the hero
  const heroHeight = Math.max(1, rect.height);         // avoid /0

  // Fade out over ~70% of hero height
  const progress = Math.min(1, viewportTop / (heroHeight * 0.7));
  const opacity = 1 - progress;

  // Gentle parallax upward (20% of scroll)
  const shift = Math.round(viewportTop * 0.2) + 'px';

  heroEl.style.setProperty('--hero-opacity', opacity.toString());
  heroEl.style.setProperty('--hero-shift', '-' + shift);
}

// Hook into your existing scroll handler
const _prevOnScroll = onScroll;
const onScrollCombined = () => {
  _prevOnScroll && _prevOnScroll();
  updateHeroEffects();
};
window.removeEventListener('scroll', onScroll);
window.addEventListener('scroll', onScrollCombined, { passive: true });
// Initial paint
updateHeroEffects();

// ---------- Footer year ----------
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ================================================================
   CONTACT FORM — Formspree (AJAX + fallback)
   No mailto:, progressive enhancement, success animation
================================================================ */
(function wireForm() {
  const form = document.querySelector('form.form[data-ajax]');
  if (!form) return;

  const endpoint = form.getAttribute('action') || '';
  if (!/^https:\/\/formspree\.io\/f\//.test(endpoint)) {
    console.error('[house-sol] Invalid Formspree endpoint');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const failureEl = form.querySelector('.form-failure');

  form.removeAttribute('onsubmit'); // remove any inline handler

  const setErr = (id, msg) => {
    const field = document.getElementById(id);
    const small = field?.closest('.field')?.querySelector('.error');
    if (small) small.textContent = msg;
  };

  // Fallback to normal POST if AJAX blocked
  function fallbackPost() {
    console.warn('[house-sol] Fallback: normal POST to Formspree');
    form.removeEventListener('submit', onSubmit);
    form.removeAttribute('data-ajax');
    form.submit();
  }

  async function onSubmit(e) {
    e.preventDefault();

    // Honeypot
    const hp = (form.querySelector('input[name="company"]')?.value || '').trim();
    if (hp) return;

    // Reset states
    successEl.hidden = true;
    failureEl.hidden = true;
    form.querySelectorAll('.error').forEach(s => (s.textContent = ''));

    // Validation
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const budget = form.budget.value;
    const message = form.message.value.trim();
    const consent = document.getElementById('consent')?.checked;

    let valid = true;
    if (!name) { setErr('name', 'Please enter your name.'); valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email.'); valid = false; }
    if (!budget) { setErr('budget', 'Select a budget.'); valid = false; }
    if (!message || message.length < 12) { setErr('message', 'Tell us a bit more (12+ chars).'); valid = false; }
    if (!consent) { alert('Please agree to the privacy policy.'); valid = false; }
    if (!valid) return;

    // Button state → Sending…
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      if (typeof fetch !== 'function') return fallbackPost();

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name, email, budget, message,
          source: 'housesol.co — GitHub Pages'
        }),
        mode: 'cors',
        redirect: 'follow',
        credentials: 'omit'
      });

      if (res.ok) {
        successEl.hidden = false;
        form.reset();

        // 🎉 Show "Sent ✓" for 2 seconds, then restore
        btn.textContent = 'Sent ✓';
        btn.classList.add('btn--ok');
        setTimeout(() => {
          btn.textContent = originalLabel;
          btn.classList.remove('btn--ok');
          btn.disabled = false;
        }, 2000);
        return; // skip finally
      } else {
        try {
          const data = await res.json();
          if (data?.errors?.length) {
            failureEl.textContent = `Submission failed: ${data.errors[0].message}`;
          }
        } catch {}
        failureEl.hidden = false;
        btn.textContent = 'Try again';
      }
    } catch (err) {
      console.error('[house-sol] AJAX error:', err);
      failureEl.hidden = false;
      btn.textContent = 'Try again';
    } finally {
      // Only reset if we didn’t succeed
      if (btn.textContent !== 'Sent ✓') {
        btn.disabled = false;
      }
    }
  }

  form.addEventListener('submit', onSubmit);
})();

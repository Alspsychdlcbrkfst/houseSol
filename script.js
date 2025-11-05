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
document.getElementById('year').textContent = new Date().getFullYear();

/* ------------------------------------------------------------------
   FORM: Direct submit via Formspree (AJAX) — no Mail app
   - Keep client-side validation
   - Honeypot field "company" for spam mitigation
------------------------------------------------------------------- */
const form = document.querySelector('.form[data-ajax]');
if (form) {
  const btn = form.querySelector('button[type="submit"]');
  const successEl = form.querySelector('.form-success');
  const failureEl = form.querySelector('.form-failure');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const budget = form.budget.value;
    const message = form.message.value.trim();
    const consent = document.getElementById('consent').checked;

    // Honeypot (bots will fill; humans won't)
    const honeypot = (form.querySelector('input[name="company"]')?.value || '').trim();
    if (honeypot) return; // silently drop

    // clear errors & notices
    form.querySelectorAll('.error').forEach(s => (s.textContent = ''));
    successEl.hidden = true;
    failureEl.hidden = true;

    // client-side validation
    let ok = true;
    if (!name) { setErr('name', 'Please enter your name.'); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email.'); ok = false; }
    if (!budget) { setErr('budget', 'Select a budget.'); ok = false; }
    if (!message || message.length < 12) { setErr('message', 'Tell us a bit more (12+ chars).'); ok = false; }
    if (!consent) { alert('Please agree to the privacy policy.'); ok = false; }

    if (!ok) return;

    // disable while sending
    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = 'Sending…';

    try {
      const endpoint = form.getAttribute('action'); // YOUR_FORMSPREE_ENDPOINT
      if (!endpoint || !/^https:\/\/formspree\.io\/f\//.test(endpoint)) {
        throw new Error('Formspree endpoint is missing or invalid.');
      }

      const payload = {
        name,
        email,
        budget,
        message,
        source: 'housesol (GitHub Pages)'
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        successEl.hidden = false;
        form.reset();
      } else {
        // Attempt to parse any error details
        let details = '';
        try { const data = await res.json(); details = data?.errors?.[0]?.message || ''; } catch {}
        failureEl.textContent = details ? `Submission failed: ${details}` : 'Hmm, something went wrong. Please try again in a moment.';
        failureEl.hidden = false;
      }
    } catch (err) {
      failureEl.textContent = err?.message || 'Network error. Please try again shortly.';
      failureEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = originalLabel;
    }
  });
}

function setErr(fieldId, msg){
  const field = document.getElementById(fieldId);
  const small = field.closest('.field').querySelector('.error');
  small.textContent = msg;
}

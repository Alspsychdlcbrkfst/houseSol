// ---------------- General UI ----------------
const body = document.body;
const toggle = document.querySelector('.nav-toggle');
if (toggle) {
  toggle.addEventListener('click', () => {
    const open = body.classList.toggle('nav-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

let lastY = 0;
const onScroll = () => {
  const y = window.scrollY || window.pageYOffset;
  if (y > 8 && lastY <= 8) body.classList.add('is-scrolled');
  if (y <= 8 && lastY > 8) body.classList.remove('is-scrolled');
  lastY = y;
};
window.addEventListener('scroll', onScroll);
onScroll();

const revealEls = Array.from(document.querySelectorAll('.section, .card, .case, .quote, .about-card'));
revealEls.forEach(el => el.setAttribute('data-reveal', ''));
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
}, {threshold: 0.15});
revealEls.forEach(el => io.observe(el));

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --------------- Contact Form (AJAX + fallback) ----------------
(function wireForm() {
  const form = document.querySelector('form.form[data-ajax]');
  if (!form) {
    console.warn('[house-sol] form not found or missing data-ajax');
    return;
  }

  // Sanity check: action must be Formspree
  const endpoint = form.getAttribute('action') || '';
  const isFormspree = /^https:\/\/formspree\.io\/f\//.test(endpoint);
  console.log('[house-sol] endpoint:', endpoint);
  if (!isFormspree) {
    console.error('[house-sol] Invalid/missing Formspree endpoint.');
    return;
  }

  const btn = form.querySelector('button[type="submit"]');
  const ok = form.querySelector('.form-success');
  const err = form.querySelector('.form-failure');

  // Clear legacy inline handler if any
  form.removeAttribute('onsubmit');

  // Utility for field errors
  function setErr(id, msg){
    const field = document.getElementById(id);
    const small = field?.closest('.field')?.querySelector('.error');
    if (small) small.textContent = msg;
  }

  // Fallback: submit the form as a normal POST to Formspree (no AJAX)
  // This will navigate to Formspree's thank-you page.
  function fallbackPost() {
    console.warn('[house-sol] Using fallback HTML POST (AJAX blocked).');
    // Temporarily remove our listener to avoid preventDefault loop
    form.removeEventListener('submit', onSubmit);
    // Remove data-ajax so future loads do default POST
    form.removeAttribute('data-ajax');
    form.submit();
  }

  async function onSubmit(e) {
    e.preventDefault();
    console.log('[house-sol] submit fired');

    // Honeypot
    const hp = (form.querySelector('input[name="company"]')?.value || '').trim();
    if (hp) { console.warn('[house-sol] honeypot triggered'); return; }

    // Reset messages
    ok.hidden = true; err.hidden = true;
    form.querySelectorAll('.error').forEach(s => (s.textContent = ''));

    // Basic validation
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

    // Disable button and send
    const original = btn.textContent;
    btn.disabled = true; btn.textContent = 'Sending…';

    try {
      // If fetch is missing/blocked, go to fallback
      if (typeof fetch !== 'function') {
        console.warn('[house-sol] fetch not available');
        return fallbackPost();
      }

      // Some privacy extensions block cross-site POST; try AJAX
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name, email, budget, message, source: 'house sol — GitHub Pages' }),
        // Keep it simple to avoid preflight issues with strict environments
        mode: 'cors',
        redirect: 'follow',
        credentials: 'omit'
      });

      console.log('[house-sol] response:', res.status, res.ok);
      if (res.ok) {
        ok.hidden = false;
        form.reset();
      } else {
        // If blocked by extension / CORS policy, fall back to normal POST
        try {
          const data = await res.json().catch(() => null);
          if (data?.errors?.length) {
            err.textContent = `Submission failed: ${data.errors[0].message}`;
            err.hidden = false;
          } else {
            // Use fallback when non-200 without useful details
            return fallbackPost();
          }
        } catch {
          return fallbackPost();
        }
      }
    } catch (ex) {
      console.error('[house-sol] AJAX error, falling back:', ex);
      return fallbackPost();
    } finally {
      btn.disabled = false; btn.textContent = original;
    }
  }

  form.addEventListener('submit', onSubmit);
})();

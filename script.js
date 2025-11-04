// Mobile nav toggle
const header = document.querySelector('.site-header');
const body = document.body;
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');

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

// Form validation + mailto handoff (no backend)
const form = document.querySelector('.form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const budget = form.budget.value;
    const message = form.message.value.trim();
    const consent = document.getElementById('consent').checked;

    // clear errors
    form.querySelectorAll('.error').forEach(s => s.textContent = '');

    let ok = true;

    if (!name) { setErr('name', 'Please enter your name.'); ok = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr('email', 'Enter a valid email.'); ok = false; }
    if (!budget) { setErr('budget', 'Select a budget.'); ok = false; }
    if (!message || message.length < 12) { setErr('message', 'Tell us a bit more (12+ chars).'); ok = false; }
    if (!consent) { alert('Please agree to the privacy policy.'); ok = false; }

    if (!ok) return;

    // Compose email
    const subject = encodeURIComponent(`New inquiry — house sol`);
    const body = encodeURIComponent(
`Name: ${name}
Email: ${email}
Budget: ${budget}

Project:
${message}

— Sent from housesol.agency`
    );
    const mailto = `mailto:hello@housesol.agency?subject=${subject}&body=${body}`;
    // Success message and open email client
    form.querySelector('.form-success').hidden = false;
    window.location.href = mailto;
    form.reset();
  });
}

function setErr(fieldId, msg){
  const field = document.getElementById(fieldId);
  const small = field.closest('.field').querySelector('.error');
  small.textContent = msg;
}
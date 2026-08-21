// Welcome/splash logic
const TOTAL = 20; // seconds
let remaining = TOTAL;
let timerId = null;
let endTimeout = null;
let motionTimeouts = [];

const progressFill = document.getElementById('progressFill');
const countdownEl = document.getElementById('countdown');
const skipBtn = document.getElementById('skipBtn');
const walkBtn = document.getElementById('walkBtn');
const dontShow = document.getElementById('dontShow');

function startSplash() {
  // Start countdown tick
  countdownEl.textContent = remaining;
  timerId = setInterval(() => {
    remaining -= 1;
    countdownEl.textContent = remaining;
    const pct = Math.max(0, ((TOTAL - remaining) / TOTAL) * 100);
    progressFill.style.width = pct + '%';
    if (remaining <= 0) {
      clearInterval(timerId);
    }
  }, 1000);

  // Ensure full-fill at end and redirect after TOTAL seconds
  endTimeout = setTimeout(() => {
    finishSplash();
  }, TOTAL * 1000);

  // Animate progress-fill smoothly to 100% over TOTAL seconds (nice fallback)
  progressFill.style.transition = `width ${TOTAL}s linear`;
  progressFill.style.width = '100%';

  // Start enhanced motion graphics sequence (prefer GSAP timeline; fallback to CSS sequence)
  if (!playAutoGSAPMotion()) startMotionSequence();
}

function clearMotionSequence() {
  motionTimeouts.forEach(t => {
    try {
      // if a GSAP timeline was stored, kill it
      if (t && typeof t.kill === 'function') t.kill();
    } catch (err) {}
    try { clearTimeout(t); } catch (err) {}
  });
  motionTimeouts = [];
  const plane = document.querySelector('.logo-plane');
  const inner = document.querySelector('.splash-inner');
  if (plane) {
    plane.classList.remove('fly-in', 'expand');
  }
  if (inner) inner.classList.remove('reveal');
}

function startMotionSequence() {
  const plane = document.querySelector('.logo-plane');
  const inner = document.querySelector('.splash-inner');
  if (!plane || !inner) return;

  // Reset classes
  plane.classList.remove('fly-in', 'expand');
  inner.classList.remove('reveal');

  // Step 1: fly-in from left
  motionTimeouts.push(setTimeout(() => {
    plane.classList.add('fly-in');
  }, 200));

  // Step 2: after fly-in, pause then expand and center
  motionTimeouts.push(setTimeout(() => {
    plane.classList.remove('fly-in');
    plane.classList.add('expand');
  }, 2000));

  // Step 3: reveal the content
  motionTimeouts.push(setTimeout(() => {
    inner.classList.add('reveal');
  }, 2400));

  // Step 4: subtle settle (remove expand)
  motionTimeouts.push(setTimeout(() => {
    plane.classList.remove('expand');
  }, 3400));
}

// If GSAP is available, use it for an After Effects-like timeline
function startGSAPSequence() {
  if (typeof gsap === 'undefined') return false;
  clearMotionSequence();
  const plane = document.querySelector('.logo-plane');
  const trail = document.querySelector('.plane-trail');
  const title = document.getElementById('welcomeTitle');
  const lead = document.querySelector('.lead');
  const progress = document.querySelector('.progress-wrap');

  // Reset
  gsap.set([plane, trail, title, lead, progress], { clearProps: 'all' });

  const tl = gsap.timeline();

  // Plane swoops in from left with trail, then expands and reveals content
  tl.set(trail, { opacity: 0 });
  tl.fromTo(plane, { x: '-120%', rotation: -10, scale: 0.9 }, { duration: 1.1, x: '40%', rotation: 6, ease: 'power3.out' })
    .to(trail, { opacity: 1, duration: 0.2 }, '<')
    .to(trail, { x: '70%', scaleX: 1.6, duration: 0.9, ease: 'power1.out' }, '-=0.2')
    .to(plane, { duration: 0.45, x: '0%', scale: 2.2, rotation: 0, ease: 'power2.inOut' })
    .to(trail, { duration: 0.4, opacity: 0, scaleX: 1, ease: 'power2.in' }, '-=0.25')
    .addLabel('reveal')
    .fromTo(title, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 'reveal+=0.05')
    .fromTo(lead, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 'reveal+=0.18')
    .fromTo(progress, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 'reveal+=0.32');

  // Save references so clearMotionSequence can cancel
  motionTimeouts.push(tl);
  return true;
}

// Alternate GSAP variant (a second motion style) — offers a different "After Effects" flavor
function startGSAPSequenceVariant2() {
  if (typeof gsap === 'undefined') return false;
  clearMotionSequence();
  const plane = document.querySelector('.logo-plane');
  const ring = document.querySelector('.logo-ring');
  const title = document.getElementById('welcomeTitle');
  const lead = document.querySelector('.lead');
  const trail = document.querySelector('.plane-trail');
  const particleLayer = document.querySelector('.particle-layer');

  gsap.set([plane, ring, title, lead, trail], { clearProps: 'all' });
  if (particleLayer) particleLayer.innerHTML = '';

  // create particles
  createParticles(18, particleLayer);

  const tl = gsap.timeline();

  // energetic swoop with overshoot and settle, ring ripple and particles burst
  tl.fromTo(plane, { x: '-160%', y: -8, rotation: -12, scale: 0.85 }, { duration: 1.05, x: '24%', y: -2, rotation: 6, ease: 'power3.out' })
    .to(trail, { opacity: 1, scaleX: 1.6, duration: 0.9, ease: 'power1.out' }, '-=0.9')
    .to(plane, { duration: 0.5, x: '0%', scale: 2.15, rotation: 0, ease: 'back.out(1.2)' }, '>-0.15')
    .to(trail, { duration: 0.45, opacity: 0, scaleX: 1, ease: 'power2.in' }, '-=0.25')
    .to(ring, { scale: 1.15, opacity: 0.95, boxShadow: '0 0 60px rgba(11,118,255,0.12)', duration: 0.32 }, '-=0.35')
    .addLabel('burst')
    .to('.particle', { duration: 0.9, opacity: 1, y: (i) => -30 - Math.random() * 80, x: (i) => (Math.random() - 0.5) * 240, ease: 'power2.out', stagger: 0.02 }, 'burst')
    .to('.particle', { duration: 0.8, opacity: 0, scale: 0.8, ease: 'power2.in', stagger: 0.02 }, 'burst+=0.6')
    .addLabel('reveal')
    .fromTo(title, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'elastic.out(1,0.6)' }, 'reveal')
    .fromTo(lead, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, ease: 'power2.out' }, 'reveal+=0.08');

  motionTimeouts.push(tl);
  return true;
}

// Automatically play the richer GSAP motion (no keyboard controls)
function playAutoGSAPMotion() {
  if (typeof gsap === 'undefined') return false;
  // Prefer variant2 for the more complex motion, fallback to variant1
  return startGSAPSequenceVariant2() || startGSAPSequence();
}

// Create lightweight particle elements inside container
function createParticles(count, container) {
  if (!container) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    // random starting offset near the logo center
    p.style.left = 50 + Math.round((Math.random() - 0.5) * 40) + '%';
    p.style.top = 45 + Math.round((Math.random() - 0.5) * 24) + '%';
    p.style.width = p.style.height = `${6 + Math.round(Math.random() * 8)}px`;
    p.style.background = `rgba(255,255,255,${0.85 + Math.random() * 0.15})`;
    container.appendChild(p);
  }
}

function finishSplash() {
  // Save "don't show" choice if checked
  if (dontShow && dontShow.checked) localStorage.setItem('skipWelcome', '1');
  // fade out then redirect to home
  clearInterval(timerId);
  clearTimeout(endTimeout);
  clearMotionSequence();
  document.querySelector('.welcome-splash').style.transition = 'opacity 600ms ease';
  document.querySelector('.welcome-splash').style.opacity = '0';
  setTimeout(() => { window.location.href = '/'; }, 650);
}

function skipSplash() {
  clearInterval(timerId);
  clearTimeout(endTimeout);
  finishSplash();
}

function showWalkthrough() {
  // Simple walkthrough modal (placeholder): show steps
  const steps = [
    'Access learning resources on the Student/Parent portal.',
    'Admins can upload resources and manage timetables.',
    'Parents can view reviews and student progress.'
  ];
  let idx = 0;
  const modal = document.createElement('div');
  modal.className = 'welcome-modal';
  modal.innerHTML = `\n    <div class="modal-card">\n      <div class="modal-content">\n        <h3>Walkthrough</h3>\n        <p id="walk-text">${steps[idx]}</p>\n        <div class="modal-actions">\n          <button id="modalNext" class="btn">Next</button>\n          <button id="modalClose" class="btn btn-outline">Close</button>\n        </div>\n      </div>\n    </div>\n  `;
  document.body.appendChild(modal);
  document.getElementById('modalNext').addEventListener('click', () => {
    idx += 1;
    if (idx >= steps.length) {
      modal.remove();
      return;
    }
    document.getElementById('walk-text').textContent = steps[idx];
  });
  document.getElementById('modalClose').addEventListener('click', () => modal.remove());
}

// Wire buttons
if (skipBtn) skipBtn.addEventListener('click', skipSplash);
if (walkBtn) walkBtn.addEventListener('click', showWalkthrough);

// Start on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  // If the user disabled the welcome previously, go straight to home
  if (localStorage.getItem('skipWelcome')) {
    window.location.href = '/';
    return;
  }
  // Try to load an admin-provided welcome motion video; then start the splash
  loadWelcomeMotion().finally(() => startSplash());
});

// Load welcome motion video URL from server (admin-uploaded)
async function loadWelcomeMotion() {
  try {
    const r = await fetch('/api/welcome-motion');
    const j = await r.json();
    if (j.success && j.url) {
      const video = document.createElement('video');
      video.className = 'welcome-bg-video';
      video.src = j.url;
      video.autoplay = true;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(video, document.body.firstChild);
      // let it warm up (play promise) but ignore failures
      video.play().catch(() => {});
    }
  } catch (err) {
    // ignore errors; fallback to built-in motion
    console.warn('No welcome motion or failed to load:', err);
  }
}

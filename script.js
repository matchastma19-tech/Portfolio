// ---------- Typing intro ----------
const sentence = "Hi, I'm Riza Mae, an IT student leveling up in software development, networking, and ethical hacking.";
const typed = document.getElementById('typed');
let i = 0;
(function type() {
  if (i <= sentence.length) {
    typed.textContent = sentence.slice(0, i++);
    setTimeout(type, 35);
  }
})();

// ---------- Starfield background ----------
const canvas = document.getElementById('stars');
const ctx = canvas.getContext('2d');
let stars = [];
function resize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  stars = Array.from({ length: Math.floor(innerWidth / 8) }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    s: Math.random() < 0.15 ? 4 : 2,
    v: 0.1 + Math.random() * 0.5,
    t: Math.random() * Math.PI * 2,
    c: ['#ffffff', '#ffd84d', '#46f0a8', '#ff5fb2'][Math.floor(Math.random() * 4)]
  }));
}
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, '#0a0a23');
  g.addColorStop(1, '#1d1050');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (const s of stars) {
    s.t += 0.03;
    s.y += s.v;
    if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
    ctx.globalAlpha = 0.5 + Math.sin(s.t) * 0.5;
    ctx.fillStyle = s.c;
    ctx.fillRect(Math.round(s.x), Math.round(s.y), s.s, s.s);
  }
  ctx.globalAlpha = 1;
  requestAnimationFrame(draw);
}
addEventListener('resize', resize);
resize();
draw();

// ---------- Content (from data.js) ----------
const STORE_KEY = 'portfolio-preview-v1';
const isAdmin = location.hash === '#admin';

// Visitors always see data.js. Only admin mode reads the browser preview.
function loadData() {
  const base = JSON.parse(JSON.stringify(portfolio));
  if (!isAdmin) return base;
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return base;
}
let data = loadData();

function saveData() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
}

// Only allow normal web links (blocks "javascript:" tricks)
function safeUrl(u) {
  return /^https?:\/\//i.test(u || '') ? u : '';
}

function el(tag, className, text) {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text) n.textContent = text;   // textContent keeps typed text from being run as HTML
  return n;
}

function emptyCard(box, msg) {
  const c = el('div', 'card empty');
  c.append(el('p', '', msg));
  box.append(c);
}

function removeBtn(kind, index) {
  if (!isAdmin) return null;
  const b = el('button', 'remove', 'Remove');
  b.type = 'button';
  b.addEventListener('click', () => {
    data[kind].splice(index, 1);
    saveData();
    renderAll();
  });
  return b;
}

function renderProjects() {
  const box = document.getElementById('projectList');
  box.replaceChildren();
  if (!data.projects.length) return emptyCard(box, '🚧 Still working on this. New quests coming soon!');
  data.projects.forEach((p, i) => {
    const card = el('article', 'card project');
    card.append(el('span', 'badge', 'QUEST ' + String(i + 1).padStart(2, '0')));
    card.append(el('h3', '', p.title));
    if (p.desc) card.append(el('p', '', p.desc));
    const url = safeUrl(p.link);
    if (url) {
      const a = el('a', 'proj-link', 'View project \u25B8');
      a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
      card.append(a);
    }
    const rm = removeBtn('projects', i);
    if (rm) card.append(rm);
    box.append(card);
  });
}

function renderSkills() {
  const box = document.getElementById('skillList');
  box.replaceChildren();
  if (!data.skills.length) return emptyCard(box, '🚧 Still working on this. Skills are loading...');
  const card = el('div', 'card');
  const ul = el('ul', 'chips');
  data.skills.forEach((s, i) => {
    const li = el('li', '', s);
    const rm = removeBtn('skills', i);
    if (rm) { rm.classList.add('inline'); li.append(' ', rm); }
    ul.append(li);
  });
  card.append(ul);
  box.append(card);
}

function renderAchievements() {
  const box = document.getElementById('achievementList');
  box.replaceChildren();
  if (!data.achievements.length) return emptyCard(box, '🚧 Still working on this. Achievements will be unlocked soon!');
  data.achievements.forEach((a, i) => {
    const card = el('article', 'card cert');
    card.append(el('span', 'badge gold', '\u2605 ACHIEVEMENT UNLOCKED'));
    card.append(el('h3', '', a.title));
    if (a.desc) card.append(el('p', '', a.desc));
    if (a.date) card.append(el('p', 'date', a.date));
    const rm = removeBtn('achievements', i);
    if (rm) card.append(rm);
    box.append(card);
  });
}

function renderTrainings() {
  const box = document.getElementById('trainingList');
  box.replaceChildren();
  if (!data.trainings.length) return emptyCard(box, '🚧 Still working on this.');
  data.trainings.forEach((t, i) => {
    const card = el('article', 'card cert');
    card.append(el('span', 'badge gold', '\u2605 ACHIEVEMENT UNLOCKED'));
    card.append(el('h3', '', t.title));
    if (t.org) card.append(el('p', '', t.org));
    if (t.date) card.append(el('p', 'date', t.date));
    const rm = removeBtn('trainings', i);
    if (rm) card.append(rm);
    box.append(card);
  });
}

function renderAll() {
  renderProjects();
  renderSkills();
  renderAchievements();
  renderTrainings();
}
renderAll();

// ---------- Admin mode (open yoursite.com/#admin) ----------
if (isAdmin) {
  document.getElementById('admin').hidden = false;

  const fType = document.getElementById('fType');
  const labels = {
    projects:     { details: 'Description',          extra: 'Link (optional, https://...)' },
    skills:       { details: null,                   extra: null },
    achievements: { details: 'Description',          extra: 'Date (e.g. March 2025)' },
    trainings:    { details: 'Organizer / details',  extra: 'Date (e.g. Issued Aug 31, 2026)' }
  };
  function syncFields() {
    const l = labels[fType.value];
    document.getElementById('fDetailsWrap').hidden = !l.details;
    document.getElementById('fExtraWrap').hidden = !l.extra;
    if (l.details) document.getElementById('fDetailsLabel').textContent = l.details;
    if (l.extra) document.getElementById('fExtraLabel').textContent = l.extra;
  }
  fType.addEventListener('change', syncFields);
  syncFields();

  const msg = document.getElementById('adminMsg');
  const say = t => { msg.textContent = t; };

  document.getElementById('adminForm').addEventListener('submit', e => {
    e.preventDefault();
    const type = fType.value;
    const title = document.getElementById('fTitle').value.trim();
    const details = document.getElementById('fDetails').value.trim();
    const extra = document.getElementById('fExtra').value.trim();
    if (!title) return;

    if (type === 'projects') data.projects.push({ title, desc: details, link: extra });
    if (type === 'skills') data.skills.push(title);
    if (type === 'achievements') data.achievements.push({ title, desc: details, date: extra });
    if (type === 'trainings') data.trainings.push({ title, org: details, date: extra });

    saveData();
    renderAll();
    e.target.reset();
    fType.value = type;
    syncFields();
    say('Added! This is a preview on this browser only. Use "Copy for data.js" to publish it.');
  });

  document.getElementById('exportBtn').addEventListener('click', async () => {
    const text = 'const portfolio = ' + JSON.stringify(data, null, 2) + ';\n';
    try {
      await navigator.clipboard.writeText(text);
      say('Copied! Paste it into data.js (replace everything), then commit and push.');
    } catch (err) {
      prompt('Copy this and paste it into data.js:', text);
    }
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Discard your preview and go back to what is in data.js?')) return;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    data = JSON.parse(JSON.stringify(portfolio));
    renderAll();
    say('Preview reset.');
  });
}

// Reload when entering/leaving admin mode
addEventListener('hashchange', () => {
  if ((location.hash === '#admin') !== isAdmin) location.reload();
});

// ---------- Scroll reveal + active nav link ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('show'));
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

const links = document.querySelectorAll('#menu a');
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
document.querySelectorAll('section[id]').forEach(s => spy.observe(s));

// ---------- Mobile menu ----------
const burger = document.getElementById('burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
links.forEach(l => l.addEventListener('click', () => {
  menu.classList.remove('open');
  burger.setAttribute('aria-expanded', 'false');
}));

// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

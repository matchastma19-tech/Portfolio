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

// ---------- Scroll reveal + active nav link ----------
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.isIntersecting && e.target.classList.add('show'));
}, { threshold: 0.15 });
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
links.forEach(l => l.addEventListener('click', () => menu.classList.remove('open')));

// ---------- Footer year ----------
document.getElementById('year').textContent = new Date().getFullYear();

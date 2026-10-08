// Screens, menu links and the XP bar
const screens = Array.from(document.querySelectorAll(".screen"));
const navLinks = Array.from(document.querySelectorAll(".hud-nav a"));
const levelLabel = document.getElementById("level-label");
const xpFill = document.getElementById("xp-fill");

let current = 0;

function setScreen(index) {
  current = index;
  navLinks.forEach((link, i) => link.classList.toggle("active", i === index));
  levelLabel.textContent = "LV " + (index + 1);
  xpFill.style.width = ((index + 1) / screens.length) * 100 + "%";
}

// Detect which screen is mostly in view while scrolling
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) setScreen(screens.indexOf(entry.target));
  });
}, { threshold: 0.55 });
screens.forEach((screen) => observer.observe(screen));

// Arrow keys (and A / D) move between screens
document.addEventListener("keydown", (event) => {
  const next = ["ArrowRight", "ArrowDown", "d"].includes(event.key);
  const prev = ["ArrowLeft", "ArrowUp", "a"].includes(event.key);
  if (!next && !prev) return;
  event.preventDefault();
  const target = Math.min(screens.length - 1, Math.max(0, current + (next ? 1 : -1)));
  screens[target].scrollIntoView({ behavior: "smooth" });
});

setScreen(0);

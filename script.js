// ===== Screens, menu links and the XP bar =====
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
  if (document.querySelector("dialog[open]")) return; // don't move screens while the game is open
  const next = ["ArrowRight", "ArrowDown", "d"].includes(event.key);
  const prev = ["ArrowLeft", "ArrowUp", "a"].includes(event.key);
  if (!next && !prev) return;
  event.preventDefault();
  const target = Math.min(screens.length - 1, Math.max(0, current + (next ? 1 : -1)));
  screens[target].scrollIntoView({ behavior: "smooth" });
});

setScreen(0);

// ===== Online / offline indicator (real browser status) =====
const netStatus = document.getElementById("net-status");
function updateNetStatus() {
  const online = navigator.onLine;
  netStatus.textContent = online ? "ONLINE" : "OFFLINE";
  netStatus.classList.toggle("offline", !online);
}
window.addEventListener("online", updateNetStatus);
window.addEventListener("offline", updateNetStatus);
updateNetStatus();

// ===== Terminal typing effect on the Home screen =====
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const terminal = document.getElementById("terminal");
if (terminal && !reduceMotion) {
  const fullText = terminal.textContent;
  terminal.textContent = "";
  let i = 0;
  (function typeNext() {
    i++;
    terminal.textContent = fullText.slice(0, i);
    if (i < fullText.length) {
      // short pause at the end of each line, like a real command running
      setTimeout(typeNext, fullText[i - 1] === "\n" ? 350 : 28);
    }
  })();
}

// ===== Profile photo fallback: show "RM" box if photo.jpg is missing =====
const photo = document.querySelector(".avatar-photo");
function showInitials() {
  const box = document.createElement("div");
  box.className = "avatar";
  box.setAttribute("aria-hidden", "true");
  box.textContent = "RM";
  photo.replaceWith(box);
}
if (photo) {
  photo.addEventListener("error", showInitials);
  if (photo.complete && photo.naturalWidth === 0) showInitials();
}

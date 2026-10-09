// ===== Network Quest: a networking quiz game =====
// 10 questions (easy -> hard), 3 lives, 15 seconds each, streak and speed bonuses.
(function () {
  const dialog = document.getElementById("game");
  const playButtons = Array.from(document.querySelectorAll("[data-play]"));
  if (!dialog || typeof dialog.showModal !== "function") {
    playButtons.forEach((b) => (b.hidden = true)); // very old browsers: hide the buttons
    return;
  }

  // ---------- QUESTIONS (edit or add your own!) ----------
  // level: "Easy", "Medium" or "Hard"
  // a: the correct answer, wrong: three wrong answers, why: short explanation
  const QUESTIONS = [
    // Easy
    { level: "Easy", q: "How many layers does the OSI model have?", a: "7", wrong: ["4", "5", "9"],
      why: "The OSI model has 7 layers, from Physical (1) up to Application (7)." },
    { level: "Easy", q: "Which protocol turns a website name into an IP address?", a: "DNS", wrong: ["DHCP", "FTP", "ARP"],
      why: "DNS (Domain Name System) translates names like example.com into IP addresses." },
    { level: "Easy", q: "What is the default port for HTTPS?", a: "443", wrong: ["80", "21", "25"],
      why: "HTTPS uses port 443. Plain HTTP uses port 80." },
    { level: "Easy", q: "Which topology connects every device to one central device?", a: "Star", wrong: ["Ring", "Bus", "Mesh"],
      why: "In a star topology, each device connects to a central switch or hub." },
    { level: "Easy", q: "Which protocol automatically gives devices an IP address?", a: "DHCP", wrong: ["DNS", "SMTP", "ICMP"],
      why: "DHCP assigns IP addresses (and other settings) to devices when they join a network." },
    { level: "Easy", q: "How many bits are in an IPv4 address?", a: "32", wrong: ["16", "64", "128"],
      why: "IPv4 addresses are 32 bits long. IPv6 addresses are 128 bits." },

    // Medium
    { level: "Medium", q: "Which OSI layer is responsible for routing packets between networks?", a: "Layer 3 (Network)", wrong: ["Layer 2 (Data Link)", "Layer 4 (Transport)", "Layer 7 (Application)"],
      why: "Routers work at Layer 3, using IP addresses to choose paths between networks." },
    { level: "Medium", q: "Which of these is a private IPv4 address?", a: "192.168.1.10", wrong: ["8.8.8.8", "172.32.0.5", "100.200.1.1"],
      why: "Private ranges are 10.0.0.0/8, 172.16.0.0/12 (172.16 to 172.31) and 192.168.0.0/16." },
    { level: "Medium", q: "Which protocol does the ping command use?", a: "ICMP", wrong: ["TCP", "HTTP", "SSH"],
      why: "Ping sends ICMP echo requests and waits for echo replies." },
    { level: "Medium", q: "Which protocol finds the MAC address that belongs to an IP address on a LAN?", a: "ARP", wrong: ["DNS", "NAT", "DHCP"],
      why: "ARP (Address Resolution Protocol) maps IP addresses to MAC addresses on the local network." },
    { level: "Medium", q: "What is the default port for SSH?", a: "22", wrong: ["23", "53", "443"],
      why: "SSH uses port 22. Telnet, which is not encrypted, uses port 23." },
    { level: "Medium", q: "Which transport protocol is connection-oriented and reliable?", a: "TCP", wrong: ["UDP", "ICMP", "IP"],
      why: "TCP sets up a connection and makes sure data arrives in order. UDP does not." },
    { level: "Medium", q: "At which OSI layer does a typical switch forward frames using MAC addresses?", a: "Layer 2 (Data Link)", wrong: ["Layer 1 (Physical)", "Layer 3 (Network)", "Layer 5 (Session)"],
      why: "Standard switches work at Layer 2 and use MAC addresses to forward frames." },

    // Hard
    { level: "Hard", q: "How many usable host addresses are in a /24 IPv4 network?", a: "254", wrong: ["256", "255", "252"],
      why: "A /24 has 256 addresses. One is the network address and one is the broadcast address, leaving 254." },
    { level: "Hard", q: "What does NAT mainly do?", a: "Translates private addresses to a public address", wrong: ["Encrypts all traffic", "Assigns MAC addresses", "Blocks all incoming traffic"],
      why: "NAT lets many devices with private addresses share one public IP address." },
    { level: "Hard", q: "What is the main purpose of a VLAN?", a: "Split a network into separate logical networks", wrong: ["Increase Wi-Fi speed", "Translate domain names", "Assign IP addresses"],
      why: "VLANs create separate broadcast domains on the same physical switch." },
    { level: "Hard", q: "What is the subnet mask for a /26 network?", a: "255.255.255.192", wrong: ["255.255.255.128", "255.255.255.224", "255.255.255.240"],
      why: "/26 means 26 network bits: 255.255.255.11000000, which is 255.255.255.192." },
    { level: "Hard", q: "What does a default gateway do?", a: "Lets devices reach other networks", wrong: ["Gives out IP addresses", "Stores website files", "Converts MAC to IP"],
      why: "Devices send traffic for other networks to the default gateway, usually the router." },
    { level: "Hard", q: "Which Windows command shows each hop on the path to a destination?", a: "tracert", wrong: ["ipconfig", "nslookup", "netstat"],
      why: "tracert (traceroute on Linux and macOS) lists the routers a packet passes through." },
  ];

  const TOTAL = 10;       // questions per game
  const LIVES = 3;
  const SECONDS = 15;     // time per question
  const MIX = { Easy: 4, Medium: 3, Hard: 3 };

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const views = { start: $("game-start"), play: $("game-play"), over: $("game-over") };
  const els = {
    best: $("game-best"), score: $("g-score"), lives: $("g-lives"), streak: $("g-streak"),
    level: $("g-level"), timer: $("g-timer"), progress: $("g-progress"), question: $("g-question"),
    options: $("g-options"), feedback: $("g-feedback"), next: $("g-next"),
    result: $("g-result"), rank: $("g-rank"), summary: $("g-summary"),
    sound: $("game-sound"),
  };

  // ---------- Helpers ----------
  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function show(name) {
    Object.entries(views).forEach(([key, el]) => (el.hidden = key !== name));
  }

  // High score is saved in the browser (wrapped in try/catch in case storage is blocked)
  function getBest() {
    try { return Number(localStorage.getItem("networkQuestBest")) || 0; } catch (e) { return 0; }
  }
  function saveBest(value) {
    try { localStorage.setItem("networkQuestBest", String(value)); } catch (e) { /* ignore */ }
  }

  // Tiny sound effects using the Web Audio API (off by default)
  let soundOn = false;
  let audio = null;
  function beep(freq, seconds, type) {
    if (!soundOn) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type || "square";
      osc.frequency.value = freq;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + seconds);
    } catch (e) { /* sound is optional */ }
  }

  // ---------- Game state ----------
  let state = null;
  let timerId = null;

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function startGame() {
    const picked = [];
    for (const level of Object.keys(MIX)) {
      const pool = shuffle(QUESTIONS.filter((q) => q.level === level));
      picked.push(...pool.slice(0, MIX[level]));
    }
    state = { list: picked.slice(0, TOTAL), i: 0, score: 0, lives: LIVES, streak: 0, correct: 0, locked: false, timeLeft: SECONDS };
    updateStats();
    show("play");
    showQuestion();
  }

  function updateStats() {
    els.score.textContent = state.score;
    els.streak.textContent = state.streak;
    els.lives.textContent = "■ ".repeat(state.lives) + "□ ".repeat(LIVES - state.lives);
    els.lives.setAttribute("aria-label", state.lives + " lives left");
  }

  function showQuestion() {
    const item = state.list[state.i];
    state.locked = false;
    els.progress.textContent = "Question " + (state.i + 1) + " of " + state.list.length;
    els.level.textContent = item.level;
    els.question.textContent = item.q;
    els.feedback.textContent = "";
    els.next.hidden = true;

    els.options.textContent = "";
    shuffle([item.a, ...item.wrong]).forEach((text, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "game-opt";
      btn.dataset.value = text;
      btn.textContent = (index + 1) + ". " + text;
      btn.addEventListener("click", () => answer(text));
      els.options.append(btn);
    });

    state.timeLeft = SECONDS;
    els.timer.style.width = "100%";
    els.timer.classList.remove("low");
    stopTimer();
    timerId = setInterval(() => {
      state.timeLeft = Math.max(0, state.timeLeft - 0.1);
      els.timer.style.width = (state.timeLeft / SECONDS) * 100 + "%";
      els.timer.classList.toggle("low", state.timeLeft <= 5);
      if (state.timeLeft <= 0) answer(null); // out of time
    }, 100);
    els.question.focus();
  }

  function answer(choice) {
    if (state.locked) return;
    state.locked = true;
    stopTimer();

    const item = state.list[state.i];
    const right = choice === item.a;

    Array.from(els.options.children).forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.value === item.a) btn.classList.add("right");
      else if (btn.dataset.value === choice) btn.classList.add("wrong");
    });

    if (right) {
      state.streak++;
      state.correct++;
      const speedBonus = Math.round(state.timeLeft) * 5;
      const streakBonus = Math.min(state.streak - 1, 5) * 10;
      const gained = 100 + speedBonus + streakBonus;
      state.score += gained;
      els.feedback.textContent = "Correct! +" + gained + " points. " + item.why;
      beep(660, 0.1);
      setTimeout(() => beep(880, 0.15), 110);
    } else {
      state.streak = 0;
      state.lives--;
      const prefix = choice === null ? "Time's up!" : "Not quite.";
      els.feedback.textContent = prefix + " The answer is " + item.a + ". " + item.why;
      beep(160, 0.3, "sawtooth");
    }
    updateStats();

    const finished = state.lives <= 0 || state.i >= state.list.length - 1;
    els.next.textContent = finished ? "See results (Enter)" : "Next (Enter)";
    els.next.hidden = false;
    els.next.focus();
  }

  function nextStep() {
    const finished = state.lives <= 0 || state.i >= state.list.length - 1;
    if (finished) endGame();
    else { state.i++; showQuestion(); }
  }

  function rankFor(correct) {
    const pct = correct / TOTAL;
    if (pct >= 0.9) return "Network Wizard";
    if (pct >= 0.7) return "Network Admin";
    if (pct >= 0.4) return "Junior Technician";
    return "Rookie";
  }

  function endGame() {
    stopTimer();
    const best = getBest();
    const newBest = state.score > best;
    if (newBest) saveBest(state.score);

    els.result.textContent = state.lives > 0 ? "Quest complete!" : "Game over";
    els.rank.textContent = "Rank: " + rankFor(state.correct);
    els.summary.textContent =
      "Score: " + state.score + ". Correct answers: " + state.correct + " of " + TOTAL + "." +
      (newBest ? " New high score!" : " High score: " + best + ".");
    beep(state.lives > 0 ? 880 : 200, 0.4);
    show("over");
    els.best.textContent = Math.max(best, state.score);
  }

  // ---------- Open / close ----------
  function openGame() {
    stopTimer();
    els.best.textContent = getBest();
    show("start");
    dialog.showModal();
    $("game-go").focus();
  }

  playButtons.forEach((b) => b.addEventListener("click", openGame));
  $("game-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", stopTimer); // also runs when Esc is pressed
  $("game-go").addEventListener("click", startGame);
  $("g-again").addEventListener("click", startGame);
  els.next.addEventListener("click", nextStep);

  els.sound.addEventListener("click", () => {
    soundOn = !soundOn;
    els.sound.textContent = "Sound: " + (soundOn ? "on" : "off");
    els.sound.setAttribute("aria-pressed", String(soundOn));
    beep(660, 0.08);
  });

  // Keyboard: 1-4 to answer, Enter for next
  dialog.addEventListener("keydown", (e) => {
    if (views.play.hidden || !state) return;
    if (!state.locked && ["1", "2", "3", "4"].includes(e.key)) {
      const btn = els.options.children[Number(e.key) - 1];
      if (btn) answer(btn.dataset.value);
    } else if (state.locked && e.key === "Enter" && !els.next.hidden && document.activeElement !== els.next) {
      nextStep();
    }
  });
})();

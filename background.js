// ===== Live network background =====
// Drifting nodes (devices), links between nearby nodes, and packets that travel
// from node to node. Move the mouse to act as a router; click to send packets.
(function () {
  const canvas = document.getElementById("bg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Colors come from the theme variables in style.css
  const theme = getComputedStyle(document.documentElement);
  const LINE_COLOR = theme.getPropertyValue("--accent").trim() || "#c9ccd1";
  const PACKET_COLOR = theme.getPropertyValue("--highlight").trim() || "#ffd166";

  // Tweak these to change the feel
  const LINK_DIST = 150;    // how close two nodes must be to connect
  const MOUSE_DIST = 140;   // radius around the mouse that connects and pushes nodes
  const MAX_PACKETS = 28;   // limit so the page stays light
  const PACKET_SPEED = 2.2; // pixels per frame
  const SPAWN_EVERY = 450;  // ms between automatic packets

  let w = 0, h = 0;
  let nodes = [];
  let links = [];
  let packets = [];
  let pulses = [];
  let lastSpawn = 0;
  const mouse = { x: -9999, y: -9999 };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // More nodes on bigger screens, but never too many
    const count = Math.max(18, Math.min(70, Math.round((w * h) / 20000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: Math.random() < 0.2 ? 6 : 4, // bigger squares act like routers
    }));
    packets = [];
    pulses = [];
    update(0, 0);
    if (reduceMotion) draw();
  }

  function update(dt, now) {
    // Move nodes and bounce them off the edges
    for (const n of nodes) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < 0 || n.x > w) { n.vx *= -1; n.x = Math.max(0, Math.min(w, n.x)); }
      if (n.y < 0 || n.y > h) { n.vy *= -1; n.y = Math.max(0, Math.min(h, n.y)); }

      // The mouse gently pushes nearby nodes away
      const dx = n.x - mouse.x;
      const dy = n.y - mouse.y;
      const d = Math.hypot(dx, dy);
      if (d < MOUSE_DIST && d > 0) {
        const push = (1 - d / MOUSE_DIST) * 1.2 * dt;
        n.x += (dx / d) * push;
        n.y += (dy / d) * push;
      }
    }

    // Find which nodes are close enough to be linked
    links = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < LINK_DIST) links.push({ a: nodes[i], b: nodes[j], d });
      }
    }

    if (reduceMotion || dt === 0) return;

    // Send a new packet every so often
    if (now - lastSpawn > SPAWN_EVERY && packets.length < MAX_PACKETS && links.length) {
      const link = links[Math.floor(Math.random() * links.length)];
      const forward = Math.random() < 0.5;
      packets.push({ from: forward ? link.a : link.b, to: forward ? link.b : link.a, t: 0 });
      lastSpawn = now;
    }

    // Move packets along their links; at each node they may hop onward
    packets = packets.filter((p) => {
      const dist = Math.hypot(p.to.x - p.from.x, p.to.y - p.from.y);
      if (dist > LINK_DIST * 1.2) return false; // link broke because nodes drifted apart
      p.t += (PACKET_SPEED * dt) / Math.max(dist, 1);
      if (p.t < 1) return true;

      // Arrived: 60% chance to continue to another neighbor (like a router forwarding)
      if (Math.random() < 0.6) {
        const options = links.filter((l) => (l.a === p.to || l.b === p.to) && l.a !== p.from && l.b !== p.from);
        if (options.length) {
          const l = options[Math.floor(Math.random() * options.length)];
          p.from = p.to;
          p.to = l.a === p.from ? l.b : l.a;
          p.t = 0;
          return true;
        }
      }
      return false;
    });

    // Fade out click pulses
    pulses = pulses.filter((pl) => {
      pl.age += dt;
      return pl.age < 40;
    });
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;

    // Links between nodes (fainter when farther apart)
    ctx.strokeStyle = LINE_COLOR;
    for (const l of links) {
      ctx.globalAlpha = (1 - l.d / LINK_DIST) * 0.28;
      ctx.beginPath();
      ctx.moveTo(l.a.x, l.a.y);
      ctx.lineTo(l.b.x, l.b.y);
      ctx.stroke();
    }

    // Links from nearby nodes to the mouse
    ctx.strokeStyle = PACKET_COLOR;
    for (const n of nodes) {
      const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
      if (d < MOUSE_DIST) {
        ctx.globalAlpha = (1 - d / MOUSE_DIST) * 0.5;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // Nodes as small pixel squares
    ctx.fillStyle = LINE_COLOR;
    ctx.globalAlpha = 0.55;
    for (const n of nodes) {
      ctx.fillRect(Math.round(n.x - n.size / 2), Math.round(n.y - n.size / 2), n.size, n.size);
    }

    // Packets
    ctx.fillStyle = PACKET_COLOR;
    ctx.globalAlpha = 1;
    for (const p of packets) {
      const x = p.from.x + (p.to.x - p.from.x) * p.t;
      const y = p.from.y + (p.to.y - p.from.y) * p.t;
      ctx.fillRect(Math.round(x - 3), Math.round(y - 3), 6, 6);
    }

    // Click pulses: expanding square outlines
    ctx.strokeStyle = PACKET_COLOR;
    for (const pl of pulses) {
      const r = 6 + pl.age * 2.5;
      ctx.globalAlpha = 1 - pl.age / 40;
      ctx.strokeRect(pl.x - r, pl.y - r, r * 2, r * 2);
    }
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 16.67, 3); // 1 = one frame at 60fps
    last = now;
    update(dt, now);
    draw();
    requestAnimationFrame(frame);
  }

  // Mouse / touch interaction
  if (!reduceMotion) {
    window.addEventListener("pointermove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    window.addEventListener("pointerup", (e) => {
      if (e.pointerType === "touch") { mouse.x = -9999; mouse.y = -9999; }
    });
    window.addEventListener("mouseout", (e) => {
      if (!e.relatedTarget) { mouse.x = -9999; mouse.y = -9999; }
    });

    // Click the background: the nearest node sends packets to all its neighbors
    window.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button, dialog, input, textarea, select")) return;
      pulses.push({ x: e.clientX, y: e.clientY, age: 0 });
      let nearest = null;
      let best = 200;
      for (const n of nodes) {
        const d = Math.hypot(n.x - e.clientX, n.y - e.clientY);
        if (d < best) { best = d; nearest = n; }
      }
      if (!nearest) return;
      for (const l of links) {
        if (packets.length >= MAX_PACKETS + 12) break;
        if (l.a === nearest) packets.push({ from: l.a, to: l.b, t: 0 });
        else if (l.b === nearest) packets.push({ from: l.b, to: l.a, t: 0 });
      }
    });
  }

  window.addEventListener("resize", resize);
  resize();
  if (!reduceMotion) requestAnimationFrame(frame);
})();

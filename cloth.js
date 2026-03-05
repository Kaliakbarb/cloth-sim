const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");

const COLS = 28, ROWS = 20, SPACING = 20, ORIGIN_X = 90, ORIGIN_Y = 20;
const GRAVITY = 0.4, DRAG = 0.995, CONSTRAINT_ITERS = 4, TEAR_DIST = SPACING * 2.2;

let points = [], sticks = [];
let wind = false, windPhase = 0;
let mouse = { x: -1, y: -1, down: false, px: -1, py: -1 };

function makePoint(x, y, pinned) {
  return { x, y, oldx: x, oldy: y, pinned };
}

function reset() {
  points = [];
  sticks = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = ORIGIN_X + c * SPACING;
      const y = ORIGIN_Y + r * SPACING;
      points.push(makePoint(x, y, r === 0 && c % 3 === 0));
    }
  }
  const idx = (r, c) => r * COLS + c;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c < COLS - 1) addStick(idx(r, c), idx(r, c + 1));
      if (r < ROWS - 1) addStick(idx(r, c), idx(r + 1, c));
    }
  }
}

function addStick(a, b) {
  const pa = points[a], pb = points[b];
  const length = Math.hypot(pa.x - pb.x, pa.y - pb.y);
  sticks.push({ a, b, length });
}

function updatePoints() {
  windPhase += 0.05;
  const windForce = wind ? Math.sin(windPhase) * 0.15 + 0.1 : 0;
  for (const p of points) {
    if (p.pinned) continue;
    const vx = (p.x - p.oldx) * DRAG;
    const vy = (p.y - p.oldy) * DRAG;
    p.oldx = p.x;
    p.oldy = p.y;
    p.x += vx + windForce;
    p.y += vy + GRAVITY;
  }
}

function satisfyConstraints() {
  for (const s of sticks) {
    const pa = points[s.a], pb = points[s.b];
    const dx = pb.x - pa.x, dy = pb.y - pa.y;
    const dist = Math.hypot(dx, dy) || 0.0001;
    const diff = (dist - s.length) / dist;
    const offx = dx * 0.5 * diff, offy = dy * 0.5 * diff;
    if (!pa.pinned) { pa.x += offx; pa.y += offy; }
    if (!pb.pinned) { pb.x -= offx; pb.y -= offy; }
  }
  sticks = sticks.filter(s => {
    const pa = points[s.a], pb = points[s.b];
    return Math.hypot(pa.x - pb.x, pa.y - pb.y) < TEAR_DIST;
  });
}

function applyMouse() {
  if (!mouse.down) return;
  for (const p of points) {
    if (p.pinned) continue;
    const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
    if (dist < 26) {
      p.x += mouse.x - mouse.px;
      p.y += mouse.y - mouse.py;
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#7ee787";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const s of sticks) {
    const pa = points[s.a], pb = points[s.b];
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
  }
  ctx.stroke();

  ctx.fillStyle = "#f7768e";
  for (const p of points) {
    if (p.pinned) ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
  }
}

function loop() {
  updatePoints();
  applyMouse();
  for (let i = 0; i < CONSTRAINT_ITERS; i++) satisfyConstraints();
  draw();
  mouse.px = mouse.x;
  mouse.py = mouse.y;
  requestAnimationFrame(loop);
}

canvas.addEventListener("mousedown", e => {
  const r = canvas.getBoundingClientRect();
  mouse.down = true;
  mouse.x = mouse.px = e.clientX - r.left;
  mouse.y = mouse.py = e.clientY - r.top;
});
canvas.addEventListener("mousemove", e => {
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
window.addEventListener("mouseup", () => (mouse.down = false));

document.getElementById("wind").addEventListener("click", () => (wind = !wind));
document.getElementById("reset").addEventListener("click", reset);

reset();
loop();

const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");

const ui = {
  startBtn: document.getElementById("startBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  newRunBtn: document.getElementById("newRunBtn"),
  speed1Btn: document.getElementById("speed1Btn"),
  speed4Btn: document.getElementById("speed4Btn"),
  speed16Btn: document.getElementById("speed16Btn"),
  stats: document.getElementById("stats"),
  history: document.getElementById("history"),
};

const ACTIONS = [
  { thrust: 0, ax: 0 },
  { thrust: 1, ax: 0 },
  { thrust: 1, ax: -1 },
  { thrust: 1, ax: 1 },
  { thrust: 0.45, ax: -1 },
  { thrust: 0.45, ax: 1 },
];

const SETTINGS = {
  populationSize: 120,
  chromosomeLength: 300,
  mutationRate: 0.05,
  eliteRate: 0.1,
  tournamentSize: 4,
  gravity: 2.8,
  thrustPower: 4.6,
  sidePower: 2.6,
  maxTilt: 0.55,
  safeVx: 0.95,
  safeVy: 1.15,
  maxCrashSpeed: 2.5,
};

const state = {
  running: false,
  generation: 0,
  population: [],
  evaluated: [],
  history: [],
  world: null,
  ship: null,
  activeChromosome: null,
  stepIndex: 0,
  status: "Pausado",
  timeScale: 1,
  explosion: null,
  pendingEvolutionReason: null,
};

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function createWorld() {
  const floorY = canvas.height - 65;
  const zoneWidth = 180;
  const center = canvas.width / 2;
  const zoneX1 = center - zoneWidth / 2;
  const zoneX2 = center + zoneWidth / 2;

  return {
    width: canvas.width,
    height: canvas.height,
    floorY,
    landingZone: { x1: zoneX1, x2: zoneX2, y: floorY },
    start: {
      x: clamp(center + rand(-120, 120), 40, canvas.width - 40),
      y: canvas.height - 250,
      vx: rand(-0.25, 0.25),
      vy: rand(0.0, 0.3),
      angle: 0,
    },
  };
}

function randomGene() {
  return Math.floor(Math.random() * ACTIONS.length);
}

function createIndividual() {
  return Array.from({ length: SETTINGS.chromosomeLength }, randomGene);
}

function initPopulation() {
  state.population = Array.from({ length: SETTINGS.populationSize }, createIndividual);
  state.evaluated = [];
  state.generation = 0;
  state.history = [];
}

function resetShip() {
  state.ship = {
    x: state.world.start.x,
    y: state.world.start.y,
    vx: state.world.start.vx,
    vy: state.world.start.vy,
    angle: state.world.start.angle,
    path: [{ x: state.world.start.x, y: state.world.start.y }],
  };
  state.stepIndex = 0;
  state.status = "Volando";
  state.explosion = null;
  state.pendingEvolutionReason = null;
}

function isInsideLandingZone(x) {
  return x >= state.world.landingZone.x1 && x <= state.world.landingZone.x2;
}

function stepPhysics(ship, geneIndex) {
  const action = ACTIONS[geneIndex] || ACTIONS[0];
  const targetTilt = action.ax * SETTINGS.maxTilt;
  ship.angle += (targetTilt - ship.angle) * 0.25;

  const ax = action.ax * SETTINGS.sidePower;
  const ay = SETTINGS.gravity - action.thrust * SETTINGS.thrustPower;

  ship.vx += ax / 30;
  ship.vy += ay / 30;

  ship.x += ship.vx;
  ship.y += ship.vy;

  ship.x = clamp(ship.x, 12, state.world.width - 12);
  if (ship.y < 5) {
    ship.y = 5;
    ship.vy = Math.max(0, ship.vy);
  }

  ship.path.push({ x: ship.x, y: ship.y });
}

function evaluateLanding(ship) {
  if (ship.y < state.world.floorY) return { done: false };

  ship.y = state.world.floorY;

  const speed = Math.hypot(ship.vx, ship.vy);
  if (speed > SETTINGS.maxCrashSpeed) {
    return { done: true, landed: false, crashed: true };
  }

  const inZone = isInsideLandingZone(ship.x);
  const soft = Math.abs(ship.vx) <= SETTINGS.safeVx && Math.abs(ship.vy) <= SETTINGS.safeVy;
  const upright = Math.abs(ship.angle) <= 0.16;
  const landed = inZone && soft && upright;

  return { done: true, landed, crashed: !landed };
}

function triggerExplosion(x, y) {
  state.explosion = { x, y, radius: 0, maxRadius: 42, life: 18 };
}

function simulateIndividual(chromosome) {
  const ship = {
    x: state.world.start.x,
    y: state.world.start.y,
    vx: state.world.start.vx,
    vy: state.world.start.vy,
    angle: state.world.start.angle,
    path: [],
  };

  let landed = false;
  let crashed = false;
  let fuel = 0;

  for (let i = 0; i < chromosome.length; i += 1) {
    const gene = chromosome[i];
    fuel += ACTIONS[gene].thrust;
    stepPhysics(ship, gene);

    const landing = evaluateLanding(ship);
    if (landing.done) {
      landed = landing.landed;
      crashed = landing.crashed;
      break;
    }
  }

  const center = (state.world.landingZone.x1 + state.world.landingZone.x2) / 2;
  const dx = Math.abs(ship.x - center);
  const dy = Math.abs(state.world.floorY - ship.y);

  let fitness = 0;
  fitness += 900 - dx * 3;
  fitness += 300 - dy * 1.6;
  fitness += 200 - Math.abs(ship.vx) * 140;
  fitness += 260 - Math.abs(ship.vy) * 140;
  fitness += 130 - Math.abs(ship.angle) * 170;
  fitness += Math.max(0, 100 - fuel * 0.45);
  if (landed) fitness += 2600;
  if (crashed) fitness -= 600;

  return {
    chromosome,
    fitness,
    landed,
    crashed,
    final: { x: ship.x, y: ship.y, vx: ship.vx, vy: ship.vy, angle: ship.angle },
  };
}

function evaluatePopulation() {
  state.evaluated = state.population.map(simulateIndividual).sort((a, b) => b.fitness - a.fitness);
  state.activeChromosome = [...state.evaluated[0].chromosome];
}

function tournamentSelect() {
  let best = null;
  for (let i = 0; i < SETTINGS.tournamentSize; i += 1) {
    const current = pick(state.evaluated);
    if (!best || current.fitness > best.fitness) best = current;
  }
  return best.chromosome;
}

function crossover(a, b) {
  const cut = Math.floor(rand(1, a.length - 1));
  return [...a.slice(0, cut), ...b.slice(cut)];
}

function mutate(chromosome) {
  return chromosome.map((gene) => (Math.random() < SETTINGS.mutationRate ? randomGene() : gene));
}

function evolveToNextGeneration(reason) {
  const eliteCount = Math.max(2, Math.floor(SETTINGS.populationSize * SETTINGS.eliteRate));
  const elites = state.evaluated.slice(0, eliteCount).map((i) => [...i.chromosome]);

  const next = [...elites];
  while (next.length < SETTINGS.populationSize) {
    const p1 = tournamentSelect();
    const p2 = tournamentSelect();
    next.push(mutate(crossover(p1, p2)));
  }

  const best = state.evaluated[0];
  state.history.unshift({
    generacion: state.generation,
    razonCambio: reason,
    fitness: Number(best.fitness.toFixed(2)),
    estado: best.landed ? "Aterrizó" : "Choque",
    vx: Number(best.final.vx.toFixed(2)),
    vy: Number(best.final.vy.toFixed(2)),
  });
  state.history = state.history.slice(0, 12);

  state.population = next;
  state.generation += 1;
  evaluatePopulation();
  resetShip();
}

function drawShip(ship, color = "#60a5fa") {
  ctx.save();
  ctx.translate(ship.x, ship.y - 12);
  ctx.rotate(ship.angle);

  ctx.fillStyle = "#93c5fd";
  ctx.beginPath();
  ctx.ellipse(0, -7, 9, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fde68a";
  [-10, 0, 10].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, 5, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function drawExplosion() {
  if (!state.explosion) return;
  const e = state.explosion;

  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
  ctx.fillStyle = "orange";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(e.x, e.y, e.radius * 0.6, 0, Math.PI * 2);
  ctx.fillStyle = "yellow";
  ctx.fill();

  e.radius += 2.4;
  e.life -= 1;
  if (e.life <= 0 || e.radius > e.maxRadius) {
    state.explosion = null;
    if (state.pendingEvolutionReason) {
      evolveToNextGeneration(state.pendingEvolutionReason);
      state.pendingEvolutionReason = null;
    }
  }
}

function drawWorld() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#020817";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#334155";
  ctx.fillRect(0, state.world.floorY, canvas.width, canvas.height - state.world.floorY);

  ctx.fillStyle = "#22c55e";
  ctx.fillRect(
    state.world.landingZone.x1,
    state.world.floorY - 4,
    state.world.landingZone.x2 - state.world.landingZone.x1,
    8,
  );

  ctx.beginPath();
  ctx.strokeStyle = "#22d3ee";
  ctx.lineWidth = 2;
  state.ship.path.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  const color = state.status === "Aterrizaje suave" ? "#22c55e" : state.status === "Choque" ? "#f43f5e" : "#60a5fa";
  drawShip(state.ship, color);
  drawExplosion();
}

function statusClass() {
  if (state.status === "Aterrizaje suave") return "ok";
  if (state.status === "Choque") return "bad";
  return "warn";
}

function renderInfo() {
  const center = (state.world.landingZone.x1 + state.world.landingZone.x2) / 2;
  const dxZone = Math.abs(state.ship.x - center);

  ui.stats.innerHTML = `
    <article class="stat"><span class="label">Generación actual</span><span class="value">${state.generation}</span></article>
    <article class="stat"><span class="label">Velocidad X</span><span class="value">${state.ship.vx.toFixed(2)}</span></article>
    <article class="stat"><span class="label">Velocidad Y</span><span class="value">${state.ship.vy.toFixed(2)}</span></article>
    <article class="stat"><span class="label">Distancia horizontal a zona</span><span class="value">${dxZone.toFixed(2)}</span></article>
    <article class="stat"><span class="label">Estado</span><span class="value ${statusClass()}">${state.status}</span></article>
  `;

  ui.history.textContent = JSON.stringify(state.history, null, 2);
}

function render() {
  drawWorld();
  renderInfo();
}

function stepSimulation() {
  if (state.pendingEvolutionReason) {
    render();
    return;
  }

  const gene = state.activeChromosome[state.stepIndex] ?? 0;
  stepPhysics(state.ship, gene);
  state.stepIndex += 1;

  const landing = evaluateLanding(state.ship);
  if (landing.done) {
    if (landing.landed) {
      state.status = "Aterrizaje suave";
      pause();
      render();
      return;
    }

    state.status = "Choque";
    triggerExplosion(state.ship.x, state.ship.y);
    state.pendingEvolutionReason = "Choque contra el piso";
  }

  render();
}

function loop() {
  if (!state.running) return;

  for (let i = 0; i < state.timeScale; i += 1) {
    if (!state.running) break;
    stepSimulation();
  }

  requestAnimationFrame(loop);
}

function setSpeed(scale) {
  state.timeScale = scale;
  [ui.speed1Btn, ui.speed4Btn, ui.speed16Btn].forEach((btn) => btn.classList.remove("active"));
  if (scale === 1) ui.speed1Btn.classList.add("active");
  if (scale === 4) ui.speed4Btn.classList.add("active");
  if (scale === 16) ui.speed16Btn.classList.add("active");
}

function start() {
  if (!state.running) {
    state.running = true;
    loop();
  }
}

function pause() {
  state.running = false;
}

function newRun() {
  pause();
  state.world = createWorld();
  initPopulation();
  evaluatePopulation();
  resetShip();
  render();
}

ui.startBtn.addEventListener("click", start);
ui.pauseBtn.addEventListener("click", pause);
ui.newRunBtn.addEventListener("click", newRun);
ui.speed1Btn.addEventListener("click", () => setSpeed(1));
ui.speed4Btn.addEventListener("click", () => setSpeed(4));
ui.speed16Btn.addEventListener("click", () => setSpeed(16));

setSpeed(1);
newRun();

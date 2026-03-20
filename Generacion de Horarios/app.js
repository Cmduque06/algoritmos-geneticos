const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const startHour = 6;
const endHour = 23;

const FIXED_POPULATION_SIZE = 120;
const FIXED_GENERATION_LIMIT = 300;

const groups = [];
let page = 1;
const SUBJECTS_PER_PAGE = 5;

const tbody = document.querySelector("#groups-table tbody");
const statusEl = document.querySelector("#status");
const generationLogEl = document.querySelector("#generation-log");
const bestSummaryEl = document.querySelector("#best-summary");
const generationSelectEl = document.querySelector("#generation-select");
const pageInfoEl = document.querySelector("#page-info");

function getPreferences() {
  return {
    jornada: document.querySelector("#jornada").value,
    allowSaturday: document.querySelector("#allowSaturday").checked,
    allowSunday: document.querySelector("#allowSunday").checked,
    maxCredits: Number(document.querySelector("#maxCredits").value || 0),
    maxSubjects: Number(document.querySelector("#maxSubjects").value || 0),
  };
}

function selectedDaysFromForm() {
  return Array.from(document.querySelectorAll('input[name="dias"]:checked')).map((el) => el.value);
}

function clearDayChecks() {
  document.querySelectorAll('input[name="dias"]').forEach((el) => {
    el.checked = false;
  });
}

function groupedBySubject() {
  return groups.reduce((acc, g) => {
    if (!acc[g.materia]) acc[g.materia] = [];
    acc[g.materia].push(g);
    return acc;
  }, {});
}

function daysText(dias) {
  return dias.join(" y ");
}

function renderGroups() {
  const bySubject = groupedBySubject();
  const subjects = Object.keys(bySubject).sort((a, b) => a.localeCompare(b, "es"));
  const totalPages = Math.max(1, Math.ceil(subjects.length / SUBJECTS_PER_PAGE));
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * SUBJECTS_PER_PAGE;
  const visibleSubjects = new Set(subjects.slice(start, start + SUBJECTS_PER_PAGE));
  const visible = groups.filter((g) => visibleSubjects.has(g.materia));

  tbody.innerHTML = "";
  visible.forEach((g) => {
    const idx = groups.indexOf(g);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.materia}</td><td>${g.grupo}</td><td>${g.creditos}</td><td>${g.docente}</td>
      <td>${daysText(g.dias)}</td><td>${g.horaInicio}:00-${g.horaFin}:00</td><td>${g.salon}</td>
      <td><button data-i="${idx}" class="del">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".del").forEach((btn) => {
    btn.onclick = () => {
      groups.splice(Number(btn.dataset.i), 1);
      renderGroups();
    };
  });

  pageInfoEl.textContent = `Página ${page} de ${totalPages} `;
  document.querySelector("#prev-page").disabled = page <= 1;
  document.querySelector("#next-page").disabled = page >= totalPages;
}

document.querySelector("#prev-page").onclick = () => {
  page -= 1;
  renderGroups();
};
document.querySelector("#next-page").onclick = () => {
  page += 1;
  renderGroups();
};

document.querySelector("#group-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const dias = selectedDaysFromForm();
  const group = {
    materia: document.querySelector("#materia").value.trim(),
    grupo: document.querySelector("#grupo").value.trim(),
    creditos: Number(document.querySelector("#creditos").value),
    docente: document.querySelector("#docente").value.trim(),
    dias,
    horaInicio: Number(document.querySelector("#horaInicio").value),
    horaFin: Number(document.querySelector("#horaFin").value),
    salon: document.querySelector("#salon").value.trim(),
  };

  if (!group.materia || !group.grupo || !group.docente || !group.salon) return;
  if (!group.creditos || group.creditos < 1) return;
  if (!dias.length) {
    statusEl.textContent = "Selecciona al menos un día.";
    return;
  }
  if (group.horaInicio < 6 || group.horaFin > 23 || group.horaInicio >= group.horaFin) {
    statusEl.textContent = "Rango horario inválido.";
    return;
  }

  groups.push(group);
  e.target.reset();
  clearDayChecks();
  renderGroups();
  statusEl.textContent = "Grupo agregado.";
});

document.querySelector("#seed-demo").onclick = () => {
  groups.splice(0, groups.length, ...[
    { materia: "Estadística", grupo: "G2", creditos: 3, docente: "Laura", dias: ["Lunes", "Miércoles"], horaInicio: 8, horaFin: 10, salon: "P25-202" },
    { materia: "Estadística", grupo: "G1", creditos: 3, docente: "Laura", dias: ["Martes", "Jueves"], horaInicio: 8, horaFin: 10, salon: "P25-202" },
    { materia: "Programación", grupo: "G1", creditos: 4, docente: "Robert", dias: ["Martes", "Jueves"], horaInicio: 12, horaFin: 14, salon: "P13-307" },
    { materia: "Programación", grupo: "G2", creditos: 4, docente: "Robert", dias: ["Lunes", "Miércoles"], horaInicio: 14, horaFin: 16, salon: "P13-307" },
    { materia: "Inglés", grupo: "G1", creditos: 2, docente: "Ana", dias: ["Martes", "Jueves"], horaInicio: 10, horaFin: 12, salon: "P17-305" },
    { materia: "Inglés", grupo: "G2", creditos: 2, docente: "Ana", dias: ["Lunes", "Miércoles"], horaInicio: 8, horaFin: 10, salon: "P17-306" },
    { materia: "IA", grupo: "G1", creditos: 3, docente: "Juan", dias: ["Miércoles", "Viernes"], horaInicio: 16, horaFin: 18, salon: "P17-211" },
    { materia: "IA", grupo: "G2", creditos: 3, docente: "Juan", dias: ["Sábado", "Domingo"], horaInicio: 8, horaFin: 10, salon: "P17-211" },
    { materia: "Física", grupo: "G1", creditos: 3, docente: "Luis", dias: ["Lunes", "Miércoles"], horaInicio: 8, horaFin: 10, salon: "P20-101" },
    { materia: "Física", grupo: "G2", creditos: 3, docente: "Luis", dias: ["Martes", "Jueves"], horaInicio: 10, horaFin: 12, salon: "P20-102" },
    { materia: "Química", grupo: "G1", creditos: 3, docente: "María", dias: ["Lunes", "Miércoles"], horaInicio: 10, horaFin: 12, salon: "P15-202" },
    { materia: "Química", grupo: "G2", creditos: 3, docente: "María", dias: ["Martes", "Jueves"], horaInicio: 8, horaFin: 10, salon: "P15-203" },
    { materia: "Bases de Datos", grupo: "G1", creditos: 4, docente: "Andrés", dias: ["Martes", "Jueves"], horaInicio: 12, horaFin: 14, salon: "P13-201" },
    { materia: "Bases de Datos", grupo: "G2", creditos: 4, docente: "Andrés", dias: ["Lunes", "Miércoles"], horaInicio: 14, horaFin: 16, salon: "P13-202" },
    { materia: "Redes", grupo: "G1", creditos: 3, docente: "Camilo", dias: ["Martes", "Jueves"], horaInicio: 14, horaFin: 17, salon: "P18-302" },
    { materia: "Redes", grupo: "G2", creditos: 3, docente: "Camilo", dias: ["Lunes", "Miércoles"], horaInicio: 12, horaFin: 15, salon: "P18-303" },
    { materia: "Sistemas Operativos", grupo: "G1", creditos: 4, docente: "Diana", dias: ["Lunes", "Miércoles"], horaInicio: 14, horaFin: 16, salon: "P22-105" },
    { materia: "Sistemas Operativos", grupo: "G2", creditos: 4, docente: "Diana", dias: ["Martes", "Viernes"], horaInicio: 10, horaFin: 12, salon: "P22-106" },
    { materia: "Álgebra Lineal", grupo: "G1", creditos: 3, docente: "Jorge", dias: ["Martes", "Jueves"], horaInicio: 8, horaFin: 10, salon: "P30-101" },
    { materia: "Álgebra Lineal", grupo: "G2", creditos: 3, docente: "Jorge", dias: ["Lunes", "Miércoles"], horaInicio: 10, horaFin: 12, salon: "P30-102" },
    { materia: "Estadística Avanzada", grupo: "G1", creditos: 3, docente: "Laura", dias: ["Martes", "Jueves"], horaInicio: 10, horaFin: 12, salon: "P25-201" },
    { materia: "Estadística Avanzada", grupo: "G2", creditos: 3, docente: "Laura", dias: ["Lunes", "Miércoles"], horaInicio: 8, horaFin: 10, salon: "P25-202" }
  ]);
  page = 1;
  renderGroups();
  statusEl.textContent = "Datos de ejemplo cargados.";
};

function buildPoolBySubject(data) {
  const pool = {};
  data.forEach((g) => {
    if (!pool[g.materia]) pool[g.materia] = [];
    pool[g.materia].push(g);
  });
  return pool;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeIndividual(pool) {
  const ind = {};
  Object.keys(pool).forEach((subject) => {
    ind[subject] = Math.random() < 0.85 ? randomChoice(pool[subject]) : null;
  });
  return ind;
}

function flattenMeetings(selectedGroups) {
  return selectedGroups.flatMap((g) =>
    g.dias.map((dia) => ({
      materia: g.materia,
      grupo: g.grupo,
      docente: g.docente,
      dia,
      horaInicio: g.horaInicio,
      horaFin: g.horaFin,
      salon: g.salon,
    })),
  );
}

function computeIdleHours(meetings) {
  const byDay = {};
  meetings.forEach((m) => {
    if (!byDay[m.dia]) byDay[m.dia] = [];
    byDay[m.dia].push([m.horaInicio, m.horaFin]);
  });

  let idle = 0;
  Object.values(byDay).forEach((intervals) => {
    intervals.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < intervals.length; i++) {
      const gap = intervals[i][0] - intervals[i - 1][1];
      if (gap > 0) idle += gap;
    }
  });
  return idle;
}

function computeMetrics(individual, prefs) {
  const selectedGroups = Object.values(individual).filter(Boolean);
  const meetings = flattenMeetings(selectedGroups);

  const totalCredits = selectedGroups.reduce((acc, g) => acc + g.creditos, 0);
  const totalSubjects = selectedGroups.length;

  let overlapConflicts = 0;
  let roomConflicts = 0;
  let outsideWindow = 0;
  let weekendViolations = 0;

  const occupied = new Map();
  const roomOccupied = new Map();
  meetings.forEach((m) => {
    for (let h = m.horaInicio; h < m.horaFin; h++) {
      const key = `${m.dia}-${h}`;
      occupied.set(key, (occupied.get(key) || 0) + 1);
      const roomKey = `${m.dia}-${h}-${m.salon}`;
      roomOccupied.set(roomKey, (roomOccupied.get(roomKey) || 0) + 1);
    }

    if (prefs.jornada === "morning" && (m.horaInicio < 6 || m.horaFin > 12)) outsideWindow += 1;
    if (prefs.jornada === "afternoon" && (m.horaInicio < 14 || m.horaFin > 22)) outsideWindow += 1;
    if (m.dia === "Sábado" && !prefs.allowSaturday) weekendViolations += 1;
    if (m.dia === "Domingo" && !prefs.allowSunday) weekendViolations += 1;
  });

  occupied.forEach((count) => { if (count > 1) overlapConflicts += count - 1; });
  roomOccupied.forEach((count) => { if (count > 1) roomConflicts += count - 1; });

  const idleHours = computeIdleHours(meetings);
  const creditOverflow = Math.max(0, totalCredits - prefs.maxCredits);
  const unusedCredits = Math.max(0, prefs.maxCredits - totalCredits);
  const subjectsOverflow = prefs.maxSubjects > 0 ? Math.max(0, totalSubjects - prefs.maxSubjects) : 0;

  return {
    totalCredits,
    totalSubjects,
    idleHours,
    overlapConflicts,
    roomConflicts,
    outsideWindow,
    weekendViolations,
    creditOverflow,
    subjectsOverflow,
    unusedCredits,
  };
}

function fitness(individual, prefs) {
  const m = computeMetrics(individual, prefs);
  const penalties =
    m.overlapConflicts * 80 +
    m.roomConflicts * 50 +
    m.outsideWindow * 40 +
    m.weekendViolations * 55 +
    m.creditOverflow * 140 +
    m.subjectsOverflow * 70 +
    m.idleHours * 18 +
    m.unusedCredits * 25;
  return 200 - penalties;
}

function crossover(a, b, subjects) {
  if (subjects.length <= 1) return [{ ...a }, { ...b }];
  const cut = Math.floor(Math.random() * (subjects.length - 1)) + 1;
  const c1 = {};
  const c2 = {};
  subjects.forEach((s, i) => {
    c1[s] = i < cut ? a[s] : b[s];
    c2[s] = i < cut ? b[s] : a[s];
  });
  return [c1, c2];
}

function mutate(ind, pool, subjects) {
  if (Math.random() > 0.25) return;
  const s = randomChoice(subjects);
  ind[s] = randomChoice([null, ...pool[s]]);
}

function isOptimal(metrics, prefs) {
  const creditsAtMax = metrics.totalCredits === prefs.maxCredits;
  const subjectsOk = prefs.maxSubjects <= 0 || metrics.totalSubjects <= prefs.maxSubjects;

  return creditsAtMax && subjectsOk &&
    metrics.overlapConflicts === 0 &&
    metrics.roomConflicts === 0 &&
    metrics.outsideWindow === 0 &&
    metrics.weekendViolations === 0 &&
    metrics.creditOverflow === 0 &&
    metrics.subjectsOverflow === 0 &&
    metrics.idleHours === 0;
}

function runGA(data, prefs) {
  const pool = buildPoolBySubject(data);
  const subjects = Object.keys(pool);
  if (!subjects.length) return null;

  let pop = Array.from({ length: FIXED_POPULATION_SIZE }, () => makeIndividual(pool));
  let bestEver = pop[0];
  let bestFit = fitness(bestEver, prefs);
  const history = [];
  let optimalGeneration = null;

  for (let gen = 1; gen <= FIXED_GENERATION_LIMIT; gen++) {
    pop.sort((a, b) => fitness(b, prefs) - fitness(a, prefs));
    const bestGen = pop[0];
    const fit = fitness(bestGen, prefs);
    const metrics = computeMetrics(bestGen, prefs);

    if (fit > bestFit) {
      bestEver = bestGen;
      bestFit = fit;
    }

    history.push({ gen, fitness: fit, metrics, individual: JSON.parse(JSON.stringify(bestGen)) });
    if (isOptimal(metrics, prefs)) {
      optimalGeneration = gen;
      break;
    }

    const elite = Math.max(1, Math.floor(FIXED_POPULATION_SIZE * 0.1));
    const newPop = pop.slice(0, elite).map((x) => ({ ...x }));
    while (newPop.length < FIXED_POPULATION_SIZE) {
      const p1 = pop[Math.floor(Math.random() * Math.min(25, pop.length))] || pop[0];
      const p2 = pop[Math.floor(Math.random() * Math.min(25, pop.length))] || pop[0];
      const [c1, c2] = crossover(p1, p2, subjects);
      mutate(c1, pool, subjects);
      mutate(c2, pool, subjects);
      newPop.push(c1, c2);
    }
    pop = newPop.slice(0, FIXED_POPULATION_SIZE);
  }

  return {
    best: bestEver,
    score: bestFit,
    metrics: computeMetrics(bestEver, prefs),
    history,
    optimalGeneration,
  };
}

function summaryLine(h) {
  return `Gen ${String(h.gen).padStart(3, "0")} | Fitness: ${h.fitness.toFixed(2)} | Créditos: ${h.metrics.totalCredits} | Materias: ${h.metrics.totalSubjects} | Huecos: ${h.metrics.idleHours}h | Conflictos: ${h.metrics.overlapConflicts}`;
}

function renderGenerationSelector(result) {
  generationSelectEl.innerHTML = "";
  result.history.forEach((h, idx) => {
    const opt = document.createElement("option");
    opt.value = String(idx);
    opt.textContent = `Generación ${h.gen}`;
    generationSelectEl.appendChild(opt);
  });

  generationSelectEl.onchange = () => {
    const idx = Number(generationSelectEl.value);
    const entry = result.history[idx];
    if (!entry) return;
    generationLogEl.textContent = summaryLine(entry);
    renderBestSummary(entry.fitness, entry.metrics, `Vista generación ${entry.gen}`);
    renderSchedule(entry.individual);
  };
}

function renderBestSummary(score, metrics, title = "Mejor resultado") {
  bestSummaryEl.innerHTML = `
    <div class="summary-pill"><strong>${title}</strong></div>
    <p><strong>Fitness:</strong> ${score.toFixed(2)} | <strong>Créditos:</strong> ${metrics.totalCredits}/${document.querySelector("#maxCredits").value} | <strong>Materias:</strong> ${metrics.totalSubjects} | <strong>Tiempo perdido:</strong> ${metrics.idleHours}h</p>
  `;
}

function renderSchedule(individual) {
  const container = document.querySelector("#schedule");
  if (!individual) {
    container.innerHTML = "";
    return;
  }

  const bySlot = {};
  Object.values(individual).filter(Boolean).forEach((g) => {
    g.dias.forEach((dia) => {
      for (let h = g.horaInicio; h < g.horaFin; h++) {
        const key = `${dia}-${h}`;
        if (!bySlot[key]) bySlot[key] = [];
        bySlot[key].push({ materia: g.materia, grupo: g.grupo, docente: g.docente, salon: g.salon });
      }
    });
  });

  const grid = document.createElement("div");
  grid.className = "schedule-grid";
  grid.innerHTML = `<div class="head"></div>${days.map((d) => `<div class="head">${d}</div>`).join("")}`;

  for (let h = startHour; h < endHour; h++) {
    const hourCell = document.createElement("div");
    hourCell.className = "cell hour";
    hourCell.textContent = `${h}:00`;
    grid.appendChild(hourCell);

    days.forEach((d) => {
      const key = `${d}-${h}`;
      const entries = bySlot[key] || [];
      const cell = document.createElement("div");
      cell.className = "cell";
      if (entries.length) {
        cell.innerHTML = entries.map((e) => `<div class="class-block ${entries.length > 1 ? "conflict" : ""}"><strong>${e.materia} (${e.grupo})</strong><br>${e.docente}<br>${e.salon}</div>`).join("");
      }
      grid.appendChild(cell);
    });
  }

  container.innerHTML = "";
  container.appendChild(grid);
}

document.querySelector("#run-ga").onclick = () => {
  if (!groups.length) {
    statusEl.textContent = "Agrega datos primero.";
    return;
  }
  const prefs = getPreferences();
  if (prefs.maxCredits < 1) {
    statusEl.textContent = "Define créditos máximos válidos.";
    return;
  }

  const result = runGA(groups, prefs);
  if (!result) return;

  renderGenerationSelector(result);
  generationSelectEl.value = String(result.history.length - 1);
  generationLogEl.textContent = result.history.map(summaryLine).join("\n") +
    (result.optimalGeneration ? `\n✅ Óptimo en generación ${result.optimalGeneration}` : "\n⚠️ Sin óptimo exacto, se muestra mejor resultado.");

  renderBestSummary(result.score, result.metrics);
  renderSchedule(result.best);

  statusEl.textContent = result.optimalGeneration
    ? `Horario óptimo encontrado en generación ${result.optimalGeneration}.`
    : "No se encontró óptimo exacto; se muestra el mejor horario.";
};

renderGroups();
renderSchedule(null);

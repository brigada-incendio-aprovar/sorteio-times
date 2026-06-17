/* =========================================================
   Sorteio de Times — app.js
   Dados em LocalStorage. 100% offline.
   ========================================================= */
"use strict";

/* ---------- Storage ---------- */
const KEY_P = "vt_players";
const KEY_H = "vt_history";
const KEY_T = "vt_theme";

const load = (k, def) => { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let players = load(KEY_P, []);
let history = load(KEY_H, []);
let lastDraw = null;          // resultado atual em memória
let editingId = null;         // jogador em edição no modal
let modalSex = "M", modalStars = 3;
let playerFilter = "all";

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const savePlayers = () => save(KEY_P, players);
const saveHistory = () => save(KEY_H, history);

/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const starsTxt = n => "⭐".repeat(n);
const starsHTML = n => "★".repeat(n) + `<span class="off">${"★".repeat(5 - n)}</span>`;
const TEAM_NAMES = ["A", "B", "C", "D", "E", "F"];
const TEAM_EMOJI = ["🔵", "🔴", "🟢", "🟡", "🟣", "🟠"];

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg; t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.hidden = true), 2200);
}

/* ---------- Navegação ---------- */
function go(id) {
  $$(".screen").forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo(0, 0);
  if (id === "screen-players") renderPlayers();
  if (id === "screen-history") renderHistory();
  if (id === "screen-home") renderHome();
  if (id === "screen-draw") updateDrawStatus();
}
$$("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));

/* ---------- HOME ---------- */
function renderHome() {
  const active = players.filter(p => p.active).length;
  $("#home-stats").textContent =
    players.length === 0 ? "Cadastre seus jogadores para começar"
    : `${players.length} jogadores · ${active} ativos`;
}

/* =========================================================
   JOGADORES
   ========================================================= */
function renderPlayers() {
  const term = ($("#player-search").value || "").toLowerCase().trim();
  const list = $("#player-list");
  let arr = [...players].sort((a, b) => a.name.localeCompare(b.name, "pt"));
  if (playerFilter === "active") arr = arr.filter(p => p.active);
  if (playerFilter === "off") arr = arr.filter(p => !p.active);
  if (term) arr = arr.filter(p => p.name.toLowerCase().includes(term));

  $("#players-empty").hidden = players.length !== 0;
  list.innerHTML = arr.map(p => `
    <li class="player-item ${p.active ? "" : "off"}" data-id="${p.id}">
      <button class="p-toggle ${p.active ? "on" : ""}" data-act="toggle" aria-label="ativar">${p.active ? "✓" : ""}</button>
      <div class="p-main" data-act="edit">
        <div class="p-name">${escapeHTML(p.name)}
          <span class="p-badge ${p.sex === "M" ? "m" : "f"}">${p.sex === "M" ? "M" : "F"}</span>
        </div>
        <div class="p-stars">${starsHTML(p.rank)}</div>
      </div>
      <button class="p-menu" data-act="menu" aria-label="opções">⋯</button>
    </li>`).join("");
}

function escapeHTML(s) {
  return s.replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

$("#player-list").addEventListener("click", e => {
  const li = e.target.closest(".player-item"); if (!li) return;
  const id = li.dataset.id;
  const act = e.target.closest("[data-act]")?.dataset.act;
  const p = players.find(x => x.id === id);
  if (act === "toggle") { p.active = !p.active; savePlayers(); renderPlayers(); }
  else if (act === "edit") openPlayerModal(p);
  else if (act === "menu") {
    if (confirm(`Excluir ${p.name}?`)) {
      players = players.filter(x => x.id !== id); savePlayers(); renderPlayers();
      toast("Jogador excluído");
    }
  }
});

$("#player-search").addEventListener("input", renderPlayers);
$$("#screen-players .seg-btn").forEach(b => b.addEventListener("click", () => {
  $$("#screen-players .seg-btn").forEach(x => x.classList.remove("active"));
  b.classList.add("active"); playerFilter = b.dataset.filter; renderPlayers();
}));
$("#btn-all-on").addEventListener("click", () => { players.forEach(p => p.active = true); savePlayers(); renderPlayers(); });
$("#btn-all-off").addEventListener("click", () => { players.forEach(p => p.active = false); savePlayers(); renderPlayers(); });

/* ---------- Modal jogador ---------- */
$("#btn-add-player").addEventListener("click", () => openPlayerModal(null));

function openPlayerModal(p) {
  editingId = p ? p.id : null;
  $("#player-modal-title").textContent = p ? "Editar jogador" : "Novo jogador";
  $("#f-name").value = p ? p.name : "";
  modalSex = p ? p.sex : "M";
  modalStars = p ? p.rank : 3;
  $$("#f-sex .seg-btn").forEach(b => b.classList.toggle("active", b.dataset.sex === modalSex));
  paintStars();
  $("#player-modal").hidden = false;
  setTimeout(() => $("#f-name").focus(), 100);
}
function paintStars() {
  $$("#f-stars button").forEach(b => b.classList.toggle("on", +b.dataset.v <= modalStars));
}
$$("#f-sex .seg-btn").forEach(b => b.addEventListener("click", () => {
  modalSex = b.dataset.sex;
  $$("#f-sex .seg-btn").forEach(x => x.classList.remove("active")); b.classList.add("active");
}));
$$("#f-stars button").forEach(b => b.addEventListener("click", () => { modalStars = +b.dataset.v; paintStars(); }));
$("#player-cancel").addEventListener("click", () => $("#player-modal").hidden = true);
$("#player-modal").addEventListener("click", e => { if (e.target.id === "player-modal") $("#player-modal").hidden = true; });

$("#player-save").addEventListener("click", () => {
  const name = $("#f-name").value.trim();
  if (!name) { toast("Digite um nome"); return; }
  if (editingId) {
    const p = players.find(x => x.id === editingId);
    p.name = name; p.sex = modalSex; p.rank = modalStars;
  } else {
    players.push({ id: uid(), name, sex: modalSex, rank: modalStars, active: true });
  }
  savePlayers();
  $("#player-modal").hidden = true;
  renderPlayers();
  toast(editingId ? "Atualizado" : "Jogador adicionado");
});

/* =========================================================
   SORTEAR — config
   ========================================================= */
const cfg = { type: "normal", size: 5, teams: 2, comp: "auto" };

function segHandler(sel, key, cast = String) {
  $$(`${sel} .seg-btn`).forEach(b => b.addEventListener("click", () => {
    $$(`${sel} .seg-btn`).forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    cfg[key] = cast(b.dataset[key]);
    if (key === "size") buildCompOptions();
    if (key === "type") $("#type-hint").textContent =
      cfg.type === "ranked" ? "Usa as estrelas para equilibrar a força dos times."
                            : "Distribuição aleatória, sem usar estrelas.";
    updateDrawStatus();
  }));
}
segHandler("#cfg-type", "type");
segHandler("#cfg-size", "size", Number);
segHandler("#cfg-teams", "teams", Number);

function buildCompOptions() {
  const P = cfg.size;
  const sel = $("#cfg-comp");
  let opts = `<option value="auto">Sem restrição de sexo</option>`;
  for (let m = P; m >= 0; m--) {
    const f = P - m;
    const label = `${m} ${m === 1 ? "homem" : "homens"} + ${f} ${f === 1 ? "mulher" : "mulheres"}`;
    opts += `<option value="${m}-${f}">${label}</option>`;
  }
  sel.innerHTML = opts;
  cfg.comp = "auto";
}
$("#cfg-comp").addEventListener("change", e => { cfg.comp = e.target.value; updateDrawStatus(); });

/* Validação + status */
function getNeeds() {
  const total = cfg.size * cfg.teams;
  if (cfg.comp === "auto") return { total, men: null, women: null };
  const [m, f] = cfg.comp.split("-").map(Number);
  return { total, men: m * cfg.teams, women: f * cfg.teams };
}

function updateDrawStatus() {
  const act = players.filter(p => p.active);
  const men = act.filter(p => p.sex === "M").length;
  const women = act.filter(p => p.sex === "F").length;
  const need = getNeeds();
  const st = $("#cfg-status");
  const btn = $("#btn-do-draw");
  let ok = true, msg = "";

  if (need.men === null) {
    if (act.length < need.total) { ok = false; msg = `${act.length} ativos — este sorteio precisa de ${need.total}`; }
    else msg = `${act.length} ativos · este sorteio usa ${need.total}`;
  } else {
    const probs = [];
    if (men < need.men) probs.push(`homens ${men}/${need.men}`);
    if (women < need.women) probs.push(`mulheres ${women}/${need.women}`);
    if (probs.length) { ok = false; msg = "Faltam: " + probs.join(" · "); }
    else msg = `OK · este sorteio usa ${need.men}H + ${need.women}M`;
  }
  st.textContent = msg;
  st.className = "cfg-status " + (ok ? "ok" : "bad");
  btn.disabled = !ok;
  return ok;
}

/* =========================================================
   ALGORITMOS DE SORTEIO
   ========================================================= */
function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function emptyTeams(n) {
  return Array.from({ length: n }, (_, i) => ({ name: TEAM_NAMES[i], players: [], total: 0, m: 0, f: 0 }));
}

/* MODO NORMAL: aleatório, respeitando quotas */
function drawNormal(active, needPerTeam) {
  const teams = emptyTeams(cfg.teams);
  const fill = (pool, key, per) => {
    pool = shuffle(pool);
    let idx = 0;
    // round-robin: distribui de forma circular
    for (const p of pool) {
      // procura próximo time com vaga, partindo de idx (rotativo)
      let placed = false;
      for (let k = 0; k < teams.length; k++) {
        const t = teams[(idx + k) % teams.length];
        if (t[key] < per) { t.players.push(p); t[key]++; t.total += p.rank; idx = (idx + k + 1) % teams.length; placed = true; break; }
      }
      if (!placed) bench.push(p); // sobra
    }
  };
  const bench = [];
  if (needPerTeam.men === null) {
    // sem restrição: distribui todos contando "m" como slot genérico
    const pool = shuffle(active);
    let idx = 0;
    for (const p of pool) {
      let placed = false;
      for (let k = 0; k < teams.length; k++) {
        const t = teams[(idx + k) % teams.length];
        if (t.players.length < cfg.size) { t.players.push(p); t.total += p.rank; idx = (idx + k + 1) % teams.length; placed = true; break; }
      }
      if (!placed) bench.push(p);
    }
  } else {
    fill(active.filter(p => p.sex === "M"), "m", needPerTeam.men);
    fill(active.filter(p => p.sex === "F"), "f", needPerTeam.women);
  }
  return { teams, bench };
}

/* MODO RANKEADO: equilibra somatório de estrelas */
function drawRanked(active, needPerTeam) {
  const teams = emptyTeams(cfg.teams);
  const bench = [];

  const assignGender = (pool, key, per, useSizeOnly = false) => {
    // ordena por força desc; embaralha empates para variar entre sorteios
    pool = shuffle(pool).sort((a, b) => b.rank - a.rank);
    for (const p of pool) {
      const elig = teams.filter(t => useSizeOnly ? t.players.length < cfg.size : t[key] < per);
      if (!elig.length) { bench.push(p); continue; }
      // entrega o mais forte ao time mais fraco no momento
      elig.sort((a, b) => a.total - b.total || a.players.length - b.players.length);
      const t = elig[0];
      t.players.push(p); t.total += p.rank; t[key]++;
    }
  };

  if (needPerTeam.men === null) {
    assignGender(active, "m", 0, true);
  } else {
    assignGender(active.filter(p => p.sex === "M"), "m", needPerTeam.men);
    assignGender(active.filter(p => p.sex === "F"), "f", needPerTeam.women);
  }

  optimizeBalance(teams);
  return { teams, bench };
}

/* Refino: troca jogadores de MESMO sexo entre times para reduzir a diferença */
function optimizeBalance(teams) {
  const spread = () => {
    const t = teams.map(x => x.total);
    return Math.max(...t) - Math.min(...t);
  };
  let improved = true, guard = 0;
  while (improved && guard++ < 400) {
    improved = false;
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i === j) continue;
        for (const pi of teams[i].players) {
          for (const pj of teams[j].players) {
            if (pi.sex !== pj.sex) continue;       // preserva quota de sexo
            if (pi.rank === pj.rank) continue;
            const before = spread();
            const tot = teams.map(x => x.total);
            tot[i] = tot[i] - pi.rank + pj.rank;
            tot[j] = tot[j] - pj.rank + pi.rank;
            const after = Math.max(...tot) - Math.min(...tot);
            if (after < before) {
              // efetua a troca
              teams[i].players[teams[i].players.indexOf(pi)] = pj;
              teams[j].players[teams[j].players.indexOf(pj)] = pi;
              teams[i].total = teams[i].total - pi.rank + pj.rank;
              teams[j].total = teams[j].total - pj.rank + pi.rank;
              improved = true;
            }
          }
        }
      }
    }
  }
}

/* ---------- Executar sorteio ---------- */
$("#btn-do-draw").addEventListener("click", () => runDraw());
$("#btn-redraw").addEventListener("click", () => runDraw(true));

function runDraw(silent = false) {
  if (!updateDrawStatus()) { toast("Ajuste a configuração"); return; }
  const active = players.filter(p => p.active);
  const need = getNeeds();
  const perTeam = need.men === null ? { men: null } : { men: need.men / cfg.teams, women: need.women / cfg.teams };

  const res = cfg.type === "ranked" ? drawRanked(active, perTeam) : drawNormal(active, perTeam);

  // ordena jogadores de cada time por força desc só p/ exibir
  res.teams.forEach(t => t.players.sort((a, b) => b.rank - a.rank));

  lastDraw = {
    id: uid(),
    date: new Date().toISOString(),
    type: cfg.type,
    size: cfg.size,
    teamsCount: cfg.teams,
    comp: cfg.comp,
    teams: res.teams.map(t => ({ name: t.name, total: t.total, players: t.players.map(p => ({ name: p.name, sex: p.sex, rank: p.rank })) })),
    bench: res.bench.map(p => ({ name: p.name, sex: p.sex, rank: p.rank }))
  };

  history.unshift(lastDraw);
  history = history.slice(0, 50);
  saveHistory();

  renderResult(lastDraw);
  if (!silent) go("screen-result");
}

/* ---------- Render resultado ---------- */
function renderResult(d) {
  const typeLbl = d.type === "ranked" ? "Rankeado" : "Normal";
  $("#result-meta").textContent = `${typeLbl} · ${d.teamsCount} times · ${d.size} por time`;
  const out = $("#teams-out");
  out.innerHTML = d.teams.map((t, i) => `
    <div class="team-card">
      <div class="team-head t-c${i}">
        <span class="t-name">${TEAM_EMOJI[i]} Time ${t.name}</span>
        <span class="t-total">${t.total} pts</span>
      </div>
      <ul class="team-body">
        ${t.players.map(p => `<li><span>${escapeHTML(p.name)}</span><span class="stars">${"★".repeat(p.rank)}</span></li>`).join("")}
      </ul>
    </div>`).join("");

  if (d.bench && d.bench.length) {
    out.innerHTML += `<div class="bench"><h4>Reservas</h4>${d.bench.map(p => `<span>${escapeHTML(p.name)} ${"★".repeat(p.rank)}</span>`).join("")}</div>`;
  }
}

/* =========================================================
   COMPARTILHAR
   ========================================================= */
function buildShareText(d) {
  let txt = "🏐 SORTEIO DOS TIMES\n";
  txt += `${d.type === "ranked" ? "Rankeado" : "Normal"} · ${d.size} por time\n`;
  d.teams.forEach((t, i) => {
    txt += `\n${TEAM_EMOJI[i]} TIME ${t.name}  (${t.total} pts)\n`;
    t.players.forEach(p => { txt += `• ${p.name} ${starsTxt(p.rank)}\n`; });
  });
  if (d.bench && d.bench.length) {
    txt += `\n🪑 Reservas: ${d.bench.map(p => p.name).join(", ")}\n`;
  }
  return txt.trim();
}

function shareWhats(d) {
  const text = buildShareText(d);
  const url = "https://wa.me/?text=" + encodeURIComponent(text);
  // tenta Web Share API (melhor no iPhone), senão abre wa.me
  if (navigator.share) {
    navigator.share({ text }).catch(() => window.open(url, "_blank"));
  } else {
    window.open(url, "_blank");
  }
}

$("#btn-share").addEventListener("click", () => lastDraw && shareWhats(lastDraw));
$("#btn-copy").addEventListener("click", async () => {
  if (!lastDraw) return;
  try { await navigator.clipboard.writeText(buildShareText(lastDraw)); toast("Texto copiado"); }
  catch { toast("Não foi possível copiar"); }
});

/* =========================================================
   HISTÓRICO
   ========================================================= */
function renderHistory() {
  const list = $("#history-list");
  $("#history-empty").hidden = history.length !== 0;
  list.innerHTML = history.map(d => {
    const dt = new Date(d.date);
    const datestr = dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    const names = d.teams.map((t, i) => `${TEAM_EMOJI[i]}${t.total}`).join("  ");
    return `<li class="hist-item" data-id="${d.id}">
      <div class="hist-top">
        <span class="hist-date">${datestr}</span>
        <span class="hist-tag ${d.type}">${d.type === "ranked" ? "Rankeado" : "Normal"}</span>
      </div>
      <div class="hist-sub">${d.teamsCount} times · ${d.size}/time · ${names}</div>
      <div class="hist-actions">
        <button data-act="view">👁 Ver</button>
        <button data-act="share">📲 Enviar</button>
        <button data-act="del" class="del">🗑 Excluir</button>
      </div>
    </li>`;
  }).join("");
}

$("#history-list").addEventListener("click", e => {
  const li = e.target.closest(".hist-item"); if (!li) return;
  const d = history.find(x => x.id === li.dataset.id);
  const act = e.target.closest("[data-act]")?.dataset.act;
  if (act === "view") { lastDraw = d; renderResult(d); go("screen-result"); }
  else if (act === "share") shareWhats(d);
  else if (act === "del") {
    if (confirm("Excluir este sorteio?")) { history = history.filter(x => x.id !== d.id); saveHistory(); renderHistory(); }
  }
});

$("#btn-clear-history").addEventListener("click", () => {
  if (!history.length) return;
  if (confirm("Apagar todo o histórico?")) { history = []; saveHistory(); renderHistory(); toast("Histórico limpo"); }
});

/* =========================================================
   TEMA
   ========================================================= */
function applyTheme(t) {
  if (t === "light" || t === "dark") document.documentElement.setAttribute("data-theme", t);
  else document.documentElement.removeAttribute("data-theme"); // auto
}
applyTheme(load(KEY_T, "auto"));
$("#btn-theme").addEventListener("click", () => {
  const cur = load(KEY_T, "auto");
  const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
  save(KEY_T, next); applyTheme(next);
  toast("Tema: " + (next === "auto" ? "automático" : next === "light" ? "claro" : "escuro"));
});

/* =========================================================
   BACKUP / RESTAURAR  (mitiga perda de dados no iOS)
   ========================================================= */
$("#btn-backup").addEventListener("click", () => {
  const choice = prompt("Digite:\nE = exportar backup\nI = importar backup", "E");
  if (!choice) return;
  if (choice.toUpperCase() === "E") {
    const data = JSON.stringify({ players, history });
    navigator.clipboard?.writeText(data).then(
      () => toast("Backup copiado p/ área de transferência"),
      () => prompt("Copie este backup:", data)
    );
  } else if (choice.toUpperCase() === "I") {
    const raw = prompt("Cole o backup aqui:");
    if (!raw) return;
    try {
      const obj = JSON.parse(raw);
      if (Array.isArray(obj.players)) { players = obj.players; savePlayers(); }
      if (Array.isArray(obj.history)) { history = obj.history; saveHistory(); }
      toast("Backup restaurado");
      renderHome();
    } catch { toast("Backup inválido"); }
  }
});

/* =========================================================
   INIT
   ========================================================= */
buildCompOptions();
renderHome();
$("#type-hint").textContent = "Distribuição aleatória, sem usar estrelas.";

/* Service worker */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("service-worker.js").catch(() => {}));
}

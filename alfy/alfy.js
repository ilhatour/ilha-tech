// ALFY · Mapa de Rotas · Ilha Tech · v1.0.0 · 03/11/2026
// Tudo passa pelas funções alfy_* do banco, sempre com a chave pessoal de quem está usando.
// O banco decide o que cada pessoa vê; a tela só desenha o que voltou.
"use strict";

const API = "https://tladwxithannxstbneon.supabase.co/rest/v1/rpc/";
const CHAVE_PUBLICA = "sb_publishable_FV_NUHwNP2H8gkGsvd6Odw_19NBn9pl";
const GUARDA = "alfy-k";

const ST = {
  rota:      { nome: "Rotas",        curto: "A fazer",    cor: "var(--st-rota)" },
  andamento: { nome: "Em andamento", curto: "Andamento",  cor: "var(--st-andamento)" },
  pausada:   { nome: "Pausadas",     curto: "Pausar",     cor: "var(--st-pausada)" },
  concluida: { nome: "Concluídas",   curto: "Concluída",  cor: "var(--st-concluida)" },
  ideia:     { nome: "Ideias",       curto: "Ideia",      cor: "var(--st-ideia)" },
};
const ORDEM = ["rota", "andamento", "pausada", "concluida", "ideia"];
const PRIORIDADES = ["🚨 P1 · 24h", "⚡ P2 · 72h", "⏳ P3 · 7 dias", "💤 P4 · 30 dias", "⏸️ P5 · sem prazo"];
const FRENTES = ["🔥💧 Ilha Tour · Fogo e Água", "🌬️ Ilha Tour · Ar", "🌍 Terra · OP IG", "👥 Ilha Tour · Gestão de Pessoas",
  "🏨 Pousadas", "⚓️ Vou de Barco", "🌊 Buena Onda", "🏡 Cantinho da Ilha", "🏖️ Agência Ilha", "🚘 Ilha Go",
  "👾 Ilha Tech", "🌇 Agência Rio", "🧍 Pessoal"];
const NATUREZAS = ["🔴 Sobrevivência", "🟡 Manutenção", "🔵 Desenvolvimento", "🟢 Crescimento"];
const TIPOS = ["📞 Comunicação", "🛠️ Ação", "🧠 Decisão", "🛒 Compra"];

let token = null, mapa = null, versao = null, vista = "lista", ultimaLeitura = 0, cartaoAberto = null;
const filtro = { busca: "", pessoa: "", frente: "", vencidas: false, minhas: false };
const $ = (s) => document.querySelector(s);

// ---------------------------------------------------------------- utilidades
function h(tag, attrs, ...filhos) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "style") el.setAttribute("style", v);
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f !== null && f !== undefined && f !== false) el.append(f.nodeType ? f : String(f));
  return el;
}
async function rpc(fn, args) {
  const r = await fetch(API + fn, {
    method: "POST",
    headers: { apikey: CHAVE_PUBLICA, "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
  if (!r.ok) {
    let msg = "Falhou a conexão com a base.";
    try { msg = (await r.json()).message || msg; } catch (_) { /* resposta sem corpo */ }
    throw new Error(msg);
  }
  return r.json();
}
function avisar(txt, ruim) {
  const a = $("#aviso");
  a.textContent = txt; a.className = "aviso" + (ruim ? " ruim" : ""); a.hidden = false;
  clearTimeout(avisar.t); avisar.t = setTimeout(() => (a.hidden = true), 3200);
}
const guardar = (k) => { try { k ? localStorage.setItem(GUARDA, k) : localStorage.removeItem(GUARDA); } catch (_) { /* navegação privada */ } };
const lerGuardado = () => { try { return localStorage.getItem(GUARDA); } catch (_) { return null; } };

const papel = () => mapa?.eu?.papel;
const manda = () => papel() === "comando" || papel() === "gerente";
const pessoaPorId = (id) => mapa?.pessoas?.find((p) => p.id === id);
const nomeDe = (id) => pessoaPorId(id)?.nome || "Sem responsável";
const hoje0 = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const vencida = (r) => r.prazo && !["concluida", "ideia"].includes(r.status) && new Date(r.prazo) < hoje0();
function dataCurta(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
}
function quandoFoi(iso) {
  const d = new Date(iso), dif = (Date.now() - d) / 60000;
  if (dif < 1) return "agora";
  if (dif < 60) return `há ${Math.round(dif)} min`;
  if (dif < 60 * 24) return `há ${Math.round(dif / 60)} h`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
const prioCurta = (p) => (p || "").match(/P[1-5]/)?.[0] || "";
const bolinha = (st) => h("span", { class: "st", style: `background:${ST[st].cor};box-shadow:0 0 8px ${ST[st].cor}` });

// ---------------------------------------------------------------- céu da cabine
const ceu = { estrelas: [], vel: 0.15, alvo: 0.15, raf: 0, parado: false };
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
function desenhaCeu(salto) {
  const c = $("#ceu"), x = c.getContext("2d"), w = innerWidth, hgt = innerHeight, dpr = Math.min(2, devicePixelRatio || 1);
  if (c.width !== w * dpr || c.height !== hgt * dpr) { c.width = w * dpr; c.height = hgt * dpr; }
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.fillStyle = "#0B0124"; x.fillRect(0, 0, w, hgt);
  // Via Láctea inclinada, igual à cabine da Nave Mãe
  x.save(); x.translate(w / 2, hgt * 0.42); x.rotate(-18 * Math.PI / 180);
  const k = Math.max(w, hgt) / 1600, g = x.createLinearGradient(0, -170 * k, 0, 170 * k);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, "rgba(199,155,255,.13)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(-1100 * k, -170 * k, 2200 * k, 340 * k); x.restore();
  const cx = w / 2, cy = hgt * 0.45, f = Math.max(w, hgt) / 2;
  x.lineCap = "round";
  for (const s of ceu.estrelas) {
    if (salto) s.z -= ceu.vel * 0.016;
    if (s.z <= 0.03) Object.assign(s, novaEstrela(false));
    const px = cx + (s.x / s.z) * f, py = cy + (s.y / s.z) * f;
    if (px < -50 || px > w + 50 || py < -50 || py > hgt + 50) { Object.assign(s, novaEstrela(false)); continue; }
    const t = Math.max(0.4, (1 - s.z) * 2.2);
    x.globalAlpha = Math.min(1, (1 - s.z) * 1.4);
    x.strokeStyle = x.fillStyle = s.c;
    if (salto && ceu.vel > 0.6) {
      const z2 = s.z + ceu.vel * 0.05, qx = cx + (s.x / z2) * f, qy = cy + (s.y / z2) * f;
      x.lineWidth = t; x.beginPath(); x.moveTo(qx, qy); x.lineTo(px, py); x.stroke();
    } else x.fillRect(px, py, t, t);
  }
  x.globalAlpha = 1;
}
function novaEstrela(inicio) {
  const cores = ["#EDE8FF", "#EDE8FF", "#C79BFF", "#6EE79B", "#A855F4"];
  return { x: (Math.random() * 2 - 1) * 1.2, y: (Math.random() * 2 - 1) * 1.2, z: inicio ? 0.05 + Math.random() * 0.95 : 1,
           c: cores[(Math.random() * cores.length) | 0] };
}
function ligaCeu() {
  ceu.estrelas = Array.from({ length: Math.round(Math.min(520, innerWidth * innerHeight / 3600)) }, () => novaEstrela(true));
  if (calmo) { desenhaCeu(false); return; }
  const quadro = () => {
    ceu.vel += (ceu.alvo - ceu.vel) * 0.06;
    desenhaCeu(true);
    ceu.raf = ceu.parado ? 0 : requestAnimationFrame(quadro);
  };
  quadro();
}
addEventListener("resize", () => { if (calmo || ceu.parado) desenhaCeu(false); });
function salto() {
  return new Promise((ok) => {
    if (calmo) return ok();
    ceu.alvo = 4; setTimeout(() => { ceu.alvo = 0.15; }, 650); setTimeout(ok, 900);
  });
}
function estacionaCeu() {
  // no painel o céu fica parado: não gasta bateria enquanto a pessoa trabalha
  setTimeout(() => { ceu.parado = true; cancelAnimationFrame(ceu.raf); desenhaCeu(false); }, 1600);
}

// ---------------------------------------------------------------- entrada
function linhaFeed(txt) {
  const f = $("#feed"); f.append(h("div", {}, txt));
  while (f.children.length > 4) f.firstChild.remove();
}
async function entrar(k, viaLink) {
  $("#erro-entrada").textContent = "";
  linhaFeed("conferindo código de acesso");
  let eu;
  try { eu = await rpc("alfy_entrar", { p_token: k }); }
  catch (e) { $("#erro-entrada").textContent = "Sem conexão com a base. Tente de novo."; return; }
  if (!eu) {
    guardar(null);
    $("#erro-entrada").textContent = viaLink ? "Esse link não vale mais. Peça um novo ao Miguel." : "Código não reconhecido.";
    linhaFeed("acesso negado");
    return;
  }
  token = k; guardar(k);
  linhaFeed(`identidade confirmada: ${eu.nome}`);
  linhaFeed("traçando o mapa de rotas");
  await carregar();
  await salto();
  $("#tela-entrada").hidden = true;
  $("#tela-painel").hidden = false;
  estacionaCeu();
  montarPainel();
  vigiar();
}
$("#form-entrada").addEventListener("submit", (e) => {
  e.preventDefault();
  const k = $("#codigo").value.trim().replace(/^.*#k=/, "");
  if (k) entrar(k, false);
});
$("#sair").addEventListener("click", () => { guardar(null); location.reload(); });

// ---------------------------------------------------------------- dados ao vivo
async function carregar() {
  mapa = await rpc("alfy_mapa", { p_token: token });
  if (!mapa) { guardar(null); location.reload(); return; }
  versao = mapa.versao; ultimaLeitura = Date.now();
}
function vigiar() {
  setInterval(async () => {
    if (document.hidden) return;
    try {
      const v = await rpc("alfy_versao", { p_token: token });
      ultimaLeitura = Date.now(); $("#vivo").classList.remove("parado");
      if (v !== versao) {
        await carregar(); desenhar();
        if (cartaoAberto) abrirCartao(cartaoAberto, true);
      }
    } catch (_) { $("#vivo").classList.add("parado"); }
  }, 8000);
  setInterval(() => {
    const s = Math.round((Date.now() - ultimaLeitura) / 1000);
    $("#vivo").textContent = s < 15 ? "ao vivo" : `sem sinal há ${s}s`;
    $("#i-hora").textContent = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
  }, 1000);
}
async function acao(fn, args, ok) {
  try {
    const r = await rpc(fn, { p_token: token, ...args });
    await carregar(); desenhar();
    if (ok) avisar(ok);
    return r;
  } catch (e) { avisar(e.message || "Não salvou.", true); return null; }
}
const mover = (rt, st) => acao("alfy_mover", { p_rt: rt, p_status: st }, `${rt} → ${ST[st].nome}`);

// ---------------------------------------------------------------- painel
function montarPainel() {
  $("#eu-nome").textContent = mapa.eu.nome;
  $("#eu-papel").textContent = { comando: "Comando", gerente: "Gerente", colaborador: "Tripulação" }[papel()];
  $("#aba-pautas").hidden = !manda();
  $("#aba-sistema").hidden = papel() !== "comando";
  $("#f-pessoa").hidden = !manda();
  $("#f-frente").hidden = !manda();
  $("#f-minhas").hidden = !manda();
  for (const a of document.querySelectorAll(".aba")) a.addEventListener("click", () => trocaVista(a.dataset.vista));
  $("#busca").addEventListener("input", (e) => { filtro.busca = e.target.value.trim().toLowerCase(); desenhar(); });
  $("#f-pessoa").addEventListener("change", (e) => { filtro.pessoa = e.target.value; desenhar(); });
  $("#f-frente").addEventListener("change", (e) => { filtro.frente = e.target.value; desenhar(); });
  for (const [id, chave] of [["#f-vencidas", "vencidas"], ["#f-minhas", "minhas"]]) {
    $(id).addEventListener("click", () => { filtro[chave] = !filtro[chave]; $(id).setAttribute("aria-pressed", filtro[chave]); desenhar(); });
  }
  $("#nova-ideia").addEventListener("click", novaIdeia);
  try { const v = localStorage.getItem("alfy-vista"); if (v && v !== "sistema") vista = v; } catch (_) { /* sem storage */ }
  trocaVista(vista);
}
function trocaVista(v) {
  if ((v === "pautas" && !manda()) || (v === "sistema" && papel() !== "comando")) v = "lista";
  vista = v;
  try { localStorage.setItem("alfy-vista", v); } catch (_) { /* sem storage */ }
  for (const a of document.querySelectorAll(".aba")) a.setAttribute("aria-selected", a.dataset.vista === v);
  for (const s of ["lista", "kanban", "pautas", "sistema"]) $("#vista-" + s).hidden = s !== v;
  $("#filtros").hidden = v === "sistema" || v === "pautas";
  desenhar();
}
function rotasFiltradas() {
  return mapa.rotas.filter((r) => {
    if (filtro.pessoa && (filtro.pessoa === "-" ? r.responsavel_id : r.responsavel_id !== filtro.pessoa)) return false;
    if (filtro.frente && r.frente !== filtro.frente) return false;
    if (filtro.vencidas && !vencida(r)) return false;
    if (filtro.minhas && r.responsavel_id !== mapa.eu.id) return false;
    if (filtro.busca) {
      const t = `${r.rt} ${r.titulo} ${r.assist || ""} ${nomeDe(r.responsavel_id)}`.toLowerCase();
      if (!t.includes(filtro.busca)) return false;
    }
    return true;
  });
}
function desenhar() {
  if (!mapa) return;
  const vivas = mapa.rotas.filter((r) => ["rota", "andamento", "pausada"].includes(r.status));
  $("#i-abertas").textContent = vivas.length;
  $("#i-vencidas").textContent = vivas.filter(vencida).length;
  $("#n-pautas").textContent = mapa.pautas.filter((p) => p.status === "aberta").length || "";
  // filtros de pessoa e frente, só com o que existe no mapa
  const sel = $("#f-pessoa"), atual = sel.value;
  const ids = [...new Set(mapa.rotas.map((r) => r.responsavel_id).filter(Boolean))];
  sel.replaceChildren(h("option", { value: "" }, "Todas as pessoas"),
    ...ids.map((id) => ({ id, nome: nomeDe(id) })).sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => h("option", { value: p.id }, p.nome)),
    h("option", { value: "-" }, "Sem responsável"));
  sel.value = atual;
  const fr = $("#f-frente"), atualF = fr.value;
  const frentes = [...new Set(mapa.rotas.map((r) => r.frente).filter(Boolean))].sort();
  fr.replaceChildren(h("option", { value: "" }, "Todas as frentes"), ...frentes.map((f) => h("option", { value: f }, f)));
  fr.value = atualF;
  if (vista === "lista") desenhaLista();
  if (vista === "kanban") desenhaKanban();
  if (vista === "pautas") desenhaPautas();
  if (vista === "sistema") desenhaSistema();
}

// ---------------------------------------------------------------- lista
function metaDe(r, comFrente) {
  const m = h("div", { class: "meta" });
  if (r.prioridade) m.append(h("span", {}, r.prioridade.split(" · ")[0]));
  if (r.prazo) m.append(h("span", { class: vencida(r) ? "v" : "" }, (vencida(r) ? "venceu " : "até ") + dataCurta(r.prazo)));
  if (comFrente && r.frente) m.append(h("span", {}, r.frente));
  if (r.comentarios) m.append(h("span", {}, `💬 ${r.comentarios}`));
  if (r.pautas?.length) m.append(h("span", {}, `🗂️ pauta`));
  return m;
}
function botoesRapidos(r) {
  const opcoes = r.status === "ideia" ? ["rota"] : ["rota", "andamento", "pausada", "concluida"];
  return h("div", { class: "rapidos" }, opcoes.map((st) => h("button", {
    class: "rapido", type: "button", "aria-pressed": r.status === st,
    style: r.status === st ? `background:${ST[st].cor};color:#0B0124` : null,
    title: `Mover para ${ST[st].nome}`,
    onclick: (e) => { e.stopPropagation(); if (r.status !== st) mover(r.rt, st); },
  }, r.status === "ideia" ? "Virar rota" : ST[st].curto)));
}
function linhaDe(r, comDono) {
  return h("article", { class: "linha" },
    bolinha(r.status),
    h("div", { class: "meio", role: "button", tabindex: "0", onclick: () => abrirCartao(r.rt),
                onkeydown: (e) => { if (e.key === "Enter") abrirCartao(r.rt); } },
      h("div", { class: "tt" }, h("span", { class: "rt" }, r.rt), r.titulo),
      metaDe(r, comDono)),
    botoesRapidos(r));
}
function desenhaLista() {
  const alvo = $("#vista-lista"), rs = rotasFiltradas();
  alvo.replaceChildren();
  if (!rs.length) { alvo.append(h("div", { class: "vazio" }, "Nenhuma rota com esse filtro.")); return; }
  const ordemSt = (r) => ORDEM.indexOf(r.status);
  const porPrazo = (a, b) => ordemSt(a) - ordemSt(b) || (a.prazo || "9").localeCompare(b.prazo || "9");
  if (manda()) {
    const grupos = {};
    for (const r of rs) (grupos[r.responsavel_id || "-"] ||= []).push(r);
    const chaves = Object.keys(grupos).sort((a, b) =>
      (a === "-") - (b === "-") || grupos[b].length - grupos[a].length);
    for (const k of chaves) {
      const g = grupos[k].sort(porPrazo), venc = g.filter(vencida).length;
      alvo.append(h("section", { class: "grupo" },
        h("h2", {}, k === "-" ? "Sem responsável" : nomeDe(k),
          h("span", { class: "mono" }, `${g.length} rotas${venc ? ` · ${venc} vencidas` : ""}`)),
        g.map((r) => linhaDe(r, true))));
    }
  } else {
    for (const st of ORDEM) {
      const g = rs.filter((r) => r.status === st).sort(porPrazo);
      if (!g.length) continue;
      alvo.append(h("section", { class: "grupo" },
        h("h2", {}, ST[st].nome, h("span", { class: "mono" }, g.length)), g.map((r) => linhaDe(r, false))));
    }
  }
}

// ---------------------------------------------------------------- kanban
function desenhaKanban() {
  const k = $("#kanban"), rs = rotasFiltradas();
  k.replaceChildren(...ORDEM.map((st) => {
    const col = h("div", { class: "coluna", "data-st": st,
      ondragover: (e) => { e.preventDefault(); col.classList.add("alvo"); },
      ondragleave: () => col.classList.remove("alvo"),
      ondrop: (e) => { e.preventDefault(); col.classList.remove("alvo");
        const rt = e.dataTransfer.getData("text/plain"); const r = mapa.rotas.find((x) => x.rt === rt);
        if (r && r.status !== st) mover(rt, st); } });
    const g = rs.filter((r) => r.status === st).sort((a, b) => (a.prazo || "9").localeCompare(b.prazo || "9"));
    col.append(h("h3", {}, h("i", { style: `background:${ST[st].cor}` }), ST[st].nome, h("span", { class: "mono" }, g.length)));
    for (const r of g) {
      const c = h("div", { class: "card", draggable: "true", tabindex: "0",
        ondragstart: (e) => { e.dataTransfer.setData("text/plain", r.rt); c.classList.add("arrastando"); },
        ondragend: () => c.classList.remove("arrastando"),
        onclick: () => abrirCartao(r.rt), onkeydown: (e) => { if (e.key === "Enter") abrirCartao(r.rt); } },
        h("div", { class: "rt" }, r.rt),
        h("div", { class: "tt" }, r.titulo),
        manda() ? h("div", { class: "meta" }, h("span", {}, nomeDe(r.responsavel_id))) : null,
        metaDe(r, false));
      col.append(c);
    }
    if (!g.length) col.append(h("div", { class: "meta", style: "padding:6px 4px" }, "Arraste uma rota para cá."));
    return col;
  }));
}

// ---------------------------------------------------------------- cartão
function fecharCartao() { cartaoAberto = null; $("#modal").hidden = true; $("#modal").replaceChildren(); document.body.style.overflow = ""; }
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") fecharCartao(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && cartaoAberto) fecharCartao(); });

async function abrirCartao(rt, silencioso) {
  let c;
  try { c = await rpc("alfy_cartao", { p_token: token, p_rt: rt }); } catch (e) { avisar(e.message, true); return; }
  if (!c) { if (!silencioso) avisar("Essa rota não está no seu mapa.", true); fecharCartao(); return; }
  // não redesenha por cima de quem está digitando
  if (silencioso && $("#modal").contains(document.activeElement) && document.activeElement.matches("textarea,input")) return;
  cartaoAberto = rt;
  const edita = manda();
  const m = $("#modal");
  const bloco = (rotulo, campo, valor) => {
    if (!edita) return valor ? h("div", { class: "bloco" }, h("h4", {}, rotulo), h("p", {}, valor)) : null;
    const ta = h("textarea", { id: `b-${campo}`, placeholder: "Vazio" }); ta.value = valor || "";
    const cabe = () => { ta.style.height = "auto"; ta.style.height = Math.max(64, ta.scrollHeight + 2) + "px"; };
    ta.addEventListener("input", cabe); requestAnimationFrame(cabe);
    const salvar = h("button", { class: "btn", type: "button", hidden: true,
      onclick: async () => { const r = await acao("alfy_editar", { p_rt: rt, p_campos: { [campo]: ta.value } }, "Salvo"); if (r) abrirCartao(rt, true); } }, "Salvar");
    ta.addEventListener("input", () => (salvar.hidden = ta.value === (valor || "")));
    return h("div", { class: "bloco" }, h("h4", {}, rotulo), ta, h("div", { style: "margin-top:6px" }, salvar));
  };
  const statusBarra = h("div", { class: "status-barra" }, ORDEM.map((st) => h("button", {
    type: "button", "aria-pressed": c.status === st, style: c.status === st ? `background:${ST[st].cor};color:#0B0124` : null,
    onclick: async () => { if (c.status !== st) { await mover(rt, st); abrirCartao(rt, true); } } }, ST[st].nome)));

  const coments = h("div", { class: "comentarios" }, h("h4", { class: "rotulo" }, `Comentários (${c.lista_comentarios.length})`),
    c.lista_comentarios.map((x) => h("div", { class: "coment" + (x.origem === "alfy" ? " alfy" : "") },
      h("div", { class: "quem" }, h("b", {}, x.quem), " ", h("span", { class: "mono" }, quandoFoi(x.em))),
      h("p", {}, x.texto))));
  const novo = h("textarea", { id: "novo-coment", placeholder: "Escreva o andamento, uma dúvida ou o que falta" });
  coments.append(h("div", { class: "novo-coment" }, novo, h("div", {}, h("button", { class: "btn btn-cta", type: "button",
    onclick: async () => {
      const t = novo.value.trim(); if (!t) return;
      const r = await acao("alfy_comentar", { p_rt: rt, p_texto: t }, "Comentário enviado");
      if (r) abrirCartao(rt, true);
    } }, "Comentar"))));

  // propriedades
  const prop = (rotulo, el) => h("div", { class: "prop" }, h("label", {}, rotulo), el);
  const seletor = (campo, valor, opcoes, vazio) => {
    if (!edita) return h("div", { class: "val" }, valor || "—");
    const s = h("select", { id: `p-${campo}` }, h("option", { value: "" }, vazio || "—"),
      opcoes.map((o) => (typeof o === "string" ? h("option", { value: o }, o) : h("option", { value: o.v }, o.t))));
    s.value = valor || "";
    s.addEventListener("change", () => acao("alfy_editar", { p_rt: rt, p_campos: { [campo]: s.value } }, "Salvo"));
    return s;
  };
  let prazoEl;
  if (edita) {
    prazoEl = h("input", { type: "date", id: "p-prazo" });
    if (c.prazo) prazoEl.value = new Date(c.prazo).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    prazoEl.addEventListener("change", () => acao("alfy_editar", { p_rt: rt,
      p_campos: { prazo: prazoEl.value ? `${prazoEl.value}T21:00:00Z` : "" } }, "Prazo salvo"));
  } else prazoEl = h("div", { class: "val" + (vencida(c) ? " v" : "") }, c.prazo ? dataCurta(c.prazo) : "—");
  const pessoas = mapa.pessoas.filter((p) => p.codigo !== "ALFY" || c.responsavel_id === p.id)
    .map((p) => ({ v: p.id, t: p.nome }));
  const lado = h("aside", { class: "modal-lado" },
    prop("Responsável", seletor("responsavel_id", c.responsavel_id, pessoas, "Sem responsável")),
    prop("Prioridade", seletor("prioridade", c.prioridade, PRIORIDADES)),
    prop("Prazo", prazoEl),
    prop("Frente", seletor("frente", c.frente, FRENTES)),
    prop("Natureza", seletor("natureza", c.natureza, NATUREZAS)),
    prop("Tipo", seletor("tipo", c.tipo, TIPOS)));
  if (edita && mapa.pautas.length) {
    const abertas = mapa.pautas.filter((p) => p.status === "aberta" || c.pautas.includes(p.id));
    lado.append(prop("Pautas de reunião", h("div", { class: "pautas-do-cartao" }, abertas.map((p) => {
      const cb = h("input", { type: "checkbox", id: `pa-${p.id}` }); cb.checked = c.pautas.includes(p.id);
      cb.addEventListener("change", () => acao("alfy_pauta_ligar", { p_pauta: p.id, p_rt: rt, p_ligar: cb.checked },
        cb.checked ? "Ligada à pauta" : "Tirada da pauta"));
      return h("label", { for: `pa-${p.id}` }, cb, h("span", {}, p.titulo));
    }))));
  }
  if (c.trello_url) lado.append(h("a", { class: "link-trello", href: c.trello_url, target: "_blank", rel: "noopener" }, "Abrir no Trello ↗"));
  lado.append(h("div", { class: "meta" }, `Atualizada ${quandoFoi(c.atualizado_em)}`));

  let titulo;
  if (edita) {
    titulo = h("textarea", { id: "c-titulo", rows: "1", class: "titulo-edita" });
    titulo.value = c.titulo;
    const cabe = () => { titulo.style.height = "auto"; titulo.style.height = titulo.scrollHeight + "px"; };
    titulo.addEventListener("input", cabe); requestAnimationFrame(cabe);
    titulo.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); titulo.blur(); } });
    titulo.addEventListener("focus", () => (titulo.style.borderColor = "var(--line-2)"));
    titulo.addEventListener("blur", () => { titulo.style.borderColor = "transparent";
      if (titulo.value.trim() && titulo.value.trim() !== c.titulo) acao("alfy_editar", { p_rt: rt, p_campos: { titulo: titulo.value.trim() } }, "Título salvo"); });
  } else titulo = h("h2", {}, c.titulo);

  m.replaceChildren(h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": c.titulo },
    h("div", { class: "modal-cab" }, bolinha(c.status),
      h("div", { style: "min-width:0;flex:1" }, h("div", { class: "rt" }, `${c.rt} · ${nomeDe(c.responsavel_id)}`), titulo),
      h("button", { class: "fechar", type: "button", "aria-label": "Fechar", onclick: fecharCartao }, "×")),
    h("div", { class: "modal-corpo" },
      h("div", { class: "modal-principal" }, statusBarra,
        bloco("Resumo", "assist", c.assist),
        bloco("Detalhamento", "detalhamento", c.detalhamento),
        bloco("Como fazer", "como_fazer", c.como_fazer),
        bloco("Resultado esperado", "resultado", c.resultado),
        coments),
      lado)));
  if (!m.hidden && silencioso) return;
  m.hidden = false; document.body.style.overflow = "hidden";
}

// ---------------------------------------------------------------- ideia
function novaIdeia() {
  cartaoAberto = null;
  const t = h("input", { id: "ideia-titulo", placeholder: "Em uma frase, qual é a ideia" });
  const d = h("textarea", { id: "ideia-texto", placeholder: "Contexto, por que importa, quem envolve (opcional)" });
  $("#modal").replaceChildren(h("div", { class: "modal", role: "dialog", "aria-modal": "true", "aria-label": "Nova ideia" },
    h("div", { class: "modal-cab" }, h("div", {}, h("div", { class: "rt" }, "Nova ideia"), h("h2", {}, "O que você quer lançar?")),
      h("button", { class: "fechar", type: "button", "aria-label": "Fechar", onclick: fecharCartao }, "×")),
    h("form", { class: "modal-principal", onsubmit: async (e) => {
        e.preventDefault(); if (!t.value.trim()) return;
        const r = await acao("alfy_ideia", { p_titulo: t.value, p_texto: d.value }, "Ideia lançada");
        if (r) abrirCartao(r.rt);
      } },
      h("div", { class: "campo" }, h("label", { for: "ideia-titulo" }, "Ideia"), t),
      h("div", { class: "campo" }, h("label", { for: "ideia-texto" }, "Detalhes"), d),
      h("p", { class: "meta" }, "A ideia entra na coluna Ideias. Quando o Miguel decidir que vira rota, ela ganha número e vai para o mapa."),
      h("button", { class: "btn btn-cta", type: "submit" }, "Lançar ideia"))));
  $("#modal").hidden = false; document.body.style.overflow = "hidden"; t.focus();
}

// ---------------------------------------------------------------- pautas
function desenhaPautas() {
  const alvo = $("#vista-pautas");
  const form = h("form", { class: "pauta", id: "nova-pauta", hidden: true });
  const tt = h("input", { id: "np-titulo", placeholder: "Assunto da pauta" });
  const re = h("input", { id: "np-reuniao", placeholder: "Reunião (ex.: Comercial de quarta)" });
  const dt = h("input", { id: "np-data", type: "date" });
  const de = h("textarea", { id: "np-detalhe", placeholder: "O que precisa sair dessa conversa (opcional)" });
  form.append(h("div", { class: "campo" }, h("label", { for: "np-titulo" }, "Pauta"), tt),
    h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" },
      h("div", { class: "campo", style: "flex:1 1 220px" }, h("label", { for: "np-reuniao" }, "Reunião"), re),
      h("div", { class: "campo", style: "flex:0 1 180px" }, h("label", { for: "np-data" }, "Data"), dt)),
    h("div", { class: "campo" }, h("label", { for: "np-detalhe" }, "Detalhe"), de),
    h("button", { class: "btn btn-cta", type: "submit" }, "Criar pauta"));
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); if (!tt.value.trim()) return;
    await acao("alfy_pauta_salvar", { p_id: null, p_titulo: tt.value, p_detalhe: de.value, p_reuniao: re.value, p_data: dt.value || null }, "Pauta criada");
  });
  const topo = h("div", { class: "filtros" }, h("h2", { style: "margin:0;font-family:var(--font-display);font-size:18px" }, "Pautas de reunião"),
    h("button", { class: "btn mais", type: "button", onclick: () => { form.hidden = !form.hidden; if (!form.hidden) tt.focus(); } }, "+ Nova pauta"));
  const lista = h("div", { class: "pautas" });
  const pautas = [...mapa.pautas].sort((a, b) => (a.status === "tratada") - (b.status === "tratada") || (a.data || "9").localeCompare(b.data || "9"));
  if (!pautas.length) lista.append(h("div", { class: "vazio" }, "Nenhuma pauta ainda. Crie uma e ligue as rotas que vão ser discutidas, ou deixe só como assunto."));
  for (const p of pautas) {
    const rotas = p.rotas.map((rt) => mapa.rotas.find((r) => r.rt === rt) || { rt, titulo: "(fora do seu mapa)", status: "rota" });
    const busca = h("input", { placeholder: "Ligar uma rota: digite o número ou o assunto", id: `lg-${p.id}` });
    const sug = h("div", { class: "sugestoes" });
    busca.addEventListener("input", () => {
      const q = busca.value.trim().toLowerCase(); sug.replaceChildren();
      if (q.length < 2) return;
      mapa.rotas.filter((r) => !p.rotas.includes(r.rt) && `${r.rt} ${r.titulo}`.toLowerCase().includes(q)).slice(0, 6)
        .forEach((r) => sug.append(h("button", { type: "button", onclick: () => acao("alfy_pauta_ligar", { p_pauta: p.id, p_rt: r.rt, p_ligar: true }, `${r.rt} na pauta`) },
          `${r.rt} · ${r.titulo}`)));
    });
    lista.append(h("article", { class: "pauta" + (p.status === "tratada" ? " tratada" : "") },
      h("div", { class: "pauta-cab" }, h("h3", {}, p.titulo),
        h("span", { class: "quando" }, [p.reuniao, p.data && dataCurta(p.data + "T15:00:00Z")].filter(Boolean).join(" · ")),
        h("button", { class: "btn", type: "button", onclick: () => acao("alfy_pauta_status", { p_pauta: p.id, p_status: p.status === "aberta" ? "tratada" : "aberta" },
          p.status === "aberta" ? "Pauta tratada" : "Pauta reaberta") }, p.status === "aberta" ? "Marcar tratada" : "Reabrir")),
      p.detalhe ? h("p", {}, p.detalhe) : null,
      rotas.length ? h("ul", {}, rotas.map((r) => h("li", {}, bolinha(r.status),
        h("button", { class: "lk", type: "button", onclick: () => abrirCartao(r.rt) }, h("span", { class: "rt" }, r.rt), " ", r.titulo),
        h("button", { class: "rapido", type: "button", style: "margin-left:auto", title: "Tirar da pauta",
          onclick: () => acao("alfy_pauta_ligar", { p_pauta: p.id, p_rt: r.rt, p_ligar: false }, "Tirada da pauta") }, "×")))) :
        h("p", { class: "meta" }, "Pauta sem rota ligada."),
      p.status === "aberta" ? h("div", { class: "ligar" }, busca) : null, sug));
  }
  alvo.replaceChildren(topo, form, lista);
}

// ---------------------------------------------------------------- como funciona (comando)
function desenhaSistema() {
  const svg = `<svg viewBox="0 0 980 300" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif" role="img" aria-label="Fluxo do ALFY">
  <defs><marker id="s" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="#C79BFF"/></marker>
    <marker id="s2" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M10 0L0 5L10 10z" fill="#C79BFF"/></marker></defs>
  <g fill="#14062F" stroke="#3a2470">
    <rect x="20" y="40" width="200" height="90" rx="14"/><rect x="20" y="170" width="200" height="90" rx="14"/>
    <rect x="390" y="95" width="200" height="110" rx="14" stroke="#4ADE80"/>
    <rect x="760" y="40" width="200" height="90" rx="14"/><rect x="760" y="170" width="200" height="90" rx="14"/></g>
  <g fill="#EDE8FF" font-weight="700" font-size="16">
    <text x="40" y="74">ALFY online</text><text x="40" y="204">Trello</text>
    <text x="410" y="132">Banco do ALFY</text><text x="780" y="74">ALFY (Claude)</text><text x="780" y="204">WhatsApp</text></g>
  <g fill="#B9A6E8" font-size="13">
    <text x="40" y="96">ilhatech.io/alfy</text><text x="40" y="114">cada um no seu mapa</text>
    <text x="40" y="226">espelho, durante a troca</text><text x="40" y="244">robô sincroniza</text>
    <text x="410" y="154">Supabase · rotas, pautas,</text><text x="410" y="172">comentários e eventos</text><text x="410" y="190">guarda tudo, com histórico</text>
    <text x="780" y="96">lê e escreve direto</text><text x="780" y="114">no banco, a qualquer hora</text>
    <text x="780" y="226">retorno "RT-N + recado"</text><text x="780" y="244">vira comentário na rota</text></g>
  <g stroke="#C79BFF" stroke-width="2" fill="none" marker-end="url(#s)">
    <path d="M222 85 C300 85 310 130 386 135"/><path d="M386 165 C310 170 300 215 222 215" marker-start="url(#s2)"/>
    <path d="M594 135 C680 130 690 85 756 85"/><path d="M756 215 C680 215 680 170 594 165"/></g>
  <g fill="#8a7bbd" font-size="12"><text x="258" y="100">8 s</text><text x="250" y="212">10 min</text><text x="664" y="98">sempre</text><text x="664" y="210">na ronda</text></g>
</svg>`;
  const d = h("div", { class: "diagrama" }); d.innerHTML = svg; // SVG fixo, sem dado de ninguém
  $("#vista-sistema").replaceChildren(h("div", { class: "sistema" },
    h("div", { class: "caixa" }, h("h3", {}, "Onde as rotas ficam"), d,
      h("p", {}, "O banco do ALFY é a fonte da verdade. Tudo o que alguém faz aqui (mover, comentar, criar ideia, ligar a uma pauta) grava na hora e vira um evento com nome, data e o antes e o depois. O ALFY lê esse banco direto, então o que acontece aqui e o que você fala no chat chegam no mesmo lugar.")),
    h("div", { class: "caixa" }, h("h3", {}, "Quem vê o quê"),
      h("ul", {}, h("li", {}, "Comando (você): todas as rotas, todas as pautas, e pode mudar qualquer propriedade."),
        h("li", {}, "Gerente: as rotas inteiras das frentes dele e as que estão no nome dele. Edita propriedades e cria pautas."),
        h("li", {}, "Tripulação: só as rotas no próprio nome. Move, comenta e lança ideia."))),
    h("div", { class: "caixa" }, h("h3", {}, "Acesso"),
      h("p", {}, "Cada pessoa tem um link pessoal com a chave dela. Quem abre o link entra no próprio mapa, sem senha. O link pode ser trocado a qualquer momento se vazar.")),
    h("div", { class: "caixa" }, h("h3", {}, "Trello, durante a troca"),
      h("p", {}, "O Trello continua funcionando como espelho: o robô leva para o cartão o que foi feito aqui e traz para cá o que mudou lá. Quando todo mundo estiver usando o ALFY online, o Trello pode ser desligado sem perder nada."))));
}

// ---------------------------------------------------------------- partida
ligaCeu();
// abriu outro link pessoal na mesma aba: entra como essa pessoa
addEventListener("hashchange", () => { if (/k=[a-f0-9]{16,}/i.test(location.hash)) location.reload(); });
(function partida() {
  const m = location.hash.match(/k=([a-f0-9]{16,})/i);
  if (m) { history.replaceState(null, "", location.pathname); entrar(m[1], true); return; }
  const k = lerGuardado();
  if (k) entrar(k, false);
})();

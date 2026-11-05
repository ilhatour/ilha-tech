// ALFY · Mapa de Rotas · Ilha Tech · v2.28.1 · 05/11/2026 · Painel de Ferro · filtros da Passagem à mostra no painel
// Tudo passa pelas funções alfy_* do banco, sempre com a chave pessoal de quem está usando.
// O banco decide o que cada pessoa vê; a tela só desenha o que voltou.
// A IA e os comandos são pedidos numa fila (alfy.pedido) que o robô do Mac atende.
"use strict";

const API = "https://tladwxithannxstbneon.supabase.co/rest/v1/rpc/";
const CHAVE_PUBLICA = "sb_publishable_FV_NUHwNP2H8gkGsvd6Odw_19NBn9pl";
const GUARDA = "alfy-k";
const FUSO = "America/Sao_Paulo";

const ST = {
  rota:      { nome: "Rotas",        um: "Rota",      cor: "#E5484D", bola: "🔴", leg: "Não iniciada" },
  andamento: { nome: "Em andamento", um: "Andamento", cor: "#F2C94C", bola: "🟡", leg: "Em andamento" },
  pausada:   { nome: "Pausadas",     um: "Pausada",   cor: "#F2994A", bola: "🟠", leg: "Parada" },
  concluida: { nome: "Concluídas",   um: "Concluída", cor: "#7FCBA0", bola: "🟢", leg: "Concluída" },
  ideia:     { nome: "Ideias",       um: "Ideia",     cor: "#A9B4F5", bola: "💡", leg: "Ideia" },
};
const ORDEM = ["rota", "andamento", "pausada", "concluida", "ideia"];
const ABERTOS = ["rota", "andamento", "pausada"];
const PRIORIDADES = ["🚨 P1 · 24h", "⚡ P2 · 72h", "⏳ P3 · 7 dias", "💤 P4 · 30 dias", "⏸️ P5 · sem prazo"];
const PRIO_IC = { P1: "🚨", P2: "⚡", P3: "⏳", P4: "💤", P5: "⏸️" };
const FRENTES = ["🔥💧 Ilha Tour · Fogo e Água", "🌬️ Ilha Tour · Ar", "🌍 Terra · OP IG", "👥 Ilha Tour · Gestão de Pessoas",
  "⚓️ Vou de Barco", "🏨 Pousadas", "🌊 Buena Onda", "🏡 Cantinho da Ilha", "🏖️ Agência Ilha", "🚘 Ilha Go",
  "👾 Ilha Tech", "🌇 Agência Rio", "🧍 Pessoal"];
const NATUREZAS = ["🔴 Sobrevivência", "🟡 Manutenção", "🔵 Desenvolvimento", "🟢 Crescimento"];
const TIPOS = ["🛠️ Ação", "📞 Comunicação", "🧠 Decisão", "🛒 Compra", "📅 Compromisso"];
const NIVEIS = ["Baixo", "Médio", "Alto"];
const BUDGET_ST = ["sem custo", "a orçar", "aguardando aprovação", "aprovado", "recusado"];
const CAMPOS = {
  assist:    { rot: "🎯 O que fazer", dica: "o pedido, em 1 ou 2 frases. É o texto que vai no Mapa de Rotas do WhatsApp" },
  instr:     { rot: "📝 Instruções", dica: "tudo o que a pessoa precisa saber: contexto, números, contatos e o passo a passo" },
  resultado: { rot: "✅ Resultado esperado", dica: "como saber que acabou" },
  como_esta: { rot: "📍 Como está agora", dica: "o pé em que a rota está" },
};
const COLUNA = { assist: "assist", instr: "instrucoes", resultado: "resultado", como_esta: "como_esta" };
const PTIPO = { decidir: "🧠 Para decidir", conversar: "💬 Para conversar", compartilhar: "📎 Para compartilhar" };
const PST = { aberta: "Em discussão", decidida: "Decidida", tratada: "Encerrada", arquivada: "Arquivada" };
const MSG_TIPO = { comentario: "💬 Comentário", ideia: "💡 Ideia", pergunta: "❓ Pergunta", partilha: "📎 Compartilhar", decisao: "✅ Decisão" };
const RST = { marcada: "Marcada", acontecendo: "Acontecendo", encerrada: "Encerrada" };

const svg = (p, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${p}</svg>`;
const IC = {
  rotas: svg('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.2" fill="currentColor"/><circle cx="3.5" cy="12" r="1.2" fill="currentColor"/><circle cx="3.5" cy="18" r="1.2" fill="currentColor"/>'),
  feed: svg('<path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16"/><circle cx="5" cy="19" r="1.4" fill="currentColor"/>'),
  pautas: svg('<rect x="4" y="4" width="16" height="17" rx="2"/><path d="M8 2v4M16 2v4M4 10h16M8 14h5M8 17h8"/>'),
  comandos: svg('<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>'),
  agenda: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M7 13h3v3H7z"/>'),
  eu: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>'),
  despejo: svg('<path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/>'),
  whatsapp: svg('<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/><path d="M9 10h6M9 14h4"/>'),
  email: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  grupos: svg('<path d="M20 11a8 8 0 0 0-14.9-4M4 4v4h4M4 13a8 8 0 0 0 14.9 4M20 20v-4h-4"/>'),
  mapa: svg('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/>'),
  cobrar: svg('<path d="M8 21h8M12 17v4M8 12a4 4 0 1 1 8 0c0 2-1 3-2 4h-4c-1-1-2-2-2-4z"/>'),
  bomdia: svg('<circle cx="12" cy="13" r="4"/><path d="M12 3v3M4.2 7.2l2 2M19.8 7.2l-2 2M2 17h20M6 21h12"/>'),
  ronda: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  virada: svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4M9 15l2 2 4-4"/>'),
  zap: svg('<path d="M21 12a9 9 0 0 1-13.4 7.8L3 21l1.3-4.4A9 9 0 1 1 21 12z"/><path d="M9 10h6M9 14h4"/>'),
  rotinas: svg('<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>'),
  placar: svg('<path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>'),
  aprendi: svg('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.6 1 1.5 1 2.5h6c0-1 .3-1.9 1-2.5A6 6 0 0 0 12 3z"/>'),
  perguntar: svg('<path d="M21 12a9 9 0 1 1-4-7.5"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01"/>'),
  x: svg('<path d="M6 6l12 12M18 6 6 18"/>', 'width="18" height="18" stroke-width="2.2"'),
  filtro: svg('<path d="M4 6h16M7 12h10M10 18h4"/>', 'width="18" height="18"'),
};

// ---------------------------------------------------------------- estado
let token = null, M = null, versao = null, FEED = null;
const s = {
  aba: "rotas", vista: "lista", agrupar: "frente", st: "abertas", prio: "", busca: "", pessoa: "", frente: "", venc: false, filtrosAbertos: false,
  aberta: null, cartao: null, abaFolha: "ficha", editando: null, colMovel: 0,
  fFeed: "todos", pvista: "reunioes", reuniao: null, pauta: null, pautaDet: null, tipoMsg: "comentario",
  cmd: "despejo", alvo: null, despejo: { texto: "", anexos: [], pedido: null, itens: null, feitos: {} },
  chatGeral: null, esperando: {}, gravando: false,
};

// ---------------------------------------------------------------- utilidades
const $ = (q, el = document) => el.querySelector(q);
const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
async function rpc(fn, args) {
  const r = await fetch(API + fn, { method: "POST", headers: { apikey: CHAVE_PUBLICA, "Content-Type": "application/json" }, body: JSON.stringify(args) });
  if (!r.ok) {
    let msg = "Falhou a conexão com o banco.";
    try { msg = (await r.json()).message || msg; } catch (_) { /* sem corpo */ }
    throw new Error(msg);
  }
  return r.json();
}
const chamar = (fn, args = {}) => rpc(fn, { p_token: token, ...args });
function aviso(t, ruim) { const a = $("#aviso"); a.textContent = t; a.className = "aviso" + (ruim ? " ruim" : ""); a.hidden = false; clearTimeout(aviso.t); aviso.t = setTimeout(() => (a.hidden = true), 3200); }
const falhou = (e) => aviso(e.message || String(e), true);
const guardar = (k) => { try { k ? localStorage.setItem(GUARDA, k) : localStorage.removeItem(GUARDA); } catch (_) { /* privado */ } };
const lerGuardado = () => { try { return localStorage.getItem(GUARDA); } catch (_) { return null; } };

const eu = () => M?.eu || {};
const papel = () => eu().papel;
const comando = () => papel() === "comando";
const cuidaPessoas = () => papel() === "comando" || (papel() === "gerente" && (eu().frentes || []).includes("👥 Ilha Tour · Gestão de Pessoas"));
const manda = () => papel() === "comando" || papel() === "gerente";
const pessoa = (id) => M?.pessoas?.find((p) => p.id === id);
const nomeDe = (id) => pessoa(id)?.nome || "";
const curto = (n) => (!n ? "Sem dono" : n.split(" ")[0]);
const ini = (n) => (!n ? "–" : n === "ALFY" ? "🐙" : n.split(" ").slice(0, 2).map((p) => p[0]).join(""));
const frenteCurta = (f) => (f || "Sem frente").replace("Ilha Tour · ", "");
const dia = (iso) => (iso ? new Date(iso).toLocaleDateString("en-CA", { timeZone: FUSO }) : "");
const hojeDia = () => new Date().toLocaleDateString("en-CA", { timeZone: FUSO });
const ddmm = (iso) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO }) : "");
const hhmm = (iso) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO });
const dias = (iso) => Math.round((new Date(dia(iso) + "T12:00") - new Date(hojeDia() + "T12:00")) / 864e5);
const pcod = (p) => (p || "").match(/P[1-5]/)?.[0] || "";
const prioTxt = (p) => (pcod(p) ? `${PRIO_IC[pcod(p)]} ${pcod(p)}` : "");
const ehNova = (r) => r.rt.startsWith("IDEIA-") && r.status !== "ideia";
const num = (rt) => String(rt).replace(/^RT-/, "").replace(/^IDEIA-/, "");
// na tela é sempre "Rota 266", nunca o código RT-266 do banco
const nomeRota = (rt) => { const r = rotaDe(rt); if (r && ehNova(r)) return "Rota nova"; return String(rt).replace(/^RT-/, "Rota ").replace(/^IDEIA-/, "Ideia "); };
const rotaDe = (rt) => M?.rotas?.find((r) => r.rt === rt);
const ehRotina = (r) => !!r.repete;
const vencida = (r) => r.prazo && ABERTOS.includes(r.status) && pcod(r.prioridade) !== "P5" && dias(r.prazo) < 0;
const instrDe = (r) => r.instrucoes || [r.detalhamento, r.como_fazer].filter(Boolean).join("\n\n");
const ordPrio = (a, b) => (pcod(a.prioridade) || "P9").localeCompare(pcod(b.prioridade) || "P9") || (a.prazo || "9").localeCompare(b.prazo || "9") || a.rt.localeCompare(b.rt);
function prazoInfo(r) {
  if (pcod(r.prioridade) === "P5" && ABERTOS.includes(r.status)) return { txt: "sem prazo", cls: "" };
  if (!r.prazo) return { txt: "sem prazo", cls: "" };
  if (!ABERTOS.includes(r.status)) return { txt: ddmm(r.prazo), cls: "" };
  const n = dias(r.prazo);
  if (n < 0) return { txt: `venceu ${ddmm(r.prazo)}`, cls: "venc" };
  if (n === 0) return { txt: "hoje", cls: "hoje" };
  if (n === 1) return { txt: "amanhã", cls: "" };
  return { txt: "até " + ddmm(r.prazo), cls: "" };
}
function gerenteDe(frente) {
  const gs = (M?.pessoas || []).filter((p) => p.papel === "gerente" && (p.frentes || []).includes(frente));
  gs.sort((a, b) => a.frentes.length - b.frentes.length);
  return gs[0] || null;
}
function quandoFoi(iso) {
  const dif = (Date.now() - new Date(iso)) / 60000;
  if (dif < 1) return "agora";
  if (dif < 60) return `há ${Math.round(dif)} min`;
  if (dia(iso) === hojeDia()) return "hoje " + hhmm(iso);
  return ddmm(iso) + " " + hhmm(iso);
}
function copiar(texto) {
  (navigator.clipboard ? navigator.clipboard.writeText(texto) : Promise.reject())
    .then(() => aviso("Copiado. É só colar no WhatsApp."))
    .catch(() => { const t = document.createElement("textarea"); t.value = texto; document.body.append(t); t.select(); try { document.execCommand("copy"); aviso("Copiado"); } catch (_) { aviso("Não deu para copiar aqui", true); } t.remove(); });
}
function filtradas() {
  const q = s.busca.trim().toLowerCase();
  return (M?.rotas || []).filter((r) =>
    (!q || [r.titulo, nomeRota(r.rt), r.rt, r.assist, instrDe(r)].join(" ").toLowerCase().includes(q)) &&
    (!s.pessoa || (s.pessoa === "semdono" ? !r.responsavel_id : r.responsavel_id === s.pessoa || r.co_responsavel_id === s.pessoa)) &&
    (!s.frente || r.frente === s.frente) && (!s.venc || vencida(r)) && !adiada(r) && !ehRotina(r) && (!s.prio || pcod(r.prioridade) === s.prio || (s.prio === "sem" && !pcod(r.prioridade))));
}
const ativo = () => { const a = document.activeElement; return a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== "busca"; };
const opc = (lista, atual, vazio) => (vazio !== undefined ? `<option value="">${vazio}</option>` : "") +
  lista.map((x) => { const [v, n] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${v === atual ? "selected" : ""}>${esc(n)}</option>`; }).join("");
const gente = () => (M?.pessoas || []).filter((p) => p.nome).map((p) => [p.id, p.nome]);

// ---------------------------------------------------------------- casca
function navItens() {
  const abertas = (M?.rotas || []).filter((r) => ABERTOS.includes(r.status) && !ehRotina(r)).length;
  const rotinasAb = (M?.rotas || []).filter((r) => ABERTOS.includes(r.status) && ehRotina(r) && (comando() || r.responsavel_id === eu().id || r.co_responsavel_id === eu().id)).length;
  const pautas = (M?.pautas || []).filter((p) => p.status === "aberta").length;
  const it = [["rotas", "Rotas", IC.rotas, abertas], ["rotinas", "Rotinas", IC.rotinas, rotinasAb || ""], ["agenda", "Agenda", IC.agenda, ""], ["feed", "Feed", IC.feed, ""], ["pautas", "Pautas", IC.pautas, pautas || ""], ["placar", "Placar", IC.placar, ""]];
  if (cuidaPessoas()) it.push(["equipe", "Equipe", IC.eu, (s.fichas || []).filter((f) => f.status === "pendente").length || ""]);
  if (comando()) it.push(["zap", "WhatsApp", IC.whatsapp, (s.zap?.itens || []).filter((z) => z.precisa && !z.visto).length || ""]);
  if (comando()) it.push(["comandos", "Comandos", IC.comandos, ""]);
  return it;
}
function casca() {
  const p = eu();
  $("#nav").innerHTML = navItens().map(([k, n, ic, c]) => `<button type="button" data-aba="${k}" aria-current="${s.aba === k}" title="${n}" aria-label="${n}">${ic}<span class="nl">${n}</span><span class="n">${c}</span></button>`).join("");
  const fica = comando() ? ["rotas", "rotinas", "agenda", "zap"] : ["rotas", "rotinas", "agenda", "placar"];
  const bb = [...navItens().filter(([k]) => fica.includes(k)), ["eu", "Mais", svg('<path d="M4 6h16M4 12h16M4 18h16"/>')]];   // no celular o resto fica em Mais
  $("#barra-baixo").innerHTML = bb.map(([k, n, ic]) => `<button type="button" data-aba="${k}" aria-current="${s.aba === k}">${ic}<span>${n}</span></button>`).join("");
  $("#barra-baixo").style.gridTemplateColumns = `repeat(${bb.length},1fr)`;
  $("#eu-av").textContent = ini(p.nome); $("#eu-av-cel").textContent = ini(p.nome);
  $("#eu-nome").textContent = p.nome;
  $("#eu-papel").textContent = papelTxt();
  $("#titulo-cel").textContent = { rotinas: "Rotinas", placar: "Placar", zap: "WhatsApp", rotas: "Rotas", equipe: "Equipe", agenda: "Agenda", feed: "Feed", pautas: "Pautas", comandos: "Comandos", eu: "Eu" }[s.aba];
  $("#fab").hidden = s.aba !== "rotas" || s.vista === "rar";
}
const papelTxt = () => comando() ? "Comando · vê tudo" : papel() === "gerente" ? "Gerente · " + (eu().frentes || []).map(frenteCurta).join(", ") : "Vê as rotas dele";
function filtrosHTML(extra = "") {
  const vs = M?.rotas || [];
  const ids = [...new Set(vs.flatMap((r) => [r.responsavel_id, r.co_responsavel_id]).filter(Boolean))];
  const pes = ids.map((id) => [id, nomeDe(id)]).filter((x) => x[1]).sort((a, b) => a[1].localeCompare(b[1]));
  const frs = [...new Set(vs.map((r) => r.frente).filter(Boolean))].sort((a, b) => FRENTES.indexOf(a) - FRENTES.indexOf(b));
  return `<input class="busca" type="search" id="busca" placeholder="Buscar rota, número ou assunto" value="${esc(s.busca)}">
    <select class="sel" id="f-pessoa" aria-label="Pessoa">${opc([["semdono", `👻 Sem dono (${vs.filter((r) => !r.responsavel_id && ABERTOS.includes(r.status)).length})`], ...pes], s.pessoa, "Todas as pessoas")}</select>
    <select class="sel" id="f-frente" aria-label="Frente">${opc(frs.map((f) => [f, frenteCurta(f)]), s.frente, "Todas as frentes")}</select>
    ${extra}<button class="chip" type="button" id="f-mais" aria-label="Mais filtros" aria-pressed="${s.filtrosAbertos}" style="padding:5px 9px">${IC.filtro}</button>`;
}
function topo() {
  const l1 = $("#topo-l1"), fi = $("#filtros"), cel = matchMedia("(max-width:900px)").matches;
  fi.className = "filtros" + (s.filtrosAbertos ? " aberto" : "");
  const vivo = `<span class="ao-vivo"><i></i>ao vivo</span>`;
  if (s.aba === "rotas") {
    const alt = `<div class="alterna" role="group" aria-label="Visão"><button type="button" data-vista="lista" aria-pressed="${s.vista === "lista"}">Lista</button><button type="button" data-vista="kanban" aria-pressed="${s.vista === "kanban"}">Kanban</button>${comando() ? `<button type="button" data-vista="rar" aria-pressed="${s.vista === "rar"}" title="Passagem de Rotas">🧭<span class="rr-txt"> Passagem</span></button>` : ""}</div>`;
    l1.innerHTML = `<h1>Rotas<small>${comando() ? "todas as frentes" : curto(eu().nome)}</small></h1>${alt}<span class="espaco"></span>${vivo}<button class="cta" type="button" data-acao="nova">＋ Nova rota</button>`;
    $("#alterna-cel").innerHTML = alt;
    fi.innerHTML = filtrosHTML(`<button class="chip alerta" type="button" id="f-venc" aria-pressed="${s.venc}">Só vencidas</button>` +
      (s.vista === "lista" ? `<select class="sel" id="f-agrupar" aria-label="Agrupar">${opc([["prioridade", "Por prioridade"], ["minha", "Minha ordem"], ["frente", "Por frente e pessoa"], ["prazo", "Por prazo"]], s.agrupar)}</select>` : ""));
  } else if (s.aba === "feed") {
    l1.innerHTML = `<h1>Feed<small>últimas atualizações das rotas</small></h1><span class="espaco"></span>${vivo}`;
    $("#alterna-cel").innerHTML = "";
    const tipos = [["todos", "Tudo"], ["comentario", "Comentários"], ["orientacao", "Orientações"], ["whatsapp", "WhatsApp"], ["status", "Status"], ["editar", "Edições"], ["nova", "Rotas novas"], ["budget", "Budget"], ["pauta", "Pautas"]];
    fi.innerHTML = filtrosHTML() + `<div style="display:flex;gap:6px;overflow-x:auto;flex-basis:100%;scrollbar-width:none">${tipos.map(([k, n]) => `<button class="chip" type="button" data-ffeed="${k}" aria-pressed="${s.fFeed === k}">${n}</button>`).join("")}</div>`;
  } else {
    const t = { rotinas: "🔁 Rotinas", placar: "🏆 Placar", zap: "📱 WhatsApp", pautas: "Pautas e reuniões", comandos: "Comandos do ALFY", agenda: "Agenda", equipe: "Equipe e cadastro", eu: "Eu" }[s.aba];
    l1.innerHTML = `<h1>${t}</h1><span class="espaco"></span>${vivo}${s.aba === "pautas" && manda() ? '<button class="btn" type="button" data-acao="nova-pauta">＋ Nova pauta</button><button class="cta" type="button" data-acao="nova-reuniao">＋ Nova reunião</button>' : ""}`;
    fi.innerHTML = ""; $("#alterna-cel").innerHTML = "";
  }
  const fm = $("#f-mais"); if (fm) fm.style.display = cel ? "" : "none";
}
function medidores() {
  const m = $("#medidores");
  if (s.aba !== "rotas" || s.vista !== "lista") { m.innerHTML = ""; m.hidden = true; $("#prio-faixa").hidden = true; return; }
  m.hidden = false;
  const vs = filtradas(), venc = vs.filter(vencida).length;
  const its = [["abertas", "Todas abertas", vs.filter((r) => ABERTOS.includes(r.status)).length, "#E9EDEF", venc]].concat(ORDEM.map((k) => [k, ST[k].nome, vs.filter((r) => r.status === k).length, ST[k].cor]));
  m.innerHTML = its.map(([k, n, c, cor, v]) => `<button type="button" class="placa medidor" data-st="${k}" aria-pressed="${s.st === k}"><i class="barra-st" style="background:${cor}"></i><span>${n}</span><b>${c}</b>${v ? `<em>${v} vencidas</em>` : `<em style="color:transparent">.</em>`}</button>`).join("");
  m.style.gridTemplateColumns = `repeat(${its.length},minmax(0,1fr))`;
  const sp = s.prio; s.prio = "";   // os números de cada prioridade não dependem da que está escolhida
  const base = filtradas().filter((r) => ABERTOS.includes(r.status)); s.prio = sp;
  const ps = [["", "Todas", base.length]].concat(["P1", "P2", "P3", "P4", "P5"].map((p) => [p, `${PRIO_IC[p]} ${p}`, base.filter((r) => pcod(r.prioridade) === p).length])).filter(([k, , c]) => !k || c || s.prio === k);
  const pf = $("#prio-faixa"); pf.hidden = false;
  pf.innerHTML = (`<div class="prio-filtro" role="group" aria-label="Prioridade">${ps.map(([k, n, c]) => `<button type="button" class="chip prio-${k || "todas"}" data-prio="${k || "todas"}" aria-pressed="${s.prio === k}">${n} <b>${c}</b></button>`).join("")}</div>`);
}

// ---------------------------------------------------------------- rotas
function tag(r) {
  if (ehNova(r)) return `<span class="tag nova"><i class="dot" style="background:${ST[r.status].cor}"></i><small>ROTA</small><b>NOVA</b></span>`;
  return `<span class="tag ${r.status === "ideia" ? "ideia" : ""}" ${r.sensivel ? 'title="Só o Miguel vê"' : ""}>${r.sensivel ? '<span class="cadeado">🔒</span>' : ""}<i class="dot" style="background:${ST[r.status].cor}"></i><small>${r.rt.startsWith("IDEIA-") ? "IDEIA" : "ROTA"}</small><b>${num(r.rt)}</b></span>`;
}
const semEmoji = (t) => (t || "").replace(/^\S+\s/, "");
function metaLinha(r, semPessoa) {
  const pz = prazoInfo(r), b = r.budget_valor || r.budget_status !== "sem custo";
  return `<span class="meta2">${semPessoa ? "" : `<span>👤 ${esc(curto(nomeDe(r.responsavel_id)))}${r.co_responsavel_id ? " + " + esc(curto(nomeDe(r.co_responsavel_id))) : ""}</span>`}${r.repete ? `<span style="color:var(--turq)">🔁 ${{ diaria: "diária", semanal: "semanal", quinzenal: "quinzenal", mensal: "mensal", sob_demanda: "quando precisar" }[r.repete]}</span>` : ""}${r.prioridade ? `<span>${prioTxt(r.prioridade)}</span>` : ""}<span class="${pz.cls}">📅 ${pz.txt}</span>${r.natureza ? `<span>🧭 ${esc(semEmoji(r.natureza))}</span>` : ""}${r.tipo ? `<span>🏷️ ${esc(semEmoji(r.tipo))}</span>` : ""}${b && r.budget_status !== "sem custo" ? `<span class="bud ${r.budget_status === "aprovado" ? "ok" : ""}">💰 ${esc(r.budget_valor || "")} ${r.budget_status}</span>` : ""}${r.comentarios ? `<span style="color:var(--turq)">💬 ${r.comentarios}</span>` : ""}${r.n_anexos ? `<span>📎 ${r.n_anexos}</span>` : ""}${tocando(r) ? `<span class="sino">🔔 lembrete</span>` : ""}${temNova(r) ? `<span class="nova-l">💬 nova resposta</span>` : ""}${ultLinha(r)}</span>`;
}
const podeMexer = (r) => manda() || r.responsavel_id === eu().id || r.co_responsavel_id === eu().id;
function acoesLinha(r) {
  if (!podeMexer(r)) return "";
  const ab = ABERTOS.includes(r.status);
  return `<span class="acoes-linha">${ab ? `<button class="ac ok" type="button" data-rapido="concluida" data-rrt="${r.rt}" title="Concluir">✓<span>Concluir</span></button>` : ""}${r.status === "rota" ? `<button class="ac" type="button" data-rapido="andamento" data-rrt="${r.rt}" title="Começar">▶<span>Começar</span></button>` : ""}${ab && r.rt.startsWith("RT-") ? `<button class="ac" type="button" data-agdar="${r.rt}" title="${r.inicio ? "Mudar o horário na agenda" : "Dar um horário na agenda"}">📅<span>${r.inicio ? hhmm(r.inicio) : "Agendar"}</span></button>` : ""}${comando() && r.rt.startsWith("RT-") ? `<button class="ac" type="button" data-rastrear="${r.rt}" title="Rastrear: procura novidade desta rota no WhatsApp e no e-mail">📡<span>Rastrear</span></button>` : ""}<button class="ac ${s.linhasAbertas?.[r.rt] ? "on" : ""} ${s.respLinha?.[r.rt] && !s.linhasAbertas?.[r.rt] ? "pronto" : ""}" type="button" data-linhacaixa="${r.rt}" title="${comando() ? "Comentar ou pedir ao ALFY" : "Comentar"}">${comando() ? "🐙" : "💬"}<span>${comando() ? "ALFY" : "Comentar"}</span></button></span>`;
}
function caixaLinha(r, forcar) {
  if (!forcar && !s.linhasAbertas?.[r.rt]) return "";
  const resp = s.respLinha?.[r.rt], rod = s.esperando["rota:" + r.rt];
  const fid = "clf-" + r.rt.replace(/\W/g, "");
  return `<div class="caixa-linha"><form class="cl-form ${forcar ? "so-campo" : ""}" id="${fid}" data-clform="${r.rt}"><textarea class="busca" id="cl-${r.rt.replace(/\W/g, "")}" rows="2" placeholder="${comando() ? "Comente o que aconteceu ou o próximo passo (o ALFY atualiza a rota), ou peça: muda o dono para a Karol · P1 até sexta · faz a mensagem cobrando" : "Conte como está ou o próximo passo. O ALFY atualiza a rota."}">${esc(s.rascunhoLinha?.[r.rt] || "")}</textarea>
    ${forcar ? "" : `<span class="cl-bot"><button class="btn peq" type="submit" data-clmodo="comentar">💬 Comentar</button>${comando() ? '<button class="btn turq peq" type="submit" data-clmodo="alfy">🐙 Pedir ao ALFY</button>' : ""}</span>`}</form>
    ${rod ? `<div class="ia-saida pensando">${s.rastreando?.[r.rt] ? "📡 rastreando WhatsApp e e-mail desta rota… (até 1 minuto)" : "🐙 o ALFY está lendo e atualizando a rota… (uns 10 segundos)"}</div>` : ""}
    ${resp ? `<div class="ia-saida">${textoAlfy(resp)}<div class="usar">${s.sugLinha?.[r.rt] ? `<button class="mini ia" type="button" data-aplicarsug="${r.rt}">🐙 Aplicar a sugestão</button>` : ""}${/---MENSAGEM---|^\s*🐙 Alfy/.test(resp) ? "" : `<button class="mini" type="button" data-copiartxt="${r.rt}">Copiar</button>`}<button class="mini" type="button" data-rt="${r.rt}">Abrir a rota</button></div></div>` : ""}</div>`;
}
function linha(r, semPessoa) {
  return `<div class="linha-wrap"><div role="button" tabindex="0" class="linha2" data-rt="${r.rt}">${tag(r)}<span class="tt"><b>${esc(r.titulo)}</b>${r.assist && r.assist !== r.titulo ? `<span class="res">${esc(r.assist)}</span>` : ""}${metaLinha(r, semPessoa)}</span>${acoesLinha(r)}</div>${caixaLinha(r)}</div>`;
}
function vistaLista() {
  let vs = filtradas();
  vs = s.st === "abertas" ? vs.filter((r) => ABERTOS.includes(r.status)) : vs.filter((r) => r.status === s.st);
  if (!vs.length) return `<div class="vazio">Nenhuma rota aqui.${s.busca || s.pessoa || s.frente || s.venc ? " Limpe os filtros para ver mais." : ""}</div>`;
  if (s.agrupar === "minha") {   // a ordem que a própria pessoa escolheu; o que ela ainda não ordenou entra no fim, por prioridade
    const mi = minhaFila(vs);
    if (!mi.length) return `<div class="vazio">Você não tem rota aberta com você.</div>`;
    return `<section class="grupo"><h2>Minha ordem<span class="ct">${mi.length}</span><small class="nota" style="margin:0 0 0 8px;font-weight:500;letter-spacing:0;text-transform:none">use ↑ ↓ para pôr na ordem em que você vai fazer</small></h2><div class="lista">${mi.map((r, i) => `<div class="ordem-item"><span class="setas"><button type="button" class="ac" data-subir="${r.rt}" ${i ? "" : "disabled"} aria-label="Subir">↑</button><b>${i + 1}</b><button type="button" class="ac" data-descer="${r.rt}" ${i < mi.length - 1 ? "" : "disabled"} aria-label="Descer">↓</button></span>${linha(r)}</div>`).join("")}</div></section>`;
  }
  if (s.agrupar === "prioridade") {   // o modelo da equipe: começa pelas mais urgentes
    const nomes = { P1: "🚨 P1 · fazer em 24h", P2: "⚡ P2 · em 72h", P3: "⏳ P3 · em 7 dias", P4: "💤 P4 · em 30 dias", P5: "⏸️ P5 · sem prazo", "": "Sem prioridade" };
    const porPrazo = (a, b) => (a.prazo || "9").localeCompare(b.prazo || "9") || a.rt.localeCompare(b.rt);
    return Object.keys(nomes).map((p) => [p, vs.filter((r) => pcod(r.prioridade) === p).sort(porPrazo)]).filter(([, l]) => l.length)
      .map(([p, l]) => `<section class="grupo prio-g prio-${p || "sem"}"><h2>${nomes[p]}<span class="ct">${l.length}</span>${l.filter(vencida).length ? `<em>· ${l.filter(vencida).length} vencidas</em>` : ""}</h2><div class="lista">${l.map((r) => linha(r)).join("")}</div></section>`).join("");
  }
  if (s.agrupar === "prazo") {
    const g = { vencidas: [], hoje: [], semana: [], depois: [], sem: [] };
    vs.forEach((r) => { if (!r.prazo || pcod(r.prioridade) === "P5") g.sem.push(r); else { const n = dias(r.prazo); if (n < 0 && ABERTOS.includes(r.status)) g.vencidas.push(r); else if (n <= 0) g.hoje.push(r); else if (n <= 7) g.semana.push(r); else g.depois.push(r); } });
    const nomes = { vencidas: "Vencidas", hoje: "Hoje", semana: "Próximos 7 dias", depois: "Mais adiante", sem: "Sem prazo" };
    return Object.entries(g).filter(([, l]) => l.length).map(([k, l]) => `<section class="grupo ${k}"><h2>${nomes[k]}<span class="ct">${l.length}</span></h2><div class="lista">${l.sort(ordPrio).map((r) => linha(r)).join("")}</div></section>`).join("");
  }
  // padrão do Mapa de Rotas do Doc: frente › pessoa (gerente primeiro, Miguel por último) › prioridade
  const pos = (f) => { const i = FRENTES.indexOf(f); return i < 0 ? 50 : i; };
  const frentes = [...new Set(vs.map((r) => r.frente || ""))].sort((a, b) => pos(a) - pos(b));
  return frentes.map((f) => {
    const fr = vs.filter((r) => (r.frente || "") === f), ger = gerenteDe(f);
    const ids = [...new Set(fr.map((r) => r.responsavel_id || ""))];
    const ehMiguel = (id) => pessoa(id)?.papel === "comando";
    ids.sort((a, b) => (a === ger?.id ? -1 : b === ger?.id ? 1 : 0) || (ehMiguel(a) ? 1 : ehMiguel(b) ? -1 : 0) || nomeDe(a).localeCompare(nomeDe(b)));
    return `<section class="grupo-frente"><h2>${esc(frenteCurta(f))}<span class="ct">${fr.length}</span></h2>${ids.map((id) => {
      const l = fr.filter((r) => (r.responsavel_id || "") === id).sort(ordPrio), v = l.filter(vencida).length, n = nomeDe(id) || "Sem dono";
      return `<div class="grupo-pessoa"><h3><span class="avatar">${ini(n)}</span>${ehMiguel(id) && !f.includes("Pessoal") ? "Comigo (Miguel)" : esc(n)}${ger && id === ger.id ? " <small>· gerente</small>" : ""}<small>· ${l.length}</small>${v ? `<em>· ${v} vencidas</em>` : ""}</h3><div class="lista">${l.map((r) => linha(r, true)).join("")}</div></div>`;
    }).join("")}</section>`;
  }).join("");
}
function minhaFila(vs) {
  const meu = (vs || filtradas()).filter((r) => ABERTOS.includes(r.status) && (r.responsavel_id === eu().id || r.co_responsavel_id === eu().id));
  const pos = new Map((M.minha_ordem || []).map((rt, i) => [rt, i]));
  return meu.sort((a, b) => (pos.has(a.rt) ? pos.get(a.rt) : 1e6) - (pos.has(b.rt) ? pos.get(b.rt) : 1e6) || ordPrio(a, b));
}
async function moverOrdem(rt, passo) {
  const l = minhaFila(M.rotas).map((r) => r.rt), i = l.indexOf(rt), j = i + passo;
  if (i < 0 || j < 0 || j >= l.length) return;
  [l[i], l[j]] = [l[j], l[i]]; M.minha_ordem = l; render();
  try { M.minha_ordem = await chamar("alfy_minha_ordem", { p_rts: l }); } catch (e) { falhou(e); }
}
function cartaoK(r) {
  const pz = prazoInfo(r);
  return `<button type="button" class="cartao" draggable="true" data-rt="${r.rt}"><span class="c1">${tag(r)}<b>${esc(r.titulo)}</b></span><span class="c2"><span class="pessoa"><span class="avatar">${ini(nomeDe(r.responsavel_id))}</span><span>${esc(curto(nomeDe(r.responsavel_id)))}${r.co_responsavel_id ? " + " + esc(curto(nomeDe(r.co_responsavel_id))) : ""}</span></span>${r.comentarios ? `<span>💬 ${r.comentarios}</span>` : ""}<span class="prazo ${pz.cls}">${pz.txt.replace("até ", "")}</span></span></button>`;
}
function vistaKanban() {
  const vs = filtradas();
  return `<div class="abas-col">${ORDEM.map((k, i) => `<button type="button" class="chip" data-col="${i}" aria-pressed="${s.colMovel === i}">${ST[k].nome} · ${vs.filter((r) => r.status === k).length}</button>`).join("")}</div><div class="kanban" id="kanban">${ORDEM.map((k) => {
    const l = vs.filter((r) => r.status === k).sort(ordPrio);
    return `<section class="coluna" data-col-st="${k}"><header><i style="background:${ST[k].cor}"></i><b>${ST[k].nome}</b><span>${l.length}</span></header><div class="cartoes">${l.length ? l.map(cartaoK).join("") : `<div class="vazio">Arraste uma rota para cá</div>`}</div></section>`;
  }).join("")}</div>`;
}
function ligarKanban() {
  const k = $("#kanban"); if (!k) return;
  k.addEventListener("dragstart", (e) => { const el = e.target.closest(".cartao"); if (!el) return; el.classList.add("arrastando"); e.dataTransfer.setData("text/plain", el.dataset.rt); });
  k.addEventListener("dragend", (e) => { const el = e.target.closest(".cartao"); el && el.classList.remove("arrastando"); });
  k.querySelectorAll(".agk-col").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("alvo"); });
    col.addEventListener("dragleave", () => col.classList.remove("alvo"));
    col.addEventListener("drop", (e) => { e.preventDefault(); col.classList.remove("alvo"); mover(e.dataTransfer.getData("text/plain"), col.dataset.colSt); });
  });
  k.addEventListener("scroll", () => { const w = k.querySelector(".coluna").offsetWidth + 10, i = Math.round(k.scrollLeft / w); if (i !== s.colMovel) { s.colMovel = i; document.querySelectorAll(".abas-col .chip").forEach((b, j) => b.setAttribute("aria-pressed", j === i)); } }, { passive: true });
}

// ---------------------------------------------------------------- 🏆 Placar
// pontuação V3: (Impacto + Dificuldade + Qualidade) × prazo, de 0 a 10, por rota concluída; responsável e co-responsável pontuam
const MES_TXT = (d) => new Date(d + "T12:00:00-03:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
async function carregarPlacar() { s.placar = await chamar("alfy_placar", { p_mes: s.placarMes || null }).catch(() => s.placar); }
const ptsTxt = (n) => `${String(+n).replace(".", ",")} pt${+n === 1 ? "" : "s"}`;
function entregaHTML(e, comDono) {
  const pt = e.pt || {}, prazo = pt.mod === 1 ? "no prazo" : pt.mod === 0.5 ? "fora do prazo, vale metade" : "muito fora do prazo, não pontua";
  return `<button type="button" class="ent6" data-rt="${e.rt}"><span class="ent6n ${pt.mod === 1 ? "" : pt.mod === 0.5 ? "meio" : "zero"}">${(+pt.pontos || 0).toLocaleString("pt-BR")}</span><span class="ent6b"><b>${esc(e.titulo)}</b><small>${esc(nomeRota(e.rt))} · ${ddmm(pt.concluida_em)}${comDono ? " · " + esc(curto(nomeDe(e.resp))) + (e.co ? " + " + esc(curto(nomeDe(e.co))) : "") : ""} · ${prazo}</small><small class="ent6c">Impacto ${pt.impacto} + Dificuldade ${pt.dificuldade} + Qualidade ${pt.qualidade}</small></span></button>`;
}
// quanto a rota vale no Placar (mesma conta do banco, alfy._pontos): (Impacto + Dificuldade + Qualidade) × prazo
function valorRota(r) {
  if ((r.tipo || "").includes("Compromisso") || (r.frente || "").includes("Pessoal")) return null;
  const i = { Alto: 3, Baixo: 1 }[r.impacto] || 2, d = { "Muito difícil": 4, "Difícil": 3, Alto: 3, "Fácil": 1, Baixo: 1 }[r.esforco] || 2, q = { Acima: 3, Abaixo: 1 }[r.qualidade] || 2, base = i + d + q;
  if (r.pontos) return { i, d, q, base, pts: +r.pontos.pontos, feito: true, mod: r.pontos.mod };
  const atraso = r.prazo && pcod(r.prioridade) !== "P5" ? (Date.now() - new Date(r.prazo)) / 864e5 : -1, mod = atraso <= 0.5 ? 1 : atraso <= 7 ? 0.5 : 0;
  return { i, d, q, base, pts: base * mod, mod, feito: false };
}
function valeHTML(r) {
  const v = valorRota(r); if (!v) return `<p class="vale4 nao">🏆 Não pontua no Placar (${(r.tipo || "").includes("Compromisso") ? "compromisso" : "frente Pessoal"}).</p>`;
  const n = (x) => x.toLocaleString("pt-BR"), pad = (k) => !r[k] ? " (vazio, conta 2)" : "";
  const agora = v.feito ? `Valeu <b>${n(v.pts)} pts</b>${v.mod === 1 ? ", entregue no prazo" : v.mod === 0.5 ? ", entregue fora do prazo (metade)" : ", entregue muito fora do prazo (zero)"}.`
    : v.mod === 1 ? `Concluída no prazo vale <b>${n(v.base)} pts</b>. Até 7 dias fora vale ${n(v.base / 2)}; depois, zero.` : v.mod === 0.5 ? `Já passou do prazo: se concluir até 7 dias depois dele vale <b>${n(v.base / 2)} pts</b> (metade). Depois, zero.` : `Passou mais de 7 dias do prazo: <b>não pontua mais</b>.`;
  return `<p class="vale4">🏆 ${agora}<small>Impacto ${v.i}${pad("impacto")} + Dificuldade ${v.d}${pad("esforco")} + Qualidade ${v.q}${pad("qualidade")} = ${v.base}</small></p>`;
}
function vistaPlacar() {
  const pl = s.placar; if (!pl) return `<div class="carregando">Carregando o placar…</div>`;
  const mes = pl.mes, ant = new Date(mes + "T12:00:00-03:00"); ant.setMonth(ant.getMonth() - 1); const prox = new Date(mes + "T12:00:00-03:00"); prox.setMonth(prox.getMonth() + 1);
  const ehMesAtual = mes.slice(0, 7) === hojeDia().slice(0, 7), mesTxt = MES_TXT(mes).toLowerCase().replace(/^./, (c) => c.toUpperCase());
  const fimMes = new Date(prox.getFullYear(), prox.getMonth(), 1), faltam = Math.ceil((fimMes - new Date()) / 864e5);
  const pts = (n) => (+n || 0).toLocaleString("pt-BR");
  const nav = `<div class="pl7nav"><button class="pl6seta" type="button" data-plmes="${ant.toLocaleDateString("en-CA")}" aria-label="Mês anterior">‹</button><b>${mesTxt}</b><button class="pl6seta" type="button" data-plmes="${prox.toLocaleDateString("en-CA")}" ${ehMesAtual ? "disabled" : ""} aria-label="Próximo mês">›</button><span class="espaco"></span><small>${ehMesAtual ? `🏁 fecha em ${faltam} ${faltam === 1 ? "dia" : "dias"}` : "mês fechado"}</small></div>`;
  const ents = pl.entregas || pl.minhas || [], noPrazo = ents.filter((e) => e.pt?.mod === 1).length, media = ents.length ? ents.reduce((n, e) => n + (+e.pt?.pontos || 0), 0) / ents.length : 0;
  const nums = (l) => `<div class="pl7nums">${l.map(([v, t]) => `<div><b>${v}</b><small>${t}</small></div>`).join("")}</div>`;
  let topo = "";
  if (comando()) {
    const rank = pl.rank || [], pod = rank.filter((r) => r.pontos > 0).slice(0, 3);
    const placa = (r, k) => `<div class="pod7 md${k}"><span class="pod7pos">${k}º</span><span class="pod7av">${ini(r.nome)}</span><b class="pod7nm">${esc(curto(r.nome))}</b><span class="pod7pt">${pts(r.pontos)}<small> pts</small></span><small class="pod7mt">${r.entregas} ${r.entregas === 1 ? "entrega" : "entregas"}</small></div>`;
    topo = (pod.length ? `<section class="pl7pod">${[1, 0, 2].filter((k) => pod[k]).map((k) => placa(pod[k], pod[k].pos)).join("")}</section>` : `<p class="nota">Ninguém pontuou neste mês ainda.</p>`)
      + nums([[ents.length, "entregas no mês"], [ents.length ? Math.round(100 * noPrazo / ents.length) + "%" : "–", "no prazo"], [media.toLocaleString("pt-BR", { maximumFractionDigits: 1 }), "pontos por entrega"]]);
    const max = Math.max(1, ...rank.map((r) => +r.pontos || 0)), com = rank.filter((r) => r.pontos > 0 || r.entregas > 0), sem = rank.filter((r) => !(r.pontos > 0 || r.entregas > 0));
    topo += `<section class="pl6sec"><h3>Ranking</h3>${com.map((r) => `<div class="rk7 ${r.pos <= 3 && r.pontos > 0 ? "md" + r.pos : ""}"><span class="rk6p">${r.pos}º</span><span class="rk7b"><span class="rk7l"><b>${esc(r.nome)}</b><small>${r.entregas} ${r.entregas === 1 ? "entrega" : "entregas"}${r.faltas ? ` · ${r.faltas} fora do prazo` : ""}</small></span><i class="rk7bar"><i style="width:${Math.max(3, Math.round(100 * (+r.pontos || 0) / max))}%"></i></i></span><span class="rk6n">${pts(r.pontos)}<small> pts</small></span></div>`).join("")}${sem.length ? `<p class="pl6sem">Ainda sem entrega: ${sem.map((r) => esc(curto(r.nome))).join(", ")}</p>` : ""}</section>`;
  } else {
    const eu_ = pl.eu || {};
    topo = `<section class="pl7eu"><div class="pl7eupos"><b>${eu_.pos ? eu_.pos + "º" : "–"}</b><small>de ${pl.total} na equipe</small></div><div class="pl7eupt"><b>${pts(eu_.pontos)}</b><small>pontos no mês</small></div></section>`
      + nums([[eu_.entregas || 0, eu_.entregas === 1 ? "entrega" : "entregas"], [ents.length ? Math.round(100 * noPrazo / ents.length) + "%" : "–", "no prazo"], [media.toLocaleString("pt-BR", { maximumFractionDigits: 1 }), "pontos por entrega"]])
      + `<p class="nota" style="margin:0">Os pontos dos outros não aparecem: só a sua posição.</p>`;
  }
  const lista = comando() ? (pl.entregas || []).filter((e) => !s.plBusca || (e.titulo + " " + nomeDe(e.resp) + " " + nomeDe(e.co)).toLowerCase().includes(s.plBusca.toLowerCase())) : (pl.minhas || []);
  const banco = `<section class="pl6sec"><div class="pl6h"><h3>${comando() ? "Entregas do mês" : "Suas entregas"} · ${(comando() ? pl.entregas : pl.minhas || []).length}</h3><button class="lk" type="button" data-verconc="1">✓ Ver rotas concluídas</button>${comando() ? `<input class="busca" id="pl-busca" placeholder="Buscar entrega ou pessoa" value="${esc(s.plBusca || "")}">` : ""}</div>${lista.map((e) => entregaHTML(e, comando())).join("") || '<p class="nota">Nenhuma entrega neste mês ainda. Cada rota concluída vale até 10 pontos.</p>'}</section>`;
  const regra = `<details class="pl7regra"><summary>Como pontua</summary><div class="pl7tab"><div><b>Impacto</b><span>Alto 3 · Médio 2 · Baixo 1</span></div><div><b>Dificuldade</b><span>Muito difícil 4 · Difícil 3 · Simples 2 · Fácil 1</span></div><div><b>Qualidade</b><span>Acima 3 · Como esperado 2 · Abaixo 1</span></div><div><b>Prazo</b><span>No prazo ×1 · até 7 dias fora ×½ · mais que isso ×0</span></div></div><p class="nota" style="margin:8px 0 0">Pontos = (Impacto + Dificuldade + Qualidade) × prazo, até 10 por rota. Campo vazio conta como o do meio (2 + 2 + 2 = 6). Responsável e co-responsável pontuam. Compromisso e frente Pessoal não contam.</p></details>`;
  return `<div class="pl7">${nav}<div class="pl7grade"><div class="pl7a">${topo}</div><div class="pl7b">${banco}${regra}</div></div></div>`;
}

// ---------------------------------------------------------------- 🔁 Rotinas
// tarefa que se repete: ao concluir, o ALFY abre a próxima com as mesmas instruções; "quando precisar" volta com um toque
const REPETE_TXT = { diaria: "Todo dia", semanal: "Toda semana", quinzenal: "A cada 15 dias", mensal: "Todo mês", sob_demanda: "Quando precisar" };
async function carregarRotinas() { s.rotinas = await chamar("alfy_rotinas").catch(() => s.rotinas); }
function vistaRotinas() {
  const rs = s.rotinas;
  if (!rs) return `<div class="carregando">Carregando as rotinas…</div>`;
  const card = (x) => { const ab = x.aberta, pz = ab ? prazoInfo({ ...rotaDe(ab.rt) || {}, prazo: ab.prazo, status: ab.status, prioridade: "" }) : null;
    return `<div class="rot5"><div class="rot5t"><b>${esc(x.titulo)}</b><span class="sl4">🔁 ${REPETE_TXT[x.repete] || x.repete}${x.repete === "semanal" && (x.repete_dias || []).length ? " · " + x.repete_dias.map((d) => DIAS_SEM[d - 1]).join(", ") : ""}</span></div>
      <p class="rot5m">👤 ${esc(curto(nomeDe(x.responsavel_id)))}${x.frente ? " · " + esc(frenteCurta(x.frente)) : ""} · feita ${x.feitas} ${x.feitas === 1 ? "vez" : "vezes"}${x.ultima_feita ? " · última " + quandoFoi(x.ultima_feita) : ""}</p>
      <div class="rot5a">${ab ? `<span class="rot5s"><i class="pt4 st-${ab.status}"></i>Aberta: ${esc(nomeRota(ab.rt))}${pz ? " · " + pz.txt : ""}</span><button class="btn peq" type="button" data-rt="${ab.rt}">Abrir</button>` : `<span class="rot5s">Nenhuma aberta agora</span><button class="btn turq peq" type="button" data-rodarrotina="${x.serie}">▶ Rodar agora</button>`}<button class="lk" type="button" data-rt="${x.ultima_rt}">Editar modelo</button></div></div>`; };
  return `<div class="rot5-tela"><div class="f4h"><p class="nota" style="margin:0">Rotina é uma rota que volta sozinha: ao concluir, o ALFY abre a próxima com as mesmas instruções e a mesma lista. "Quando precisar" volta quando você toca em ▶ Rodar agora.</p><button class="cta" type="button" data-acao="nova-rotina">＋ Nova rotina</button></div>
    ${rs.length ? rs.map(card).join("") : '<div class="vazio">Nenhuma rotina ainda. Crie a primeira (ex.: compra do mercado, fechamento de caixa).</div>'}</div>`;
}

// passagem de rotinas: as vezes abertas, uma por uma (feita · não deu · próxima)
function vistaAbaRotinas() {
  const modo = s.rtnModo || "passagem";
  const seg = `<div class="seg5" role="group" aria-label="Rotinas"><button type="button" data-rtnmodo="passagem" aria-pressed="${modo === "passagem"}">🧭 Passagem</button><button type="button" data-rtnmodo="todas" aria-pressed="${modo === "todas"}">Todas as rotinas</button></div>`;
  if (modo === "todas") return `<div class="rot5-tela">${seg}${vistaRotinas()}</div>`;
  const minhas = (M.rotas || []).filter((r) => ehRotina(r) && ABERTOS.includes(r.status) && (comando() || r.responsavel_id === eu().id || r.co_responsavel_id === eu().id) && !(s.rtnPulou || {})[r.rt])
    .sort((x, y) => (vencida(y) - vencida(x)) || (x.prazo || "9").localeCompare(y.prazo || "9"));
  const fx = minhas.find((r) => r.rt === s.rtnFoco) || minhas[0], serie = (s.rotinas || []).find((x) => x.serie === (fx?.repete_de || fx?.rt));
  const fid = fx ? "clf-" + fx.rt.replace(/\W/g, "") : "";
  const deck = !fx ? `<div class="vazio rr-fim">🏁 Nenhuma rotina aberta${comando() ? "" : " com você"} agora.</div>` : (() => { const pz = prazoInfo(fx);
    return `<article class="rr-item foco rtn5"><div class="rr-cab">${tag(fx)}<span class="tt"><b>${esc(fx.titulo)}</b><span class="selos3"><span class="selo3">🔁 ${REPETE_TXT[fx.repete]}</span><span class="selo3 ${pz.cls}">📅 ${pz.txt}</span><span class="selo3">👤 ${esc(curto(nomeDe(fx.responsavel_id)))}</span>${serie ? `<span class="selo3">✓ feita ${serie.feitas}×${serie.ultima_feita ? " · última " + quandoFoi(serie.ultima_feita) : ""}</span>` : ""}</span></span></div>
      ${fx.assist && fx.assist !== fx.titulo ? `<p class="f5-res" style="font-size:16px">${esc(fx.assist)}</p>` : ""}
      ${instrDe(fx) ? `<div class="rtn5i"><small>📝 Instruções e lista</small><p>${esc(instrDe(fx))}</p></div>` : ""}
      ${fx.como_esta ? `<div class="rtn5i ag"><small>📍 Em que pé está</small><p>${esc(fx.como_esta)}</p></div>` : ""}
      ${caixaLinha(fx, true)}
      <div class="acoes4"><div class="grupo4"><button class="ac ok" type="button" data-rtnfeita="${fx.rt}">✓<span>Feita</span></button><button class="ac" type="button" data-rtnnao="${fx.rt}">✗<span>Não deu</span></button><button class="ac" type="submit" form="${fid}" data-clmodo="comentar">💬<span>Comentar</span></button><button class="ac" type="button" data-rt="${fx.rt}">↗<span>Abrir</span></button></div>
        <div class="grupo4 dir"><button class="btn turq" type="button" data-rtnpular="${fx.rt}">Próxima →</button></div></div></article>`; })();
  const fila = minhas.filter((r) => r !== fx).map((x) => `<div class="rr-mini4" role="button" tabindex="0" data-rtnfoco="${x.rt}">${tag(x)}<span class="tt"><b>${esc(x.titulo)}</b><small>🔁 ${REPETE_TXT[x.repete]} · ${esc(prazoInfo(x).txt)} · ${esc(curto(nomeDe(x.responsavel_id)))}</small></span></div>`).join("");
  return `<div class="rot5-tela">${seg}<p class="nota" style="margin:0">${minhas.length} rotina${minhas.length === 1 ? "" : "s"} aberta${minhas.length === 1 ? "" : "s"}. Feita: some e volta na próxima data. Não deu: fica aberta e, na próxima data, a mesma rotina é renovada (não duplica).</p>
    ${deck}${fila ? `<h3 class="rr-fila-t">Na fila · ${minhas.length - 1}</h3><div class="lista" style="display:flex;flex-direction:column;gap:6px">${fila}</div>` : ""}</div>`;
}

// ---------------------------------------------------------------- 🧭 Passagem de Rotas
// banco de trabalho: o robô rastreia todas as rotas abertas de uma vez (WhatsApp, e-mail, Drive e o próprio ALFY)
// e o Miguel passa uma a uma, na ordem que escolheu; o que ele já viu ou deixou para depois sai da fila
const RR_ORDENS = [["franquia", "Franquia"], ["prioridade", "Prioridade"], ["prazo", "Prazo"], ["vencimento", "Vencimento"]];
const RR_GUARDA = "alfy-rr";
function rrNovo() { return { f: { prio: [], st: [], prazo: [] }, modo: "tudo", ordem: "franquia", formato: "lista", novFirst: true, lote: null, rts: [], itens: {}, ped: null, feitas: {}, depois: {}, foco: null }; }
s.rr = rrNovo();
function rrSalvar() { const r = s.rr; try { localStorage.setItem(RR_GUARDA, JSON.stringify({ f: r.f, modo: r.modo, ordem: r.ordem, formato: r.formato, novFirst: r.novFirst, lote: r.lote, rts: r.rts, feitas: r.feitas, depois: r.depois })); } catch (_) { /* privado */ } }
function rrLer() { try { Object.assign(s.rr, JSON.parse(localStorage.getItem(RR_GUARDA) || "{}")); } catch (_) { /* privado */ } }
const rrRodando = () => !!s.rr.lote && !!s.rr.ped && (s.rr.ped.status === "fila" || s.rr.ped.status === "rodando");
async function rrCarregar() {
  if (!s.rr.lote) return;
  const x = await chamar("alfy_rastreios", { p_lote: s.rr.lote }).catch(() => null);
  if (x) { s.rr.itens = x.itens || {}; s.rr.ped = x.pedido; if (!x.pedido) { s.rr.lote = null; rrSalvar(); } }   // passada que sumiu do banco: começa do zero
}
const rrTem = (rt) => { const i = s.rr.itens[rt]; return !!i && !!(i.sugestao || (i.novidades && !/^(nada relevante|nada novo)/i.test(i.novidades))); };
// 🔔 O que mudou: novidade de outra pessoa (comentário, WhatsApp, mexida) ou do rastreio depois da última vez que você passou pela rota
const deOutro = (q) => !!q && q !== eu().nome && q !== "ALFY";
function rrMudou(r) {
  const v = vistoDe(r.rt), u = r.ult_txt, m = r.ult, i = s.rr.itens[r.rt], l = [];
  if (u && String(u.em) > v && deOutro(u.quem) && !String(u.texto || "").startsWith("🤖")) l.push({ em: u.em, txt: `💬 ${curto(u.quem)} ${String(u.texto || "").startsWith("📱") ? "respondeu no WhatsApp" : "comentou"} ${quandoFoi(u.em)}` });
  else if (m && String(m.em) > v && deOutro(m.quem)) l.push({ em: m.em, txt: `✏️ ${curto(m.quem)} mexeu ${quandoFoi(m.em)}` });
  if (i && i.em && String(i.em) > v && rrTem(r.rt)) l.push({ em: i.em, txt: `📡 o rastreio achou novidade` });
  return l.length ? { em: l.map((x) => String(x.em)).sort().pop(), txt: l.map((x) => x.txt).join(" · ") } : null;
}
// filtros da Passagem: cada grupo vale "qualquer um dos marcados"; grupos diferentes somam
const RR_FILTROS = {
  prio: ["Prioridade", [["P1", "🚨 P1"], ["P2", "⚡ P2"], ["P3", "⏳ P3"], ["P4", "💤 P4"], ["P5", "⏸️ P5"], ["sem", "Sem prioridade"]]],
  st: ["Etapa", [["rota", "🔴 Não iniciada"], ["andamento", "🟡 Em andamento"], ["pausada", "🟠 Pausada"]]],
  prazo: ["Prazo", [["venc", "Vencidas"], ["hoje", "Vence hoje"], ["semana", "Nos próximos 7 dias"], ["sem", "Sem prazo"]]],
};
const rrF = () => { const f = s.rr.f || (s.rr.f = { prio: [], st: [], prazo: [] }); for (const k in RR_FILTROS) f[k] = f[k] || []; return f; };
function rrPassaFiltro(x) {
  const f = rrF(), pz = !x.prazo || pcod(x.prioridade) === "P5" ? "sem" : dias(x.prazo) < 0 ? "venc" : dias(x.prazo) === 0 ? "hoje" : dias(x.prazo) <= 7 ? "semana" : "depois";
  return (!f.prio.length || f.prio.includes(pcod(x.prioridade) || "sem")) && (!f.st.length || f.st.includes(x.status))
    && (!f.prazo.length || f.prazo.includes(pz) || (f.prazo.includes("semana") && (pz === "hoje")));
}
const rrNFiltros = () => Object.values(rrF()).reduce((n, l) => n + l.length, 0) + (s.pessoa ? 1 : 0) + (s.frente ? 1 : 0);
function rrFiltrosHTML() {   // filtros à mostra: grupos curtos numa linha (no celular, desliza para o lado)
  const f = rrF(), n = rrNFiltros(), pes = gente().sort((a, b) => a[1].localeCompare(b[1]));
  const curto_ = { P1: "🚨 P1", P2: "⚡ P2", P3: "⏳ P3", P4: "💤 P4", P5: "⏸️ P5", sem: "Sem" };
  const grupo = (k, rot, ops) => `<div class="rrf2-g" role="group" aria-label="${rot}"><small>${rot}</small>${ops.map(([v, nm]) => `<button type="button" class="rrf-op" data-rrf="${k}" data-rrfv="${v}" aria-pressed="${f[k].includes(v)}">${nm}</button>`).join("")}</div>`;
  return `<div class="rrf2">${grupo("prio", "Prioridade", RR_FILTROS.prio[1].map(([v]) => [v, curto_[v]]))}
    ${grupo("st", "Etapa", [["rota", "🔴 Não iniciada"], ["andamento", "🟡 Andamento"], ["pausada", "🟠 Pausada"]])}
    ${grupo("prazo", "Prazo", [["venc", "Vencidas"], ["hoje", "Hoje"], ["semana", "7 dias"], ["sem", "Sem prazo"]])}
    <div class="rrf2-g"><select class="rrf2-sel ${s.pessoa ? "on" : ""}" data-rrsel="pessoa" aria-label="Pessoa">${opc([["semdono", "👻 Sem dono"], ...pes], s.pessoa, "👤 Todas as pessoas")}</select><select class="rrf2-sel ${s.frente ? "on" : ""}" data-rrsel="frente" aria-label="Frente">${opc(FRENTES.map((x) => [x, frenteCurta(x)]), s.frente, "🗺️ Todas as frentes")}</select></div>
    ${n ? `<button type="button" class="lk rrf2-limpa" data-acao="rr-filtros-limpar">Limpar ${n}</button>` : ""}</div>`;
}
// as rotas abertas (com os filtros do topo), na ordem escolhida, já em grupos
function rrGrupos(todas, tudoMesmo) {
  const r = s.rr, mud = r.modo === "mudou" && !tudoMesmo;
  const vs = filtradas().filter((x) => ABERTOS.includes(x.status) && (tudoMesmo || rrPassaFiltro(x)) && (todas || ((mud || !r.feitas[x.rt]) && !r.depois[x.rt])));   // no O que mudou, o "visto" é a última passada
  if (mud) {
    const ms = vs.map((x) => [x, rrMudou(x)]).filter(([, m]) => m).sort((a, b) => b[1].em.localeCompare(a[1].em)).map(([x]) => x);
    return ms.length ? [["Mudou desde a sua última passada", ms]] : [];
  }
  const porPrazo = (a, b) => (a.prazo || "9").localeCompare(b.prazo || "9") || ordPrio(a, b);
  let gs = [];
  if (r.ordem === "franquia") {
    const pos = (f) => { const i = FRENTES.indexOf(f); return i < 0 ? 50 : i; };
    gs = [...new Set(vs.map((x) => x.frente || ""))].sort((a, b) => pos(a) - pos(b)).map((f) => [frenteCurta(f), vs.filter((x) => (x.frente || "") === f).sort(ordPrio)]);
  } else if (r.ordem === "prioridade") {
    gs = ["P1", "P2", "P3", "P4", "P5", ""].map((p) => [p ? PRIORIDADES.find((x) => x.includes(p)) : "Sem prioridade", vs.filter((x) => pcod(x.prioridade) === p).sort(porPrazo)]);
  } else {
    const balde = r.ordem === "prazo"
      ? (x) => { if (!x.prazo || pcod(x.prioridade) === "P5") return 4; const n = dias(x.prazo); return n < 0 ? 0 : n === 0 ? 1 : n <= 7 ? 2 : 3; }
      : (x) => { if (!x.prazo || pcod(x.prioridade) === "P5") return 5; const n = dias(x.prazo); return n < -7 ? 0 : n < 0 ? 1 : n <= 1 ? 2 : n <= 7 ? 3 : 4; };
    const nomes = r.ordem === "prazo" ? ["Vencidas", "Hoje", "Próximos 7 dias", "Mais adiante", "Sem prazo"]
      : ["Vencidas há mais de uma semana", "Vencidas nesta semana", "Vencem hoje ou amanhã", "Vencem nos próximos 7 dias", "Em dia", "Sem prazo"];
    gs = nomes.map((n, i) => [n, vs.filter((x) => balde(x) === i).sort(porPrazo)]);
  }
  if (r.novFirst) gs.forEach(([, l]) => l.sort((a, b) => rrTem(b.rt) - rrTem(a.rt)));
  return gs.filter(([, l]) => l.length);
}
const rrFila = () => rrGrupos().flatMap(([, l]) => l);
function rrFoco() { const f = rrFila(); if (!f.find((x) => x.rt === s.rr.foco)) s.rr.foco = f[0]?.rt || null; return s.rr.foco; }
async function rrPassar() {
  const rts = rrGrupos(true, true).flatMap(([, l]) => l).map((x) => x.rt).filter((rt) => rt.startsWith("RT-"));
  if (!rts.length) { aviso("Nenhuma rota aberta com estes filtros"); return; }
  Object.assign(s.rr, { feitas: {}, depois: {}, itens: {}, foco: null, rts, ped: { status: "fila" } });
  s.rr.lote = await pedir("rastrear_lote", "lote", { rts });
  if (!s.rr.lote) s.rr.ped = null;
  rrSalvar(); render();
}
// texto escrito no campo da rota vai como comentário quando a pessoa passa, conclui ou agenda (o ALFY lê e atualiza a rota)
async function enviarRascunho(rt) {
  const ta = document.getElementById("cl-" + rt.replace(/\W/g, "")), t = (ta?.value || s.rascunhoLinha?.[rt] || "").trim();
  if (!t) return false;
  await chamar("alfy_comentar", { p_rt: rt, p_texto: t, p_tipo: "comentario" });
  s.rascunhoLinha = { ...(s.rascunhoLinha || {}), [rt]: "" }; if (ta) ta.value = "";
  return true;
}
// a tela não pula: só rola se o cartão da vez saiu de vista; o cursor não vai para o campo (as setas continuam passando)
function rrNoLugar() {
  const d = $("#rr-deck"); if (!d) return;
  const t = d.getBoundingClientRect().top;
  if (t < 0 || t > innerHeight * 0.6) d.scrollIntoView({ block: "start" });
}
// 🎲 sorteio: a próxima rota da vez sai ao acaso (para atacar rotas soltas no tempo livre)
function rrSortear() {
  const f = rrFila().filter((x) => x.rt !== s.rr.foco); if (!f.length) { aviso("Não sobrou rota para sortear"); return; }
  const r = f[Math.floor(Math.random() * f.length)]; s.rr.foco = r.rt; render(); setTimeout(rrNoLugar, 20); aviso(`🎲 Sorteada: ${nomeRota(r.rt)}`);
}
function rrTirar(rt, onde) {
  if (onde === "feitas") marcarVisto(rt);
  s.rr[onde] = { ...s.rr[onde], [rt]: true }; s.rr.foco = null; rrSalvar(); render();
  setTimeout(rrNoLugar, 20);
}
function rrNovidade(r) {
  const i = s.rr.itens[r.rt];
  if (!r.rt.startsWith("RT-")) return `<div class="rr-novo vazio">Ideia sem número: o rastreio só olha rotas numeradas.</div>`;
  if (!i) return rrRodando() && s.rr.rts.includes(r.rt) ? `<div class="rr-novo lendo">📡 lendo WhatsApp, e-mail, Drive e ALFY…</div>` : "";
  const f = i.fontes || {}, fontes = [["💬", "WhatsApp", f.whatsapp], ["✉️", "e-mail", f.email], ["📁", "Drive", f.drive], ["🐙", "ALFY", f.alfy]].filter((x) => x[2]).map(([ic, n, c]) => `<span>${ic} ${c} ${n}</span>`).join("");
  return `<div class="rr-novo ${rrTem(r.rt) ? "tem" : "vazio"}"><small class="rr-rot">📡 O rastreio achou${i.em ? " · " + quandoFoi(i.em) : ""}</small><p>${esc(i.novidades)}</p>${fontes ? `<div class="rr-fontes">${fontes}</div>` : ""}
    ${i.sugestao ? `<div class="rr-sug"><span>💡 ${esc(i.sugestao)}</span><button class="mini ia" type="button" data-rraplicar="${r.rt}">🐙 Fazer isso</button></div>` : ""}
    ${i.concluida ? `<div class="rr-sug fim"><span>🏁 Pelo que li, esta rota parece concluída.</span><button class="mini" type="button" data-rapido="concluida" data-rrt="${r.rt}">✓ Concluir</button></div>` : ""}</div>`;
}
// o pé em que a rota está: Como está agora + o último retorno que alguém escreveu
function rrSituacao(r) {
  const u = r.ult_txt;
  if (!r.como_esta && !u) return `<div class="sit4 vazio">Sem atualização ainda. Escreva abaixo o que está acontecendo.</div>`;
  return `<div class="sit4">${r.como_esta ? `<div class="sit4-l"><small>📍 Agora</small><p>${esc(r.como_esta)}</p></div>` : ""}${u ? `<div class="sit4-l ult4"><small>🕘 Último retorno · ${esc(curto(u.quem))} · ${quandoFoi(u.em)}</small><p>${esc(rotaTxt(u.texto.replace(/^📱 WhatsApp · /, "📱 ")))}</p></div>` : ""}</div>`;
}
// a rota mastigada: o ALFY entrega resumo, onde está, o que mudou e o próximo passo (sem rastreio, usa o que a rota já tem)
function rrFicha(r) {
  const i = s.rr.itens[r.rt] || {}, u = r.ult_txt, lendo = !s.rr.itens[r.rt] && rrRodando() && s.rr.rts.includes(r.rt);
  const resumo = i.resumo || r.assist || r.titulo, onde = i.onde || r.como_esta || "";
  const mudou = (i.mudou || []).length ? i.mudou : u ? [{ quando: ddmm(u.em), quem: curto(u.quem), o_que: rotaTxt(u.texto.replace(/^📱 WhatsApp · .*?\d{2}\/\d{2} \d{2}:\d{2}: /, "").replace(/^🤖 ALFY · /, "")).slice(0, 200), canal: /^📱/.test(u.texto) ? "whatsapp" : "alfy" }] : [];
  const CANAL = { whatsapp: "💬 WhatsApp", email: "✉️ E-mail", drive: "📁 Drive", alfy: "🐙 ALFY" };
  return `<div class="ficha5">
    <p class="f5-res">${esc(resumo)}</p>
    <div class="f5-l"><span class="f5-r">Onde está</span><p class="${onde ? "" : "f5-vazio"}">${onde ? esc(onde) : "Sem atualização ainda. Escreva abaixo o que está acontecendo."}</p></div>
    ${mudou.length ? `<div class="f5-l"><span class="f5-r">O que mudou</span><ul>${mudou.map((m) => `<li><span class="f5-q">${esc(m.quando || "")}${m.quem ? " · " + esc(m.quem) : ""}</span>${esc(m.o_que)}${CANAL[m.canal] ? ` <span class="f5-canal c-${m.canal}">${CANAL[m.canal]}</span>` : ""}</li>`).join("")}</ul></div>` : ""}
    ${lendo ? `<div class="f5-l"><span class="f5-r">Rastreio</span><p class="f5-vazio">📡 lendo WhatsApp, e-mail, Drive e ALFY…</p></div>` : ""}
    ${i.sugestao ? `<div class="f5-prox"><span class="f5-r">Próximo passo</span><p>${esc(i.sugestao)}</p><button class="mini ia" type="button" data-rraplicar="${r.rt}">🐙 Fazer isso</button></div>` : ""}
    ${i.concluida ? `<div class="f5-prox fim"><span class="f5-r">Parece pronta</span><p>Pelo que o ALFY leu, esta rota já foi feita.</p><button class="mini" type="button" data-rapido="concluida" data-rrt="${r.rt}">✓ Concluir</button></div>` : ""}
    ${u || i.fontes ? `<details class="f5-mais"><summary>Ver detalhes</summary>${u ? `<p><small>Último registro · ${esc(curto(u.quem))} · ${quandoFoi(u.em)}</small>${esc(rotaTxt(u.texto))}</p>` : ""}${i.fontes ? `<p><small>Rastreio leu${i.em ? " · " + quandoFoi(i.em) : ""}</small>${Object.entries(i.fontes).filter(([, n]) => n).map(([k, n]) => `${n} ${{ whatsapp: "WhatsApp", email: "e-mail", drive: "Drive", alfy: "ALFY" }[k] || k}`).join(" · ") || "nada"}</p>` : ""}</details>` : ""}
  </div>`;
}
function rrItem(r, foco) {
  const pz = prazoInfo(r), fid = "clf-" + r.rt.replace(/\W/g, ""), selo = (cls, t) => `<span class="selo3 ${cls}">${t}</span>`;
  return `<article class="rr-item ${foco ? "foco" : ""}" id="rr-${r.rt.replace(/\W/g, "")}">
    <div class="rr-cab" role="button" tabindex="0" data-rrfoco="${r.rt}">${tag(r)}<span class="tt"><b>${esc(r.titulo)}</b><span class="selos3">${selo("st-" + r.status, "● " + ST[r.status].um)}${r.prioridade ? selo("", prioTxt(r.prioridade)) : ""}${selo(pz.cls, "📅 " + pz.txt)}${selo("", "👤 " + esc(curto(nomeDe(r.responsavel_id))))}${r.comentarios ? selo("", "💬 " + r.comentarios) : ""}</span></span></div>
    ${foco && s.rr.modo === "mudou" && rrMudou(r) ? `<p class="rr-mudou">🔔 ${esc(rrMudou(r).txt)}</p>` : ""}
    ${foco ? rrFicha(r) : rrSituacao(r) + rrNovidade(r)}
    ${foco ? caixaLinha(r, true) : ""}
    ${s.rrAg === r.rt ? `<div class="rr-agenda"><label>Dia<input type="date" id="ag-dia" value="${r.inicio ? dia(r.inicio) : hojeDia()}"></label><label>Das<input type="time" id="ag-ini" value="${r.inicio ? hhmm(r.inicio) : "09:00"}"></label><label>Até<input type="time" id="ag-fim" value="${r.fim ? hhmm(r.fim) : ""}"></label>
      <span class="rr-acoes"><button class="btn turq peq" type="button" data-agpor="${r.rt}">📅 Pôr na agenda</button><button class="btn peq" type="button" data-agprazo="${r.rt}">Só mudar o prazo</button></span></div>` : ""}
    ${foco ? `<div class="acoes4"><div class="grupo4">
        <button class="ac" type="submit" form="${fid}" data-clmodo="comentar">💬<span>Comentar</span></button>${comando() ? `<button class="ac ia" type="submit" form="${fid}" data-clmodo="alfy">🐙<span>Pedir ao ALFY</span></button>` : ""}${comando() && r.rt.startsWith("RT-") ? `<button class="ac" type="button" data-rastrear="${r.rt}">📡<span>Rastrear</span></button>` : ""}
        <button class="ac ${s.rrAg === r.rt ? "on" : ""}" type="button" data-rragendar="${r.rt}">📅<span>Agendar</span></button>${r.status !== "andamento" ? `<button class="ac" type="button" data-rapido="andamento" data-rrt="${r.rt}">▶<span>Em andamento</span></button>` : ""}<button class="ac ok" type="button" data-rapido="concluida" data-rrt="${r.rt}">✓<span>Concluir</span></button><button class="ac" type="button" data-rt="${r.rt}">↗<span>Abrir</span></button></div>
      <div class="grupo4 dir"><button class="ac" type="button" data-rrdepois="${r.rt}">⏭<span>Depois</span></button><button class="ac" type="button" data-acao="rr-sortear" title="Sortear a próxima (S)">🎲<span>Sortear</span></button><button class="btn turq" type="button" data-rrfeita="${r.rt}">Próxima →</button></div></div>`
      : `<div class="acoes4 mini4"><button class="ac" type="button" data-rrfoco="${r.rt}">✎<span>Tratar</span></button><button class="ac" type="button" data-rrfeita="${r.rt}">✓<span>Vista</span></button><button class="ac" type="button" data-rrdepois="${r.rt}">⏭<span>Depois</span></button></div>`}
  </article>`;
}
function rrCartao(r) {
  const i = s.rr.itens[r.rt], pz = prazoInfo(r);
  return `<div class="cartao rr-cartao ${rrTem(r.rt) ? "tem" : ""}"><span class="c1">${tag(r)}<b>${esc(r.titulo)}</b></span>
    <span class="c2"><span class="pessoa"><span class="avatar">${ini(nomeDe(r.responsavel_id))}</span><span>${esc(curto(nomeDe(r.responsavel_id)))}</span></span><span class="prazo ${pz.cls}">${pz.txt.replace("até ", "")}</span></span>
    <span class="rr-mini">${i ? esc(i.novidades) : rrRodando() && s.rr.rts.includes(r.rt) ? "📡 lendo…" : "ainda não rastreada"}</span>
    <span class="rr-acoes"><button class="ac" type="button" data-rrfeita="${r.rt}" title="Vista">✓</button><button class="ac" type="button" data-rrdepois="${r.rt}" title="Deixar para depois">⏭</button><button class="ac" type="button" data-rrlista="${r.rt}" title="Tratar esta na lista">🐙</button><button class="ac" type="button" data-rt="${r.rt}" title="Abrir a rota">↗</button></span></div>`;
}
function vistaRotaARota() {
  const r = s.rr, todas = rrGrupos(true).flatMap(([, l]) => l), gs = rrGrupos(), fila = gs.flatMap(([, l]) => l), foco = rrFoco();
  const nFeitas = todas.filter((x) => r.feitas[x.rt]).length, nDepois = todas.filter((x) => r.depois[x.rt]).length;
  const lidas = r.rts.filter((rt) => r.itens[rt]).length, comNov = todas.filter((x) => rrTem(x.rt)).length;
  const ultima = Object.values(r.itens).map((i) => i.em).sort().pop();
  const nMud = filtradas().filter((x) => ABERTOS.includes(x.status) && rrPassaFiltro(x) && !r.depois[x.rt] && rrMudou(x)).length;
  const estado = !r.lote ? `Aperte <b>Atualizar todas</b>: o ALFY lê WhatsApp, e-mail, Drive e o próprio ALFY de cada uma das ${rrGrupos(true, true).flatMap(([, l]) => l).length} rotas abertas e traz o que mudou.`
    : rrRodando() ? `<span class="ao-vivo"><i></i></span> Rastreando… <b>${lidas} de ${r.rts.length}</b> rotas lidas. Pode ir começando pelas primeiras.`
    : r.ped?.status === "erro" ? `O rastreio deu erro: ${esc((r.ped.erro || "").slice(0, 140))}. Aperte de novo.`
    : r.modo === "mudou" ? `Rastreio de ${ultima ? quandoFoi(ultima) : "antes"}. Aperte Atualizar para o ALFY buscar novidades no WhatsApp, e-mail e Drive de todas as rotas.`
    : `Atualizado ${ultima ? quandoFoi(ultima) : ""} · <b>${comNov}</b> com novidade · ${todas.length - comNov} sem nada novo.`;
  // a carta da passada: cada rota é um ponto da rota; vista, para depois ou a da vez
  const pontos = todas.map((x) => `<i class="${r.feitas[x.rt] ? "ok" : r.depois[x.rt] ? "dep" : x.rt === foco ? "agora" : rrTem(x.rt) ? "nov" : ""}" title="${esc(nomeRota(x.rt))}"></i>`).join("");
  const painel = `<section class="placa rebites rr-painel">
    <div class="rr-l1"><div><h2>🧭 Passagem de Rotas</h2><p class="rr-estado">${estado}</p></div>
      <button class="cta" type="button" data-acao="rr-passar" ${rrRodando() ? "disabled" : ""}>📡 ${r.lote ? "Atualizar de novo" : "Atualizar todas"}</button></div>
    <div class="rr-modo"><div class="seg5" role="group" aria-label="O que passar"><button type="button" data-rrmodo="tudo" aria-pressed="${r.modo !== "mudou"}">Todas as rotas</button><button type="button" data-rrmodo="mudou" aria-pressed="${r.modo === "mudou"}">🔔 O que mudou${nMud ? ` · ${nMud}` : ""}</button></div>
      ${r.modo === "mudou" ? `<span class="nota" style="margin:0">Só o que teve novidade desde a sua última passada, da mais nova para a mais velha. Passou, sai; mexeram de novo, volta.</span>${nMud ? `<button class="lk" type="button" data-acao="rr-tudo-visto">✓ Marcar tudo como visto</button>` : ""}` : ""}</div>
    ${rrFiltrosHTML()}
    <div class="rr-l2">${r.modo === "mudou" ? "" : `<span class="rr-rot">Ordem</span>${RR_ORDENS.map(([k, n]) => `<button class="chip" type="button" data-rrordem="${k}" aria-pressed="${r.ordem === k}">${n}</button>`).join("")}
      <button class="chip" type="button" data-acao="rr-novfirst" aria-pressed="${r.novFirst}">Novidade primeiro</button>`}<span class="espaco"></span>
      <div class="alterna" role="group" aria-label="Formato"><button type="button" data-rrformato="lista" aria-pressed="${r.formato === "lista"}">Lista</button><button type="button" data-rrformato="kanban" aria-pressed="${r.formato === "kanban"}">Kanban</button></div></div>
    <div class="rr-carta" aria-hidden="true">${pontos}</div>
    <p class="rr-conta"><b>${fila.length}</b> na fila · ✓ ${nFeitas} vistas · ⏭ ${nDepois} para depois${nDepois ? ` <button class="mini" type="button" data-acao="rr-voltar">Trazer de volta</button>` : ""}${nFeitas ? ` <button class="mini" type="button" data-acao="rr-zerar">Recomeçar a passada</button>` : ""}</p></section>`;
  if (!fila.length && r.modo === "mudou") return painel + `<div class="vazio rr-fim">✅ Nada mudou desde a sua última passada. Quando alguém comentar, responder no WhatsApp ou o rastreio achar novidade, a rota aparece aqui.</div>`;
  if (!fila.length) return painel + `<div class="vazio rr-fim">🏁 Passada completa. ${nFeitas} vistas${nDepois ? `, ${nDepois} ficaram para depois` : ""}.</div>`;
  if (r.formato === "kanban") return painel + `<div class="kanban rr-kanban" style="grid-template-columns:repeat(${gs.length},minmax(230px,1fr))">${gs.map(([n, l]) => `<section class="coluna"><header><b>${esc(n)}</b><span>${l.length}</span></header><div class="cartoes">${l.map(rrCartao).join("")}</div></section>`).join("")}</div>`;
  const fx = fila.find((x) => x.rt === foco);
  const mini = (x) => `<div class="rr-mini4" role="button" tabindex="0" data-rrfoco="${x.rt}">${tag(x)}<span class="tt"><b>${esc(x.titulo)}</b><small>${r.modo === "mudou" && rrMudou(x) ? `<span class="nova-l">${esc(rrMudou(x).txt)}</span> · ` : temNova(x) ? '<span class="nova-l">💬 nova resposta</span> · ' : ""}${esc(ST[x.status].um)} · ${esc(prazoInfo(x).txt)} · ${esc(curto(nomeDe(x.responsavel_id)))}${rrTem(x.rt) ? " · 📡 novidade" : ""}${s.rr.itens[x.rt]?.resumo ? " · " + esc(s.rr.itens[x.rt].resumo.slice(0, 120)) : x.como_esta ? " · " + esc(x.como_esta.slice(0, 110)) : ""}</small></span></div>`;
  const resto = gs.map(([n, l]) => { const ll = l.filter((x) => x.rt !== foco); return ll.length ? `<section class="rr-grupo"><h2>${esc(n)}<span class="ct">${ll.length}</span></h2><div class="lista">${ll.map(mini).join("")}</div></section>` : ""; }).join("");
  return painel + (fx ? `<div class="rr-deck" id="rr-deck">${rrItem(fx, true)}</div>` : "")
    + `<p class="rr-dica">Atalhos: <kbd>⌘ Enter</kbd> comenta e passa · <kbd>⌘ Shift Enter</kbd> pede ao ALFY e passa · <kbd>→</kbd> próxima · <kbd>D</kbd> depois · <kbd>C</kbd> concluir · <kbd>S</kbd> sortear · <kbd>E</kbd> escrever · <kbd>Esc</kbd> sai do campo</p>`
    + (resto ? `<h3 class="rr-fila-t">Na fila · ${fila.length - (fx ? 1 : 0)}</h3>${resto}` : "");
}


// ---------------------------------------------------------------- 📱 WhatsApp
// ficar longe do zap sem perder nada: o que espera resposta, o resumo de cada conversa e grupo, e o que vira rota
const zapRodando = () => ["fila", "rodando"].includes(s.zap?.pedido?.status);
async function carregarZap() { s.zap = await chamar("alfy_zap").catch(() => s.zap); }
const zapNoModo = (z) => s.zapModo === "tudo" ? true : s.zapModo === "pessoal" ? z.trabalho === false && !z.prioritario : z.trabalho !== false || z.prioritario;
// nome limpo: "🟠 Tático HEAD TIG • Samuel Costa" vira Samuel Costa (com "Tático HEAD TIG" pequeno embaixo)
function nomeZap(n) {
  const limpo = (t) => String(t || "").replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu, "").replace(/\s+/g, " ").trim();
  const partes = String(n || "").split("•");
  if (partes.length > 1) return { nome: limpo(partes.pop()), sub: limpo(partes.join(" ")) };
  return { nome: limpo(n), sub: "" };
}
function zapHTML(h) {
  const zp = s.zap, ped = zp?.pedido, modo = s.zapModo || "trabalho", it = (zp?.itens || []).filter(zapNoModo);
  const esp = it.filter((z) => z.precisa && !z.visto), vistos = it.filter((z) => z.precisa && z.visto), resto = it.filter((z) => !z.precisa);
  const br = ped?.briefing || {}, imp = modo === "pessoal" ? [["", br.pessoal]] : modo === "tudo" ? [["Trabalho", br.trabalho], ["Pessoal", br.pessoal]] : [["", br.trabalho]];
  const nov = (M.sugestoes || []).filter((x) => x.tipo === "nova");
  const estado = !ped ? "Ainda não li. Toque em Atualizar." : zapRodando() ? `<span class="ao-vivo"><i></i></span> Lendo o WhatsApp… uns 2 minutos.` : ped.status === "erro" ? `Deu erro: ${esc((ped.erro || "").slice(0, 120))}` : `Atualizado ${quandoFoi(ped.feito_em)}`;
  const linha6 = (z, forte) => { const nm = nomeZap(z.conversa), ab = s.zapAberto === z.id, u = z.ultima || {};
    return `<div class="z6 ${forte ? "forte" : ""} ${z.urgencia === "alta" && forte ? "alta" : ""} ${z.visto ? "visto" : ""}">
      <button type="button" class="z6l" data-zapabre="${z.id}" aria-expanded="${ab}"><span class="z6av">${z.grupo ? "👥" : ini(nm.nome)}</span>
        <span class="z6t"><b>${z.prioritario ? "⭐ " : ""}${esc(nm.nome)}</b>${nm.sub ? `<small>${esc(nm.sub)}</small>` : ""}<span class="z6r">${esc(forte ? z.pede || z.resumo || "" : z.resumo || "")}</span></span>
        <span class="z6q">${forte && z.espera_desde ? quandoFoi(z.espera_desde) : z.n + " msg"}</span></button>
      ${ab ? `<div class="z6d">${forte && z.resumo ? `<p>${esc(z.resumo)}</p>` : ""}<p class="z6u"><small>Última · ${esc(u.quem || "")} · ${esc(u.em || "")}</small>${esc((u.txt || "").slice(0, 300))}</p>
        ${forte ? `<div class="rapidas3"><button class="chip" type="button" data-zapvisto="${z.id}">${z.visto ? "↺ Voltar para pendentes" : "✓ Já respondi"}</button><button class="chip" type="button" data-zaprota="${z.id}">🗺️ Virar rota</button></div>` : ""}</div>` : ""}</div>`; };
  const vis = s.zapTodas ? resto : resto.slice(0, 10);
  const sugs = modo === "pessoal" ? [] : nov, sugVis = s.zapSugTodas ? sugs : sugs.slice(0, 6);
  const negrito = (x) => { const i = x.indexOf(": "); return i > 0 && i < 60 ? `<b>${esc(x.slice(0, i))}</b>${esc(x.slice(i))}` : esc(x); };
  const impl = imp.flatMap(([tt, l]) => (l || []).map((x) => [tt, x])), impVis = s.zapImpTudo ? impl : impl.slice(0, 3);
  const sugHTML = (x) => { const [tit, ...resto_] = rotaTxt(x.texto).split("\n"), cit = resto_.join(" ").replace(/^[“"]|[”"]$/g, "").trim(), nm = nomeZap(x.conversa || "");
    return `<div class="z7s"><div class="z7st"><b>${esc(tit)}</b>${cit ? `<q>${esc(cit)}</q>` : ""}<small>${esc(x.quem || "")}${nm.nome && nm.nome !== x.quem ? " · " + esc(nm.nome) : ""}${x.quando ? " · " + esc(x.quando) : ""}</small></div>
      <div class="z7sa"><button class="btn turq peq" type="button" data-sug="${x.id}" data-sugacao="rota">＋ Virar rota</button><button class="lk" type="button" data-sug="${x.id}" data-sugacao="descartar">Descartar</button></div></div>`; };
  const conta = (n, txt, alvo, cls) => `<button type="button" class="z7c ${cls} ${n ? "" : "zero"}" data-zapir="${alvo}"><b>${n}</b><span>${txt}</span></button>`;
  return `<div class="z6tela">${h}
    <div class="z6top"><div class="seg5" role="group" aria-label="O que ver">${[["trabalho", "💼 Trabalho"], ["pessoal", "🏠 Pessoal"], ["tudo", "Tudo"]].map(([k, n]) => `<button type="button" data-zapmodo="${k}" aria-pressed="${modo === k}">${n}</button>`).join("")}</div>
      <span class="z6est">${estado}</span><span class="espaco"></span>
      <button class="btn turq peq" type="button" data-zapler="" ${zapRodando() ? "disabled" : ""}>📡 Atualizar</button><button class="lk" type="button" data-zapler="168" ${zapRodando() ? "disabled" : ""} title="Lê todas as conversas dos últimos 7 dias">🧹 Limpeza geral</button></div>
    ${ped?.status === "feito" ? `
    <div class="z7conta">${conta(esp.length, esp.length === 1 ? "esperando você" : "esperando você", "z-esp", "esp")}${modo !== "pessoal" ? conta(sugs.length, sugs.length === 1 ? "pode virar rota" : "podem virar rota", "z-sug", "sug") : ""}${conta(resto.length, "conversas com movimento", "z-conv", "")}</div>
    ${impl.length ? `<section class="z6sec"><h4>📰 O que importa</h4><ul class="z7imp">${impVis.map(([tt, x]) => `<li>${tt && modo === "tudo" ? `<span class="z7tag">${tt}</span>` : ""}${negrito(x)}</li>`).join("")}</ul>${impl.length > impVis.length ? `<button class="lk" type="button" data-acao="zap-imp-tudo">Ver mais ${impl.length - impVis.length}</button>` : ""}</section>` : ""}
    <section class="z6sec" id="z-esp"><div class="f4h"><h4>⏳ Esperando você · ${esp.length}</h4>${esp.length > 1 ? `<button class="lk" type="button" data-acao="zap-todas">✓ Marcar todas</button>` : ""}</div>
      ${esp.map((z) => linha6(z, true)).join("") || '<p class="nota" style="margin:0">Ninguém esperando resposta. 🎉</p>'}
      ${vistos.length ? `<details><summary class="nota" style="cursor:pointer">Já respondidas · ${vistos.length}</summary>${vistos.map((z) => linha6(z, true)).join("")}</details>` : ""}</section>
    ${modo !== "pessoal" ? `<section class="z6sec z7sug" id="z-sug"><h4>🗺️ Pode virar rota · ${sugs.length}</h4><p class="nota" style="margin:0 0 8px">O ALFY achou nas conversas. Vira rota com um toque (você revisa antes de salvar) ou descarta.</p>
      ${sugVis.map(sugHTML).join("") || '<p class="nota" style="margin:0">Nada novo para virar rota.</p>'}${sugs.length > sugVis.length ? `<button class="lk" type="button" data-acao="zap-sug-todas">Ver mais ${sugs.length - sugVis.length}</button>` : ""}</section>` : ""}
    <section class="z6sec" id="z-conv"><h4>💬 Conversas · ${resto.length}</h4>${vis.map((z) => linha6(z)).join("") || '<p class="nota" style="margin:0">Nada novo.</p>'}${resto.length > vis.length ? `<button class="lk" type="button" data-acao="zap-ver-todas">Ver mais ${resto.length - vis.length}</button>` : ""}</section>` : ""}</div>`;
}
// ---------------------------------------------------------------- feed
const EV_IC = { comentario: "💬", orientacao: "🧭", whatsapp: "📱", status: "🔀", nova: "🗺️", ideia: "💡", editar: "✏️", budget: "💰", pauta_ligar: "🗓️", reuniao_ligar: "🗓️", pauta_desligar: "🗓️", reuniao_desligar: "🗓️" };
const CAMPO_NOME = { titulo: "o título", prioridade: "a prioridade", prazo: "o prazo", frente: "a frente", natureza: "a natureza", tipo: "o tipo", impacto: "o impacto", esforco: "o esforço", responsavel_id: "o responsável", co_responsavel_id: "o co-responsável", assist: "o O que fazer", instrucoes: "as Instruções", resultado: "o Resultado esperado", como_esta: "o Como está agora", detalhamento: "o detalhamento", como_fazer: "o como fazer" };
function evTexto(e) {
  const d = e.dados || {};
  if (e.tipo === "status") return d.nova ? "lançou a rota" : `moveu para ${ST[e.para]?.nome || e.para}`;
  if (e.tipo === "nova" || e.tipo === "ideia") return "lançou a ideia";
  if (e.tipo === "editar") return "editou " + Object.keys(d.campos || {}).map((k) => CAMPO_NOME[k] || k).join(", ");
  if (e.tipo === "budget") return `${d.status === "aprovado" ? "aprovou" : d.status === "recusado" ? "recusou" : "marcou como " + d.status} o budget${d.valor ? " de " + d.valor : ""}`;
  if (e.tipo === "pauta_ligar") return `levou para a pauta ${d.titulo || ""}`;
  if (e.tipo === "reuniao_ligar") return `levou para a reunião ${d.titulo || ""}`;
  if (e.tipo === "pauta_desligar" || e.tipo === "reuniao_desligar") return `tirou da ${e.tipo.startsWith("pauta") ? "pauta" : "reunião"} ${d.titulo || ""}`;
  return e.tipo;
}
function vistaFeed() {
  if (!FEED) return `<div class="carregando">Carregando o feed…</div>`;
  const grupoTipo = (t) => (t.startsWith("pauta") || t.startsWith("reuniao") ? "pauta" : t === "ideia" ? "nova" : t);
  const l = FEED.filter((e) => {
    const r = rotaDe(e.rt);
    if (s.fFeed !== "todos" && grupoTipo(e.tipo) !== s.fFeed) return false;
    if (s.pessoa && !(r && (r.responsavel_id === s.pessoa || r.co_responsavel_id === s.pessoa)) && e.quem !== nomeDe(s.pessoa)) return false;
    if (s.frente && !(r && r.frente === s.frente)) return false;
    if (s.busca && !((e.texto || "") + " " + (r?.titulo || "") + " " + nomeRota(e.rt)).toLowerCase().includes(s.busca.toLowerCase())) return false;
    return true;
  });
  if (!l.length) return `<div class="vazio">Nada por aqui com esses filtros.</div>`;
  let d0 = "";
  return `<div class="feed">${l.map((e) => {
    const r = rotaDe(e.rt), d = dia(e.em), cab = d !== d0 ? ((d0 = d), `<div class="dia">${d === hojeDia() ? "Hoje" : ddmm(e.em)}</div>`) : "";
    const fala = ["comentario", "orientacao", "whatsapp"].includes(e.tipo);
    const verbo = { comentario: "comentou", orientacao: "deu uma orientação", whatsapp: "respondeu pelo WhatsApp" }[e.tipo];
    return cab + `<button type="button" class="ev" data-rt="${e.rt}"><span class="ic-ev">${EV_IC[e.tipo] || "•"}</span><span class="c"><span class="l1"><b>${esc(curto(e.quem))}</b> ${fala ? verbo : esc(evTexto(e))}</span>${fala ? `<p>${esc((e.texto || "").slice(0, 400))}</p>` : ""}<span class="rr">${esc(nomeRota(e.rt))}${r ? " · " + esc(r.titulo) + " · " + esc(frenteCurta(r.frente)) : ""}</span></span><small class="hh">${hhmm(e.em)}</small></button>`;
  }).join("")}</div>`;
}

// ---------------------------------------------------------------- pautas e reuniões
const reuniaoDe = (id) => M?.reunioes?.find((x) => x.id === id);
const quandoReuniao = (re) => re.quando ? new Date(re.quando).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: FUSO }) + " · " + hhmm(re.quando) : "sem data";
function linhaPauta(p) {
  const re = reuniaoDe(p.reuniao_id);
  return `<button type="button" class="linha2" data-pauta="${p.id}"><span class="tag ideia" style="width:50px"><small>PAUTA</small><b>${p.id}</b></span><span class="tt"><b>${esc(p.titulo)}</b>${p.detalhe ? `<span class="res">${esc(p.detalhe)}</span>` : ""}<span class="meta2"><span>${PTIPO[p.tipo] || p.tipo}</span><span>${PST[p.status]}</span>${p.frente ? `<span>${esc(frenteCurta(p.frente))}</span>` : ""}${p.msgs ? `<span style="color:var(--turq)">💬 ${p.msgs}</span>` : ""}${p.rotas.length ? `<span>🔗 ${p.rotas.map(nomeRota).join(", ")}</span>` : ""}${re ? `<span style="color:var(--amber)">🗓️ ${esc(re.titulo)}</span>` : `<span>sem reunião</span>`}</span></span></button>`;
}
function vistaPautas() {
  if (s.pauta) return pautaDet();
  if (s.reuniao) {
    const base = reuniaoDe(s.reuniao) || (s.reuniaoDet && s.reuniaoDet.id === s.reuniao ? { ...s.reuniaoDet, rotas: s.reuniaoDet.rotas || [] } : null);
    if (!base) { if (!s.carregandoReuniao) { s.carregandoReuniao = true; carregarReuniao().then(() => { s.carregandoReuniao = false; if (!s.reuniaoDet || s.reuniaoDet.id !== s.reuniao) s.reuniao = null; renderSeguro(); }); } return '<div class="carregando">Abrindo a reunião…</div>'; }
    return reuniaoDet(base);
  }
  const seg = `<div class="alterna" role="group" style="margin-bottom:14px"><button type="button" data-pvista="reunioes" aria-pressed="${s.pvista === "reunioes"}">Reuniões · ${(M.reunioes || []).filter((x) => x.status !== "encerrada").length}</button><button type="button" data-pvista="pautas" aria-pressed="${s.pvista === "pautas"}">Pautas · ${(M.pautas || []).filter((x) => x.status === "aberta").length}</button></div>`;
  if (s.pvista === "reunioes") {
    const rs = (M.reunioes || []).filter((x) => x.status !== "encerrada");
    if (!s.histReunioes && !s.carregandoHist) { s.carregandoHist = true; chamar("alfy_reunioes_historico").then((h) => { s.histReunioes = h || []; s.carregandoHist = false; renderSeguro(); }); }
    const hist = s.histReunioes || [];
    const soltas = (M.pautas || []).filter((p) => !p.reuniao_id && p.status === "aberta");
    return seg + `<div class="pl" style="max-width:860px">${rs.map((re) => { const np = (M.pautas || []).filter((p) => p.reuniao_id === re.id).length; return `<button type="button" class="placa rebites" data-reuniao="${re.id}"><b>${esc(re.titulo)}</b><span>${quandoReuniao(re)}${re.onde ? " · " + esc(re.onde) : ""} · ${RST[re.status]} · ${re.rotas.length} rotas · ${np} pautas</span></button>`; }).join("") || '<div class="vazio">Nenhuma reunião marcada. Use ＋ Nova reunião.</div>'}
      ${hist.length ? `<section class="grupo" style="margin-top:18px"><h2>📚 Histórico de reuniões<span class="ct">${hist.length}</span></h2><div class="pl">${hist.map((re) => `<button type="button" class="placa" data-reuniao="${re.id}" style="opacity:.92"><b>🏁 ${esc(re.titulo)}</b><span>${quandoReuniao(re)}${re.onde ? " · " + esc(re.onde) : ""} · ${re.tem_ata ? `ata com ${re.decisoes} ${re.decisoes === 1 ? "decisão" : "decisões"}` : "sem ata"}</span>${re.resumo ? `<span style="display:block;margin-top:4px;color:var(--aco-2)">${esc(re.resumo).slice(0, 220)}</span>` : ""}</button>`).join("")}</div></section>` : ""}
      ${soltas.length ? `<section class="grupo" style="margin-top:18px"><h2>Pautas esperando reunião<span class="ct">${soltas.length}</span></h2><div class="lista">${soltas.map(linhaPauta).join("")}</div></section>` : ""}
      <p class="nota">Uma reunião trata rotas e pautas. Pauta é um tópico para decidir, conversar ou compartilhar, como "qual motor comprar". Ela pode ter rotas ligadas, mas não precisa.</p></div>`;
  }
  const grupos = ["aberta", "decidida", "tratada"].map((st) => { const l = (M.pautas || []).filter((p) => p.status === st); return l.length ? `<section class="grupo"><h2>${PST[st]}<span class="ct">${l.length}</span></h2><div class="lista">${l.map(linhaPauta).join("")}</div></section>` : ""; }).join("");
  return seg + (grupos || '<div class="vazio">Nenhuma pauta ainda. Use ＋ Nova pauta.</div>');
}
function buscaRotaHTML(alvo) {
  return `<input class="busca" style="width:100%" placeholder="Buscar rota para ligar (número ou assunto)" data-buscarota="${alvo}" value="${esc(s.buscaRota || "")}"><div class="busca-rotas" id="res-busca-rota">${resultadoBuscaRota(alvo)}</div>`;
}
function resultadoBuscaRota(alvo) {
  const q = (s.buscaRota || "").trim().toLowerCase();
  if (q.length < 2) return "";
  return (M.rotas || []).filter((r) => (nomeRota(r.rt) + " " + r.titulo).toLowerCase().includes(q)).slice(0, 8)
    .map((r) => `<button type="button" class="linha2" data-ligar="${alvo}" data-lrt="${r.rt}">${tag(r)}<span class="tt"><b>${esc(r.titulo)}</b></span></button>`).join("") || '<div class="vazio">Nenhuma rota com isso</div>';
}
function reuniaoDet(re) {
  if (!re) { s.reuniao = null; return vistaPautas(); }
  const pautas = (M.pautas || []).filter((p) => p.reuniao_id === re.id);
  const rotas = re.rotas.map(rotaDe).filter(Boolean);
  const pode = manda(), participa = comando() || re.gente.includes(eu().id), det = s.reuniaoDet && s.reuniaoDet.id === re.id ? s.reuniaoDet : null;
  if (!det && !s.carregandoReuniao) { s.carregandoReuniao = true; carregarReuniao().then(() => { s.carregandoReuniao = false; renderSeguro(); }); }
  return `<div class="pd" style="max-width:900px"><div class="placa rebites cab-p"><button class="btn peq" type="button" data-acao="pautas-voltar">‹ Reuniões</button>
      <h2>${esc(re.titulo)}</h2><div class="q">${quandoReuniao(re)}${re.onde ? " · " + esc(re.onde) : ""}</div><div class="alvos" style="margin:8px 0 0">${re.gente.map((g) => `<span class="chip">👤 ${esc(nomeDe(g))}</span>`).join("")}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${re.status === "encerrada" ? `<span class="chip" aria-pressed="true" style="margin-top:10px">🏁 Encerrada${det?.encerrada_em || re.encerrada_em ? " em " + ddmm(det?.encerrada_em || re.encerrada_em) : ""}</span>` : `<div class="st3">${[["marcada", "Marcada"], ["acontecendo", "Acontecendo"]].map(([k, n]) => `<button type="button" data-rst="${k}" aria-pressed="${re.status === k}" ${pode ? "" : "disabled"}>${n}</button>`).join("")}</div>${pode ? `<button class="btn turq peq" type="button" data-acao="encerrar-reuniao" style="margin-top:10px">🏁 Encerrar reunião</button><button class="btn peq" type="button" data-acao="editar-reuniao" style="margin-top:10px">Editar</button>` : ""}`}</div>
      ${s.confirmaEncerrar === re.id ? (() => { const ps = (M.pautas || []).filter((p) => p.reuniao_id === re.id), dec = ps.filter((p) => p.status === "decidida" || p.status === "tratada").length, aberta = ps.filter((p) => p.status === "aberta").length; return `<div class="campo" style="margin-top:12px;border-color:var(--turq)"><p class="txt" style="font-size:15px">Ao encerrar: ${dec} ${dec === 1 ? "pauta decidida fica encerrada" : "pautas decididas ficam encerradas"}${aberta ? ` e ${aberta} ainda em discussão ${aberta === 1 ? "volta" : "voltam"} para a próxima reunião` : ""}. A reunião vai para o histórico.</p><label style="display:flex;gap:8px;align-items:center;margin:8px 0;font-size:14px"><input type="checkbox" id="enc-ata" ${re.ata ? "" : "checked"}> 🐙 O ALFY escreve a ata (com a gravação, se houver)</label><div style="display:flex;gap:8px"><button class="btn turq peq" type="button" data-acao="confirmar-encerrar">Encerrar agora</button><button class="btn peq" type="button" data-acao="cancelar-encerrar">Cancelar</button></div></div>`; })() : ""}</div>
    <div class="bloco"><h3>Rotas da reunião <span class="ct">${rotas.length}</span></h3><div class="lista">${rotas.map((r) => linha(r)).join("") || '<div class="vazio">Nenhuma rota ligada</div>'}</div>${pode ? buscaRotaHTML("reuniao") : ""}</div>
    <div class="bloco"><h3>Pautas da reunião <span class="ct">${pautas.length}</span></h3><div class="lista">${pautas.map(linhaPauta).join("") || '<div class="vazio">Nenhuma pauta ainda. Qualquer participante pode lançar.</div>'}</div>${participa ? '<div style="margin-top:10px"><button class="btn" type="button" data-acao="nova-pauta-reuniao">＋ Lançar pauta nesta reunião</button></div>' : ""}</div>
    ${participa ? ataHTML(re, det) : ""}</div>`;
}
function pautaDet() {
  const p = s.pautaDet;
  if (!p) return `<div class="carregando">Abrindo a pauta…</div>`;
  const pode = manda(), ops = p.opcoes || [];
  return `<div class="pd" style="max-width:900px"><div class="placa rebites cab-p"><button class="btn peq" type="button" data-acao="pautas-voltar">‹ Voltar</button>
      <h2>${esc(p.titulo)}</h2><div class="q">${PTIPO[p.tipo]} · trazida por ${esc(curto(nomeDe(p.criado_por)))}${p.frente ? " · " + esc(frenteCurta(p.frente)) : ""}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">${p.status === "tratada" ? `<span class="chip" aria-pressed="true" style="margin-top:10px">✅ Encerrada${p.encerrada_em ? " em " + ddmm(p.encerrada_em) : ""}</span>${pode ? '<button class="btn peq" type="button" data-acao="reabrir-pauta" style="margin-top:10px">Reabrir</button>' : ""}` : `<div class="st3">${[["aberta", "Em discussão"], ["decidida", "Decidida"]].map(([k, n]) => `<button type="button" data-pst="${k}" aria-pressed="${p.status === k}" ${pode ? "" : "disabled"}>${n}</button>`).join("")}</div>${pode ? '<button class="btn turq peq" type="button" data-acao="encerrar-pauta" style="margin-top:10px">✅ Encerrar pauta</button><button class="btn peq" type="button" data-acao="editar-pauta" style="margin-top:10px">Editar</button><button class="btn peq" type="button" data-pst="arquivada" style="margin-top:10px">Arquivar</button>' : ""}`}</div>
      ${s.encerrandoPauta === p.id ? `<div class="campo" style="margin-top:12px;border-color:var(--turq)"><div class="cab-campo"><b>Como terminou</b></div><textarea id="pauta-fim" rows="3" placeholder="A decisão ou a conclusão. Ex.: fechamos o motor 300; o Rafael compra até sexta.">${esc(p.decisao || "")}</textarea><div style="display:flex;gap:8px;margin-top:8px"><button class="btn turq peq" type="button" data-acao="confirmar-pauta">Encerrar pauta</button><button class="btn peq" type="button" data-acao="cancelar-pauta">Cancelar</button></div></div>` : ""}</div>
    <div class="bloco"><h3>Do que se trata</h3><p style="margin:0;font-size:15px;line-height:1.55;white-space:pre-wrap">${esc(p.detalhe || "Sem descrição.")}</p>
      ${ops.length || pode ? `<p class="rotulo" style="margin-top:14px">Opções na mesa</p><div class="alvos">${ops.map((o, i) => `<button class="chip" type="button" data-opcao="${i}" aria-pressed="${p.escolha === i}">${esc(o)}${pode ? `<span class="opcao-x" data-tiraopcao="${i}" role="button" aria-label="Tirar opção">✕</span>` : ""}</button>`).join("")}${pode ? '<button class="chip" type="button" data-acao="nova-opcao">＋ opção</button>' : ""}</div>` : ""}
      ${p.decisao ? `<div class="campo" style="margin-top:10px;border-color:#2A5A47"><div class="cab-campo"><b style="color:var(--foam)">✅ Decisão</b></div><p class="txt">${esc(p.decisao)}</p></div>` : ""}</div>
    <div class="bloco"><h3>Em qual reunião vai ser tratada</h3>${(M.reunioes || []).filter((x) => x.status !== "encerrada").length ? `<div class="alvos" style="margin:0">${(M.reunioes || []).filter((x) => x.status !== "encerrada").map((x) => `<button class="chip" type="button" data-levar="${p.reuniao_id === x.id ? 0 : x.id}" aria-pressed="${p.reuniao_id === x.id}" ${pode ? "" : "disabled"}>🗓️ ${esc(x.titulo)} · ${quandoReuniao(x)}</button>`).join("")}</div><p class="nota">Toque numa reunião para levar esta pauta para ela; toque de novo para tirar.</p>` : `<p style="margin:0 0 8px;color:var(--aco-2)">Nenhuma reunião marcada ainda.</p>`}${pode ? '<button class="btn peq" type="button" data-acao="nova-reuniao" style="margin-top:8px">＋ Marcar reunião</button>' : ""}</div>
    <div class="bloco"><h3>Rotas ligadas <span class="ct">${p.rotas.length}</span></h3><div class="lista">${p.rotas.map(rotaDe).filter(Boolean).map((r) => linha(r)).join("") || '<div class="vazio">Nenhuma rota. Pauta não precisa ter rota.</div>'}</div>${pode ? buscaRotaHTML("pauta") : ""}</div>
    <div class="bloco"><h3>Discussão <span class="ct">${p.conversa.length}</span></h3>
      <div>${p.conversa.map((m) => `<div class="topico"><span class="tk ${m.tipo === "partilha" ? "comentario" : m.tipo}">${MSG_TIPO[m.tipo]}</span><div class="c"><p style="white-space:pre-wrap">${esc(m.texto)}</p><small>${esc(curto(m.quem))} · ${quandoFoi(m.em)}${m.rt_gerada ? ` · virou <b>${esc(nomeRota(m.rt_gerada))}</b>` : ""}</small></div>${pode && !m.rt_gerada && m.tipo !== "comentario" ? `<button class="btn peq" type="button" data-msgrota="${m.id}">Virar rota</button>` : ""}</div>`).join("") || '<div class="vazio">Comece a discussão</div>'}</div>
      <form class="compor" id="f-msg"><div class="tipos">${Object.entries(MSG_TIPO).map(([k, n]) => `<button class="chip" type="button" data-tmsg="${k}" aria-pressed="${s.tipoMsg === k}">${n}</button>`).join("")}</div>
      <div class="linha-c"><input id="t-msg" placeholder="${s.tipoMsg === "decisao" ? "Escreva a decisão" : s.tipoMsg === "partilha" ? "O que quer compartilhar (link, novidade)" : "Escreva aqui"}" autocomplete="off"><button class="btn turq" type="submit">Adicionar</button></div></form></div>
    ${comando() ? `<div class="ia-painel"><div class="t">🐙 ALFY nesta pauta</div><div class="rap">${["Resuma a discussão em até 5 linhas", "Liste prós e contras de cada opção com o que foi dito", "O que falta saber para decidir, e com quem"].map((t) => `<button type="button" data-iapauta="${esc(t)}">${esc(t)}</button>`).join("")}</div>
      <div class="chat">${(p.ia || []).map((m) => `<div class="m ${m.papel === "user" ? "eu" : "alfy"}">${esc(m.texto)}</div>`).join("")}${s.esperando["pauta:" + p.id] ? '<div class="m alfy">🐙 pensando…</div>' : ""}</div></div>` : ""}</div>`;
}

// ---------------------------------------------------------------- Mapa de Rotas do WhatsApp (formato oficial de 28/10, com "Rota N")
const LEGENDA = (ex) => `*STATUS:* 🔴 Não iniciada · 🟡 Em andamento · 🟠 Parada · 🟢 Concluída\n*PRIORIDADE:* 🚨 P1 urgente, 24h · ⚡ P2 até 3 dias · ⏳ P3 até 7 dias · 💤 P4 até 30 dias · ⏸️ P5 sem prazo\n\n*COMO RESPONDER:*\nnúmero da rota + comentário\nEx.: ${ex} já liguei, aguardando retorno`;
const SITUACAO = { andamento: "em andamento", pausada: "parada" };
function blocoMapa(r, quem) {
  const partes = [`${ST[r.status].bola} *${nomeRota(r.rt)}*`];
  if (pcod(r.prioridade)) partes.push(prioTxt(r.prioridade));
  if (SITUACAO[r.status]) partes.push(SITUACAO[r.status]);
  else if (pcod(r.prioridade) === "P5" || !r.prazo) partes.push("sem prazo");
  else partes.push(`${dias(r.prazo) < 0 ? "venceu" : "até"} *${ddmm(r.prazo)}*`);
  if (quem) partes.push(`👤 ${quem}`);
  let t = (r.assist || r.titulo).trim().replace(/\.+$/, "");
  if (!/[?!]$/.test(t)) t += ".";
  return partes.join(" · ") + "\n" + t;
}
const contagem = (l) => { const v = l.filter(vencida).length, n = l.length; return `${n} rota${n !== 1 ? "s" : ""} aberta${n !== 1 ? "s" : ""}` + (v ? `, ${v} vencida${v !== 1 ? "s" : ""}` : ""); };
const mapeavel = (r) => ABERTOS.includes(r.status) && !ehNova(r) && !r.rt.startsWith("IDEIA-") && r.frente !== "🧍 Pessoal" && r.tipo !== "📅 Compromisso" && !r.inicio && !ehRotina(r) && !/\b[Rr]otina\b/.test(r.titulo);
// rotinas abertas entram no mapa numa parte própria
const rotinasMapa = (filtro) => (M.rotas || []).filter((r) => ehRotina(r) && ABERTOS.includes(r.status) && r.frente !== "🧍 Pessoal" && filtro(r)).sort((x, y) => (x.prazo || "9").localeCompare(y.prazo || "9"));
function blocoRotina(r, quem) {
  const partes = [`🔁 *${nomeRota(r.rt)}*`, REPETE_TXT[r.repete].toLowerCase()];
  partes.push(r.prazo && r.repete !== "sob_demanda" ? `${dias(r.prazo) < 0 ? "venceu" : "até"} *${ddmm(r.prazo)}*` : "quando precisar");
  if (quem) partes.push(`👤 ${quem}`);
  let t = (r.assist || r.titulo).trim().replace(/\.+$/, ""); if (!/[?!]$/.test(t)) t += ".";
  return partes.join(" · ") + "\n" + t;
}
const dataHoje = () => new Date().toLocaleDateString("pt-BR", { timeZone: FUSO });
function mapaPessoa(id, soVencidas) {
  const p = pessoa(id);
  let minhas = (M.rotas || []).filter((r) => mapeavel(r) && r.responsavel_id === id).sort(ordPrio);
  if (soVencidas) minhas = minhas.filter(vencida);
  // 04/11 (Miguel): o mapa da pessoa traz só as rotas dela; o que é da equipe vai pelo mapa do grupo ou do setor
  const time = [];
  const l = ["🗺️ *Mapa de Rotas*", "", `👤 *${p?.nome || ""}*`, `📅 ${dataHoje()} · ${contagem(minhas)}`, "", soVencidas ? "*SUAS ROTAS VENCIDAS:*" : "*SUAS ROTAS:*", ""];
  minhas.forEach((r) => l.push(blocoMapa(r), ""));
  if (!minhas.length) l.push(soVencidas ? "Nenhuma rota vencida com você agora." : "Nenhuma rota aberta com você agora.", "");
  const rotinas = rotinasMapa((r) => r.responsavel_id === id).filter((r) => !soVencidas || vencida(r));
  if (rotinas.length) { l.push("*SUAS ROTINAS:*", ""); rotinas.forEach((r) => l.push(blocoRotina(r), "")); }
  if (time.length) { l.push("*DA SUA EQUIPE (para acompanhar e cobrar):*", ""); time.forEach((r) => l.push(blocoMapa(r, curto(nomeDe(r.responsavel_id))), "")); }
  l.push(LEGENDA(num((minhas[0] || time[0] || { rt: "RT-374" }).rt)));
  return { n: minhas.length + time.length, txt: l.join("\n") };
}
function mapaGrupo(ids) {
  const rotas = (M.rotas || []).filter((r) => mapeavel(r) && ids.includes(r.responsavel_id));
  const nomes = ids.map((id) => curto(nomeDe(id)));
  const titulo = nomes.length > 1 ? nomes.slice(0, -1).join(", ") + " e " + nomes[nomes.length - 1] : nomes[0] || "";
  const l = ["🗺️ *Mapa de Rotas*", "", `👥 *${titulo}*`, `📅 ${dataHoje()} · ${contagem(rotas)}`, ""];
  ids.forEach((id) => { const rs = rotas.filter((r) => r.responsavel_id === id).sort(ordPrio), rn = rotinasMapa((r) => r.responsavel_id === id); if (!rs.length && !rn.length) return; l.push(`👤 *${nomeDe(id)}*`, ""); rs.forEach((r) => l.push(blocoMapa(r), "")); rn.forEach((r) => l.push(blocoRotina(r), "")); });
  if (!rotas.length) l.push("Nenhuma rota aberta com essas pessoas agora.", "");
  l.push(LEGENDA(num((rotas[0] || { rt: "RT-374" }).rt)));
  return { n: rotas.length, txt: l.join("\n") };
}
function mapaSetor(frente) {
  const rotas = (M.rotas || []).filter((r) => mapeavel(r) && r.frente === frente);
  const ger = gerenteDe(frente);
  const ids = [...new Set(rotas.map((r) => r.responsavel_id || ""))];
  const ehMiguel = (id) => pessoa(id)?.papel === "comando";
  ids.sort((a, b) => (a === ger?.id ? -1 : b === ger?.id ? 1 : 0) || (ehMiguel(a) ? 1 : ehMiguel(b) ? -1 : 0) || nomeDe(a).localeCompare(nomeDe(b)));
  const l = ["🗺️ *Mapa de Rotas*", "", `*${frente}*`, `📅 ${dataHoje()} · ${contagem(rotas)}`, ""];
  ids.forEach((id) => { l.push(ehMiguel(id) ? "*COMIGO (Miguel):*" : `👤 *${nomeDe(id) || "Sem responsável"}*`, ""); rotas.filter((r) => (r.responsavel_id || "") === id).sort(ordPrio).forEach((r) => l.push(blocoMapa(r), "")); });
  if (!rotas.length) l.push("Nenhuma rota aberta nesta frente agora.", "");
  l.push(LEGENDA(num((rotas[0] || { rt: "RT-374" }).rt)));
  return { n: rotas.length, txt: l.join("\n") };
}
const rotaTxt = (t) => String(t || "").replace(/\bRT[-\s]?(\d{2,4})\b/g, "Rota $1");
// "hoje 14:32", "ontem 18:10", "anteontem 09:05", depois "há 5 dias"
function ultTxt(iso) {
  const n = -dias(iso);
  if (n <= 0) return { txt: "hoje " + hhmm(iso), cls: "u-hoje" };
  if (n === 1) return { txt: "ontem " + hhmm(iso), cls: "" };
  if (n === 2) return { txt: "anteontem " + hhmm(iso), cls: "" };
  return { txt: `há ${n} dias`, cls: n >= 7 ? "u-parada" : "u-morna" };
}
function ultLinha(r) {
  if (!r.ult?.em) return "";
  const u = ultTxt(r.ult.em), q = r.ult.quem;
  return `<span class="ult ${u.cls}" title="Última atualização ${u.txt}${q ? " por " + esc(q) : ""}">🕘 ${u.txt}${q ? `<span class="ult-av">${q === "ALFY" ? "🐙" : esc(ini(q))}</span>` : ""}</span>`;
}
const tamanhoTxt = (b) => (b > 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
const zap = (t) => esc(t).replace(/\*([^*\n]+)\*/g, "<b>$1</b>");

// mensagem pronta do ALFY para alguém: vem entre ---MENSAGEM--- e ---FIM---, assinada "🐙 Alfy" (o ALFY não finge ser o Miguel, pedido de 05/11); vira balão com Copiar
const ASSINA = "🐙 Alfy", MSGS = [];
const assinar = (t) => (String(t || "").trimStart().startsWith(ASSINA) ? String(t).trim() : `${ASSINA}\n\n${String(t || "").trim()}`);
function textoAlfy(t) {
  const partes = String(t || "").split(/---MENSAGEM---\s*\n([\s\S]*?)\n\s*---FIM---/);
  if (partes.length === 1) return String(t || "").trimStart().startsWith(ASSINA) ? msgBalao(t) : `<p>${esc(t)}</p>`;
  return partes.map((x, i) => (i % 2 ? msgBalao(x) : x.trim() ? `<p>${esc(x.trim())}</p>` : "")).join("");
}
const soMsgs = (t) => { const l = [...String(t || "").matchAll(/---MENSAGEM---\s*\n([\s\S]*?)\n\s*---FIM---/g)].map((m) => assinar(m[1])); return l.length ? l.join("\n\n") : String(t || ""); };
function msgBalao(x) {
  const txt = assinar(x); let i = MSGS.indexOf(txt); if (i < 0) i = MSGS.push(txt) - 1;
  return `<div class="msg6"><button class="msg6c" type="button" data-copiarbloco="${i}" title="Copiar a mensagem" aria-label="Copiar a mensagem">⧉</button><p>${zap(txt)}</p></div>`;
}
// ---------------------------------------------------------------- comandos (só o Miguel, por enquanto)
const CMDS = [
  { g: "Despejar", k: "despejo", n: "Despejo", faz: "Joga aqui o que vier na cabeça: texto, áudio gravado na hora, áudio ou arquivo. O ALFY separa em rota, pauta, arquivo ou lembrete.", quando: "quando você quiser", onde: "mac" },
  { g: "Ler", k: "zap", n: "📱 WhatsApp", faz: "O que rolou no seu WhatsApp desde a última vez: o que importa, quem está esperando resposta e cada conversa resumida. Trabalho, pessoal ou tudo.", quando: "quando você pedir", onde: "mac" },
  { g: "Ler", k: "email", n: "Ler o e-mail e a agenda", faz: "Lê a caixa miguel@ilha.tours e faz o mesmo que com o WhatsApp: retorno de rota e o que pode virar rota.", quando: "a cada 15 min", onde: "mac" },
  { g: "Mandar", k: "mapa", n: "Lançar o Mapa de Rotas", faz: "A mensagem oficial do Mapa de Rotas de uma pessoa, de um grupo ou de um setor, ou só as vencidas para cobrar, pronta para colar no WhatsApp.", quando: "na hora", onde: "nuvem" },
  { g: "Organizar", k: "bomdia", n: "📰 Resumos do dia", faz: "O seu dia numa tela (reuniões, o que vence hoje, o que venceu, quem respondeu) e os resumos que o ALFY escreve: Bom dia, Relatório do dia e Grupos hoje.", quando: "na hora", onde: "nuvem" },
  { g: "Pensar", k: "aprendi", n: "🧠 O que o ALFY aprendeu", faz: "Como você fala, instrui e decide, e como cada rota concluída foi resolvida. O ALFY usa isso em toda resposta. Apague o que estiver errado.", quando: "de 30 em 30 minutos", onde: "mac" },
  { g: "Pensar", k: "perguntar", n: "Perguntar ao ALFY", faz: "Pergunte qualquer coisa sobre as rotas e as pautas. O ALFY responde com os dados do painel.", quando: "quando você pedir", onde: "mac" },
];
const filaRodando = (tipo, escopo) => (M.fila || []).find((q) => q.tipo === tipo && (escopo === undefined || q.escopo === escopo) && (q.status === "fila" || q.status === "rodando"));
const ROTULO_FILA = { ia: "Pergunta ao ALFY", despejo: "Despejo", whatsapp: "Leitura do WhatsApp", ronda: "Ronda", virada: "Virada da semana", ata: "Ata da reunião", entender: "Leu um comentário", aprender: "Aprendeu com o uso", rastrear: "Rastreio de rota", rastrear_lote: "Passagem de Rotas", email: "E-mail" };
function filaHTML() {
  const f = M.fila || [];
  return `<div class="bloco"><h3>Fila do robô <span class="ct">${f.filter((q) => q.status === "fila" || q.status === "rodando").length}</span></h3><div class="fila">${f.slice(0, 7).map((q) => `<div class="it"><i style="background:${q.status === "feito" ? "var(--foam)" : q.status === "erro" ? "var(--verm)" : "var(--amber)"}"></i><span>${ROTULO_FILA[q.tipo] || q.tipo}${q.resumo ? ` · ${esc(q.resumo)}` : ""}${q.status === "erro" ? " · deu erro" : ""}</span><small>${q.status === "feito" || q.status === "erro" ? quandoFoi(q.feito_em) : q.status === "rodando" ? "rodando" : "na fila"}</small></div>`).join("") || '<div class="vazio">Nada na fila</div>'}</div>
    <p class="nota">💻 precisa do Mac do escritório ligado (o robô pega o pedido em segundos). ☁️ roda direto, sem o Mac.</p></div>`;
}
function vistaComandos() {
  if (!comando()) return `<div class="vazio">Por enquanto os comandos são só do Miguel.</div>`;
  if (!CMDS.some((x) => x.k === s.cmd)) s.cmd = s.cmd === "cobrar" ? (s.mapaModo = "cobrar", "mapa") : s.cmd === "diario" ? "bomdia" : s.cmd === "grupos" || s.cmd === "ronda" || s.cmd === "whatsapp" ? "zap" : "despejo";   // comandos que foram juntados
  const c = CMDS.find((x) => x.k === s.cmd);
  const grupos = ["Despejar", "Ler", "Mandar", "Organizar", "Pensar"].map((g) => `<section class="cmd-grupo"><h2>${g}</h2><div class="cmd-grade">${CMDS.filter((x) => x.g === g).map((x) => `<button type="button" class="placa rebites comando2" data-cmd="${x.k}" aria-pressed="${s.cmd === x.k}"><span class="l1"><span class="ic">${IC[x.k]}</span><b>${x.n}</b></span><span class="faz">${x.faz}</span><span class="onde"><span class="selo">⏱ ${x.quando}</span><span class="selo ${x.onde}">${x.onde === "mac" ? "💻 precisa do Mac" : "☁️ direto"}</span>${x.k === "zap" && (s.zap?.itens || []).some((z) => z.precisa && !z.visto) ? `<span class="selo novo">${s.zap.itens.filter((z) => z.precisa && !z.visto).length} esperando</span>` : ""}</span></button>`).join("")}</div></section>`).join("");
  return `${pulsoHTML()}<div class="painel-cmd cmd2"><div>${grupos}</div><div class="det-cmd" id="det-cmd">${detCmd(c)}${filaHTML()}</div></div>`;
}
function pulsoHTML() {
  const r = s.robo; if (!r) return "";
  const vivo = r.visto_em && Date.now() - new Date(r.visto_em) < 5 * 60000;
  return `<div class="pulso"><span><i style="background:${vivo ? "var(--foam)" : "var(--verm)"}"></i>💻 Robô do Mac: ${vivo ? "ligado" : "sem sinal" + (r.visto_em ? " desde " + quandoFoi(r.visto_em) : "") + " (o Mac do escritório está ligado?)"}</span>
    <span><i style="background:${r.ia_ok ? "var(--foam)" : "var(--amber)"}"></i>🐙 IA: ${r.ia_ok ? "ligada" : esc(r.ia_msg || "desligada")}</span>
    <span><i style="background:${r.email_em ? "var(--foam)" : "var(--aco)"}"></i>✉️ E-mail: ${r.email_em ? "recebido " + quandoFoi(r.email_em) : "ainda não ligado"}</span></div>`;
}
const SCRIPT_EMAIL = (chave) => `// ALFY · e-mail (só leitura) e Google Agenda (nos dois sentidos). Cole no script.google.com, salve e rode alfyInstalar uma vez.
const ALFY_URL = "https://tladwxithannxstbneon.supabase.co/rest/v1/rpc/alfy_email_receber";
const ALFY_CHAVE_PUBLICA = "${CHAVE_PUBLICA}";
const ALFY_SEGREDO = "${chave}";

function alfyEnviarEmails() {
  const props = PropertiesService.getScriptProperties();
  const ultima = Number(props.getProperty("ultima") || 0) || Date.now() - 24 * 3600 * 1000;
  const desde = Math.floor(ultima / 1000) - 120;
  const threads = GmailApp.search("in:inbox -category:promotions -category:social -category:forums after:" + desde, 0, 60);
  const lista = [];
  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      if (m.getDate().getTime() < ultima - 120000) return;
      lista.push({ id: m.getId(), conversa: t.getId(), de: m.getFrom(), para: m.getTo(), assunto: m.getSubject(),
        quando: m.getDate().toISOString(), rotulos: t.getLabels().map(function (l) { return l.getName(); }).join(", "),
        texto: m.getPlainBody().slice(0, 6000) });
    });
  });
  UrlFetchApp.fetch(ALFY_URL, { method: "post", contentType: "application/json", headers: { apikey: ALFY_CHAVE_PUBLICA },
    payload: JSON.stringify({ p_chave: ALFY_SEGREDO, p_emails: lista }), muteHttpExceptions: true });
  props.setProperty("ultima", String(Date.now()));
}

function alfyRpc(fn, corpo) {
  const r = UrlFetchApp.fetch(ALFY_URL.replace("alfy_email_receber", fn), { method: "post", contentType: "application/json",
    headers: { apikey: ALFY_CHAVE_PUBLICA }, payload: JSON.stringify(corpo), muteHttpExceptions: true });
  return JSON.parse(r.getContentText() || "null");
}

// Google Agenda nos dois sentidos: traz os seus eventos e leva os compromissos e reuniões do ALFY
function alfyAgenda() {
  const cal = CalendarApp.getDefaultCalendar();
  const de = new Date(Date.now() - 7 * 864e5), ate = new Date(Date.now() + 62 * 864e5);
  const eventos = cal.getEvents(de, ate).filter(function (e) { return (e.getDescription() || "").indexOf("ALFY ·") < 0; }).map(function (e) {
    return { id: e.getId(), titulo: e.getTitle(), inicio: e.getStartTime().toISOString(), fim: e.getEndTime().toISOString(),
      dia_todo: e.isAllDayEvent(), onde: e.getLocation(), link: "https://calendar.google.com/calendar/r/week/" + Utilities.formatDate(e.getStartTime(), "America/Sao_Paulo", "yyyy/MM/dd") };
  });
  alfyRpc("alfy_agenda_receber", { p_chave: ALFY_SEGREDO, p_de: de.toISOString(), p_ate: ate.toISOString(), p_eventos: eventos });
  const x = alfyRpc("alfy_agenda_exportar", { p_chave: ALFY_SEGREDO });
  if (!x || !x.itens) return;
  const feitos = [], removidos = [];
  x.itens.forEach(function (it) {
    if (it.google_id && it.marca === it.marca_atual) return;
    let ev = it.google_id ? cal.getEventById(it.google_id) : null;
    const ini = new Date(it.inicio), fim = new Date(it.fim);
    if (ev) { ev.setTitle(it.titulo); ev.setTime(ini, fim); ev.setLocation(it.onde || ""); ev.setDescription(it.descricao || "ALFY ·"); }
    else ev = cal.createEvent(it.titulo, ini, fim, { location: it.onde || "", description: it.descricao || "ALFY ·" });
    feitos.push({ origem: it.origem, google_id: ev.getId(), marca: it.marca });
  });
  x.remover.forEach(function (r) { try { const ev = cal.getEventById(r.google_id); if (ev) ev.deleteEvent(); } catch (e) {} removidos.push(r.origem); });
  if (feitos.length || removidos.length) alfyRpc("alfy_agenda_marcar", { p_chave: ALFY_SEGREDO, p_feitos: feitos, p_removidos: removidos });
}

function alfyTudo() { alfyEnviarEmails(); alfyAgenda(); }

function alfyInstalar() {
  ScriptApp.getProjectTriggers().forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("alfyTudo").timeBased().everyMinutes(15).create();
  alfyTudo();
}
`;
function emailHTML(h) {
  const r = s.robo || {};
  return `<div class="bloco">${h}${r.email_em ? `<p style="margin:0 0 10px">✅ Ligado. Último envio do Google ${quandoFoi(r.email_em)} · ${r.emails || 0} e-mails recebidos, ${r.emails_novos || 0} esperando o robô. O que pede ação aparece em Ler o WhatsApp (Podem virar rota) e resposta sobre rota vai para Responderam rotas.</p>` : ""}
    <p class="rotulo">${r.email_em ? "Para reinstalar" : "Para ligar (uma vez, 3 minutos)"}</p>
    <ol style="margin:0 0 10px;padding-left:20px;line-height:1.6;color:var(--aco-2)"><li>Abra <a href="https://script.google.com/home/projects/create" target="_blank" rel="noopener" style="color:var(--turq)">script.google.com › Novo projeto</a> logado como miguel@ilha.tours.</li><li>Apague o que estiver lá, cole o script abaixo e salve (ícone do disquete). Dê o nome "ALFY e-mail".</li><li>No seletor de função, escolha <b>alfyInstalar</b> e clique em Executar.</li><li>O Google pede autorização: escolha sua conta, clique em Avançado › Acessar ALFY e-mail e Permitir. É o seu próprio script, por isso aparece o aviso de app não verificado.</li><li>Pronto: a cada 15 minutos ele manda os e-mails novos da caixa de entrada (sem propaganda) para o ALFY, traz o seu Google Agenda para a Agenda do ALFY e leva para o Google os compromissos e reuniões que você marcar no ALFY.</li><li>Se você já tinha instalado a versão só de e-mail, cole este script de novo e rode alfyInstalar: o Google pede para liberar também a agenda.</li></ol>
    ${s.emailChave ? `<div class="zap" style="background:var(--ferro-0)"><pre style="margin:0;white-space:pre-wrap;font-size:12px;color:var(--aco-2);max-height:220px;overflow:auto">${esc(SCRIPT_EMAIL(s.emailChave))}</pre></div><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn turq" type="button" data-acao="copiar-script">Copiar o script</button></div>` : '<button class="btn turq" type="button" data-acao="ver-script">Mostrar o script</button>'}
    <p class="nota">O script só lê e manda para o banco do ALFY, que só você vê. Ninguém mais tem a chave. Para desligar: script.google.com › o projeto › Acionadores › apagar.</p></div>`;
}
const convite = (p) => `🐙 *ALFY · seu Mapa de Rotas*\n\nOi, ${p.nome.split(" ")[0]}! A partir de agora as suas rotas ficam no ALFY. Abra pelo link abaixo (é só seu, não repasse):\n\nhttps://ilhatech.io/alfy/#k=${p.token}\n\nNo celular, salve na tela de início para usar como app. Lá você vê suas rotas, muda o status, comenta e responde.`;
const LINK_ACESSO = (c) => `https://ilhatech.io/alfy/acesso.html#c=${c}`;
const msgAcesso = (nome, c, novo) => `🐙 *ALFY · seu acesso*\n\nOi${nome ? ", " + nome.split(" ")[0] : ""}! ${novo ? "Para entrar no ALFY, faça seu cadastro e crie seu usuário e senha neste link" : "Crie (ou troque) seu usuário e senha do ALFY neste link"} (vale 7 dias, é só seu):\n\n${LINK_ACESSO(c)}\n\nDepois é só entrar em ilhatech.io/alfy com seu usuário e senha, de qualquer aparelho.`;
async function gerarAcesso(alfyId, papel, frentes) {
  const r = await chamar("alfy_convite_criar", { p_alfy: alfyId || null, p_papel: papel || null, p_frentes: frentes || null });
  const txt = assinar(msgAcesso(r.nome, r.codigo, !alfyId)); copiar(txt); s.ultimoAcesso = { nome: r.nome || "pessoa nova", txt }; render();
}
function equipeHTML(h) {
  const e = s.equipe;
  if (!e) return `<div class="bloco">${h}<div class="carregando">Carregando…</div></div>`;
  const papel = { comando: "👑 Admin · vê e faz tudo", gerente: "Gerente", colaborador: "Colaborador" };
  return `<div class="bloco">${h}<p class="nota" style="margin:0 0 10px">🔑 gera um link de 7 dias em que a pessoa cria usuário e senha (ou troca, se esqueceu). O link é copiado pronto para colar no privado dela no WhatsApp.</p>${s.ultimoAcesso ? `<div class="ia-painel" style="margin-bottom:10px"><div class="t">✅ Link de ${esc(s.ultimoAcesso.nome)} copiado</div><div class="zap"><div class="msg" style="max-width:none">${zap(s.ultimoAcesso.txt)}</div></div></div>` : ""}${[...e].sort((x, y) => (y.papel === "comando") - (x.papel === "comando")).map((p) => `<div class="sugestao"><div class="tx"><b>${esc(p.nome)}</b><small>${p.nome_completo && p.nome_completo !== p.nome ? esc(p.nome_completo) + " · " : ""}${p.na_nave ? "" : "⚠️ sem Nave ID · "}${p.usuario ? "👤 " + esc(p.usuario) + " · " : "sem senha · "}${papel[p.papel]}${(p.frentes || []).length ? " · " + p.frentes.map(frenteCurta).join(", ") : ""} · ${p.rotas} rotas abertas · ${p.ultimo ? "usou " + quandoFoi(p.ultimo) : "ainda não usou"}${p.ativo ? "" : " · desligado"}</small></div>${p.ativo ? `<button class="btn turq peq" type="button" data-acessode="${p.id}">🔑 ${p.usuario ? "Trocar senha" : "Link de acesso"}</button>` : ""}</div>`).join("")}</div>`;
}
const LINK_FICHA = "https://ilhatech.io/alfy/ficha.html";
const MSG_FICHA = `🐙 *Ficha de entrada · Grupo Ilha Tour*\n\nOi! Para te cadastrar nos nossos sistemas, preencha esta ficha (leva 2 minutos):\n\n${LINK_FICHA}\n\nDepois que a Gestão de Pessoas conferir, você recebe o seu acesso ao ALFY por aqui.`;
const NIVEIS_NAVE = [["operacional", "Operacional"], ["tatico", "Tático"], ["gerente", "Gerente"], ["head", "Head"]];
// pessoas vêm da Nave ID (fonte da verdade): buscar e trazer, ligar quem está sem par, ou cadastrar quem não está lá
function naveHTML() {
  const semNave = (M.pessoas || []).filter((p) => !p.na_nave && p.nome !== "ALFY");
  const ligando = s.naveLigar ? pessoa(s.naveLigar) : null, res = (s.naveBusca || "").trim() || ligando ? s.naveRes : null;   // a lista só aparece com busca
  const frs = opc(FRENTES.filter((x) => x !== "🧍 Pessoal").map((x) => [x, frenteCurta(x)]), "", "Nenhuma");
  const papeis = opc([["colaborador", "Colaborador (vê as rotas dele)"], ["gerente", "Gerente (vê a frente)"]], "colaborador");
  return `<div class="bloco"><h3>Pessoas da Nave ID</h3><p class="nota" style="margin:0 0 8px">Busque pelo nome quem já está na Nave ID e traga para o ALFY.</p>
    ${semNave.length ? `<p class="rotulo">No ALFY, mas sem cadastro na Nave ID · ${semNave.length}</p><div class="alvos" style="margin:0 0 12px">${semNave.map((p) => `<button class="chip" type="button" data-naveligar="${p.id}" aria-pressed="${s.naveLigar === p.id}">${esc(p.nome)}</button>`).join("")}</div>` : ""}
    ${ligando ? `<div class="ia-painel" style="margin-bottom:10px"><div class="t">Ligando ${esc(ligando.nome)}: ache a pessoa na lista abaixo e toque em <b>É esta</b>. Se ela não estiver na Nave ID, <button class="mini ia" type="button" data-acao="nave-novo">cadastre aqui</button>.</div></div>` : ""}
    <input class="busca" style="width:100%" id="nave-busca" placeholder="Buscar na Nave ID por nome ou função" value="${esc(s.naveBusca || "")}" autocomplete="off">
    <div class="nave-res">${!res ? "" : res.length ? res.map((x) => `<div class="sugestao"><div class="tx"><b>${esc(x.nome)}</b><small>${esc(x.funcao || "sem função")}${x.tem_whatsapp ? " · WhatsApp ✓" : " · sem WhatsApp"}</small></div>
      ${x.no_alfy ? `<span class="nota" style="margin:0">no ALFY como ${esc(x.no_alfy)}</span>` : ligando ? `<button class="btn turq peq" type="button" data-navetrazer="${x.colaborador_id}">É esta</button>`
        : s.naveAbrir === x.colaborador_id ? `<div class="props nave-form"><div class="dado"><small>Chamar de</small><input id="nv-apelido" value="${esc(x.nome.split(" ")[0])}"></div><div class="dado"><small>Acesso</small><select id="nv-papel">${papeis}</select></div><div class="dado"><small>Frente (gerente)</small><select id="nv-frente">${frs}</select></div><button class="btn turq peq" type="button" data-navetrazer="${x.colaborador_id}">Trazer para o ALFY</button></div>`
        : `<button class="btn peq" type="button" data-naveabrir="${x.colaborador_id}">＋ Trazer</button>`}</div>`).join("") : '<div class="vazio">Ninguém com esse nome na Nave ID.</div>'}</div>
    ${s.naveNovo ? `<div class="campo" style="margin-top:10px"><p class="rotulo">Cadastrar na Nave ID e no ALFY</p><div class="props"><div class="dado"><small>Nome completo</small><input id="nn-nome" placeholder="Como está no documento"></div><div class="dado"><small>Chamar de</small><input id="nn-apelido" value="${esc(ligando?.nome || "")}"></div><div class="dado"><small>WhatsApp</small><input id="nn-zap" inputmode="tel" placeholder="(24) 99999-9999"></div><div class="dado"><small>Função</small><input id="nn-funcao"></div>
      ${ligando ? "" : `<div class="dado"><small>Acesso</small><select id="nn-papel">${papeis}</select></div><div class="dado"><small>Frente (gerente)</small><select id="nn-frente">${frs}</select></div>`}</div>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn turq peq" type="button" data-acao="nave-salvar-novo">Cadastrar</button><button class="btn peq" type="button" data-acao="nave-cancelar">Cancelar</button></div></div>` : `<p class="nota">Não achou? <button class="mini" type="button" data-acao="nave-novo">Cadastrar pessoa nova</button> ou <button class="mini ia" type="button" data-acao="acesso-novo">🔑 gerar link para ela se cadastrar</button> (ela preenche e cria usuário e senha).</p>${s.ultimoAcesso && !comando() ? `<div class="ia-painel" style="margin-top:8px"><div class="t">✅ Link copiado</div><div class="zap"><div class="msg" style="max-width:none">${zap(s.ultimoAcesso.txt)}</div></div></div>` : ""}`}
    ${s.aprovado && s.aprovado.daNave ? `<div class="ia-painel" style="margin-top:10px"><div class="t">✅ ${esc(s.aprovado.nome)} está no ALFY</div><div class="zap"><div class="msg" style="max-width:none">${zap(convite({ nome: s.aprovado.nome, token: s.aprovado.token }))}</div></div><div><button class="btn turq" type="button" data-acao="copiar-aprovado">Copiar o convite</button></div></div>` : ""}</div>`;
}
async function naveBuscar(q) { s.naveBusca = q; try { s.naveRes = await chamar("alfy_nave_buscar", { p_q: q }); } catch (e) { falhou(e); } const el = document.querySelector(".nave-res"); if (el) { const pos = $("#nave-busca").selectionStart; render(); const i = $("#nave-busca"); i.focus(); i.setSelectionRange(pos, pos); } }
async function naveDepois(r, msg) {
  s.naveLigar = null; s.naveAbrir = null; s.naveNovo = false; s.aprovado = r.token ? { nome: r.nome, token: r.token, daNave: true } : null;
  await recarregar(); if (comando()) s.equipe = await chamar("alfy_equipe"); s.naveRes = await chamar("alfy_nave_buscar", { p_q: s.naveBusca || "" }); render(); aviso(msg);
}
function vistaEquipe() {
  const f = s.fichas;
  const pend = (f || []).filter((x) => x.status === "pendente"), feitas = (f || []).filter((x) => x.status !== "pendente");
  return `<div style="max-width:900px;display:flex;flex-direction:column;gap:14px">
    <div class="bloco"><h3>Ficha de entrada (link fixo e aberto)</h3><p style="margin:0 0 10px;color:var(--aco-2)">Mande este link para toda pessoa que entrar no grupo. Ela preenche nome, WhatsApp, CPF, nascimento e função. A ficha chega aqui para aprovar, e a aprovação cadastra a pessoa na Nave ID e no ALFY ao mesmo tempo.</p>
      <div class="zap"><div class="msg" style="max-width:none">${zap(MSG_FICHA)}</div></div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn turq" type="button" data-acao="copiar-ficha">Copiar mensagem com o link</button><a class="btn" href="${LINK_FICHA}" target="_blank" rel="noopener" style="text-decoration:none">Ver a ficha</a></div></div>
    <div class="bloco"><h3>Fichas para aprovar <span class="ct">${pend.length}</span></h3>${!f ? '<div class="carregando">Carregando…</div>' : pend.map((x) => `<div class="campo" style="margin-bottom:10px"><div class="cab-campo"><b>${esc(x.nome_completo)}</b><span>${quandoFoi(x.criado_em)}</span></div>
        <p class="txt" style="font-size:14px">${esc(x.apelido ? "Chamar de " + x.apelido + " · " : "")}WhatsApp ${esc(x.whatsapp)}${x.email ? " · " + esc(x.email) : ""}${x.nascimento ? " · nasc. " + ddmm(x.nascimento + "T12:00:00-03:00") : ""}${x.tem_cpf ? " · CPF ✓" : " · sem CPF"}${x.funcao ? "<br>Função: " + esc(x.funcao) : ""}${x.empresa ? " · " + esc(x.empresa) : ""}${x.observacao ? "<br>" + esc(x.observacao) : ""}</p>
        <div class="props" style="margin-top:8px"><div class="dado"><small>Acesso no ALFY</small><select id="fa-papel-${x.id}">${opc([["colaborador", "Colaborador (vê as rotas dele)"], ["gerente", "Gerente (vê a frente)"]], "colaborador")}</select></div>
          <div class="dado"><small>Frente (para gerente)</small><select id="fa-frente-${x.id}">${opc(FRENTES.filter((x2) => x2 !== "🧍 Pessoal").map((x2) => [x2, frenteCurta(x2)]), "", "Nenhuma")}</select></div>
          <div class="dado"><small>Nível na Nave</small><select id="fa-nivel-${x.id}">${opc(NIVEIS_NAVE, "operacional")}</select></div></div>
        <div style="display:flex;gap:8px;margin-top:8px"><button class="btn turq peq" type="button" data-aprovar="${x.id}">Aprovar e cadastrar</button><button class="btn peq" type="button" data-recusar="${x.id}">Recusar</button></div></div>`).join("") || '<div class="vazio">Nenhuma ficha esperando.</div>'}
      ${s.aprovado ? `<div class="ia-painel" style="margin-top:10px"><div class="t">✅ ${esc(s.aprovado.nome)} cadastrado na Nave ID e no ALFY</div><div class="zap"><div class="msg" style="max-width:none">${zap(convite({ nome: s.aprovado.nome, token: s.aprovado.token }))}</div></div><div><button class="btn turq" type="button" data-acao="copiar-aprovado">Copiar convite do ALFY</button></div></div>` : ""}
      ${feitas.length ? `<p class="rotulo" style="margin-top:12px">Últimos 7 dias</p>${feitas.map((x) => `<p style="margin:0 0 4px;font-size:14px">${x.status === "aprovada" ? "✅" : "✖️"} ${esc(x.nome_completo)}</p>`).join("")}` : ""}</div>
    ${comando() ? equipeHTML("<h3>Quem tem acesso ao ALFY</h3>") : ""}
    ${naveHTML()}</div>`;
}
function diarioHTML(h) {
  const d = s.diario;
  if (!d) return `<div class="bloco">${h}<div class="carregando">Carregando…</div></div>`;
  const nomes = { bomdia: "☀️ Bom dia", relatorio: "📰 Relatório do dia", escuta: "📡 Grupos hoje" };
  return `<div class="bloco">${h}${d.length ? d.slice(0, 30).map((x) => `<div class="campo" style="margin-bottom:8px"><div class="cab-campo"><b>${nomes[x.tipo] || x.tipo}</b><span>${ddmm(x.em)} ${hhmm(x.em)}</span></div><p class="txt">${esc(rotaTxt(x.texto))}</p></div>`).join("") : '<div class="vazio">As rotinas ainda não escreveram nada aqui. A Escuta grava de hora em hora e a Ronda das 8h grava o Bom dia, com o app do Claude aberto no Mac.</div>'}</div>`;
}
const DEST = { rota: "🗺️ Rota", pauta: "🗓️ Pauta", arquivo: "🗂️ Arquivo", lembrete: "⏰ Lembrete", descartar: "🗑️ Descartar" };
function detCmd(c) {
  const h = `<h3>${c.n}</h3>`;
  if (c.k === "despejo") {
    const d = s.despejo, rod = d.pedido && filaRodando("despejo");
    return `<div class="bloco">${h}<textarea id="desp-txt" class="busca" rows="5" style="width:100%" placeholder="Escreva do seu jeito. Ex.: falar com a Gabriela sobre o ar da suíte 12 até sexta, pagar a Protegy, ideia de pacote de réveillon com a Buena Onda, dentista quinta 10h">${esc(d.texto)}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn" type="button" data-acao="gravar">${s.gravando ? "⏹ Parar gravação" : "🎙️ Gravar áudio"}</button><label class="btn" style="cursor:pointer">📎 Anexar<input type="file" id="desp-arq" multiple hidden></label><button class="btn turq" type="button" data-acao="despejar" ${rod ? "disabled" : ""}>🐙 Mandar para o ALFY</button></div>
      ${d.anexos.length ? `<div class="alvos" style="margin-top:10px">${d.anexos.map((a, i) => `<span class="chip">${a.audio ? "🎙️" : "📎"} ${esc(a.nome)}${a.id ? "" : " · subindo…"}<span class="opcao-x" data-tiraanexo="${i}" role="button" aria-label="Tirar">✕</span></span>`).join("")}</div>` : ""}
      ${rod ? `<div class="ia-saida pensando" style="margin-top:10px">🐙 O ALFY está ${d.anexos.some((a) => a.audio) ? "ouvindo o áudio e " : ""}separando o despejo…</div>` : ""}
      ${d.itens ? `<p class="rotulo" style="margin-top:14px">O ALFY separou assim</p>${d.transcricao ? `<p class="nota" style="margin:0 0 6px">Transcrição: ${esc(d.transcricao)}</p>` : ""}${d.itens.map((it, i) => `<div class="sugestao ${d.feitos[i] ? "feita" : ""}"><div class="tx"><b>${esc(it.titulo)}</b><small>${DEST[it.destino] || it.destino}${it.responsavel ? " · " + esc(it.responsavel) : ""}${it.prazo ? " · até " + esc(ddmm(it.prazo + "T12:00:00-03:00")) : ""}</small></div>${d.feitos[i] ? `<small style="color:var(--aco)">${esc(d.feitos[i])}</small>` : `<button class="btn turq peq" type="button" data-desp="${i}">${{ rota: "Criar rota", pauta: "Criar pauta", arquivo: "Ok, guardado", lembrete: "Criar lembrete", descartar: "Descartar" }[it.destino] || "Ok"}</button><select class="sel" data-despdest="${i}" style="padding:4px 6px;font-size:12px" aria-label="Destino">${Object.entries(DEST).map(([k, n]) => `<option value="${k}" ${k === it.destino ? "selected" : ""}>${n}</option>`).join("")}</select>`}</div>`).join("")}` : ""}
      <p class="nota">O grupo ALFY do WhatsApp continua valendo como despejo. Arquivo anexado vai para o Drive 🗂️ ALFY · Arquivos › 00 Entrada. Lembrete vira rota sua na frente Pessoal, com o prazo.</p></div>`;
  }
  if (c.k === "whatsapp" || c.k === "grupos") {
    const rod = filaRodando("whatsapp"), sug = M.sugestoes || [];
    const ret = sug.filter((x) => x.tipo === "retorno"), nov = sug.filter((x) => x.tipo === "nova");
    return `<div class="bloco">${h}<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><div class="alterna" role="group" aria-label="Período"><button type="button" data-wahoras="24" aria-pressed="${(s.waHoras || 24) === 24}">24 horas</button><button type="button" data-wahoras="168" aria-pressed="${s.waHoras === 168}">7 dias</button></div><button class="btn turq" type="button" data-acao="whatsapp" ${rod ? "disabled" : ""}>${rod ? "Lendo…" : "Ler agora"}</button></div>${rod ? '<p class="estado-fila">🐙 O robô do Mac está lendo as conversas. Leva de 1 a 3 minutos.</p>' : ""}
      <p class="rotulo" style="margin-top:14px">Responderam rotas · ${ret.length}</p>${ret.map((x) => { const r = rotaDe(x.rt); return `<div class="retorno">${r ? tag(r) : ""}<div class="bal"><small><b style="color:var(--texto)">${esc(x.quem || "")}</b> · ${esc(x.quando || "")} · ${esc(x.conversa || "")}</small><br><p>${esc(rotaTxt(x.texto))}</p><br><span style="display:inline-flex;gap:6px;flex-wrap:wrap">${r ? `<button class="btn turq peq" type="button" data-sug="${x.id}" data-sugacao="comentar">Pôr na conversa da ${esc(nomeRota(x.rt))}</button><button class="btn peq" type="button" data-rt="${x.rt}">Abrir</button>` : ""}<button class="btn peq" type="button" data-sug="${x.id}" data-sugacao="descartar">Descartar</button></span></div></div>`; }).join("") || '<div class="vazio">Nenhum retorno novo</div>'}
      <p class="rotulo" style="margin-top:14px">Podem virar rota · ${nov.length}</p>${nov.map((x) => `<div class="sugestao"><div class="tx"><b style="white-space:pre-wrap">${esc(rotaTxt(x.texto))}</b><small>${esc(x.quem || "")}${x.conversa ? " · " + esc(x.conversa) : ""}${x.quando ? " · " + esc(x.quando) : ""}</small></div><button class="btn turq peq" type="button" data-sug="${x.id}" data-sugacao="rota">Virar rota</button><button class="btn peq" type="button" data-sug="${x.id}" data-sugacao="descartar">Descartar</button></div>`).join("") || '<div class="vazio">Nada novo</div>'}</div>`;
  }
  if (c.k === "email") return emailHTML(h);
  if (c.k === "diario") return diarioHTML(h);
  if (c.k === "zap") return zapHTML(h);
  if (c.k === "aprendi") {
    const ap = s.aprendi;
    if (!ap) return `<div class="bloco">${h}<div class="carregando">Carregando…</div></div>`;
    return `<div class="bloco">${h}<p class="rotulo">O jeito do Miguel${ap.jeito ? ` · atualizado ${quandoFoi(ap.jeito.em)}` : ""}</p>${ap.jeito ? `<div class="ia-saida">${esc(rotaTxt(ap.jeito.texto.replace(/\*\*/g, "")))}</div>` : '<p class="nota">Ainda não aprendeu. Sai na próxima rodada.</p>'}
      <p class="rotulo" style="margin-top:14px">Casos resolvidos · ${ap.casos.length}</p>${ap.casos.map((x) => `<div class="sugestao"><div class="tx"><b>${esc(x.rt ? nomeRota(x.rt) : "Rota")}</b><small style="white-space:normal">${esc(rotaTxt(x.texto))}</small></div><button class="mini" type="button" data-tiraraprendi="${x.id}" title="Esquecer este caso">✕</button></div>`).join("") || '<p class="nota">Nenhum ainda.</p>'}
      <p class="nota">O ALFY aprende sozinho de 30 em 30 minutos com as rotas concluídas e, uma vez por dia, relê o que você escreveu (pedidos, comentários, orientações) para ajustar o seu jeito.</p></div>`;
  }
  if (c.k === "equipe") return equipeHTML(h);
  if (c.k === "mapa" || c.k === "cobrar") {
    const pessoasAlvo = (M.pessoas || []).filter((p) => p.papel !== "comando" && p.nome !== "ALFY" && (M.rotas || []).some((r) => r.responsavel_id === p.id && mapeavel(r)));
    const setores = FRENTES.filter((f) => f !== "🧍 Pessoal" && (M.rotas || []).some((r) => r.frente === f && mapeavel(r)));
    const cobrando = c.k === "cobrar" || s.mapaModo === "cobrar";
    const modo = cobrando ? "pessoa" : s.mapaModo || "rapido";
    if (modo === "pessoa" && !pessoasAlvo.some((p) => p.id === s.alvo)) s.alvo = pessoasAlvo[0]?.id || null;
    if (modo === "setor" && !setores.includes(s.alvo)) s.alvo = setores[0] || null;
    s.grupo = (s.grupo || []).filter((id) => pessoasAlvo.some((p) => p.id === id));
    if (modo === "rapido") {
      const lista = pessoasAlvo.map((p) => { const rs = (M.rotas || []).filter((r) => mapeavel(r) && r.responsavel_id === p.id); return { p, n: rs.length, v: rs.filter(vencida).length }; }).sort((x, y) => y.v - x.v || y.n - x.n);
      const env = s.mapasCopiados || {};
      return `<div class="bloco">${h}<div class="alterna" role="group" style="margin-bottom:12px"><button type="button" data-mapamodo="rapido" aria-pressed="true">Todos</button><button type="button" data-mapamodo="pessoa" aria-pressed="false">Pessoa</button><button type="button" data-mapamodo="grupo" aria-pressed="false">Grupo</button><button type="button" data-mapamodo="setor" aria-pressed="false">Setor</button><button type="button" data-mapamodo="cobrar" aria-pressed="false">Vencidas</button></div>
        <p class="nota" style="margin:0 0 8px">Cada botão copia o Mapa de Rotas da pessoa, só com as rotas dela, no formato oficial. Cole no privado dela no WhatsApp.</p>
        ${lista.map(({ p, n, v }) => `<div class="sugestao ${env[p.id] ? "feita" : ""}"><span class="avatar" style="width:30px;height:30px;font-size:12px">${ini(p.nome)}</span><div class="tx"><b>${esc(p.nome)}</b><small>${n} ${n === 1 ? "rota aberta" : "rotas abertas"}${v ? ` · <span style="color:#FF9A9C">${v} ${v === 1 ? "vencida" : "vencidas"}</span>` : ""}${env[p.id] ? " · copiado " + env[p.id] : ""}</small></div><button class="btn ${env[p.id] ? "" : "turq"} peq" type="button" data-copiarmapa="${p.id}">${env[p.id] ? "Copiar de novo" : "Copiar mapa"}</button></div>`).join("") || '<div class="vazio">Ninguém com rota aberta.</div>'}</div>`;
    }
    const m = modo === "grupo" ? (s.grupo.length ? mapaGrupo(s.grupo) : { n: 0, txt: "Escolha as pessoas do grupo." }) : !s.alvo ? { n: 0, txt: "" } : modo === "setor" ? mapaSetor(s.alvo) : mapaPessoa(s.alvo, cobrando);
    const chipsPessoa = (sel, attr) => pessoasAlvo.map((p) => `<button class="chip" type="button" ${attr}="${p.id}" aria-pressed="${sel(p.id)}">${esc(curto(p.nome))}${cobrando ? ` · ${(M.rotas || []).filter((r) => mapeavel(r) && r.responsavel_id === p.id && vencida(r)).length}` : ""}</button>`).join("");
    return `<div class="bloco">${h}${c.k === "mapa" ? `<div class="alterna" role="group" style="margin-bottom:12px"><button type="button" data-mapamodo="rapido" aria-pressed="${modo === "rapido"}">Todos</button><button type="button" data-mapamodo="pessoa" aria-pressed="${modo === "pessoa"}">Pessoa</button><button type="button" data-mapamodo="grupo" aria-pressed="${modo === "grupo"}">Grupo</button><button type="button" data-mapamodo="setor" aria-pressed="${modo === "setor"}">Setor</button><button type="button" data-mapamodo="cobrar" aria-pressed="${cobrando}">Vencidas</button></div>` : ""}
      ${modo === "pessoa" ? `<p class="rotulo">Só as rotas da pessoa</p><div class="alvos">${chipsPessoa((id) => s.alvo === id, "data-alvo")}</div>` : ""}
      ${modo === "grupo" ? `<p class="rotulo">Escolha quem entra (cada um com as rotas dele)</p><div class="alvos">${chipsPessoa((id) => s.grupo.includes(id), "data-grupo")}</div>` : ""}
      ${modo === "setor" ? `<p class="rotulo">Todas as rotas abertas da frente, por pessoa</p><div class="alvos">${setores.map((f) => `<button class="chip" type="button" data-alvo="${esc(f)}" aria-pressed="${s.alvo === f}">${esc(frenteCurta(f))}</button>`).join("")}</div>` : ""}
      <div style="display:flex;gap:8px;margin:4px 0 12px;flex-wrap:wrap"><button class="btn turq" type="button" data-acao="copiar-mapa">Copiar para o WhatsApp</button><span class="nota" style="align-self:center;margin:0">${m.n} rotas</span></div>
      <div class="zap"><div class="msg" style="max-width:none">${zap(m.txt)}<small>prévia · ${m.n} rotas</small></div></div>
      <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn turq" type="button" data-acao="copiar-mapa">Copiar para o WhatsApp</button></div>
      <p class="nota">Formato oficial do Mapa de Rotas. O texto de cada rota é o 🎯 O que fazer do cartão. Rota da frente Pessoal e rota concluída nunca entram.</p></div>`;
  }
  if (c.k === "bomdia") {
    const hoje = (M.rotas || []).filter((r) => ABERTOS.includes(r.status) && r.prazo && dias(r.prazo) === 0 && (r.responsavel_id === eu().id || r.co_responsavel_id === eu().id));
    const venc = (M.rotas || []).filter((r) => vencida(r) && r.responsavel_id === eu().id).sort(ordPrio);
    const reus = (M.reunioes || []).filter((x) => x.quando && dia(x.quando) === hojeDia());
    const resp = (FEED || []).filter((e) => (e.tipo === "whatsapp" || e.tipo === "comentario") && e.quem !== eu().nome && (Date.now() - new Date(e.em)) < 864e5);
    const bud = (M.rotas || []).filter((r) => r.budget_status === "aguardando aprovação");
    return `<div class="bloco">${h}<p class="rotulo">Reuniões de hoje · ${reus.length}</p>${reus.map((x) => `<p style="margin:0 0 4px">🗓️ ${hhmm(x.quando)} · ${esc(x.titulo)}</p>`).join("") || '<p class="nota" style="margin:0">Nenhuma</p>'}
      <p class="rotulo" style="margin-top:14px">Vencem hoje · ${hoje.length}</p><div class="lista">${hoje.map((r) => linha(r)).join("") || '<p class="nota" style="margin:0">Nada</p>'}</div>
      <p class="rotulo" style="margin-top:14px">Suas vencidas · ${venc.length}</p><div class="lista">${venc.map((r) => linha(r)).join("") || '<p class="nota" style="margin:0">Nenhuma</p>'}</div>
      <p class="rotulo" style="margin-top:14px">Budget esperando você · ${bud.length}</p><div class="lista">${bud.map((r) => linha(r)).join("") || '<p class="nota" style="margin:0">Nenhum</p>'}</div>
      <p class="rotulo" style="margin-top:14px">Responderam nas últimas 24 h · ${resp.length}</p>${resp.slice(0, 8).map((e) => `<button type="button" class="ev" data-rt="${e.rt}"><span class="ic-ev">${EV_IC[e.tipo]}</span><span class="c"><span class="l1"><b>${esc(curto(e.quem))}</b> · ${esc(nomeRota(e.rt))}</span><p>${esc((e.texto || "").slice(0, 200))}</p></span></button>`).join("") || '<p class="nota" style="margin:0">Ninguém</p>'}</div>` + diarioHTML("<h3>Resumos que o ALFY escreveu</h3>");
  }
  if (c.k === "ronda") { const rod = filaRodando(c.k); return `<div class="bloco">${h}<p style="margin:0 0 10px">${c.faz}</p><button class="btn turq" type="button" data-acao="${c.k}" ${rod ? "disabled" : ""}>${rod ? "Rodando…" : "Rodar a ronda agora"}</button></div>`; }
  if (c.k === "perguntar") {
    const msgs = s.chatGeral || [], rod = s.esperando.geral;
    return `<div class="bloco">${h}<div class="chat" id="chat-geral">${msgs.map((m) => `<div class="m ${m.papel === "user" ? "eu" : "alfy"}">${m.papel === "user" ? esc(m.texto) : textoAlfy(m.texto)}</div>`).join("") || `<div class="m alfy">🐙 Oi, Miguel. Pergunte sobre as rotas e as pautas. Ex.: "o que está vencido da Karoline?", "o que precisa de decisão minha?", "quais rotas têm budget esperando aprovação?"</div>`}${rod ? '<div class="m alfy">🐙 pensando…</div>' : ""}</div>
      <form class="chat-form" id="f-chat"><input id="t-chat" placeholder="Pergunte ao ALFY" autocomplete="off"><button class="btn turq" type="submit">Perguntar</button></form></div>`;
  }
  return "";
}

function vistaEu() {
  const p = eu(), minhas = (M.rotas || []).filter((r) => (r.responsavel_id === p.id || r.co_responsavel_id === p.id) && ABERTOS.includes(r.status));
  return `<div class="placa rebites" style="padding:22px 18px;display:flex;gap:14px;align-items:center"><div class="avatar" style="width:52px;height:52px;font-size:18px">${ini(p.nome)}</div><div><b style="font-family:var(--fd);font-size:18px">${esc(p.nome)}</b><div style="color:var(--aco);font-size:14px">${papelTxt()}</div></div></div>
    <div class="bloco" style="margin-top:14px"><h3>Suas rotas abertas <span class="ct">${minhas.length}</span></h3><p style="margin:0;color:var(--aco-2)">${minhas.filter(vencida).length} vencidas · ${minhas.filter((r) => r.prazo && dias(r.prazo) === 0).length} vencem hoje</p></div>
    <div class="bloco" style="margin-top:14px"><h3>No celular</h3><p style="margin:0;color:var(--aco-2)">Para usar como app: no iPhone, toque em Compartilhar › Adicionar à Tela de Início. No Android, menu ⋮ › Adicionar à tela inicial.</p></div>
    <div class="bloco eu-atalhos" style="margin-top:14px"><h3>Atalhos</h3><div class="rapidas3"><button class="btn" type="button" data-aba="pautas">🗓️ Pautas</button><button class="btn" type="button" data-aba="placar">🏆 Placar</button><button class="btn" type="button" data-verconc="1">✓ Concluídas</button><button class="btn" type="button" data-aba="feed">📰 Feed</button>${cuidaPessoas() ? '<button class="btn" type="button" data-aba="equipe">👥 Equipe</button>' : ""}${comando() ? '<button class="btn" type="button" data-aba="comandos">⚙️ Comandos</button>' : ""}</div></div>
    <div class="bloco" style="margin-top:14px"><h3>Seu acesso</h3><p style="margin:0 0 10px;color:var(--aco-2)">${p.usuario ? `Você entra com o usuário <b>${esc(p.usuario)}</b> e sua senha, de qualquer aparelho.` : "Crie um usuário e uma senha para entrar de qualquer aparelho, sem precisar do link."}</p><button class="btn turq" type="button" data-acao="meu-acesso">🔑 ${p.usuario ? "Trocar minha senha" : "Criar usuário e senha"}</button></div>
    <div style="margin-top:14px"><button class="btn" type="button" data-acao="sair">Sair deste aparelho</button></div>`;
}

// ---------------------------------------------------------------- cartão da rota
function podeCampo(k) { return manda() || k === "como_esta"; }
function campoHTML(r, k) {
  const c = CAMPOS[k], v = k === "instr" ? instrDe(r) : r[COLUNA[k]] || "", ed = s.editando === k;
  return `<div class="campo"><div class="cab-campo"><b>${c.rot}</b><span class="acoes">${ed || !podeCampo(k) ? "" : `<button class="mini" type="button" data-editar="${k}">Editar</button>`}${comando() ? `<button class="mini ia" type="button" data-iacampo="${k}">🐙 Pedir ao ALFY</button>` : ""}</span></div>
    <div class="dica-campo">${c.dica}</div>
    ${ed ? `<textarea id="ed-${k}" rows="6">${esc(v)}</textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn turq peq" type="button" data-salvar="${k}">Salvar</button><button class="btn peq" type="button" data-cancelar="1">Cancelar</button></div>`
      : `<p class="txt ${v ? "" : "vazio"}">${v ? esc(v) : "Vazio."}</p>`}</div>`;
}
function chatRotaHTML(r) {
  const msgs = s.cartao?.ia || [], rod = s.esperando["rota:" + r.rt];
  const resp = curto(nomeDe(r.responsavel_id));
  const rap = [`Escreva uma mensagem de WhatsApp para ${resp} sobre esta rota`, "Qual é o próximo passo?", "Escreva as Instruções com o que já sabemos", "Resuma a conversa da rota"];
  return `<div class="chat" id="chat-rota">${msgs.map((m) => `<div class="m ${m.papel === "user" ? "eu" : "alfy"}">${esc(m.texto)}${m.papel === "assistant" ? `<div class="usar">${Object.keys(CAMPOS).map((k) => `<button class="mini" type="button" data-usar="${m.id}" data-campo="${k}">Usar em ${CAMPOS[k].rot.split(" ").slice(1).join(" ")}</button>`).join("")}<button class="mini" type="button" data-copiarmsg="${m.id}">Copiar</button></div>` : ""}</div>`).join("") || `<div class="m alfy">🐙 Eu já li tudo desta rota: o pedido, as instruções, a conversa e o histórico. Peça o que precisar, por exemplo uma mensagem para ${esc(resp)} do jeito que você quer.</div>`}${rod ? '<div class="m alfy">🐙 pensando… (o robô do Mac responde em alguns segundos)</div>' : ""}</div>
    <div class="rap" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${rap.map((t) => `<button class="chip" type="button" data-rap="${esc(t)}">${esc(t)}</button>`).join("")}</div>
    <form class="chat-form" id="f-chat-rota"><textarea id="t-chat-rota" rows="2" class="busca" style="flex:1;min-width:0;resize:vertical" placeholder="Escreva para o ALFY. Ex.: faz uma mensagem curta cobrando, sem pressionar">${esc(s.rascunhoRota || "")}</textarea><button class="btn turq" type="submit" ${rod ? "disabled" : ""}>Enviar</button></form>`;
}
// ---------------------------------------------------------------- cartão da rota · polegar (rodada 3)
// uma coluna que rola: Fazer · Interagir · Detalhes · Agenda · Histórico; ações presas embaixo, com anterior e próxima
const ETAPA_BOT = { rota: ["▶", "Começar", "andamento"], andamento: ["⏸", "Pausar", "pausada"], pausada: ["▶", "Voltar a fazer", "andamento"], concluida: ["↺", "Reabrir", "andamento"], ideia: ["▶", "Virar rota", "rota"] };
const SECOES_F = [["fazer", "🎯 Rota"], ["interagir", "💬 Conversa"], ["detalhes", "⚙️ Detalhes"], ["lembrete", "⏰ Lembrete"], ["historico", "🕘 Histórico"]];
// respostas novas: o que outra pessoa escreveu depois da última vez que você abriu a rota (guardado neste aparelho)
const VISTO = "alfy-visto";
function vistoTodos() { try { const v = JSON.parse(localStorage.getItem(VISTO) || "{}"); if (!v._base) { v._base = new Date().toISOString(); localStorage.setItem(VISTO, JSON.stringify(v)); } return v; } catch (_) { return { _base: new Date().toISOString() }; } }
const vistoDe = (rt) => { const v = vistoTodos(); return v[rt] || v._base; };
function marcarVisto(rt) { try { const v = vistoTodos(); v[rt] = new Date().toISOString(); localStorage.setItem(VISTO, JSON.stringify(v)); } catch (_) { /* privado */ } }
const temNova = (r) => { const u = r.ult_txt; return !!u && u.quem !== eu().nome && u.quem !== "ALFY" && !String(u.texto || "").startsWith("🤖") && String(u.em) > vistoDe(r.rt); };
const lembreteDe = (rt) => (M?.lembretes || []).find((l) => l.rt === rt);
const adiada = (r) => { const l = lembreteDe(r.rt); return !!l && new Date(l.quando) > new Date(); };
const tocando = (r) => { const l = lembreteDe(r.rt); return !!l && new Date(l.quando) <= new Date(); };
// conversa: lista limpa (iniciais, nome, quando, texto); resposta do ALFY com um único "⋯"
const menuApagar = (chave) => comando() ? (s.apagando === chave ? `<span class="apaga4">Apagar mesmo? <button type="button" data-apagar="${chave}">Sim, apagar</button><button type="button" data-apagar="">Não</button></span>` : `<button class="mais4" type="button" data-apagarq="${chave}" aria-label="Apagar">⋯</button>`) : "";
function comentHTML(c, nova) {
  const orig = c.origem === "whatsapp" ? "WhatsApp" : c.tipo === "orientacao" ? "orientação" : c.origem === "trello" ? "Trello" : "";
  const robo = c.origem === "alfy";
  return `<div class="c4 ${robo ? "robo" : ""} ${nova ? "nova" : ""}"><span class="av4">${robo ? "🐙" : ini(c.quem)}</span><div class="c4b"><div class="c4h"><b>${esc(robo ? "ALFY" : curto(c.quem))}</b><span>${quandoFoi(c.em)}${orig ? " · " + orig : ""}</span>${nova ? '<span class="novo4">Nova</span>' : ""}${menuApagar("c" + c.id)}</div>${(() => { const tx = rotaTxt(c.texto.replace(/^📱 WhatsApp · .*?\d{2}\/\d{2} \d{2}:\d{2}: /, "").replace(/^🤖 ALFY · /, "")); return robo ? textoAlfy(tx) : `<p>${esc(tx)}</p>`; })()}</div></div>`;
}
function iaHTML(m) {
  if (m.papel === "user") return `<div class="c4 pede"><span class="av4">${ini(eu().nome)}</span><div class="c4b"><div class="c4h"><b>Você → 🐙 ALFY</b><span>${quandoFoi(m.em)}</span>${menuApagar("i" + m.id)}</div><p>${esc(m.texto)}</p></div></div>`;
  const aberto = s.menuIa === String(m.id);
  return `<div class="c4 alfy"><span class="av4">🐙</span><div class="c4b"><div class="c4h"><b>ALFY</b><span>${quandoFoi(m.em)}</span><button class="mais4" type="button" data-menuia="${m.id}" aria-label="Opções" aria-expanded="${aberto}">⋯</button></div>${textoAlfy(m.texto)}
    ${aberto ? `<div class="menu4"><button type="button" data-copiarmsg="${m.id}">Copiar</button>${comando() ? `<button type="button" data-apagar="i${m.id}">Apagar</button>` : ""}${Object.keys(CAMPOS).map((k) => `<button type="button" data-usar="${m.id}" data-campo="${k}">Usar em ${{ assist: "Resumo", instr: "Instruções", resultado: "Resultado", como_esta: "Status" }[k]}</button>`).join("")}</div>` : ""}</div></div>`;
}
function histHTML(e) {
  const t = e.acao === "status" ? (e.dados?.nova ? "lançou a rota" : `moveu para ${ST[e.para]?.nome || e.para}`) : e.acao === "editar" ? "editou " + Object.keys(e.dados?.campos || {}).map((k) => CAMPO_NOME[k] || k).join(", ") : { comentario: "comentou", orientacao: "deu uma orientação", whatsapp: "respondeu no WhatsApp", anexo: "anexou um arquivo" }[e.acao] || evTexto({ tipo: e.acao, para: e.para, dados: e.dados || {} });
  return `<li><span class="h4q">${ddmm(e.em)} ${hhmm(e.em)}</span><b>${esc(curto(e.quem || "ALFY"))}</b> ${esc(t)}</li>`;
}
function linhaD(ic, rot, controle) { return `<label class="lin3"><span class="ic">${ic}</span><span class="rot">${rot}</span><span class="val">${controle}</span></label>`; }
const NOME_CAMPO4 = { assist: "Resumo", instr: "Instruções", resultado: "Resultado esperado", como_esta: "📍 Em que pé está" };
function campo4(r, k, cls) {
  const v = k === "instr" ? instrDe(r) : r[COLUNA[k]] || "", ed = s.editando === k;
  return `<div class="f4c ${cls || ""}"><div class="f4h"><h4>${NOME_CAMPO4[k]}</h4>${ed ? "" : `<span>${podeCampo(k) ? `<button class="lk" type="button" data-editar="${k}">Editar</button>` : ""}${comando() ? `<button class="lk ia" type="button" data-iacampo="${k}" title="Pedir ao ALFY para escrever">🐙</button>` : ""}</span>`}</div>
    ${ed ? `<textarea id="ed-${k}" rows="5">${esc(v)}</textarea><div class="b3ed"><button class="btn turq peq" type="button" data-salvar="${k}">Salvar</button><button class="btn peq" type="button" data-cancelar="1">Cancelar</button></div>`
      : `<p class="${v ? "" : "vazio"}">${v ? esc(v) : k === "como_esta" ? "Ninguém contou ainda em que pé está." : "Vazio."}</p>`}</div>`;
}
const DIAS_LEM = () => { const h = new Date(), am = new Date(h); am.setDate(h.getDate() + 1); const sg = new Date(h); sg.setDate(h.getDate() + ((8 - h.getDay()) % 7 || 7)); return [["hoje", "Hoje", h], ["amanha", "Amanhã", am], ["segunda", "Segunda " + sg.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), sg]]; };
const HORAS_LEM = [9, 10, 12, 14, 16, 17];
function folha() {
  const r = s.cartao; if (!r) return;
  const pz = prazoInfo(r), ger = gerenteDe(r.frente), pode = manda(), ord = s.ordemFolha || [r.rt], i = Math.max(0, ord.indexOf(r.rt));
  const eb = ETAPA_BOT[r.status] || ETAPA_BOT.rota, lem = lembreteDe(r.rt), rod = s.esperando["rota:" + r.rt];
  const reus = (M.reunioes || []).filter((x) => x.status !== "encerrada");
  const desde = s.vistoAntes || "9999", ehNova = (c) => c.em > desde && c.quem !== eu().nome && c.origem !== "alfy";
  const novas = (r.lista_comentarios || []).filter(ehNova).length;
  const tempo = [...(r.lista_comentarios || []).map((c) => ({ em: c.em, h: comentHTML(c, ehNova(c)) })), ...(comando() ? (r.ia || []).map((m) => ({ em: m.em, h: iaHTML(m) })) : [])].sort((a, b) => String(a.em).localeCompare(String(b.em)));
  const conv = s.convTudo ? tempo : tempo.slice(-8), hist = [...(r.historico || [])].reverse(), histV = s.histTudo ? hist : hist.slice(0, 6);
  const ld = s.lemDia || "amanha", lh = s.lemHora ?? 9;
  const comp = !!r.inicio;
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha v3 v4" role="dialog" aria-modal="true" aria-label="${esc(nomeRota(r.rt))}">
    <div class="corpo" id="corpo-folha"><div class="cab3"><div class="col3">
      <div class="cab3-nav"><button class="voltar3" type="button" data-acao="fechar"><span>‹</span>${{ rotas: "Rotas", agenda: "Agenda", feed: "Feed", pautas: "Pautas", comandos: "Comandos", equipe: "Equipe", eu: "Eu" }[s.aba] || "Voltar"}</button>${ord.length > 1 ? `<span class="pos3">${i + 1} de ${ord.length}</span>` : ""}<span class="espaco"></span><button class="fechar4" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
      <div class="cab4">${tag(r)}<div class="cab4t"><h2>${esc(r.titulo)}</h2></div></div>
      <nav class="ancoras3" aria-label="Seções">${SECOES_F.map(([k, n]) => `<button type="button" data-irf="${k}" aria-current="${k === "fazer"}">${n}${k === "interagir" ? (novas ? ` <small class="novas4">${novas} nova${novas > 1 ? "s" : ""}</small>` : tempo.length ? ` <small>${tempo.length}</small>` : "") : ""}${k === "lembrete" && lem ? " ⏰" : ""}</button>`).join("")}</nav></div></div>
    <div class="col3">
      <section class="secao3" id="f-fazer">
        <div class="selos4"><span class="sl4 st-${r.status}"><i></i>${ST[r.status].um}</span>${r.prioridade ? `<span class="sl4">${prioTxt(r.prioridade)}</span>` : ""}<span class="sl4 ${pz.cls}">📅 ${pz.txt}</span><span class="sl4">👤 ${esc(curto(nomeDe(r.responsavel_id)))}${r.co_responsavel_id ? " + " + esc(curto(nomeDe(r.co_responsavel_id))) : ""}</span>${(() => { const v = valorRota(r); return v ? `<button type="button" class="sl4 pts" data-irf="det-tipo" title="Quanto esta rota vale no Placar">🏆 ${v.feito ? "" : "vale "}${(v.feito || v.mod === 1 ? (v.feito ? v.pts : v.base) : v.pts).toLocaleString("pt-BR")} pts</button>` : ""; })()}${r.repete ? `<span class="sl4">🔁 ${REPETE_TXT[r.repete]}</span>` : ""}${r.sensivel ? '<span class="sl4">🔒 só eu</span>' : ""}</div>
        ${campo4(r, "assist", "resumo4")}${campo4(r, "instr")}${campo4(r, "resultado")}
        ${campo4(r, "como_esta", "agora4")}
      </section>
      <section class="secao3 conv-sec" id="f-interagir"><div class="f4h"><h3>Conversa</h3>${comando() && r.rt.startsWith("RT-") ? `<button class="lk" type="button" data-acao="rastrear-cartao" title="Procura no WhatsApp, no e-mail e no Drive o que foi dito sobre esta rota">📡 Buscar novidades</button>` : ""}</div>
        ${tempo.length > conv.length ? `<button class="lk" type="button" data-acao="conv-tudo">Ver ${tempo.length - conv.length} anteriores</button>` : ""}
        <div class="conv4">${conv.map((x) => x.h).join("") || '<p class="nota" style="margin:0">Ninguém escreveu ainda.</p>'}${rod ? '<div class="c4 alfy"><span class="av4">🐙</span><div class="c4b"><p class="pensa4">lendo e atualizando a rota…</p></div></div>' : ""}</div>
        ${comando() ? (() => { const sug = s.rr?.itens?.[r.rt]?.sugestao, resp = curto(nomeDe(r.responsavel_id));
          const op = [sug ? ["👉 " + sug, sug] : null, r.responsavel_id && pessoa(r.responsavel_id)?.papel !== "comando" ? [`✍️ Escrever cobrança para ${resp}`, `Escreva uma mensagem curta de WhatsApp cobrando ${resp} sobre esta rota, sem pressionar`] : null, tempo.length > 3 ? ["🧾 Resumir a conversa", "Resuma a conversa desta rota em 3 linhas e atualize o Como está agora"] : null, ["📍 Atualizar o status", "Atualize o Como está agora com o que já se sabe da rota"]].filter(Boolean);
          return `<div class="alfy4"><span class="alfy4t">🐙 O ALFY pode</span><div class="alfy4o">${op.map(([n, t]) => `<button class="chip" type="button" data-rap="${esc(t)}">${esc(n)}</button>`).join("")}</div></div>`; })() : ""}
        <form class="escrever4" id="f-coment"><textarea id="t-coment" rows="2" placeholder="${comando() ? "Conte o que aconteceu ou o próximo passo (o ALFY atualiza a rota), ou peça algo ao ALFY" : "Conte como está ou o próximo passo. O ALFY atualiza a rota."}">${esc(s.rascunhoRota || "")}</textarea>
          <div class="acoes4b"><button class="btn turq peq" type="submit" data-tipoc="comentario">💬 Comentar</button>${comando() ? `<button class="lk" type="button" data-acao="coment-alfy">🐙 Pedir ao ALFY</button>` : ""}${pode ? `<button class="lk" type="submit" data-tipoc="orientacao">🧭 Dar como orientação</button>` : ""}</div></form></section>
      <section class="secao3" id="f-detalhes"><div class="f4h"><h3>Detalhes</h3>${comando() ? `<button class="anel4" type="button" data-acao="det-alfy" title="O ALFY preenche os detalhes com o que entendeu da rota">🐙<span>Preencher</span></button>` : ""}</div><div class="det3 ${pode ? "" : "so-leitura"}">
        <div class="grupo3"><small>Quem</small>${linhaD("🗺️", "Frente", `<select data-prop="frente">${opc(FRENTES.map((f) => [f, frenteCurta(f)]), r.frente, "Sem frente")}</select>`)}${linhaD("👤", "Responsável", `<select data-prop="responsavel_id">${opc(gente(), r.responsavel_id, "Sem dono")}</select>`)}${linhaD("🤝", "Junto com", `<select data-prop="co_responsavel_id">${opc(gente(), r.co_responsavel_id, "Ninguém")}</select>`)}${comando() ? `<div class="lin3"><span class="ic">${r.sensivel ? "🔒" : "👥"}</span><span class="rot">Quem vê</span><span class="val"><button class="chip" type="button" data-acao="sensivel" aria-pressed="${!!r.sensivel}">${r.sensivel ? "Só eu" : "Equipe da rota"}</button></span></div>` : ""}${ger ? `<p class="nota3">Gerente da frente: ${esc(ger.nome)}</p>` : ""}</div>
        <div class="grupo3"><small>Quando e quanto</small>${linhaD("⚡", "Prioridade", `<select data-prop="prioridade">${opc(PRIORIDADES, r.prioridade, "Sem prioridade")}</select>`)}${linhaD("📅", "Prazo", `<input type="date" data-prop="prazo" value="${dia(r.prazo)}">`)}${linhaD("🔁", "Repete", `<select data-prop="repete">${opc([["", "Pontual"], ["diaria", "Diária"], ["semanal", "Semanal"], ["quinzenal", "Quinzenal"], ["mensal", "Mensal"], ["sob_demanda", "Quando precisar"]], r.repete || "")}</select>`)}
          ${r.repete === "semanal" ? `<div class="dias-sem" style="padding:0 12px 10px">${DIAS_SEM.map((n, k) => `<label><input type="checkbox" data-repetedia="1" value="${k + 1}" ${(r.repete_dias || []).includes(k + 1) ? "checked" : ""}>${n}</label>`).join("")}</div>` : ""}
          ${linhaD("💰", "Custo", `<input data-bud="1" value="${esc(r.budget_valor || "")}" placeholder="sem custo">`)}
          ${r.budget_valor || r.budget_status !== "sem custo" ? `<div class="bud3">${BUDGET_ST.map((x) => `<button type="button" class="chip" data-budst="${x}" aria-pressed="${r.budget_status === x}" ${(x === "aprovado" || x === "recusado") && !comando() ? "disabled" : ""}>${x}</button>`).join("")}</div>` : ""}</div>
        <div class="grupo3" id="f-det-tipo"><small>Tipo e pontos</small>${linhaD("🏷️", "Tipo", `<select data-prop="tipo">${opc(TIPOS, r.tipo, "Sem tipo")}</select>`)}${linhaD("🧭", "Natureza", `<select data-prop="natureza">${opc(NATUREZAS, r.natureza, "Sem natureza")}</select>`)}${linhaD("💥", "Impacto", `<select data-prop="impacto">${opc(NIVEIS, r.impacto, "Sem")}</select>`)}${linhaD("🏋️", "Dificuldade", `<select data-prop="esforco">${opc(["Fácil", "Simples", "Difícil", "Muito difícil"].concat(["Baixo", "Médio", "Alto"].includes(r.esforco) ? [r.esforco] : []), r.esforco, "Sem")}</select>`)}${comando() ? linhaD("⭐", "Qualidade da entrega", `<select data-prop="qualidade">${opc(["Acima", "Como esperado", "Abaixo"], r.qualidade, "Como esperado (padrão)")}</select>`) : ""}${valeHTML(r)}</div>
        <div class="grupo3"><small>📎 Arquivos</small>${(r.anexos || []).map((x) => `<div class="lin3"><span class="ic">${/pdf/.test(x.tipo || "") ? "📄" : /image/.test(x.tipo || "") ? "🖼️" : "📎"}</span><span class="rot" style="min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(x.nome)}</span><span class="val"><button class="mini" type="button" data-baixar="${x.id}">Baixar</button><button class="mini" type="button" data-tiraranexo="${x.id}" aria-label="Tirar">✕</button></span></div>`).join("")}
          <label class="lin3" style="cursor:pointer"><span class="ic">＋</span><span class="rot">Anexar arquivo</span><input type="file" id="rota-arq" multiple hidden></label><span id="rota-arq-prog" class="nota3"></span></div>
        <div class="grupo3"><small>🗓️ Pauta e reunião</small><div class="lin3"><span class="rot">Levar para</span><span class="val val-w">${(r.pautas || []).map((id) => { const p = (M.pautas || []).find((x) => x.id === id); return p ? `<button class="chip" type="button" data-irpauta="${id}">${esc(p.titulo)}</button>` : ""; }).join("")}${(r.reunioes || []).map((id) => { const x = reuniaoDe(id); return x ? `<button class="chip" type="button" data-irreuniao="${id}">${esc(x.titulo)}</button>` : ""; }).join("")}${pode ? `<button class="chip" type="button" data-acao="pauta-da-rota">＋ pauta</button>${reus.length ? `<select data-levarreuniao="1"><option value="">＋ reunião</option>${reus.filter((x) => !(r.reunioes || []).includes(x.id)).map((x) => `<option value="${x.id}">${esc(x.titulo)}</option>`).join("")}</select>` : ""}` : ""}</span></div>
</div>
      </div></section>
      <section class="secao3" id="f-lembrete"><h3>⏰ Lembrete</h3>
        ${lem ? `<div class="lem4"><p>${tocando(r) ? "🔔 Chegou a hora do lembrete" : `⏰ Vou te lembrar ${quandoFoi(lem.quando).replace(/^hoje/, "hoje às")}. A rota volta para a sua lista nessa hora.`}</p><button class="chip" type="button" data-lemfeito="${lem.id}">${tocando(r) ? "✓ Visto" : "Tirar"}</button></div>`
          : `<div class="lem5"><div class="seg5">${DIAS_LEM().map(([k, n]) => `<button type="button" data-lemdia="${k}" aria-pressed="${ld === k}">${n.replace("Segunda ", "Seg ")}</button>`).join("")}</div>
            <div class="seg5">${HORAS_LEM.map((h) => `<button type="button" data-lemhora="${h}" aria-pressed="${lh === h && !s.lemHoraTxt}">${h}h</button>`).join("")}<button type="button" data-acao="lem-outro" aria-pressed="${!!s.lemOutro}">Outro</button></div>
            <button class="btn turq peq" type="button" data-acao="lem-confirmar">Lembrar</button></div>
            ${s.lemOutro ? `<div class="rapidas3"><input type="date" id="lem-dia" value="${s.lemData || ""}" aria-label="Dia"><input type="time" id="lem-hora" value="${s.lemHoraTxt || ""}" aria-label="Hora"></div>` : ""}
            <p class="nota5">Até a hora escolhida, a rota sai da sua lista.</p>`}
        <div class="comp5">${comp && !s.compEditando ? `<span>📅 Compromisso: <b>${new Date(r.inicio).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: FUSO })} · ${hhmm(r.inicio)}${r.fim ? "–" + hhmm(r.fim) : ""}</b>${r.onde ? " · " + esc(r.onde) : ""}</span><button class="lk" type="button" data-acao="comp-editar">Mudar</button><button class="lk" type="button" data-acao="comp-tirar">Tirar da agenda</button>`
          : s.compEditando ? `<div class="rapidas3"><input type="date" id="cp-dia" value="${comp ? dia(r.inicio) : hojeDia()}"><input type="time" id="cp-ini" value="${comp ? hhmm(r.inicio) : "09:00"}"><input type="time" id="cp-fim" value="${r.fim ? hhmm(r.fim) : ""}" aria-label="Até"><input id="cp-onde" value="${esc(r.onde || "")}" placeholder="Onde" class="nota4"><button class="btn turq peq" type="button" data-acao="comp-salvar">Pôr na agenda</button><button class="lk" type="button" data-acao="comp-cancelar">Cancelar</button></div>`
          : `<button class="lk" type="button" data-acao="comp-editar">📅 Virar compromisso na agenda</button><span class="nota5">tem dia e hora e entra na Agenda</span>`}</div></section>
      <section class="secao3 ultima" id="f-historico"><h3>Histórico</h3><ul class="hist4">${histV.map(histHTML).join("") || "<li>Sem registro.</li>"}</ul>${hist.length > histV.length ? `<button class="lk" type="button" data-acao="hist-tudo">Ver todo o histórico (${hist.length})</button>` : ""}</section>
    </div></div>
    <nav class="barra3" aria-label="Ações da rota">${(() => { const bt = [
        r.status === "concluida" ? `<button type="button" class="b3" data-mover="andamento"><span>↺</span>Reabrir</button>` : `<button type="button" class="b3 princ" data-mover="${eb[2]}"><span>${eb[0]}</span>${eb[1]}</button>`,
        `<button type="button" class="b3" data-acao="ir-escrever"><span>💬</span>Interagir</button>`,
        comando() ? `<button type="button" class="b3 ia" data-acao="ir-alfy"><span>🐙</span>Pedir</button>` : "",
        comando() && r.rt.startsWith("RT-") ? `<button type="button" class="b3" data-acao="rastrear-cartao"><span>📡</span>Rastrear</button>` : "",
        r.status === "concluida" || !r.rt.startsWith("RT-") ? "" : `<button type="button" class="b3" data-agdar="${r.rt}"><span>📅</span>${r.inicio ? hhmm(r.inicio) : "Agendar"}</button>`,
        `<button type="button" class="b3 lem" data-irf="lembrete"><span>⏰</span>Lembrar</button>`,
        r.status === "concluida" ? "" : `<button type="button" class="b3 ok" data-mover="concluida"><span>✓</span>Concluir</button>`].filter(Boolean);
      return `<div class="col3 barra3-in" style="grid-template-columns:36px repeat(${bt.length},minmax(0,1fr)) 36px"><button type="button" class="seta3" data-fnav="-1" ${i > 0 ? "" : "disabled"} aria-label="Rota anterior">‹</button>${bt.join("")}<button type="button" class="seta3" data-fnav="1" ${i < ord.length - 1 ? "" : "disabled"} aria-label="Próxima rota">›</button></div>`; })()}</nav>
  </section></div>`;
  ligarAncoras();
}
async function lembrar(quando) {
  const rt = s.aberta, nota = $("#lem-nota")?.value || "";
  M.lembretes = await chamar("alfy_lembrar", { p_rt: rt, p_quando: quando.toISOString(), p_nota: nota });
  aviso(`⏰ Vou te lembrar ${quandoFoi(quando.toISOString()).replace(/^hoje/, "hoje às")}. A rota sai da sua lista até lá`);
  await recarregarCartao(); refolha(); await recarregar(); render();
}

function LEM_RAPIDOS() {
  const ag = new Date(), h = (d, hh) => { const x = new Date(d); x.setHours(hh, 0, 0, 0); return x; };
  const amanha = new Date(ag); amanha.setDate(ag.getDate() + 1);
  const seg = new Date(ag); seg.setDate(ag.getDate() + ((8 - ag.getDay()) % 7 || 7));
  const l = [["em 1 hora", new Date(ag.getTime() + 3600e3)]];
  if (ag.getHours() < 16) l.push(["hoje 17h", h(ag, 17)]);
  l.push(["amanhã 8h", h(amanha, 8)], ["segunda 8h", h(seg, 8)]);
  return l;
}
// a aba de seção acende conforme a parte do cartão que está na tela
function ligarAncoras() {
  const c = $("#corpo-folha"); if (!c) return;
  const marcar = () => {
    const topo = c.getBoundingClientRect().top + ($(".cab3")?.offsetHeight || 0) + 24; let atual = "fazer";
    SECOES_F.forEach(([k]) => { const el = $("#f-" + k); if (el && el.getBoundingClientRect().top <= topo) atual = k; });
    if (c.scrollTop + c.clientHeight >= c.scrollHeight - 4) atual = "historico";
    document.querySelectorAll(".ancoras3 [data-irf]").forEach((b) => b.setAttribute("aria-current", b.dataset.irf === atual));
  };
  c.addEventListener("scroll", marcar, { passive: true }); marcar();
}
// bolhas dos lembretes: aparecem quando falta menos de 1 hora; várias juntam numa só
function bolhas() {
  let el = $("#bolhas"); if (!el) { el = document.createElement("div"); el.id = "bolhas"; document.body.append(el); }
  const agora = Date.now(), perto = (M?.lembretes || []).filter((l) => new Date(l.quando) - agora < 3600e3);
  if (!perto.length) { el.innerHTML = ""; return; }
  const hora = (l) => new Date(l.quando) <= agora, toca = perto.some(hora);
  const um = (l) => `<button type="button" class="bolha ${hora(l) ? "hora" : ""}" data-abrirlem="${l.rt}" aria-label="Abrir ${esc(nomeRota(l.rt))}">${num(l.rt)}<small>${hora(l) ? "agora" : hhmm(l.quando)}</small></button>`;
  el.innerHTML = perto.length > 1 && !s.bolhasAbertas ? `<button type="button" class="bolha mae ${toca ? "hora" : ""}" data-bolhas="1" aria-label="Lembretes">${toca ? "🔔" : "⏰"}<span class="cont">${perto.length}</span></button>`
    : `${perto.length > 1 ? `<button type="button" class="bolha mae" data-bolhas="0" aria-label="Fechar">✕</button>` : ""}${perto.map(um).join("")}`;
  el.className = s.bolhasAbertas ? "aberto" : "";
}
setInterval(() => { if (M) bolhas(); }, 30000);

function refolha() { const c = $("#corpo-folha"), y = c ? c.scrollTop : 0; folha(); const n = $("#corpo-folha"); if (n) n.scrollTop = y; }
async function abrir(rt, navegando) {
  if (!navegando) { const vistos = [...new Set([...document.querySelectorAll("#conteudo [data-rt]")].map((x) => x.dataset.rt))]; s.ordemFolha = vistos.includes(rt) ? vistos : [rt]; }
  s.apagando = null; s.vistoAntes = vistoDe(rt); marcarVisto(rt); s.lemOutro = false;
  s.lembrando = false; s.convTudo = false; s.histTudo = false; s.compEditando = false; s.menuIa = null; s.lemDia = "amanha"; s.lemHora = 9; s.lemHoraTxt = ""; s.lemData = "";
  s.aberta = rt; s.abaFolha = "ficha"; s.editando = null; s.rascunhoRota = "";
  try { s.cartao = await chamar("alfy_cartao", { p_rt: rt }); if (!s.cartao) { aviso("Você não tem acesso a essa rota", true); return; } folha(); } catch (e) { falhou(e); }
}
async function recarregarCartao() { if (!s.aberta) return; const c = await chamar("alfy_cartao", { p_rt: s.aberta }); if (c) { s.cartao = c; s.aberta = c.rt; } }
function fechar() { $("#camada").innerHTML = ""; s.aberta = null; s.cartao = null; s.editando = null; }

// ---------------------------------------------------------------- formulários
function novaRota(pre = {}) {
  fechar();
  const st = pre.status || (manda() ? "rota" : "ideia");
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha" role="dialog" aria-modal="true" aria-label="Nova rota">
    <div class="cab"><span class="tag nova"><small>ROTA</small><b>＋</b></span><h2>${st === "ideia" ? "Nova ideia" : "Nova rota"}</h2><button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
    <form class="corpo" id="f-nova">
      <label><p class="rotulo">Título</p><input id="n-tit" class="busca" style="width:100%" value="${esc(pre.titulo || "")}" placeholder="Ex.: Trocar a contabilidade"></label>
      <label><p class="rotulo">🎯 O que fazer · é o texto que vai no Mapa de Rotas</p><textarea id="n-assist" class="busca" rows="4" style="width:100%" placeholder="${comando() ? "Escreva do seu jeito, pode ser corrido: quem faz, o quê, até quando, contexto. O ALFY organiza." : "Na sua voz, falando com quem faz."}">${esc(pre.assist || "")}</textarea></label>
      ${comando() ? `<label class="chip ia-org" style="cursor:pointer;align-self:flex-start;white-space:normal"><input type="checkbox" id="n-ia" ${pre.semIA ? "" : "checked"} style="margin-right:6px">🐙 O ALFY organiza: arruma o título e o O que fazer, preenche Instruções e Resultado e acerta dono, frente, prioridade e prazo pelo que você escreveu. Desmarque para salvar exatamente como está.</label>` : ""}
      <div class="form-linha"><label><p class="rotulo">🔁 Pontual ou recorrente?</p><select id="n-rep" class="busca" style="width:100%">${opc([["", "Pontual (uma vez só)"], ["diaria", "🔁 Diária"], ["semanal", "🔁 Semanal"], ["quinzenal", "🔁 Quinzenal"], ["mensal", "🔁 Mensal"], ["sob_demanda", "🔁 Quando precisar (reativo com um toque)"]], pre.repete || "")}</select></label><div id="n-dias" hidden><p class="rotulo">Em quais dias</p><div class="dias-sem">${DIAS_SEM.map((n, i) => `<label><input type="checkbox" class="n-dia-sem" value="${i + 1}">${n}</label>`).join("")}</div></div></div>
      ${manda() ? `<div class="cadeia"><div class="elo"><small>🗺️ Frente</small><select id="n-frente">${opc(FRENTES.map((f) => [f, frenteCurta(f)]), pre.frente || (eu().frentes || [])[0] || "", "Sem frente")}</select></div><span class="seta">›</span>
        <div class="elo"><small>👤 Responsável</small><select id="n-resp">${opc(gente(), pre.responsavel_id || eu().id)}</select></div><span class="seta">›</span>
        <div class="elo"><small>🤝 Co-responsável</small><select id="n-co">${opc(gente(), "", "Ninguém")}</select></div></div>
      <div class="props"><div class="dado"><small>Prioridade</small><select id="n-prio">${opc(PRIORIDADES, pre.prioridade || "⏳ P3 · 7 dias")}</select></div><div class="dado"><small>Prazo</small><input id="n-prazo" type="date" value="${esc(pre.prazo || "")}"></div><div class="dado"><small>Vai para</small><select id="n-st">${opc([["rota", "Rotas"], ["ideia", "Ideias"]], st)}</select></div></div>${comando() ? '<label class="chip" style="cursor:pointer;align-self:flex-start"><input type="checkbox" id="n-sens" style="margin-right:6px">🔒 Só eu vejo (processo, saúde, sócio, assunto sobre gerente)</label>' : ""}` : '<p class="nota" style="margin:0">Entra como ideia. Quem coordena a frente transforma em rota.</p>'}
      <label class="chip" style="cursor:pointer;align-self:flex-start"><input type="checkbox" id="n-comp" ${pre.compromisso ? "checked" : ""} style="margin-right:6px">📅 É compromisso com dia e hora (vai para a agenda, não entra no Mapa de Rotas)</label>
      <div id="n-quando" ${pre.compromisso ? "" : "hidden"} class="form-linha"><label><p class="rotulo">Dia</p><input id="n-dia" type="date" class="busca" style="width:100%" value="${esc(pre.dia || hojeDia())}"></label><label><p class="rotulo">Das · às</p><span style="display:flex;gap:6px"><input id="n-hi" type="time" class="busca" style="flex:1" value="09:00"><input id="n-hf" type="time" class="busca" style="flex:1" value="10:00"></span></label><label style="grid-column:1/-1"><p class="rotulo">Onde</p><input id="n-onde" class="busca" style="width:100%" placeholder="Local ou link"></label></div>
      <p class="nota" style="margin:0">Depois de salvar, a rota abre para você completar Instruções, Resultado esperado e Budget.</p>
      <div><button class="cta" type="submit">Salvar</button></div></form></section></div>`;
  setTimeout(() => $("#n-tit")?.focus(), 50);
  $("#f-nova").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const bt = $("#f-nova .cta"); if (bt.disabled) return;
    bt.disabled = true; const bt0 = bt.textContent; bt.textContent = "Salvando…";
    const solta = () => { bt.disabled = false; bt.textContent = bt0; };
    const v = (id) => $("#" + id)?.value || "";
    const campos = { titulo: v("n-tit").trim(), assist: v("n-assist").trim(), frente: v("n-frente"), responsavel_id: v("n-resp"), co_responsavel_id: v("n-co"),
      prioridade: v("n-prio"), prazo: v("n-prazo") ? v("n-prazo") + "T12:00:00-03:00" : "", status: v("n-st") || "ideia", sensivel: !!$("#n-sens")?.checked,
      repete: v("n-rep"), repete_dias: [...document.querySelectorAll(".n-dia-sem:checked")].map((x) => x.value) };
    const organizar = !!$("#n-ia")?.checked, tit0 = campos.titulo, txt0 = campos.assist;
    if (!campos.titulo && !campos.assist) { aviso("Escreva o título ou o que fazer", true); solta(); return; }
    if (!campos.titulo) campos.titulo = campos.assist.split("\n")[0].slice(0, 90);
    if (campos.repete && campos.repete !== "sob_demanda" && !campos.prazo) campos.prazo = hojeDia() + "T18:00:00-03:00";
    if ($("#n-comp")?.checked && v("n-dia")) Object.assign(campos, { inicio: `${v("n-dia")}T${v("n-hi") || "09:00"}:00-03:00`, fim: v("n-hf") ? `${v("n-dia")}T${v("n-hf")}:00-03:00` : "", onde: v("n-onde"), tipo: "📅 Compromisso", status: "rota", prioridade: campos.prioridade, frente: campos.frente || (comando() ? "🧍 Pessoal" : "") });
    try {
      const c = await chamar("alfy_nova_rota", { p_campos: campos });
      if (pre.depois) await pre.depois(c.rt);
      if (organizar) {   // o ALFY reescreve e completa a rota a partir do texto como foi escrito
        const q = await chamar("alfy_pedir", { p_tipo: "ia", p_escopo: "rota:" + c.rt, p_dados: { agir: true, texto: `Organize esta rota nova a partir do que eu escrevi. Título: «${tit0 || "(vazio)"}». Texto: «${txt0 || "(vazio)"}». Reescreva o título no formato "Pessoa: verbo + o quê", o O que fazer na minha voz falando com quem faz (1 ou 2 frases), e preencha Instruções e Resultado esperado só com o que o texto diz. Se o texto disser quem faz, junto com quem, frente, prioridade ou prazo, ajuste. Não invente nada.` } });
        s.esperando["rota:" + c.rt] = q.id;
      }
      // abre a rota na hora; a lista se atualiza por trás (fica na aba em que a pessoa estava)
      aviso(organizar ? "Salvo. O ALFY está organizando a rota…" : "Salvo");
      await abrir(c.rt); if (organizar) { s.abaFolha = "alfy"; refolha(); }
      recarregar().then(async () => { if (s.aba === "agenda") await carregarAgenda(); render(); }).catch(falhou);
    } catch (e) { falhou(e); solta(); }
  });
}
function formReuniao(re) {
  fechar();
  const q = re?.quando ? new Date(re.quando) : null;
  const d0 = q ? q.toLocaleDateString("en-CA", { timeZone: FUSO }) : "", h0 = q ? q.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: FUSO }) : "";
  const g = new Set(re?.gente || [eu().id]);
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha" role="dialog" aria-modal="true" aria-label="Reunião">
    <div class="cab"><span class="tag ideia"><small>REUNIÃO</small><b>🗓️</b></span><h2>${re ? "Editar reunião" : "Nova reunião"}</h2><button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
    <form class="corpo" id="f-reuniao">
      <label><p class="rotulo">Título</p><input id="r-tit" class="busca" style="width:100%" value="${esc(re?.titulo || "")}" placeholder="Ex.: Reunião geral da VDB" required></label>
      <div class="form-linha"><label><p class="rotulo">Dia</p><input id="r-dia" type="date" class="busca" style="width:100%" value="${d0}"></label><label><p class="rotulo">Hora</p><input id="r-hora" type="time" class="busca" style="width:100%" value="${h0}"></label></div>
      <label><p class="rotulo">Onde</p><input id="r-onde" class="busca" style="width:100%" value="${esc(re?.onde || "")}" placeholder="House, VDB, online…"></label>
      <div><p class="rotulo">Quem participa (só quem participa vê a reunião)</p><div class="gente-sel">${(M.pessoas || []).filter((p) => p.nome !== "ALFY").map((p) => `<label class="chip" style="cursor:pointer"><input type="checkbox" value="${p.id}" ${g.has(p.id) ? "checked" : ""} style="margin-right:6px">${esc(p.nome)}</label>`).join("")}</div></div>
      <div><button class="cta" type="submit">Salvar</button></div></form></section></div>`;
  $("#f-reuniao").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const dd = $("#r-dia").value, hh = $("#r-hora").value || "09:00";
    const campos = { titulo: $("#r-tit").value.trim(), onde: $("#r-onde").value.trim(), quando: dd ? `${dd}T${hh}:00-03:00` : "",
      gente: [...document.querySelectorAll("#f-reuniao input[type=checkbox]:checked")].map((x) => x.value) };
    try { const r = await chamar("alfy_reuniao_salvar", { p_id: re?.id || null, p_campos: campos }); fechar(); await recarregar(); s.aba = "pautas"; s.pauta = null; s.reuniao = r.id; render(); aviso("Reunião salva"); } catch (e) { falhou(e); }
  });
}
function formPauta(p, pre = {}) {
  fechar();
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha" role="dialog" aria-modal="true" aria-label="Pauta">
    <div class="cab"><span class="tag ideia"><small>PAUTA</small><b>＋</b></span><h2>${p ? "Editar pauta" : "Nova pauta"}</h2><button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
    <form class="corpo" id="f-pauta">
      <label><p class="rotulo">Assunto</p><input id="p-tit" class="busca" style="width:100%" value="${esc(p?.titulo || pre.titulo || "")}" placeholder="Ex.: Motor do Flex: 300 ou 350?" required></label>
      <div class="form-linha"><label><p class="rotulo">Tipo</p><select id="p-tipo" class="busca" style="width:100%">${opc(Object.entries(PTIPO), p?.tipo || pre.tipo || "conversar")}</select></label>
        <label><p class="rotulo">Reunião</p><select id="p-reu" class="busca" style="width:100%">${opc((M.reunioes || []).filter((x) => x.status !== "encerrada").map((x) => [String(x.id), x.titulo + " · " + quandoReuniao(x)]), String(p?.reuniao_id || pre.reuniao_id || ""), "Sem reunião ainda")}</select></label></div>
      <label><p class="rotulo">Frente</p><select id="p-frente" class="busca" style="width:100%">${opc(FRENTES.map((f) => [f, frenteCurta(f)]), p?.frente || pre.frente || "", "Sem frente")}</select></label>
      <label><p class="rotulo">Do que se trata</p><textarea id="p-det" class="busca" rows="4" style="width:100%" placeholder="O contexto, o que precisa ser decidido ou compartilhado.">${esc(p?.detalhe || pre.detalhe || "")}</textarea></label>
      <div><button class="cta" type="submit">Salvar</button></div></form></section></div>`;
  $("#f-pauta").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const campos = { titulo: $("#p-tit").value.trim(), tipo: $("#p-tipo").value, detalhe: $("#p-det").value.trim(), reuniao_id: $("#p-reu").value, frente: $("#p-frente").value, ...(pre.rt ? { rt: pre.rt } : {}) };
    try { const r = await chamar("alfy_pauta_salvar", { p_id: p?.id || null, p_campos: campos }); fechar(); await recarregar(); s.aba = "pautas"; s.reuniao = null; await abrirPauta(r.id); aviso("Pauta salva"); if (pre.depois) pre.depois(r.id); } catch (e) { falhou(e); }
  });
}
async function abrirPauta(id) { s.pauta = id; s.pautaDet = null; render(); try { s.pautaDet = await chamar("alfy_pauta", { p_id: id }); } catch (e) { falhou(e); } render(); scrollTo(0, 0); }


// ---------------------------------------------------------------- agenda (semana em kanban e mês)
const REPETE = [["", "Não se repete"], ["diaria", "Todo dia"], ["semanal", "Toda semana"], ["quinzenal", "A cada 15 dias"], ["mensal", "Todo mês"]];
const DIAS_SEM = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const ehCompromisso = (r) => !!r.inicio || r.tipo === "📅 Compromisso";
const segundaDe = (d) => { const x = new Date(d.toLocaleDateString("en-CA", { timeZone: FUSO }) + "T12:00:00-03:00"); const dw = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dw); return x; };
const diaISO = (d) => d.toLocaleDateString("en-CA", { timeZone: FUSO });
function proximaJS(d, repete, dias) {
  const x = new Date(d);
  if (repete === "diaria") { x.setDate(x.getDate() + 1); return x; }
  if (repete === "quinzenal") { x.setDate(x.getDate() + 14); return x; }
  if (repete === "mensal") { x.setMonth(x.getMonth() + 1); return x; }
  if (!dias || !dias.length) { x.setDate(x.getDate() + 7); return x; }
  for (let i = 1; i <= 7; i++) { const y = new Date(d); y.setDate(y.getDate() + i); const iso = ((y.getDay() + 6) % 7) + 1; if (dias.includes(iso)) return y; }
  x.setDate(x.getDate() + 7); return x;
}
function intervaloAgenda() {
  const base = s.agBase || segundaDe(new Date());
  if (s.agVista === "mes") { const m = new Date(base); const ini = new Date(m.getFullYear(), m.getMonth(), 1, 12); const de = segundaDe(ini); const ate = new Date(de); ate.setDate(ate.getDate() + 42); return { de, ate, mes: m.getMonth() }; }
  const ate = new Date(base); ate.setDate(ate.getDate() + 7); return { de: base, ate };
}
async function carregarAgenda() {
  const { de, ate } = intervaloAgenda();
  const de0 = new Date(de); de0.setHours(0, 0, 0, 0); de0.setHours(de0.getHours() - 3);
  s.agDados = await chamar("alfy_agenda", { p_de: de0.toISOString(), p_ate: new Date(ate.getTime() + 3 * 3600e3).toISOString() }).catch((e) => { falhou(e); return null; });
}
// Agenda em kanban (aprovada 05/11): uma coluna por dia, cartões em ordem de horário, "Sem horário" no fim da coluna.
// k: comp (📅 compromisso) · rota (rota com horário ou sem) · rotina (🔁) · reuniao · google. Detalhe abre por cima (folha).
const AG_TIPO = { comp: ["📅", "Compromisso"], rota: ["📍", "Rota"], rotina: ["🔁", "Rotina"], reuniao: ["🗓️", "Reunião"], google: ["📆", "Google"] };
function itensAgenda() {
  const d = s.agDados; if (!d) return {};
  const { de, ate } = intervaloAgenda(), por = {};
  s.agItens = {};
  const por0 = (iso, it) => { const k = dia(iso); (por[k] = por[k] || []).push(it); s.agItens[it.chave] = it; };
  for (const r of d.rotas || []) {
    const base = r.inicio || r.prazo;
    if (!base) continue;
    const k = r.repete ? "rotina" : r.tipo === "📅 Compromisso" ? "comp" : "rota";
    if (!r.inicio && !ABERTOS.includes(r.status)) continue;   // sem horário: só o que ainda está aberto
    const dur = r.inicio && r.fim ? new Date(r.fim) - new Date(r.inicio) : 0;
    const it = (quando, virtual) => ({ chave: "r:" + r.rt + (virtual ? ":" + quando : ""), k, quando, ini: r.inicio ? hhmm(quando) : "", fim: dur ? hhmm(new Date(new Date(quando).getTime() + dur).toISOString()) : "",
      titulo: r.titulo, rt: r.rt, st: r.status, virtual, onde: r.onde, prazo: r.prazo, rotas: r.liga_rotas || [], pautas: r.liga_pautas || [] });
    const b = new Date(base);
    if (b >= de && b < ate) por0(base, it(base, false));
    if (r.repete && ABERTOS.includes(r.status)) {   // próximas da série, só para ver (a rota de verdade abre quando a anterior conclui)
      let x = new Date(b);
      for (let i = 0; i < 60; i++) { x = proximaJS(x, r.repete, r.repete_dias); if (x >= ate) break; if (x >= de) por0(x.toISOString(), it(x.toISOString(), true)); }
    }
  }
  for (const re of d.reunioes || []) por0(re.quando, { chave: "re:" + re.id, k: "reuniao", quando: re.quando, ini: hhmm(re.quando), fim: "", titulo: re.titulo, id: re.id, onde: re.onde, gente: re.gente || [], rotas: re.liga_rotas || [], pautas: re.liga_pautas || [] });
  for (const g of d.google || []) por0(g.inicio, { chave: "g:" + g.id, k: "google", quando: g.inicio, ini: g.dia_todo ? "" : hhmm(g.inicio), fim: g.fim && !g.dia_todo ? hhmm(g.fim) : "", diaTodo: g.dia_todo, titulo: g.titulo, link: g.link, onde: g.onde, g, rotas: [], pautas: [] });
  for (const k in por) por[k].sort((a, b) => (a.ini || "99:99").localeCompare(b.ini || "99:99"));
  return por;
}
function itemAgendaHTML(it) {   // mês: linha curta
  const attr = it.k === "rota" || it.k === "rotina" ? `data-rt="${it.rt}"` : `data-agabrir="${esc(it.chave)}"`;
  return `<button type="button" class="ag-it ${it.k} ${it.virtual ? "virtual" : ""} ${it.st === "concluida" ? "feito" : ""}" ${attr}><span class="h">${it.ini || (it.diaTodo ? "dia todo" : "sem hora")}</span><span class="t">${AG_TIPO[it.k][0]} ${esc(it.titulo)}</span></button>`;
}
const agMin = (h) => { const [a, b] = (h || "0:0").split(":").map(Number); return a * 60 + b; };
function agCartao(it, hoje, agora) {
  const [ic, nome] = AG_TIPO[it.k];
  const abre = it.k === "rota" || it.k === "rotina" ? `data-rt="${it.rt}"` : `data-agabrir="${esc(it.chave)}"`;
  const arrasta = it.rt && !it.virtual ? `draggable="true" data-agarrasta="${it.rt}"` : "";
  const podeHora = it.rt && !it.virtual && (manda() || (rotaDe(it.rt) && podeMexer(rotaDe(it.rt))));
  if (!it.ini && !it.diaTodo) return `<div role="button" tabindex="0" class="agk-card agk-sem k-${it.k}" ${abre} ${arrasta}><span class="agk-rt">${ic} ${esc(nomeRota(it.rt))}</span><span class="agk-tt">${esc(it.titulo)}</span>${podeHora ? `<button class="agk-dar" type="button" data-agdar="${it.rt}">📅 Dar horário</button>` : ""}</div>`;
  const d0 = dia(it.quando), fimMin = it.fim ? agMin(it.fim) : agMin(it.ini) + 60;
  const passou = it.st === "concluida" || d0 < hoje || (d0 === hoje && fimMin <= agora), agoraJa = d0 === hoje && agMin(it.ini) <= agora && agora < fimMin;
  const meta = [it.onde && "📍 " + it.onde, (it.gente || []).length > 1 && "👥 " + it.gente.length].filter(Boolean).join("  ·  ");
  const chips = (it.rotas.length ? `<span>📍 ${it.rotas.length} ${it.rotas.length > 1 ? "rotas" : "rota"}</span>` : "") + (it.pautas.length ? `<span>💬 ${it.pautas.length} ${it.pautas.length > 1 ? "pautas" : "pauta"}</span>` : "");
  return `<div role="button" tabindex="0" class="agk-card k-${it.k} ${passou ? "passou" : ""} ${agoraJa ? "agora" : ""} ${it.virtual ? "virtual" : ""}" ${abre} ${arrasta}>
    <span class="agk-l1"><span class="agk-hora">${it.ini || "Dia todo"}${it.fim ? `<span class="agk-fim"> – ${it.fim}</span>` : ""}</span><span class="agk-ic" title="${nome}">${ic}</span></span>
    <span class="agk-tt">${esc(it.titulo)}</span>${meta ? `<span class="agk-mt">${esc(meta)}</span>` : ""}${chips ? `<span class="agk-chips">${chips}</span>` : ""}</div>`;
}
// detalhe do compromisso, da reunião ou do evento do Google, por cima da agenda
function agFolha(chave) {
  const it = s.agItens?.[chave]; if (!it) return;
  s.agAberto = chave;
  const [ic, nome] = AG_TIPO[it.k], dur = it.fim ? agMin(it.fim) - agMin(it.ini) : 0;
  const durTxt = dur ? (dur < 60 ? dur + " min" : Math.floor(dur / 60) + "h" + (dur % 60 ? String(dur % 60).padStart(2, "0") : "")) : "";
  const quando = it.ini ? `${it.ini}${it.fim ? " às " + it.fim : ""} <small>${[durTxt, ddmm(it.quando)].filter(Boolean).join(" · ")}</small>` : `<small>Dia todo · ${ddmm(it.quando)}</small>`;
  const lig = it.k === "comp" || it.k === "reuniao", pode = manda() || it.k === "reuniao" || (rotaDe(it.rt) && podeMexer(rotaDe(it.rt)));
  const rotas = it.rotas.map((r) => `<div class="agk-lig"><button type="button" class="agk-ir" data-rt="${r.rt}"><span class="agk-rt">${esc(nomeRota(r.rt))}</span><span class="agk-tt">${esc(r.titulo)}</span><span class="agk-abrir">Abrir ›</span></button>${pode ? `<button type="button" class="agk-tira" data-agtirarota="${r.rt}" aria-label="Tirar a ${esc(nomeRota(r.rt))} deste horário">✕</button>` : ""}</div>`).join("");
  const pautas = it.pautas.map((p) => `<div class="agk-lig"><button type="button" class="agk-ir" data-irpauta="${p.id}"><span class="agk-rt">Pauta</span><span class="agk-tt">${esc(p.titulo)}</span><span class="agk-abrir">Abrir ›</span></button>${pode && it.k === "comp" ? `<button type="button" class="agk-tira" data-agtirapauta="${p.id}" aria-label="Tirar a pauta">✕</button>` : ""}</div>`).join("");
  const opRotas = (M.rotas || []).filter((r) => r.rt !== it.rt && ABERTOS.includes(r.status) && !it.rotas.some((x) => x.rt === r.rt)).map((r) => `<option value="${esc(nomeRota(r.rt) + " · " + r.titulo)}"></option>`).join("");
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha agk-folha" role="dialog" aria-modal="true" aria-label="${esc(it.titulo)}">
    <div class="cab"><div class="agk-cabtxt"><span class="agk-tipo k-${it.k}">${ic} ${nome}</span><h2>${esc(it.titulo)}</h2><div class="agk-quando">${quando}</div>
      ${it.onde ? `<div class="agk-dado">📍 ${esc(it.onde)}</div>` : ""}${(it.gente || []).length ? `<div class="agk-dado">👥 ${esc(it.gente.join(", "))}</div>` : ""}</div>
      <button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
    <div class="corpo">
      ${lig ? `<div><p class="rotulo">Rotas deste ${it.k === "reuniao" ? "encontro" : "compromisso"}</p><div class="agk-ligados">${rotas || '<p class="nota" style="margin:0">Nenhuma rota ligada.</p>'}</div></div>
      <div><p class="rotulo">Pautas para levar</p><div class="agk-ligados">${pautas || '<p class="nota" style="margin:0">Nenhuma pauta.</p>'}</div></div>
      ${pode ? `<div class="agk-add"><input id="agk-rota" class="busca" list="agk-rotas" placeholder="Ligar rota: número ou nome"><datalist id="agk-rotas">${opRotas}</datalist><button class="btn" type="button" data-agligarota="1">＋ Ligar rota</button></div>
      <div class="agk-add"><input id="agk-pauta" class="busca" placeholder="Nova pauta: o assunto para levar"><button class="btn" type="button" data-agnovapauta="1">＋ Nova pauta</button></div>` : ""}`
      : `<p class="nota" style="margin:0">${it.k === "google" ? "Evento do seu Google Agenda. Traga para o ALFY para ligar rotas e pautas." : ""}</p>`}
    </div>
    <div class="agk-acoes">${it.k === "google" ? `<button class="cta" type="button" data-agtrazer="${esc(chave)}">Trazer para o ALFY</button>${it.link ? `<a class="btn" href="${esc(it.link)}" target="_blank" rel="noopener">Abrir no Google</a>` : ""}`
      : it.k === "reuniao" ? `<button class="cta" type="button" data-irreuniao="${it.id}">🗓️ Abrir a reunião</button>`
      : `${pode ? `<button class="btn" type="button" data-agdar="${it.rt}">📅 Mudar horário</button>` : ""}<button class="btn" type="button" data-rt="${it.rt}">✏️ Abrir o compromisso</button>`}</div>
  </section></div>`;
}
// ⏰ Dar horário (ou mudar): dia, começa e quanto tempo; a rota mantém o prazo e o tipo
function agDarHorario(rt) {
  const r = rotaDe(rt) || (s.agDados?.rotas || []).find((x) => x.rt === rt); if (!r) { aviso("Não achei essa rota", true); return; }
  const dur = r.inicio && r.fim ? Math.round((new Date(r.fim) - new Date(r.inicio)) / 60000) : 60;
  s.agDur = [15, 30, 60, 90, 120].includes(dur) ? dur : 60;
  const d0 = r.inicio ? dia(r.inicio) : r.prazo ? dia(r.prazo) : hojeDia();
  $("#camada").innerHTML = `<div class="veu" id="veu"><section class="folha agk-folha" role="dialog" aria-modal="true" aria-label="Dar horário">
    <div class="cab"><div class="agk-cabtxt"><span class="agk-tipo k-rota">📅 ${r.inicio ? "Mudar horário" : "Dar horário"}</span><h2>${esc(r.titulo)}</h2><div class="agk-dado">${esc(nomeRota(r.rt))}${r.prazo ? " · prazo " + ddmm(r.prazo) : ""}</div></div>
      <button class="fechar" type="button" data-acao="fechar" aria-label="Fechar">${IC.x}</button></div>
    <form class="corpo" id="agk-f-hora">
      <div class="form-linha"><label><p class="rotulo">Dia</p><input id="agk-dia" type="date" class="busca" style="width:100%" value="${d0}" required></label><label><p class="rotulo">Começa</p><input id="agk-ini" type="time" step="900" class="busca" style="width:100%" value="${r.inicio ? hhmm(r.inicio) : "09:00"}" required></label></div>
      <div><p class="rotulo">Quanto tempo</p><div class="agk-durs">${[15, 30, 60, 90, 120].map((m) => `<button type="button" data-agdur="${m}" aria-pressed="${s.agDur === m}">${m < 60 ? m + " min" : Math.floor(m / 60) + "h" + (m % 60 ? "30" : "")}</button>`).join("")}</div></div>
      <p class="nota" style="margin:0">A rota continua na lista de Rotas com o mesmo prazo. Ela só ganha o horário e entra na coluna do dia, na ordem da hora.</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="cta" type="submit">Salvar horário</button>${r.inicio && r.tipo !== "📅 Compromisso" ? `<button class="btn" type="button" data-agsemhora="${r.rt}">Tirar o horário</button>` : ""}</div>
    </form></section></div>`;
  $("#agk-f-hora").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const bt = $("#agk-f-hora .cta"); if (bt.disabled) return; bt.disabled = true;
    const dd = $("#agk-dia").value, hi = $("#agk-ini").value || "09:00", fimMin = agMin(hi) + s.agDur;
    const ini = new Date(`${dd}T${hi}:00-03:00`), fim = new Date(ini.getTime() + s.agDur * 60000);
    try {
      await chamar("alfy_editar", { p_rt: r.rt, p_campos: { inicio: ini.toISOString(), fim: fim.toISOString() } });
      fechar(); aviso(`📅 ${nomeRota(r.rt)}: ${ddmm(ini.toISOString())}, ${hi} às ${hhmm(fim.toISOString())}`);
      if (fimMin > 24 * 60) aviso("Passou da meia-noite: confira o horário", true);
      await recarregar(); if (s.aba === "agenda") await carregarAgenda(); render();
    } catch (e) { falhou(e); bt.disabled = false; }
  });
}
async function agLigar(campos) {
  const it = s.agItens?.[s.agAberto]; if (!it) return;
  if (it.k === "reuniao") {
    if (campos.p_rt) await chamar("alfy_reuniao_rota", { p_reuniao: it.id, p_rt: campos.p_rt, p_ligar: !campos.p_tirar });
    if (campos.titulo) await chamar("alfy_pauta_salvar", { p_id: null, p_campos: { titulo: campos.titulo, reuniao_id: String(it.id) } });
  } else {
    let pauta = campos.p_pauta || null;
    if (campos.titulo) pauta = (await chamar("alfy_pauta_salvar", { p_id: null, p_campos: { titulo: campos.titulo } })).id;
    await chamar("alfy_agenda_ligar", { p_comp: it.rt, p_rt: campos.p_rt || null, p_pauta: pauta, p_tirar: !!campos.p_tirar });
  }
  const chave = s.agAberto; await carregarAgenda(); render(); itensAgenda(); agFolha(chave);
}
// arrastar o cartão para outro dia: mantém o horário (ou muda o prazo, se ainda não tem horário)
function ligarAgendaKanban() {
  const k = $("#ag-semana"); if (!k || k.dataset.ligado) return; k.dataset.ligado = "1";
  let x0 = null;   // celular: deslizar troca o dia dentro da semana
  k.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  k.addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) < 70) return;
    const bs = [...document.querySelectorAll("[data-agsel]")], i = bs.findIndex((b) => b.getAttribute("aria-selected") === "true"), j = i + (dx < 0 ? 1 : -1);
    if (bs[j]) { s.agDia = bs[j].dataset.agsel; render(); } }, { passive: true });
  k.addEventListener("dragstart", (e) => { const el = e.target.closest("[data-agarrasta]"); if (!el) return; el.classList.add("arrastando"); e.dataTransfer.setData("text/plain", el.dataset.agarrasta); });
  k.addEventListener("dragend", (e) => { const el = e.target.closest("[data-agarrasta]"); el && el.classList.remove("arrastando"); });
  k.querySelectorAll(".coluna").forEach((col) => {
    col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("alvo"); });
    col.addEventListener("dragleave", (e) => { if (!col.contains(e.relatedTarget)) col.classList.remove("alvo"); });
    col.addEventListener("drop", async (e) => {
      e.preventDefault(); col.classList.remove("alvo");
      const rt = e.dataTransfer.getData("text/plain"), r = (s.agDados?.rotas || []).find((x) => x.rt === rt), novo = col.dataset.agcoldia; if (!r || !novo) return;
      const muda = (iso) => iso ? new Date(`${novo}T${hhmm(iso)}:00-03:00`).toISOString() : "";
      const campos = r.inicio ? { inicio: muda(r.inicio), fim: muda(r.fim) } : { prazo: `${novo}T12:00:00-03:00` };
      if (r.inicio ? dia(r.inicio) === novo : dia(r.prazo) === novo) return;
      try { await chamar("alfy_editar", { p_rt: rt, p_campos: campos }); aviso(`${nomeRota(rt)} foi para ${ddmm(novo + "T12:00:00-03:00")}`); await carregarAgenda(); await recarregar(); render(); } catch (er) { falhou(er); }
    });
  });
}
function vistaAgenda() {
  const { de, mes } = intervaloAgenda(), por = itensAgenda(), hoje = hojeDia();
  const titulo = s.agVista === "mes" ? new Date((s.agBase || new Date()).getTime() + 6 * 864e5).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: FUSO }).replace(/^./, (c) => c.toUpperCase()).replace(" De ", " de ")
    : `${ddmm(de.toISOString())} a ${ddmm(new Date(de.getTime() + 6 * 864e5).toISOString())}`;
  const g = s.agDados?.google_em;
  const barra = `<div class="ag-barra"><div class="alterna" role="group"><button type="button" data-agvista="semana" aria-pressed="${s.agVista !== "mes"}">Semana</button><button type="button" data-agvista="mes" aria-pressed="${s.agVista === "mes"}">Mês</button></div>
    <div class="ag-nav"><button class="btn peq" type="button" data-agnav="-1" aria-label="Anterior">‹</button><button class="btn peq" type="button" data-agnav="0">Hoje</button><button class="btn peq" type="button" data-agnav="1" aria-label="Próxima">›</button><b>${esc(titulo)}</b></div>
    <span class="espaco"></span><button class="cta" type="button" data-acao="novo-compromisso">＋ Compromisso</button></div>
    ${comando() && !g ? '<p class="nota ag-leg" style="margin:0 0 10px">📆 O Google Agenda ainda não está ligado: Comandos › Ler o e-mail e a agenda.</p>' : ""}`;
  if (!s.agDados) return barra + `<div class="carregando">Carregando a agenda…</div>`;
  if (s.agVista === "mes") {
    const dias = Array.from({ length: 42 }, (_, i) => { const x = new Date(de); x.setDate(x.getDate() + i); return x; });
    return barra + `<div class="ag-mes">${DIAS_SEM.map((n) => `<div class="ag-cab">${n}</div>`).join("")}${dias.map((x) => { const k = diaISO(x), l = por[k] || []; return `<div class="ag-dia ${x.getMonth() !== mes ? "fora" : ""} ${k === hoje ? "hoje" : ""}"><span class="n">${x.getDate()}</span>${l.slice(0, 4).map(itemAgendaHTML).join("")}${l.length > 4 ? `<button class="ag-mais" type="button" data-agdia="${k}">+${l.length - 4}</button>` : ""}</div>`; }).join("")}</div>`;
  }
  const dias = Array.from({ length: 7 }, (_, i) => { const x = new Date(de); x.setDate(x.getDate() + i); return x; });
  const agora = agMin(hhmm(new Date().toISOString())), ks = dias.map(diaISO);
  const sel = ks.includes(s.agDia) ? s.agDia : ks.includes(hoje) ? hoje : ks[0];   // no celular: um dia por vez, escolhido na faixa
  const faixa = `<div class="agk-dias" role="tablist">${dias.map((x, i) => { const k = ks[i], n = (por[k] || []).length;
    return `<button type="button" role="tab" data-agsel="${k}" aria-selected="${k === sel}" class="${k === hoje ? "hoje" : ""} ${k < hoje ? "foi" : ""}"><small>${DIAS_SEM[i]}</small><b>${x.getDate()}</b><i>${"•".repeat(Math.min(n, 3))}</i></button>`; }).join("")}</div>`;
  return barra + faixa + `<div class="agk7" id="ag-semana">${dias.map((x, i) => {
    const k = ks[i], l = por[k] || [], com = l.filter((it) => it.ini || it.diaTodo), sem = l.filter((it) => !it.ini && !it.diaTodo);
    let marca = k === hoje ? com.findIndex((it) => !it.diaTodo && agMin(it.ini) > agora) : -2; if (marca === -1) marca = com.length;
    const linhaAgora = `<div class="agk-agora"><span>${hhmm(new Date().toISOString())}</span></div>`;
    const cards = com.map((it, j) => (j === marca ? linhaAgora : "") + agCartao(it, hoje, agora)).join("") + (marca === com.length && com.length ? linhaAgora : "");
    return `<section class="agk-col ${k === hoje ? "hoje" : ""} ${k < hoje ? "foi" : ""} ${k === sel ? "agk-on" : ""}" data-agcoldia="${k}">
      <header><span class="agk-dn">${DIAS_SEM[i]}</span><b class="agk-dd">${x.getDate()}</b><span class="espaco"></span><button class="agk-mais" type="button" data-agnovo="${k}" title="Compromisso neste dia" aria-label="Compromisso em ${ddmm(x.toISOString())}">＋</button></header>
      <div class="agk-lista">${cards || (sem.length ? "" : '<p class="agk-vazio">Livre</p>')}${sem.length ? `<div class="agk-divisa">Sem horário · ${sem.length}</div>${sem.map((it) => agCartao(it, hoje, agora)).join("")}` : ""}</div></section>`;
  }).join("")}</div>`;
}

// ---------------------------------------------------------------- gravação de reunião (PCM 16 kHz mono, sobe em pedaços enquanto grava)
const grav = { ctx: null, proc: null, fonte: null, stream: null, buf: [], amostras: 0, anexo: null, inicio: 0, fila: Promise.resolve(), relogio: null, trava: null };
function pcm16(f32, de) {
  const r = de / 16000, n = Math.floor(f32.length / r), out = new Int16Array(n);
  for (let i = 0; i < n; i++) { const v = f32[Math.floor(i * r)]; out[i] = Math.max(-1, Math.min(1, v)) * 0x7fff; }
  return out;
}
function enviarPedacoGravacao(final) {
  if (!grav.buf.length) return grav.fila;
  const total = grav.buf.reduce((n, b) => n + b.length, 0), junto = new Int16Array(total); let o = 0;
  grav.buf.forEach((b) => { junto.set(b, o); o += b.length; }); grav.buf = [];
  const blob = new Blob([junto.buffer]);
  grav.fila = grav.fila.then(async () => {
    const b64 = await base64(blob);
    if (!grav.anexo) grav.anexo = (await chamar("alfy_anexar", { p_nome: `gravação ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.pcm`, p_tipo: "audio/pcm16", p_base64: b64 })).id;
    else await chamar("alfy_anexar_parte", { p_id: grav.anexo, p_base64: b64 });
  }).catch((e) => aviso("Falhou ao subir um pedaço da gravação: " + e.message, true));
  return grav.fila;
}
async function gravarReuniao() {
  if (grav.ctx) { pararReuniao(); return; }
  try {
    grav.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    grav.ctx = new (window.AudioContext || window.webkitAudioContext)();
    grav.fonte = grav.ctx.createMediaStreamSource(grav.stream);
    grav.proc = grav.ctx.createScriptProcessor(4096, 1, 1);
    grav.proc.onaudioprocess = (e) => { const p = pcm16(e.inputBuffer.getChannelData(0), grav.ctx.sampleRate); grav.buf.push(p); grav.amostras += p.length; if (grav.amostras - (grav.enviadas || 0) > 16000 * 30) { grav.enviadas = grav.amostras; enviarPedacoGravacao(); } };
    grav.fonte.connect(grav.proc); grav.proc.connect(grav.ctx.destination);
    grav.inicio = Date.now(); grav.reuniao = s.reuniao; grav.anexo = null; grav.amostras = 0; grav.enviadas = 0;
    try { grav.trava = await navigator.wakeLock?.request("screen"); } catch (_) { /* sem trava de tela */ }
    grav.relogio = setInterval(() => { const el = $("#grav-tempo"); if (el) { const sg = Math.floor((Date.now() - grav.inicio) / 1000); el.textContent = `${Math.floor(sg / 60)}:${String(sg % 60).padStart(2, "0")}`; } }, 1000);
    render();
  } catch (_) { aviso("Não consegui usar o microfone. Libere o acesso no navegador.", true); }
}
async function pararReuniao() {
  clearInterval(grav.relogio);
  try { grav.proc.disconnect(); grav.fonte.disconnect(); grav.stream.getTracks().forEach((t) => t.stop()); grav.ctx.close(); } catch (_) { /* já parado */ }
  try { grav.trava?.release(); } catch (_) { /* */ }
  grav.ctx = null; aviso("Subindo a gravação…");
  await enviarPedacoGravacao(true);
  if (grav.anexo) { await chamar("alfy_reuniao_anexo", { p_reuniao: grav.reuniao, p_anexo: grav.anexo }); aviso("Gravação guardada. O ALFY vai transcrever e escrever a ata."); }
  grav.anexo = null; await recarregar(); await carregarReuniao(); render();
}
async function subirGrande(file) {
  const parte = 4 * 1024 * 1024; let id = null;
  for (let i = 0; i < file.size; i += parte) {
    const b64 = await base64(file.slice(i, i + parte));
    if (!id) id = (await chamar("alfy_anexar", { p_nome: file.name, p_tipo: file.type || "application/octet-stream", p_base64: b64 })).id;
    else await chamar("alfy_anexar_parte", { p_id: id, p_base64: b64 });
    const el = $("#plaud-prog"); if (el) el.textContent = `subindo ${Math.min(100, Math.round(((i + parte) / file.size) * 100))}%`;
  }
  return id;
}
async function carregarReuniao() { if (s.reuniao) s.reuniaoDet = await chamar("alfy_reuniao", { p_id: s.reuniao }).catch(() => s.reuniaoDet); }
function ataHTML(re, det) {
  const j = det?.ata_json, ped = det?.pedido, rodando = ped && (ped.status === "fila" || ped.status === "rodando");
  const lista = (t, l, cls) => (l && l.length ? `<p class="rotulo" style="margin-top:12px">${t}</p><ul class="ata-l ${cls || ""}">${l.map((x) => `<li>${esc(rotaTxt(x))}</li>`).join("")}</ul>` : "");
  const ligadas = new Set(re.rotas || []);
  const rotasHTML = j?.rotas?.length ? `<p class="rotulo" style="margin-top:12px">Rotas que saem da reunião</p>${j.rotas.map((r, i) => { const feita = (M.rotas || []).find((x) => ligadas.has(x.rt) && x.titulo === r.titulo); return `<div class="sugestao ${feita ? "feita" : ""}"><div class="tx"><b>${esc(r.titulo)}</b><small>${esc(r.responsavel || "sem responsável")}${r.prazo ? " · até " + ddmm(r.prazo + "T12:00:00-03:00") : ""}</small></div>${feita ? `<small style="color:var(--aco)">virou ${esc(nomeRota(feita.rt))}</small>` : manda() ? `<button class="btn turq peq" type="button" data-atarota="${i}">Criar rota</button>` : ""}</div>`; }).join("")}` : "";
  return `<div class="ia-painel"><div class="t">🐙 Ata da reunião</div>
    ${rodando ? '<div class="ia-saida pensando">🐙 O ALFY está transcrevendo e escrevendo a ata. Uma reunião de 1 hora leva uns 15 minutos no Mac.</div>' : ""}
    ${ped?.status === "erro" ? `<div class="ia-saida" style="border-color:var(--verm)">Não deu: ${esc(ped.erro || "")}</div>` : ""}
    ${j ? `<div class="ata">${j.resumo ? `<p style="margin:0">${esc(rotaTxt(j.resumo))}</p>` : ""}${lista("✅ Decisões", j.decisoes)}${rotasHTML}${lista("💡 Conclusões", j.conclusoes)}${lista("⏳ Pendências", j.pendencias)}</div>` : re.ata ? `<div class="ia-saida">${esc(re.ata)}</div>` : '<p style="margin:0;color:#9ED9D2;font-size:14px">Grave a reunião aqui ou anexe a gravação ou o texto do PLAUD. No fim, o ALFY escreve a ata com decisões, rotas, conclusões e pendências.</p>'}
    <div style="display:flex;gap:8px;flex-wrap:wrap">${grav.ctx && grav.reuniao === re.id ? `<button class="btn" type="button" data-acao="gravar-reuniao" style="border-color:var(--verm)">⏹ Parar · <span id="grav-tempo">0:00</span></button>` : `<button class="btn turq" type="button" data-acao="gravar-reuniao">🎙️ Gravar reunião</button>`}
      <label class="btn" style="cursor:pointer">📎 Anexar do PLAUD<input type="file" id="plaud-arq" hidden accept="audio/*,.txt,.md,.srt,.vtt"></label>
      <button class="btn" type="button" data-acao="ata" ${rodando ? "disabled" : ""}>🐙 ${re.ata ? "Escrever a ata de novo" : "Escrever a ata"}</button>${re.ata ? '<button class="btn" type="button" data-acao="copiar-ata">Copiar a ata</button>' : ""}<span id="plaud-prog" class="nota" style="align-self:center"></span></div>
    ${det?.transcricao ? `<details><summary style="cursor:pointer;color:#9ED9D2;font-size:13px">Ver a transcrição</summary><div class="ia-saida" style="margin-top:6px;max-height:260px;overflow:auto">${esc(det.transcricao)}</div></details>` : ""}
    <p class="nota" style="margin:0">Na gravação, deixe a tela ligada. O áudio sobe a cada 30 segundos e, no fim, vai para o Drive 🗂️ ALFY · Arquivos › 00 Entrada.</p></div>`;
}

// ---------------------------------------------------------------- desenhar
function render() {
  if (!M) return;
  casca(); topo(); medidores(); bolhas();
  const c = $("#conteudo");
  c.innerHTML = { rotinas: vistaAbaRotinas, placar: vistaPlacar, zap: () => `<div style="max-width:900px">${zapHTML("")}</div>`, rotas: () => (s.vista === "rar" && comando() ? vistaRotaARota() : s.vista === "kanban" ? vistaKanban() : vistaLista()), feed: vistaFeed, agenda: vistaAgenda, equipe: vistaEquipe, pautas: vistaPautas, comandos: vistaComandos, eu: vistaEu }[s.aba]();
  if (s.aba === "rotas" && s.vista === "kanban") ligarKanban();
  if (s.aba === "agenda") ligarAgendaKanban();
  try { localStorage.setItem("alfy-vista", JSON.stringify({ vista: s.vista, agrupar: s.agrupar, v28: true })); } catch (_) { /* privado */ }
}
// não redesenha o que a pessoa está digitando: espera ela sair do campo
function renderSeguro() {
  const a = document.activeElement, dentro = a && $("#conteudo").contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) && a.id !== "busca";
  if (dentro) { s.pendente = true; return; }
  render();
}
async function recarregar() {
  const m = await chamar("alfy_mapa");
  if (!m) { sair(); return; }
  M = m; versao = m.versao;
  if (s.aba === "feed" || s.cmd === "bomdia" || !FEED) FEED = await chamar("alfy_feed", { p_limite: 150 }).catch(() => FEED);
  // pedidos que terminaram: traz o resultado
  for (const [escopo, pid] of Object.entries(s.esperando)) {
    const q = (M.fila || []).find((x) => x.id === pid);
    if (!q || q.status === "fila" || q.status === "rodando") continue;
    delete s.esperando[escopo];
    if (q.status === "erro") aviso("O robô não conseguiu: " + (q.erro || "erro").slice(0, 120), true);
    if (escopo === "geral") s.chatGeral = await chamar("alfy_ia_conversa", { p_escopo: "geral" });
    if (escopo.startsWith("rota:") && s.rastreando?.[escopo.slice(5)]) { const rt = escopo.slice(5); s.rastreando[rt] = false; const p = await chamar("alfy_pedido", { p_id: pid }); s.sugLinha = { ...(s.sugLinha || {}), [rt]: p?.resultado?.sugestao || "" }; }
    if (escopo.startsWith("rota:") && q.tipo === "entender" && !String(q.resumo || "").startsWith("entendeu")) { s.respLinha = { ...(s.respLinha || {}), [escopo.slice(5)]: "🐙 Li o comentário. Não tinha nada para mudar na rota." }; continue; }
    if (escopo.startsWith("rota:")) {   // cada rota guarda a sua resposta, mesmo com a caixa fechada ou outra aberta
      const rt = escopo.slice(5), conv = await chamar("alfy_ia_conversa", { p_escopo: escopo }), ult = [...conv].reverse().find((m) => m.papel === "assistant");
      if (ult) { s.respLinha = { ...(s.respLinha || {}), [rt]: ult.texto }; if (s.aba === "rotas" && s.aberta !== rt) aviso(`🐙 ${nomeRota(rt)}: pronto`); }
    }
  }
  const d = s.despejo;
  if (d.pedido) {
    const q = (M.fila || []).find((x) => x.id === d.pedido);
    if (q && (q.status === "feito" || q.status === "erro")) {
      const p = await chamar("alfy_pedido", { p_id: d.pedido });
      d.pedido = null;
      if (p.status === "erro") aviso("O despejo deu erro: " + (p.erro || "").slice(0, 120), true);
      else { d.itens = p.resultado?.itens || []; d.feitos = {}; d.transcricao = (p.resultado?.transcricao || []).map((t) => t.texto).join(" "); d.anexos = []; d.texto = ""; const rs = p.resultado?.resumo || ""; aviso(rs.startsWith("sem separar") ? rs.replace("sem separar: ", "Não separei: ") : "O ALFY separou o despejo", rs.startsWith("sem separar")); }
    }
  }
  // o resto não depende um do outro: vai tudo junto, em vez de um esperando o outro
  await Promise.all([
    comando() && chamar("alfy_robo").then((x) => { s.robo = x; }, () => {}),
    (s.cmd === "diario" || s.cmd === "bomdia") && s.aba === "comandos" && chamar("alfy_diario", { p_dias: 3 }).then((x) => { s.diario = x; }, () => {}),
    s.aba === "agenda" && carregarAgenda(),
    cuidaPessoas() && chamar("alfy_fichas").then((x) => { s.fichas = x; }, () => {}),
    s.reuniao && carregarReuniao(),
    s.aberta && recarregarCartao().then(() => { if (!ativoNaFolha()) refolha(); }),
    s.pauta && chamar("alfy_pauta", { p_id: s.pauta }).then((x) => { s.pautaDet = x; }, () => {}),
  ]);
}
const ativoNaFolha = () => { const a = document.activeElement; return a && $("#camada").contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName); };

// ---------------------------------------------------------------- ações
async function mover(rt, st) {
  const r = rotaDe(rt) || s.cartao; if (!r || r.status === st) return;
  try { const r2 = await chamar("alfy_mover", { p_rt: rt, p_status: st }); if (s.aberta === rt && r2?.rt) s.aberta = r2.rt; aviso(`${nomeRota(r2?.rt || rt)} foi para ${ST[st].nome}`); await recarregar(); render(); } catch (e) { falhou(e); }
}
async function editar(campos, msg) {
  try { s.cartao = await chamar("alfy_editar", { p_rt: s.aberta, p_campos: campos }); s.editando = null; aviso(msg || "Salvo"); refolha(); await recarregar(); render(); } catch (e) { falhou(e); }
}
// o comentário vira um pedido "entender" no banco; a tela acompanha para mostrar o que o ALFY mudou
function esperarEntender(rt) { const q = (M.fila || []).find((x) => x.tipo === "entender" && x.escopo === "rota:" + rt && (x.status === "fila" || x.status === "rodando")); if (q) { s.esperando["rota:" + rt] = q.id; s.respLinha = { ...(s.respLinha || {}), [rt]: "" }; } }
async function pedir(tipo, escopo, dados, chave) {
  try {
    const r = await chamar("alfy_pedir", { p_tipo: tipo, p_escopo: escopo || null, p_dados: dados || {} });
    if (chave) s.esperando[chave] = r.id;
    await recarregar();
    return r.id;
  } catch (e) { falhou(e); return null; }
}
async function falarNaRota(texto) {
  if (!texto.trim()) return;
  s.rascunhoRota = ""; s.abaFolha = "alfy";
  await pedir("ia", "rota:" + s.aberta, { texto, agir: true }, "rota:" + s.aberta);
  refolha(); const c = $("#corpo-folha"); if (c) c.scrollTop = c.scrollHeight;
}
function pessoaPorNome(n) {
  if (!n) return null;
  const a = n.toLowerCase().trim();
  const exatos = (M.pessoas || []).filter((p) => p.nome.toLowerCase() === a);
  if (exatos.length === 1) return exatos[0].id;
  const inicio = (M.pessoas || []).filter((p) => p.nome.toLowerCase().startsWith(a) || a.startsWith(p.nome.toLowerCase()));
  return inicio.length === 1 ? inicio[0].id : null;
}

// áudio: gravado ou anexado vira WAV 16 kHz mono no próprio aparelho (o robô transcreve com o Whisper do Mac)
let gravador = null, pedacos = [];
async function paraWav(blob) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const off = new OfflineAudioContext(1, Math.ceil(buf.duration * 16000), 16000);
  const src = off.createBufferSource(); src.buffer = buf; src.connect(off.destination); src.start();
  const out = (await off.startRendering()).getChannelData(0);
  ctx.close && ctx.close();
  const dv = new DataView(new ArrayBuffer(44 + out.length * 2));
  const w = (o, t) => [...t].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  w(0, "RIFF"); dv.setUint32(4, 36 + out.length * 2, true); w(8, "WAVE"); w(12, "fmt "); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, "data"); dv.setUint32(40, out.length * 2, true);
  for (let i = 0; i < out.length; i++) dv.setInt16(44 + i * 2, Math.max(-1, Math.min(1, out[i])) * 0x7fff, true);
  return new Blob([dv], { type: "audio/wav" });
}
async function base64(blob) {
  const b = new Uint8Array(await blob.arrayBuffer()); let s2 = "";
  for (let i = 0; i < b.length; i += 0x8000) s2 += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
  return btoa(s2);
}
async function subirAnexo(blob, nome, audio) {
  const d = s.despejo, item = { nome, audio, id: null }; d.anexos.push(item); render();
  try {
    let arq = blob, tipo = blob.type || "application/octet-stream";
    if (audio) { try { arq = await paraWav(blob); tipo = "audio/wav"; nome = nome.replace(/\.[^.]+$/, "") + ".wav"; } catch (_) { /* o Mac tenta converter */ } }
    if (arq.size > 10 * 1024 * 1024) throw new Error("Arquivo grande demais (máximo 10 MB).");
    const r = await chamar("alfy_anexar", { p_nome: nome, p_tipo: tipo, p_base64: await base64(arq) });
    item.id = r.id; item.nome = nome;
  } catch (e) { d.anexos = d.anexos.filter((x) => x !== item); falhou(e); }
  render();
}
async function gravar() {
  if (gravador) { gravador.stop(); return; }
  try {
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    gravador = new MediaRecorder(st); pedacos = [];
    gravador.ondataavailable = (e) => pedacos.push(e.data);
    gravador.onstop = () => { st.getTracks().forEach((t) => t.stop()); const blob = new Blob(pedacos, { type: gravador.mimeType || "audio/webm" }); gravador = null; s.gravando = false; subirAnexo(blob, `áudio ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.webm`, true); };
    gravador.start(); s.gravando = true; render();
  } catch (_) { aviso("Não consegui usar o microfone. Libere o acesso nas configurações do navegador.", true); }
}
async function despejar() {
  const d = s.despejo; d.texto = $("#desp-txt")?.value.trim() || d.texto;
  if (!d.texto && !d.anexos.length) { aviso("Escreva, grave ou anexe alguma coisa"); return; }
  if (d.anexos.some((a) => !a.id)) { aviso("Espere o anexo terminar de subir"); return; }
  d.itens = null; d.feitos = {};
  d.pedido = await pedir("despejo", null, { texto: d.texto, anexos: d.anexos.map((a) => a.id) });
  render();
}
async function usarItemDespejo(i) {
  const d = s.despejo, it = d.itens[i];
  const prazo = it.prazo && /^\d{4}-\d{2}-\d{2}$/.test(it.prazo) ? it.prazo : "";
  if (it.destino === "rota") { novaRota({ titulo: it.titulo, assist: it.o_que_fazer, responsavel_id: pessoaPorNome(it.responsavel) || eu().id, prazo, depois: async (rt) => { d.feitos[i] = "virou rota"; } }); return; }
  try {
    if (it.destino === "pauta") { await chamar("alfy_pauta_salvar", { p_id: null, p_campos: { titulo: it.titulo, tipo: "conversar" } }); d.feitos[i] = "virou pauta"; }
    else if (it.destino === "lembrete") { await chamar("alfy_nova_rota", { p_campos: { titulo: it.titulo, frente: "🧍 Pessoal", responsavel_id: eu().id, prazo: prazo ? prazo + "T12:00:00-03:00" : "", prioridade: "⚡ P2 · 72h", status: "rota" } }); d.feitos[i] = "virou rota sua na frente Pessoal"; }
    else d.feitos[i] = it.destino === "arquivo" ? "guardado" : "descartado";
    await recarregar(); render();
  } catch (e) { falhou(e); }
}

// ---------------------------------------------------------------- eventos
document.addEventListener("click", async (e) => {
  if (e.target.id === "veu") { fechar(); return; }
  const fl = e.target.closest("[data-fechalem]");
  if (fl && (e.target === fl || e.target.closest("button")?.dataset.fechalem)) { s.lembrando = false; refolha(); return; }
  const x = e.target.closest("[data-tiraopcao],[data-tiraanexo]");
  if (x) {
    e.stopPropagation();
    if (x.dataset.tiraanexo !== undefined) { s.despejo.anexos.splice(+x.dataset.tiraanexo, 1); render(); return; }
    const p = s.pautaDet, ops = [...(p.opcoes || [])]; ops.splice(+x.dataset.tiraopcao, 1);
    try { await chamar("alfy_pauta_salvar", { p_id: p.id, p_campos: { opcoes: ops, escolha: "" } }); await recarregar(); render(); } catch (er) { falhou(er); }
    return;
  }
  const b = e.target.closest("button,[role=button]"); if (!b || b.disabled) return;
  if (b.type === "submit") return;
  const d = b.dataset;
  if (b.classList.contains("ocupado")) return;   // clique repetido enquanto o pedido roda não faz nada
  b.classList.add("ocupado"); b.setAttribute("aria-busy", "true");
  try {
    if (b.id === "eu-av-cel") { s.aba = "eu"; render(); return; }
    if (d.aba) { s.aba = d.aba; s.pauta = null; s.reuniao = null; if (d.aba === "agenda") { render(); await carregarAgenda(); } if (d.aba === "equipe") { s.aprovado = null; if ((s.naveBusca || "").trim()) s.naveRes = await chamar("alfy_nave_buscar", { p_q: s.naveBusca }).catch(() => null); s.fichas = await chamar("alfy_fichas"); if (comando()) s.equipe = await chamar("alfy_equipe"); } if (d.aba === "feed") FEED = await chamar("alfy_feed", { p_limite: 150 }); if (d.aba === "zap") await carregarZap(); if (d.aba === "placar") await carregarPlacar(); if (d.aba === "rotinas") await carregarRotinas(); if (d.aba === "rotas" && s.vista === "rotinas") await carregarRotinas(); if (d.aba === "comandos" && s.cmd === "perguntar" && !s.chatGeral) s.chatGeral = await chamar("alfy_ia_conversa", { p_escopo: "geral" }); render(); scrollTo(0, 0); return; }
    if (d.vista) { s.vista = d.vista; if (d.vista === "rar") await rrCarregar(); if (d.vista === "rotinas") await carregarRotinas(); render(); return; }
    if (d.rrordem) { s.rr.ordem = d.rrordem; s.rr.foco = null; rrSalvar(); render(); return; }
    if (d.rrformato) { s.rr.formato = d.rrformato; rrSalvar(); render(); return; }
    if (d.rrfoco) { s.rr.foco = d.rrfoco; render(); setTimeout(rrNoLugar, 20); return; }
    if (d.irf) { const c = $("#corpo-folha"), el = $("#f-" + d.irf); if (c && el) c.scrollTo({ top: el.offsetTop - ($(".cab3")?.offsetHeight || 0) - 6 }); return; }
    if (d.fnav) { const ord = s.ordemFolha || [], k = ord.indexOf(s.aberta) + +d.fnav; if (ord[k]) { await abrir(ord[k], true); $("#corpo-folha")?.scrollTo({ top: 0 }); aviso(nomeRota(ord[k])); } return; }
    if (d.lemq) { const q = LEM_RAPIDOS().find(([n]) => n === d.lemq); if (q) await lembrar(q[1]); return; }
    if (d.lemfeito) { M.lembretes = await chamar("alfy_lembrete_feito", { p_id: +d.lemfeito }); refolha(); render(); aviso("Lembrete tirado"); return; }
    if (d.bolhas) { s.bolhasAbertas = d.bolhas === "1"; bolhas(); return; }
    if (d.abrirlem) { s.bolhasAbertas = false; const l = lembreteDe(d.abrirlem); if (l && new Date(l.quando) <= new Date()) M.lembretes = await chamar("alfy_lembrete_feito", { p_id: l.id }); bolhas(); abrir(d.abrirlem); return; }
    if (d.zapler !== undefined) { await pedir("zap", null, d.zapler ? { horas: +d.zapler } : {}); await carregarZap(); render(); aviso("Lendo o WhatsApp… leva de 1 a 2 minutos"); return; }
    if (d.apagarq !== undefined) { s.apagando = d.apagarq; refolha(); return; }
    if (d.apagar !== undefined) { const k = d.apagar; s.apagando = null; if (!k) { refolha(); return; } s.menuIa = null; s.cartao = await chamar("alfy_comentario_apagar", { p_id: +k.slice(1), p_ia: k[0] === "i" }); refolha(); aviso("Apagado"); recarregar().then(render); return; }
    if (d.menuia) { s.menuIa = s.menuIa === d.menuia ? null : d.menuia; refolha(); return; }
    if (d.lemdia) { s.lemDia = d.lemdia; refolha(); return; }
    if (d.lemhora) { s.lemHora = +d.lemhora; s.lemHoraTxt = ""; refolha(); return; }
    if (d.zapabre) { s.zapAberto = s.zapAberto === +d.zapabre ? null : +d.zapabre; render(); return; }
    if (d.zapmodo) { s.zapModo = d.zapmodo; render(); return; }
    if (d.rtnmodo) { s.rtnModo = d.rtnmodo; if (d.rtnmodo === "todas") await carregarRotinas(); render(); return; }
    if (d.rtnfoco) { s.rtnFoco = d.rtnfoco; render(); return; }
    if (d.rtnpular) { const t = await enviarRascunho(d.rtnpular); s.rtnPulou = { ...(s.rtnPulou || {}), [d.rtnpular]: true }; s.rtnFoco = null; render(); if (t) aviso("Comentário enviado"); return; }
    if (d.rtnfeita) { const rt = d.rtnfeita; await enviarRascunho(rt); await chamar("alfy_mover", { p_rt: rt, p_status: "concluida" }); s.rtnFoco = null; await recarregar(); await carregarRotinas(); render(); aviso(`✓ ${nomeRota(rt)} feita. Volta na próxima data.`); return; }
    if (d.rtnnao) { const rt = d.rtnnao, ta = document.getElementById("cl-" + rt.replace(/\W/g, "")), mot = (ta?.value || "").trim(); if (!mot) { aviso("Escreva no campo por que não deu, e toque de novo"); ta?.focus(); return; } ta.value = ""; await chamar("alfy_comentar", { p_rt: rt, p_texto: "✗ Não deu: " + mot, p_tipo: "comentario" }); s.rtnPulou = { ...(s.rtnPulou || {}), [rt]: true }; s.rtnFoco = null; await recarregar(); render(); aviso("Registrado. A rotina fica aberta."); return; }
    if (d.plmes) { s.placarMes = d.plmes; await carregarPlacar(); render(); return; }
    if (d.rodarrotina) { const r = await chamar("alfy_rotina_rodar", { p_serie: d.rodarrotina }); await recarregar(); await carregarRotinas(); render(); aviso(r.ja_aberta ? `Já tem uma aberta: ${nomeRota(r.rt)}` : `🔁 Rotina aberta: ${nomeRota(r.rt)}`); abrir(r.rt); return; }
    if (d.zapvisto) { s.zap = await chamar("alfy_zap_visto", { p_id: +d.zapvisto }); render(); return; }
    if (d.zaprota) { const z = (s.zap?.itens || []).find((x) => String(x.id) === d.zaprota); if (z) novaRota({ titulo: z.pede || z.conversa, assist: `${z.conversa}: ${z.pede || ""}\n${z.resumo || ""}` }); return; }
    if (d.rragendar) { s.rrAg = s.rrAg === d.rragendar ? null : d.rragendar; render(); return; }
    if (d.agpor || d.agprazo) {
      await enviarRascunho(d.agpor || d.agprazo);
      const rt = d.agpor || d.agprazo, dd = $("#ag-dia").value, hi = $("#ag-ini").value, hf = $("#ag-fim").value; if (!dd) { aviso("Escolha o dia"); return; }
      const campos = d.agpor ? { inicio: `${dd}T${hi || "09:00"}:00-03:00`, fim: hf ? `${dd}T${hf}:00-03:00` : "", tipo: "📅 Compromisso" } : { prazo: dd + "T12:00:00-03:00" };
      await chamar("alfy_editar", { p_rt: rt, p_campos: campos }); s.rrAg = null; aviso(d.agpor ? `📅 ${nomeRota(rt)} na agenda: ${ddmm(dd + "T12:00:00-03:00")} ${hi}` : `Prazo da ${nomeRota(rt)}: ${ddmm(dd + "T12:00:00-03:00")}`); await recarregar(); render(); return;
    }
    if (d.rrfeita) { const foi = await enviarRascunho(d.rrfeita); rrTirar(d.rrfeita, "feitas"); if (foi) aviso(`💬 Comentário enviado na ${nomeRota(d.rrfeita)}. O ALFY vai atualizar a rota`); return; }
    if (d.rrdepois) { const foi = await enviarRascunho(d.rrdepois); rrTirar(d.rrdepois, "depois"); aviso(nomeRota(d.rrdepois) + " ficou para depois" + (foi ? " · comentário enviado" : "")); return; }
    if (d.rrlista) { s.rr.formato = "lista"; s.rr.foco = d.rrlista; rrSalvar(); render(); setTimeout(() => $(".rr-item.foco")?.scrollIntoView({ block: "start", behavior: "smooth" }), 40); return; }
    if (d.rraplicar) { const rt = d.rraplicar, t = s.rr.itens[rt]?.sugestao; if (!t) return; s.rr.itens[rt].sugestao = ""; s.rr.foco = rt; s.respLinha = { ...(s.respLinha || {}), [rt]: "" }; await pedir("ia", "rota:" + rt, { texto: t, agir: true }, "rota:" + rt); render(); return; }
    if (d.zapir) { document.getElementById(d.zapir)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }
    if (d.rrf) { const f = rrF(), l = f[d.rrf]; f[d.rrf] = l.includes(d.rrfv) ? l.filter((x) => x !== d.rrfv) : [...l, d.rrfv]; s.rr.foco = null; rrSalvar(); render(); return; }
    if (d.rrftira) { s[d.rrftira] = ""; s.rr.foco = null; render(); return; }
    if (d.rrmodo) { s.rr.modo = d.rrmodo; s.rr.foco = null; rrSalvar(); render(); return; }
    if (d.agsel) { s.agDia = d.agsel; render(); return; }
    if (d.agnovo) { novaRota({ compromisso: true, dia: d.agnovo }); return; }
    if (d.agvista) { s.agVista = d.agvista; s.agDados = null; render(); await carregarAgenda(); render(); return; }
    if (d.agnav !== undefined) { const n = +d.agnav, b = s.agBase || segundaDe(new Date()); if (n === 0) { s.agBase = segundaDe(new Date()); s.agDia = hojeDia(); } else if (s.agVista === "mes") { const m = new Date(b.getTime() + 6 * 864e5); m.setMonth(m.getMonth() + n, 1); s.agBase = segundaDe(m); } else { const x = new Date(b); x.setDate(x.getDate() + 7 * n); s.agBase = x; } s.agDados = null; s.agRolou = n !== 0; render(); await carregarAgenda(); render(); return; }
    if (d.agdia) { s.agVista = "semana"; s.agBase = segundaDe(new Date(d.agdia + "T12:00:00-03:00")); s.agDados = null; render(); await carregarAgenda(); render(); return; }
    if (d.google !== undefined) { if (d.google) window.open(d.google, "_blank", "noopener"); else aviso("Compromisso do Google Agenda"); return; }
    if (d.atarota !== undefined) { const r = s.reuniaoDet.ata_json.rotas[+d.atarota], rid = s.reuniao; novaRota({ titulo: r.titulo, assist: r.o_que_fazer, responsavel_id: pessoaPorNome(r.responsavel) || eu().id, prazo: r.prazo || "", depois: async (rt) => { await chamar("alfy_reuniao_rota", { p_reuniao: rid, p_rt: rt, p_ligar: true }); } }); return; }
    if (d.st) { s.st = d.st; render(); return; }
    if (d.verconc) { s.aba = "rotas"; s.vista = "lista"; s.st = "concluida"; s.busca = ""; s.prio = ""; render(); scrollTo(0, 0); return; }
    if (d.subir || d.descer) { moverOrdem(d.subir || d.descer, d.subir ? -1 : 1); return; }
    if (d.prio) { s.prio = d.prio === "todas" ? "" : d.prio; if (s.prio && s.agrupar === "frente") s.agrupar = "prioridade"; render(); return; }
    if (d.ffeed) { s.fFeed = d.ffeed; render(); return; }
    if (d.ligar) { const rt = d.lrt; s.buscaRota = ""; if (d.ligar === "reuniao") await chamar("alfy_reuniao_rota", { p_reuniao: s.reuniao, p_rt: rt, p_ligar: true }); else await chamar("alfy_pauta_ligar", { p_pauta: s.pauta, p_rt: rt, p_ligar: true }); await recarregar(); render(); aviso(nomeRota(rt) + " ligada"); return; }
    // agenda em kanban
    if (d.agabrir) { itensAgenda(); agFolha(d.agabrir); return; }
    if (d.agdar) { agDarHorario(d.agdar); return; }
    if (d.agdur) { s.agDur = +d.agdur; document.querySelectorAll("[data-agdur]").forEach((y) => y.setAttribute("aria-pressed", y === b)); return; }
    if (d.agsemhora) { await chamar("alfy_editar", { p_rt: d.agsemhora, p_campos: { inicio: "", fim: "" } }); fechar(); aviso(`${nomeRota(d.agsemhora)} voltou para Sem horário`); await carregarAgenda(); await recarregar(); render(); return; }
    if (d.agligarota) {
      const v = ($("#agk-rota")?.value || "").trim(), n = (v.match(/(\d+)/) || [])[1];
      const r = n ? (M.rotas || []).find((x) => x.rt === "RT-" + n) : (M.rotas || []).find((x) => x.titulo.toLowerCase() === v.toLowerCase());
      if (!r) { aviso("Escreva o número da rota (ex.: 549) ou escolha da lista", true); return; }
      await agLigar({ p_rt: r.rt }); aviso(`${nomeRota(r.rt)} ligada`); return;
    }
    if (d.agnovapauta) { const t = ($("#agk-pauta")?.value || "").trim(); if (!t) { aviso("Escreva o assunto da pauta", true); return; } await agLigar({ titulo: t }); aviso("Pauta criada e ligada"); return; }
    if (d.agtirarota) { await agLigar({ p_rt: d.agtirarota, p_tirar: true }); aviso(`${nomeRota(d.agtirarota)} saiu deste horário`); return; }
    if (d.agtirapauta) { await agLigar({ p_pauta: +d.agtirapauta, p_tirar: true }); aviso("Pauta tirada deste compromisso"); return; }
    if (d.agtrazer) {
      const it = s.agItens?.[d.agtrazer]; if (!it) return;
      const c = await chamar("alfy_nova_rota", { p_campos: { titulo: it.titulo, status: "rota", tipo: "📅 Compromisso", frente: "🧍 Pessoal", inicio: it.g.inicio, fim: it.g.fim || "", onde: it.onde || "", prioridade: "⏳ P3 · 7 dias" } });
      aviso(`Trazido para o ALFY como ${nomeRota(c.rt)}`); await carregarAgenda(); await recarregar(); render(); itensAgenda(); agFolha("r:" + c.rt); return;
    }
    if (d.rt && !d.acao) { abrir(d.rt); return; }
    if (d.mover) { mover(s.aberta, d.mover); return; }
    if (d.afolha) { s.abaFolha = d.afolha; s.editando = null; refolha(); if (d.afolha === "alfy") { const c = $("#corpo-folha"); c.scrollTop = c.scrollHeight; } return; }
    if (d.editar) { s.editando = d.editar; refolha(); setTimeout(() => $("#ed-" + d.editar)?.focus(), 30); return; }
    if (d.salvar) { editar({ [COLUNA[d.salvar]]: $("#ed-" + d.salvar).value.trim() }); return; }
    if (d.cancelar) { s.editando = null; refolha(); return; }
    if (d.iacampo) { const c = CAMPOS[d.iacampo], nome = c.rot.split(" ").slice(1).join(" "), atual = d.iacampo === "instr" ? instrDe(s.cartao) : s.cartao[COLUNA[d.iacampo]]; s.rascunhoRota = atual ? `Melhore o campo ${nome}: ` : `Escreva o campo ${nome} com o que já sabemos. `; refolha(); const t = $("#t-coment"); $("#f-interagir")?.scrollIntoView({ block: "start" }); t.focus(); t.setSelectionRange(t.value.length, t.value.length); return; }
    if (d.rap) { falarNaRota(d.rap); return; }
    if (d.usar) { const m = (s.cartao.ia || []).find((y) => String(y.id) === d.usar); if (m) { s.abaFolha = "ficha"; editar({ [COLUNA[d.campo]]: m.texto }, "Colocado em " + CAMPOS[d.campo].rot.split(" ").slice(1).join(" ")); } return; }
    if (d.copiarbloco !== undefined) { const m = MSGS[+d.copiarbloco]; if (m) { copiar(m); b.textContent = "✓"; b.classList.add("ok"); setTimeout(() => { b.textContent = "⧉"; b.classList.remove("ok"); }, 1600); } return; }
    if (d.copiarmsg) { const m = (s.cartao.ia || []).find((y) => String(y.id) === d.copiarmsg); if (m) copiar(soMsgs(m.texto)); return; }
    if (d.budst) { s.cartao = await chamar("alfy_budget", { p_rt: s.aberta, p_valor: $("[data-bud]")?.value || "", p_status: d.budst }); refolha(); await recarregar(); render(); return; }
    if (d.irpauta) { const id = +d.irpauta; fechar(); s.aba = "pautas"; s.reuniao = null; abrirPauta(id); return; }
    if (d.irreuniao) { fechar(); s.aba = "pautas"; s.pauta = null; s.reuniao = +d.irreuniao; render(); scrollTo(0, 0); return; }
    if (d.naveligar) { s.naveLigar = s.naveLigar === d.naveligar ? null : d.naveligar; s.naveNovo = false; const n = pessoa(d.naveligar)?.nome || ""; if (s.naveLigar) await naveBuscar(n.split(" ")[0]); else render(); return; }
    if (d.naveabrir) { s.naveAbrir = d.naveabrir; render(); return; }
    if (d.navetrazer) { const fr = $("#nv-frente")?.value; const r = await chamar("alfy_nave_trazer", { p_colaborador: d.navetrazer, p_alfy: s.naveLigar || null, p_apelido: $("#nv-apelido")?.value || "", p_papel: $("#nv-papel")?.value || "colaborador", p_frentes: fr ? [fr] : null }); await naveDepois(s.naveLigar ? {} : r, s.naveLigar ? "Ligado à Nave ID" : `${r.nome} entrou no ALFY`); return; }
    if (d.aprovar || d.recusar) { const id = +(d.aprovar || d.recusar), fr = $("#fa-frente-" + id)?.value; const r = await chamar("alfy_ficha_aprovar", { p_id: id, p_papel: $("#fa-papel-" + id)?.value || "colaborador", p_frentes: fr ? [fr] : [], p_nivel: $("#fa-nivel-" + id)?.value || "operacional", p_aprovar: !!d.aprovar }); s.aprovado = d.aprovar ? r : null; s.fichas = await chamar("alfy_fichas"); if (comando()) s.equipe = await chamar("alfy_equipe"); await recarregar(); render(); aviso(d.aprovar ? "Cadastrado na Nave ID e no ALFY" : "Ficha recusada"); return; }
    if (d.copiarmapa) { copiar(assinar(mapaPessoa(d.copiarmapa).txt)); s.mapasCopiados = { ...(s.mapasCopiados || {}), [d.copiarmapa]: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }; render(); return; }
    if (d.baixar) { aviso("Baixando…"); const x = await chamar("alfy_anexo_baixar", { p_id: +d.baixar }); const bin = atob(x.base64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const url = URL.createObjectURL(new Blob([u8], { type: x.tipo || "application/octet-stream" })); const l = document.createElement("a"); l.href = url; l.download = x.nome; document.body.append(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000); return; }
    if (d.tiraranexo) { s.cartao = await chamar("alfy_anexo_tirar", { p_id: +d.tiraranexo }); refolha(); await recarregar(); render(); aviso("Anexo tirado da rota"); return; }
    if (d.rapido) { const rt = d.rrt; if (s.aba === "rotas" && s.vista === "rar") await enviarRascunho(rt); await chamar("alfy_mover", { p_rt: rt, p_status: d.rapido }); if (d.rapido === "concluida" && s.rr.feitas) { s.rr.feitas = { ...s.rr.feitas, [rt]: true }; s.rr.foco = null; rrSalvar(); if (s.vista === "rar") setTimeout(rrNoLugar, 60); } aviso(d.rapido === "concluida" ? `✓ ${nomeRota(rt)} concluída` : `${nomeRota(rt)} em andamento`); await recarregar(); render(); return; }
    if (d.rastrear) { const rt = d.rastrear; s.linhasAbertas = { ...(s.linhasAbertas || {}), [rt]: true }; s.respLinha = { ...(s.respLinha || {}), [rt]: "" }; s.sugLinha = { ...(s.sugLinha || {}), [rt]: "" }; s.rastreando = { ...(s.rastreando || {}), [rt]: true }; s.pedRastreio = { ...(s.pedRastreio || {}), [rt]: await pedir("rastrear", "rota:" + rt, {}, "rota:" + rt) }; render(); return; }
    if (d.aplicarsug) { const rt = d.aplicarsug, t = s.sugLinha[rt]; s.sugLinha[rt] = ""; s.respLinha[rt] = ""; s.rastreando[rt] = false; await pedir("ia", "rota:" + rt, { texto: t, agir: true }, "rota:" + rt); render(); return; }
    if (d.linhacaixa) { s.linhasAbertas = { ...(s.linhasAbertas || {}), [d.linhacaixa]: !s.linhasAbertas?.[d.linhacaixa] }; render(); setTimeout(() => $("#cl-" + d.linhacaixa.replace(/\W/g, ""))?.focus(), 30); return; }
    if (d.copiartxt) { copiar(soMsgs(s.respLinha[d.copiartxt])); return; }
    if (d.convite) { const p = s.equipe.find((x) => x.id === d.convite); copiar(assinar(convite(p))); return; }
    if (d.acessode) { await gerarAcesso(d.acessode); return; }
    if (d.tiraraprendi) { s.aprendi = await chamar("alfy_aprendizado_tirar", { p_id: +d.tiraraprendi }); render(); aviso("Esquecido"); return; }
    if (d.cmd === "bomdia") s.diario = await chamar("alfy_diario", { p_dias: 3 }).catch(() => s.diario);
    if (d.cmd === "zap") await carregarZap();
    if (d.cmd) { s.cmd = d.cmd; if (d.cmd === "aprendi") s.aprendi = await chamar("alfy_aprendizado"); if (d.cmd === "equipe") s.equipe = await chamar("alfy_equipe"); if (d.cmd === "diario") s.diario = await chamar("alfy_diario", { p_dias: 3 }); if (d.cmd === "perguntar" && !s.chatGeral) s.chatGeral = await chamar("alfy_ia_conversa", { p_escopo: "geral" }); if (d.cmd === "bomdia") FEED = await chamar("alfy_feed", { p_limite: 150 }); render(); if (matchMedia("(max-width:900px)").matches) setTimeout(() => $("#det-cmd")?.scrollIntoView({ behavior: "smooth" }), 30); return; }
    if (d.alvo) { s.alvo = d.alvo; render(); return; }
    if (d.wahoras) { s.waHoras = +d.wahoras; render(); return; }
    if (d.mapamodo) { s.mapaModo = d.mapamodo; render(); return; }
    if (d.grupo) { s.grupo = s.grupo || []; s.grupo = s.grupo.includes(d.grupo) ? s.grupo.filter((x) => x !== d.grupo) : [...s.grupo, d.grupo]; render(); return; }
    if (d.col) { const k = $("#kanban"), w = k.querySelector(".coluna").offsetWidth + 10; k.scrollTo({ left: +d.col * w, behavior: "smooth" }); return; }
    if (d.sug) {
      const sg = (M.sugestoes || []).find((y) => String(y.id) === d.sug);
      if (d.sugacao === "rota") { const [tit] = (sg.texto || "").split("\n"); novaRota({ titulo: tit, responsavel_id: pessoaPorNome(sg.quem) || eu().id, depois: async (rt) => { await chamar("alfy_sugestao", { p_id: sg.id, p_acao: "rota", p_rt: rt }); } }); return; }
      await chamar("alfy_sugestao", { p_id: sg.id, p_acao: d.sugacao }); await recarregar(); render(); aviso(d.sugacao === "comentar" ? "Foi para a conversa da " + nomeRota(sg.rt) : "Descartado"); return;
    }
    if (d.desp) { usarItemDespejo(+d.desp); return; }
    if (d.pvista) { s.pvista = d.pvista; render(); return; }
    if (d.pauta) { s.reuniaoVolta = s.reuniao; s.reuniao = null; abrirPauta(+d.pauta); return; }
    if (d.reuniao) { s.pauta = null; s.reuniao = +d.reuniao; render(); scrollTo(0, 0); return; }
    if (d.rst) { await chamar("alfy_reuniao_salvar", { p_id: s.reuniao, p_campos: { status: d.rst } }); await recarregar(); render(); return; }
    if (d.pst) { await chamar("alfy_pauta_salvar", { p_id: s.pauta, p_campos: { status: d.pst } }); await recarregar(); render(); return; }
    if (d.opcao !== undefined) { const p = s.pautaDet; await chamar("alfy_pauta_salvar", { p_id: p.id, p_campos: { escolha: p.escolha === +d.opcao ? "" : String(+d.opcao) } }); await recarregar(); render(); return; }
    if (d.levar !== undefined) { await chamar("alfy_pauta_salvar", { p_id: s.pauta, p_campos: { reuniao_id: d.levar === "0" ? "" : d.levar } }); await recarregar(); render(); aviso(d.levar === "0" ? "Esta pauta saiu da reunião" : "Pauta levada para a " + reuniaoDe(+d.levar)?.titulo); return; }
    if (d.tmsg) { s.tipoMsg = d.tmsg; render(); setTimeout(() => $("#t-msg")?.focus(), 20); return; }
    if (d.msgrota) { const m = s.pautaDet.conversa.find((y) => String(y.id) === d.msgrota), pid = s.pauta; novaRota({ titulo: m.texto.slice(0, 120), frente: s.pautaDet.frente, depois: async (rt) => { await chamar("alfy_pauta_msg_rota", { p_msg: m.id, p_rt: rt }); } }); return; }
    if (d.iapauta) { const ch = "pauta:" + s.pauta; await pedir("ia", ch, { texto: d.iapauta }, ch); s.pautaDet = await chamar("alfy_pauta", { p_id: s.pauta }); render(); return; }
    if (b.id === "f-venc") { s.venc = !s.venc; render(); return; }
    if (b.id === "f-mais") { s.filtrosAbertos = !s.filtrosAbertos; render(); return; }
    if (b.id === "fab" || d.acao === "nova") { novaRota(); return; }
    const a = d.acao;
    if (a === "fechar") { fechar(); return; }
    if (a === "pautas-voltar") { const vinha = s.pauta ? s.reuniaoVolta : null; s.pauta = null; s.pautaDet = null; s.reuniao = vinha || null; s.reuniaoVolta = null; render(); scrollTo(0, 0); return; }
    if (a === "nova-reuniao") { formReuniao(null); return; }
    if (a === "editar-reuniao") { formReuniao(reuniaoDe(s.reuniao)); return; }
    if (a === "nova-pauta") { formPauta(null); return; }
    if (a === "nova-pauta-reuniao") { formPauta(null, { reuniao_id: s.reuniao }); return; }
    if (a === "editar-pauta") { formPauta(s.pautaDet); return; }
    if (a === "pauta-da-rota") { const r = s.cartao; formPauta(null, { titulo: r.titulo, frente: r.frente, detalhe: r.assist || "", rt: r.rt }); return; }
    if (a === "nova-opcao") { abrirNovaOpcao(); return; }
    if (a === "ag-prazos") { s.agPrazos = !s.agPrazos; render(); return; }
    if (a === "novo-compromisso") { novaRota({ compromisso: true }); return; }
    if (a === "gravar-reuniao") { gravarReuniao(); return; }
    if (a === "ata") { const ch = "ata:" + s.reuniao; await pedir("ata", "reuniao:" + s.reuniao, {}, ch); render(); return; }
    if (a === "copiar-ata") { copiar(reuniaoDe(s.reuniao)?.ata || ""); return; }
    if (a === "despejar") { despejar(); return; }
    if (a === "gravar") { gravar(); return; }
    if (a === "whatsapp" || a === "grupos") { await pedir("whatsapp", null, { horas: a === "grupos" ? 168 : s.waHoras || 24 }); render(); aviso("Lendo o WhatsApp… leva de 1 a 3 minutos"); return; }
    if (a === "ronda") { await pedir(a, null, {}); render(); aviso("Pedido na fila do robô"); return; }
    if (a === "copiar-mapa") { const cob = s.cmd === "cobrar" || s.mapaModo === "cobrar", modo = cob ? "pessoa" : s.mapaModo || "pessoa"; copiar(assinar((modo === "grupo" ? mapaGrupo(s.grupo || []) : modo === "setor" ? mapaSetor(s.alvo) : mapaPessoa(s.alvo, cob)).txt)); return; }
    if (a === "sair") { sair(); return; }
    if (a === "lembrar") { $("[data-irf=lembrete]")?.click(); return; }
    if (a === "lem-confirmar") {
      const dl = DIAS_LEM().find(([k]) => k === (s.lemDia || "amanha")), base = s.lemDia === "data" && s.lemData ? new Date(s.lemData + "T12:00:00-03:00") : dl ? dl[2] : new Date();
      const hh = s.lemHoraTxt || String(s.lemHora ?? 9).padStart(2, "0") + ":00", q = new Date(`${base.toLocaleDateString("en-CA", { timeZone: FUSO })}T${hh}:00-03:00`);
      if (q <= new Date()) { aviso("Esse horário já passou. Escolha outro.", true); return; }
      await lembrar(q); return;
    }
    if (a === "ir-escrever" || a === "ir-alfy") { const el = a === "ir-alfy" ? ($(".alfy4") || $("#f-coment")) : $("#f-coment"), c = $("#corpo-folha"); if (el && c) c.scrollTo({ top: el.offsetTop - ($(".cab3")?.offsetHeight || 0) - 10 }); setTimeout(() => $("#t-coment")?.focus({ preventScroll: true }), 50); if (a === "ir-alfy") aviso("Escolha uma ação do ALFY ou escreva o pedido"); return; }
    if (a === "zap-ver-todas") { s.zapTodas = true; render(); return; }
    if (a === "zap-sug-todas") { s.zapSugTodas = true; render(); return; }
    if (a === "zap-imp-tudo") { s.zapImpTudo = true; render(); return; }
    if (a === "zap-todas") { for (const z of (s.zap?.itens || []).filter((x) => x.precisa && !x.visto && zapNoModo(x))) s.zap = await chamar("alfy_zap_visto", { p_id: z.id }); render(); aviso("Tudo marcado como respondido"); return; }
    if (a === "nova-rotina") { novaRota({ repete: "semanal", semIA: false }); return; }
    if (a === "lem-outro") { s.lemOutro = !s.lemOutro; refolha(); return; }
    if (a === "comp-editar") { s.compEditando = true; refolha(); return; }
    if (a === "comp-cancelar") { s.compEditando = false; refolha(); return; }
    if (a === "comp-salvar") { const dd = $("#cp-dia").value, hi = $("#cp-ini").value || "09:00", hf = $("#cp-fim").value; if (!dd) { aviso("Escolha o dia"); return; } s.compEditando = false; await editar({ inicio: `${dd}T${hi}:00-03:00`, fim: hf ? `${dd}T${hf}:00-03:00` : "", onde: $("#cp-onde").value, tipo: "📅 Compromisso" }, "📅 Na agenda"); return; }
    if (a === "comp-tirar") { await editar({ inicio: "", fim: "", tipo: "" }, "Saiu da agenda"); return; }
    if (a === "conv-tudo") { s.convTudo = true; refolha(); return; }
    if (a === "hist-tudo") { s.histTudo = true; refolha(); return; }
    if (a === "det-alfy") { await pedir("ia", "rota:" + s.aberta, { agir: true, texto: "Preencha os detalhes desta rota com o que você entende dela: frente, responsável, prioridade, prazo, tipo, natureza, impacto e esforço. Só mude o que estiver vazio ou claramente errado, sem inventar, e diga em uma linha o que mudou." }, "rota:" + s.aberta); refolha(); aviso("🐙 O ALFY está preenchendo os detalhes…"); return; }
    if (a === "lem-escolhido") { const dd = $("#lem-dia").value, hh = $("#lem-hora").value || "09:00"; if (!dd) { aviso("Escolha o dia"); return; } await lembrar(new Date(`${dd}T${hh}:00-03:00`)); return; }
    if (a === "coment-alfy") { const t = $("#t-coment").value.trim(); if (!t) { aviso("Escreva o pedido para o ALFY"); return; } s.rascunhoRota = ""; $("#t-coment").value = ""; aviso("🐙 Enviado ao ALFY"); await pedir("ia", "rota:" + s.aberta, { texto: t, agir: true }, "rota:" + s.aberta); refolha(); $("#f-interagir")?.scrollIntoView({ block: "start" }); return; }
    if (a === "acesso-novo") { const fr = $("#nv-frente")?.value; await gerarAcesso(null, "colaborador", fr ? [fr] : null); return; }
    if (a === "meu-acesso") { const r = await chamar("alfy_convite_criar", { p_alfy: eu().id, p_papel: null, p_frentes: null }); location.href = LINK_ACESSO(r.codigo); return; }
    if (a === "entrar-codigo") { s.comCodigo = !s.comCodigo; $("#bloco-codigo").hidden = !s.comCodigo; $("#bloco-senha").hidden = s.comCodigo; return; }
    if (a === "nave-novo") { s.naveNovo = true; render(); setTimeout(() => $("#nn-nome")?.focus(), 30); return; }
    if (a === "nave-cancelar") { s.naveNovo = false; render(); return; }
    if (a === "nave-salvar-novo") { const fr = $("#nn-frente")?.value, lig = s.naveLigar; const r = await chamar("alfy_pessoa_nova", { p_nome_completo: $("#nn-nome").value, p_apelido: $("#nn-apelido").value, p_whatsapp: $("#nn-zap").value, p_papel: $("#nn-papel")?.value || "colaborador", p_frentes: fr ? [fr] : null, p_funcao: $("#nn-funcao").value, p_alfy: lig || null }); await naveDepois(lig ? {} : r, lig ? "Cadastrado na Nave ID e ligado" : `${r.nome} cadastrado na Nave ID e no ALFY`); return; }
    if (a === "rr-sortear") { rrSortear(); return; }
    if (a === "rr-passar") { await rrPassar(); return; }
    if (a === "rr-novfirst") { s.rr.novFirst = !s.rr.novFirst; s.rr.foco = null; rrSalvar(); render(); return; }
    if (a === "rr-filtros") { s.rrFAberto = !s.rrFAberto; render(); return; }
    if (a === "rr-filtros-limpar") { s.rr.f = { prio: [], st: [], prazo: [] }; s.pessoa = ""; s.frente = ""; s.rr.foco = null; rrSalvar(); render(); return; }
    if (a === "rr-tudo-visto") { filtradas().filter((x) => ABERTOS.includes(x.status) && rrMudou(x)).forEach((x) => marcarVisto(x.rt)); s.rr.foco = null; render(); aviso("Tudo marcado como visto"); return; }
    if (a === "rr-voltar") { s.rr.depois = {}; rrSalvar(); render(); return; }
    if (a === "rr-zerar") { s.rr.feitas = {}; s.rr.depois = {}; s.rr.foco = null; rrSalvar(); render(); return; }
    if (a === "copiar-ficha") { copiar(assinar(MSG_FICHA)); return; }
    if (a === "copiar-aprovado") { copiar(assinar(convite({ nome: s.aprovado.nome, token: s.aprovado.token }))); return; }
    if (a === "ver-script") { s.emailChave = await chamar("alfy_email_chave"); render(); return; }
    if (a === "copiar-script") { copiar(SCRIPT_EMAIL(s.emailChave)); return; }
    if (a === "encerrar-reuniao") { s.confirmaEncerrar = s.reuniao; render(); return; }
    if (a === "cancelar-encerrar") { s.confirmaEncerrar = null; render(); return; }
    if (a === "confirmar-encerrar") { const r = await chamar("alfy_reuniao_encerrar", { p_id: s.reuniao, p_ata: !!$("#enc-ata")?.checked }); s.confirmaEncerrar = null; s.histReunioes = null; await recarregar(); await carregarReuniao(); render(); aviso(`🏁 Reunião encerrada · ${r.tratadas} pautas encerradas${r.voltaram ? ` · ${r.voltaram} para a próxima` : ""}`); return; }
    if (a === "encerrar-pauta") { s.encerrandoPauta = s.pauta; render(); setTimeout(() => $("#pauta-fim")?.focus(), 30); return; }
    if (a === "cancelar-pauta") { s.encerrandoPauta = null; render(); return; }
    if (a === "confirmar-pauta") { s.pautaDet = await chamar("alfy_pauta_encerrar", { p_id: s.pauta, p_conclusao: $("#pauta-fim").value }); s.encerrandoPauta = null; await recarregar(); render(); aviso("✅ Pauta encerrada"); return; }
    if (a === "reabrir-pauta") { s.pautaDet = await chamar("alfy_pauta_reabrir", { p_id: s.pauta }); await recarregar(); render(); return; }
    if (a === "rastrear-cartao") { await pedir("rastrear", "rota:" + s.aberta, {}, "rota:" + s.aberta); s.abaFolha = "alfy"; refolha(); aviso("📡 Rastreando… a resposta aparece na aba 🐙 ALFY"); return; }
    if (a === "sensivel") { s.cartao = await chamar("alfy_sensivel", { p_rt: s.aberta, p_sensivel: !s.cartao.sensivel }); refolha(); await recarregar(); render(); aviso(s.cartao.sensivel ? "Agora só você vê esta rota" : "A rota voltou a ser vista pela equipe"); return; }
  } catch (er) { falhou(er); } finally { b.classList.remove("ocupado"); b.removeAttribute("aria-busy"); }
});
function abrirNovaOpcao() {
  const alvo = document.querySelector('[data-acao="nova-opcao"]'); if (!alvo) return;
  const f = document.createElement("form"); f.className = "linha-c"; f.style.cssText = "display:flex;gap:6px;width:100%;margin-top:6px";
  f.innerHTML = `<input class="busca" id="t-opcao" placeholder="Escreva a opção" style="flex:1"><button class="btn turq peq" type="submit">Pôr</button>`;
  alvo.replaceWith(f); $("#t-opcao").focus();
  f.addEventListener("submit", async (ev) => { ev.preventDefault(); const t = $("#t-opcao").value.trim(); if (!t) return; const p = s.pautaDet; try { await chamar("alfy_pauta_salvar", { p_id: p.id, p_campos: { opcoes: [...(p.opcoes || []), t] } }); await recarregar(); render(); } catch (e) { falhou(e); } });
}
document.addEventListener("input", (e) => {
  const t = e.target;
  if (t.id === "pl-busca") { s.plBusca = t.value; const pos = t.selectionStart; render(); const i = $("#pl-busca"); i.focus(); i.setSelectionRange(pos, pos); return; }
  if (t.id === "nave-busca") { clearTimeout(naveBuscar.t); const q = t.value; naveBuscar.t = setTimeout(() => naveBuscar(q), 250); return; }
  if (t.id === "busca") { s.busca = t.value; const pos = t.selectionStart; render(); const i = $("#busca"); i.focus(); i.setSelectionRange(pos, pos); }
  if (t.id === "t-chat-rota" || t.id === "t-coment") s.rascunhoRota = t.value;
  if (t.closest && t.closest("[data-clform]")) { const rt = t.closest("[data-clform]").dataset.clform; s.rascunhoLinha = { ...(s.rascunhoLinha || {}), [rt]: t.value }; }
  if (t.id === "desp-txt") s.despejo.texto = t.value;
  if (t.dataset.buscarota) { s.buscaRota = t.value; $("#res-busca-rota").innerHTML = resultadoBuscaRota(t.dataset.buscarota); }
});
document.addEventListener("change", async (e) => {
  const t = e.target;
  try {
    if (t.dataset.rrsel) { s[t.dataset.rrsel] = t.value; s.rr.foco = null; render(); return; }
    if (t.id === "f-pessoa") { s.pessoa = t.value; render(); }
    if (t.id === "f-frente") { s.frente = t.value; render(); }
    if (t.id === "f-agrupar") { s.agrupar = t.value; render(); }
    if (t.id === "rota-arq" && t.files.length && s.aberta) { const rt = s.aberta; for (const f of [...t.files]) { if (f.size > 15 * 1024 * 1024) { aviso(f.name + " passa de 15 MB", true); continue; } const el = $("#rota-arq-prog"); if (el) el.textContent = "Subindo " + f.name + "…"; const id = await subirGrande(f); s.cartao = await chamar("alfy_rota_anexo", { p_rt: rt, p_anexo: id }); } refolha(); await recarregar(); render(); aviso("Anexado"); }
    if (t.id === "plaud-arq" && t.files[0]) { const f = t.files[0], rid = s.reuniao; aviso("Subindo " + f.name + "…"); const id = await subirGrande(f); await chamar("alfy_reuniao_anexo", { p_reuniao: rid, p_anexo: id }); aviso("Anexado. O ALFY vai ler e escrever a ata."); await recarregar(); await carregarReuniao(); render(); }
    if (t.dataset.repetedia && s.aberta) { const dias = [...document.querySelectorAll("[data-repetedia]:checked")].map((x) => +x.value); editar({ repete_dias: dias }); }
    if (t.id === "lem-dia") { s.lemDia = "data"; s.lemData = t.value; refolha(); }
    if (t.id === "lem-hora") { s.lemHoraTxt = t.value; s.lemHora = null; refolha(); }
    if (t.id === "n-comp") { $("#n-quando").hidden = !t.checked; }
    if (t.id === "n-rep") { $("#n-dias").hidden = t.value !== "semanal"; }
    if (t.id === "desp-arq") { for (const f of [...t.files]) subirAnexo(f, f.name, f.type.startsWith("audio")); }
    if (t.dataset.despdest) { s.despejo.itens[+t.dataset.despdest].destino = t.value; render(); }
    if (t.dataset.prop && s.aberta) { const k = t.dataset.prop; editar({ [k]: k === "prazo" ? (t.value ? t.value + "T12:00:00-03:00" : "") : t.value }); }
    if (t.dataset.quando && s.aberta) { const dd = $("#q-dia").value, hi = $("#q-ini").value, hf = $("#q-fim").value; editar({ inicio: dd ? `${dd}T${hi || "09:00"}:00-03:00` : "", fim: dd && hf ? `${dd}T${hf}:00-03:00` : "", tipo: dd ? "📅 Compromisso" : s.cartao.tipo || "" }); }
    if (t.dataset.bud && s.aberta) { s.cartao = await chamar("alfy_budget", { p_rt: s.aberta, p_valor: t.value, p_status: s.cartao.budget_status === "aprovado" || s.cartao.budget_status === "recusado" ? "aguardando aprovação" : s.cartao.budget_status === "sem custo" ? "a orçar" : s.cartao.budget_status }); refolha(); await recarregar(); render(); }
    if (t.dataset.levarreuniao && t.value) { await chamar("alfy_reuniao_rota", { p_reuniao: +t.value, p_rt: s.aberta, p_ligar: true }); await recarregar(); await recarregarCartao(); refolha(); render(); aviso("Levada para a reunião"); }
  } catch (er) { falhou(er); }
});
document.addEventListener("submit", async (e) => {
  const f = e.target;
  if (e.submitter?.classList.contains("ocupado")) { e.preventDefault(); return; }
  if (e.submitter) { const sb = e.submitter; sb.classList.add("ocupado"); setTimeout(() => sb.classList.remove("ocupado"), 4000); }
  if (f.dataset.clform) {
    e.preventDefault();
    const rt = f.dataset.clform, ta = f.querySelector("textarea"), t = ta.value.trim(), modo = e.submitter?.dataset.clmodo || "comentar";
    if (!t) return;
    try {
      if (modo === "comentar") { await chamar("alfy_comentar", { p_rt: rt, p_texto: t, p_tipo: "comentario" }); s.rascunhoLinha = { ...(s.rascunhoLinha || {}), [rt]: "" }; aviso("Comentado. O ALFY está lendo para atualizar a rota"); await recarregar(); esperarEntender(rt); render(); }
      else { s.rascunhoLinha = { ...(s.rascunhoLinha || {}), [rt]: "" }; s.respLinha = { ...(s.respLinha || {}), [rt]: "" }; await pedir("ia", "rota:" + rt, { texto: t, agir: true }, "rota:" + rt); s.ultimaPerguntaLinha = rt; render(); }
    } catch (er) { falhou(er); }
    return;
  }
  if (!["f-coment", "f-chat-rota", "f-msg", "f-chat", "form-entrada"].includes(f.id)) return;
  e.preventDefault();
  try {
    if (f.id === "form-entrada") {
      if (!$("#bloco-codigo").hidden) { entrar($("#codigo").value.trim()); return; }
      const er = $("#erro-entrada"); er.textContent = "";
      try { const r = await rpc("alfy_entrar", { p_usuario: $("#usuario").value, p_senha: $("#senha").value }); entrar(r.token); } catch (x) { er.textContent = x.message.replace(/^./, (c) => c.toUpperCase()); }
      return;
    }
    if (f.id === "f-coment") { const t = $("#t-coment").value.trim(); if (!t) return; $("#t-coment").value = ""; s.rascunhoRota = ""; const tipo = e.submitter?.dataset.tipoc || "comentario"; s.cartao = await chamar("alfy_comentar", { p_rt: s.aberta, p_texto: t, p_tipo: tipo }); s.rascunhoRota = ""; refolha(); aviso((tipo === "orientacao" ? "Orientação registrada" : "Comentário salvo") + ". O ALFY vai ler e atualizar a rota"); await recarregar(); esperarEntender(s.aberta); render(); }
    if (f.id === "f-chat-rota") { falarNaRota($("#t-chat-rota").value); }
    if (f.id === "f-msg") { const t = $("#t-msg").value.trim(); if (!t) return; s.pautaDet = await chamar("alfy_pauta_msg", { p_pauta: s.pauta, p_tipo: s.tipoMsg, p_texto: t }); await recarregar(); render(); setTimeout(() => $("#t-msg")?.focus(), 20); }
    if (f.id === "f-chat") { const t = $("#t-chat").value.trim(); if (!t) return; await pedir("ia", "geral", { texto: t }, "geral"); s.chatGeral = await chamar("alfy_ia_conversa", { p_escopo: "geral" }); render(); setTimeout(() => $("#t-chat")?.focus(), 20); }
  } catch (er) { falhou(er); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.classList?.contains("linha2")) { abrir(e.target.dataset.rt); return; }
  if (e.key === "Enter" && e.target.dataset?.rrfoco) { e.target.click(); return; }
  if (e.key === "Escape" && $("#veu")) fechar();
  if (s.aba === "rotas" && s.vista === "rar" && !$("#veu") && $("#rr-deck")) {
    const deck = $("#rr-deck"), aperta = (sel) => { const b = deck.querySelector(sel); if (b) { e.preventDefault(); b.click(); } };
    const noCampo = (e.target.tagName === "TEXTAREA" && e.target.value.trim()) || e.target.tagName === "INPUT" || e.target.tagName === "SELECT";   // campo de texto vazio não segura as setas
    if (e.key === "Escape" && e.target.tagName === "TEXTAREA") { e.target.blur(); return; }
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && e.target.closest?.("#rr-deck")) {
      if (e.shiftKey) { const rt = s.rr.foco; aperta("[data-clmodo=alfy]"); setTimeout(() => { if (s.rr.foco === rt) rrTirar(rt, "feitas"); }, 400); }
      else aperta("[data-rrfeita]");
      return;
    }
    if (!noCampo && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const naCaixa = e.target.tagName === "TEXTAREA";   // dentro do campo vazio só a seta passa; letras são texto
      if (e.key === "ArrowRight" || (!naCaixa && e.key === "j")) { aperta("[data-rrfeita]"); e.target.blur?.(); }
      else if (!naCaixa && (e.key === "d" || e.key === "D")) aperta("[data-rrdepois]");
      else if (!naCaixa && (e.key === "c" || e.key === "C")) aperta('[data-rapido="concluida"]');
      else if (!naCaixa && (e.key === "s" || e.key === "S")) { e.preventDefault(); rrSortear(); }
      else if (!naCaixa && (e.key === "e" || e.key === "/")) { e.preventDefault(); deck.querySelector("textarea")?.focus({ preventScroll: true }); }
    }
  }
  if (e.key === "Enter" && !e.shiftKey && e.target.id === "t-chat-rota") { e.preventDefault(); falarNaRota(e.target.value); }
});
document.addEventListener("focusout", () => { if (s.pendente) setTimeout(() => { if (!ativo()) { s.pendente = false; render(); } }, 150); });

// ---------------------------------------------------------------- entrada e tempo real
function sair() { guardar(null); token = null; M = null; location.hash = ""; location.reload(); }
async function entrar(k) {
  const erro = $("#erro-entrada");
  if (!k) { erro.textContent = "Cole o seu código."; return; }
  try {
    token = k;
    const m = await chamar("alfy_mapa");
    if (!m) { erro.textContent = "Código não reconhecido. Confira o seu link pessoal."; token = null; return; }
    guardar(k); M = m; versao = m.versao;
    $("#tela-entrada").hidden = true; $("#tela-painel").hidden = false; $("#barra-baixo").hidden = false;
    try { const g = JSON.parse(localStorage.getItem("alfy-vista") || "{}"); if (g.vista) s.vista = g.vista; if (g.agrupar && g.v28) s.agrupar = g.agrupar; else if (!comando()) s.agrupar = "prioridade"; } catch (_) { /* privado */ }
    rrLer(); if (comando() && s.rr.lote) await rrCarregar(); if (comando()) await carregarZap();
    render();
    FEED = await chamar("alfy_feed", { p_limite: 150 }).catch(() => null);
    if (comando()) s.robo = await chamar("alfy_robo").catch(() => null);
    vigiar();
  } catch (e) { erro.textContent = e.message; token = null; }
}
let vigia = null;
function vigiar() {
  clearInterval(vigia);
  const espera = () => (Object.keys(s.esperando).length || s.despejo.pedido || (M?.fila || []).some((q) => q.status === "fila" || q.status === "rodando") || rrRodando() || zapRodando() ? 3000 : 8000);
  const passo = async () => {
    if (document.hidden || !token) return agenda();
    try {
      const v = await chamar("alfy_versao");
      if (v === null) { sair(); return; }
      if (v !== versao || Object.keys(s.esperando).length || s.despejo.pedido) { await recarregar(); renderSeguro(); }
      if (rrRodando() && s.aba === "rotas" && s.vista === "rar") { await rrCarregar(); renderSeguro(); }
      if (((s.aba === "comandos" && s.cmd === "zap") || s.aba === "zap") && zapRodando()) { await carregarZap(); renderSeguro(); }
    } catch (_) { /* sem rede: tenta de novo */ }
    agenda();
  };
  const agenda = () => { vigia = setTimeout(passo, espera()); };
  agenda();
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && token) chamar("alfy_versao").then(async (v) => { if (v !== versao) { await recarregar(); renderSeguro(); } }).catch(() => {}); });
let largAnt = innerWidth > 900;
addEventListener("resize", () => { const l = innerWidth > 900; if (l !== largAnt) { largAnt = l; render(); } });
addEventListener("hashchange", () => { const m = location.hash.match(/k=([0-9a-f]+)/); if (m) location.reload(); });

(function inicio() {
  const m = location.hash.match(/k=([0-9a-f]+)/);
  if (m) { guardar(m[1]); history.replaceState(null, "", location.pathname); }
  const k = (m && m[1]) || lerGuardado();
  if (k) entrar(k).then(() => { if (!token) $("#tela-entrada").hidden = false; });
  else $("#tela-entrada").hidden = false;
})();

// versão nova no ar: recarrega sozinho (a cada 3 min e ao voltar para a aba), nunca com texto sendo digitado
const VERSAO = (document.querySelector('script[src*="alfy.js?v="]')?.getAttribute("src") || "").split("v=")[1];
async function conferirVersao() {
  if (!VERSAO || document.hidden) return;
  try {
    const html = await (await fetch("index.html?x=" + Date.now(), { cache: "no-store" })).text(), v = (html.match(/alfy\.js\?v=(\d+)/) || [])[1];
    const digitando = [...document.querySelectorAll("textarea,input[type=text],input:not([type])")].some((e) => e.value && e.offsetParent && e.id !== "busca");
    if (v && v !== VERSAO && !digitando && !grav.ctx) location.reload();
  } catch (_) { /* sem rede: tenta depois */ }
}
setInterval(conferirVersao, 180000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) conferirVersao(); });

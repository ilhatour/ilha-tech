// 🪎 Rotas do Tesouro · Modelo de Moedas v3 (22/11/2026): baús conquistados e guardados, 🪙 moeda, elementos 🔥💧⚡🌱, 💎 e 🎖️;
// desafios no formato de missões do MU (atividade do dia com 3 baús), 📦 Abrir Baús (efeito de caixa, abrir todos), Mercado com orçamento do mês,
// ⚓ Cais (baú ↔ moeda), 🏦 Lastro, XP e nível 1 a 100, patentes da Marinha, frentes, conquistas, Trilha, reconhecimento e Ponte.
// Toda conta e todo sorteio acontecem no banco (alfy_tesouros, alfy_coletar, alfy_abrir_baus, alfy_roda_girar, alfy_mercado_comprar, alfy_reconhecer...).
// Usa os globais do alfy.js: s, token, chamar, esc, render, aviso, falhou, comando, vistaPlacar.
/* global s, token, chamar, esc, render, aviso, falhou, comando, vistaPlacar, frenteCurta */
"use strict";
const T4_JOIA = { tesouro: ["🪎", "baú", "baús"], moeda: ["🪙", "moeda", "moedas"], fogo: ["🔥", "fogo", "fogos"], gota: ["💧", "gota", "gotas"], raio: ["⚡", "raio", "raios"], broto: ["🌱", "broto", "brotos"], diamante: ["💎", "diamante", "diamantes"], medalha: ["🎖️", "Medalha de Honra", "Medalhas de Honra"] };
const T4_ORDEM = ["tesouro", "moeda", "fogo", "gota", "raio", "broto", "diamante", "medalha"];
const T4_ELEM = ["fogo", "gota", "raio", "broto"];
const T4_BREVE = ["raio", "broto"];
const T4_VALOR = { tesouro: 10, moeda: 1, fogo: 30, gota: 300, raio: null, broto: null, diamante: 10000, medalha: 50000 };
const t4valor = () => ({ ...T4_VALOR, ...(s.tes?.valor || {}) });
const T4_PATENTES = [[1, "Recruta", "▫️", "Bote"], [5, "Marinheiro", "▪️", "Bote"], [10, "Cabo", "🔻", "Lancha"], [15, "Terceiro-Sargento", "🔺", "Lancha"], [20, "Segundo-Sargento", "🔺", "Navio-Patrulha"], [25, "Primeiro-Sargento", "🔺", "Navio-Patrulha"], [30, "Suboficial", "🔶", "Corveta"], [35, "Guarda-Marinha", "⚓", "Corveta"], [40, "Segundo-Tenente", "⭐", "Fragata"], [45, "Primeiro-Tenente", "⭐", "Fragata"], [50, "Capitão-Tenente", "🎖️", "Contratorpedeiro"], [60, "Capitão de Corveta", "🎖️", "Contratorpedeiro"], [70, "Capitão de Fragata", "🏅", "Cruzador"], [80, "Capitão de Mar e Guerra", "🏅", "Cruzador"], [88, "Contra-Almirante", "🌟", "Porta-Aviões"], [94, "Vice-Almirante", "🌟", "Porta-Aviões"], [100, "Almirante de Esquadra", "👑", "Capitânia da Esquadra"]];
const T4_FRENTE_NIV = [0, 5, 15, 30, 60, 100, 160, 250, 400, 600];
const t4n = (n) => (Math.round((+n || 0) * 10) / 10).toLocaleString("pt-BR");
const t4premio = (pr, tes) => { const l = []; if (+tes) l.push(`${t4n(tes)} 🪎`); T4_ORDEM.forEach((k) => { if (pr && +pr[k] && !(k === "tesouro" && +tes)) l.push(`${t4n(pr[k])} ${T4_JOIA[k][0]}`); });
  if (pr?.titulo) l.push(typeof pr.titulo === "string" ? pr.titulo : "🏷️ título raro"); if (pr?.vale) l.push(typeof pr.vale === "string" && pr.icone ? `${pr.icone} ${pr.vale}` : `🎟️ vale ${t4vale(pr.vale)}`); if (pr?.gratis) l.push("🔁 abertura grátis");
  return l.join(" + ") || "sem prêmio"; };
const t4rs = (n) => (+n || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const t4vale = (id) => ({ cafe: "café da manhã", copo: "copo", camisa: "camisa" }[id] || id);
const t4moedas = (pr) => { const v = t4valor(); return Object.entries(pr || {}).reduce((a, [k, q]) => a + (+q || 0) * (+v[k] || 0), 0); };
const t4hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const t4seg = () => { const h = new Date(t4hoje() + "T12:00:00Z"), d = (h.getUTCDay() + 6) % 7; h.setUTCDate(h.getUTCDate() - d); return h.toISOString().slice(0, 10); };
const t4frente = (f) => (typeof frenteCurta === "function" ? frenteCurta(f) : f);
const t4ok = () => s.tes && !s.tes.bloqueado;

// presença: 1 vez por carregamento do app (vale XP e o desafio "Bom dia, Guardião")
(function t4presenca() { if (typeof token !== "undefined" && token) chamar("alfy_presenca").catch(() => {}); else setTimeout(t4presenca, 5000); })();

async function t4carregar() {
  s.tes = await chamar("alfy_tesouros").catch(() => s.tes);
  if (t4ok()) s.cais = await chamar("alfy_cais").catch(() => s.cais);
  if (t4ok() && ["comando", "gerente"].includes(s.tes.eu?.papel)) s.ponte = await chamar("alfy_ponte").catch(() => s.ponte);
}

/* ---------- tela ---------- */
function vistaTesouros() {
  if (!t4ok()) return vistaPlacar();
  const t = s.tes, sub = s.tsub || "inicio", mand = ["comando", "gerente"].includes(t.eu.papel);
  const prontos = (t.ganhos || []).filter((g) => g.estado === "pronta");
  const abas = [["inicio", "⚓ Início"], ["desafios", "🎯 Desafios"], ["conquistas", "🏅 Conquistas"], ["trilha", "🗺️ Trilha"], ["baus", "📦 Abrir Baús"], ["mercado", "🏪 Mercado"], ["bau", "🏆 Baú da Tripulação"]].concat(mand ? [["ponte", "🎛️ Ponte"]] : []);
  const conta = { baus: Math.floor((+t.abrir?.abrivel || 0) / +(t.abrir?.custo || 10)), desafios: prontos.filter((g) => !g.missao.startsWith("c_") && g.missao !== "trilha").length, conquistas: prontos.filter((g) => g.missao.startsWith("c_")).length, trilha: prontos.filter((g) => g.missao === "trilha").length, ponte: mand ? (s.ponte?.pedidos || []).length : 0 };
  const V = { inicio: t4inicio, desafios: t4desafios, conquistas: t4conquistas, trilha: t4trilha, mercado: t4mercado, baus: t4baus, bau: () => vistaPlacar(), ponte: t4ponte }[sub] || t4inicio;
  return `<div class="t4">${t4topo(prontos.length)}
    <div class="t4abas" role="tablist">${abas.map(([k, n]) => `<button type="button" role="tab" class="chip" aria-pressed="${sub === k}" data-tsub="${k}">${n}${conta[k] ? ` <b class="t4bd">${conta[k]}</b>` : ""}</button>`).join("")}</div>
    ${t.lancado !== "todos" && t.eu.papel === "comando" ? `<p class="t4aviso">🔒 Só você está vendo. A equipe continua na tela antiga até você tocar em <b>Lançar para a equipe</b>, na Ponte.</p>` : ""}
    <div class="t4tela">${V()}</div></div>`;
}
function t4topo(np) {
  const t = s.tes, nv = t.nivel, pa = nv.patente, faltam = nv.prox != null ? nv.prox - nv.xp : 0, pct = nv.prox != null ? Math.round(100 * (nv.xp - nv.ini) / (nv.prox - nv.ini)) : 100;
  return `<section class="t4topo">
    <div class="t4navio" aria-hidden="true">${pa.ni}</div>
    <div class="t4quem"><div class="t4nome"><b>${esc((t.eu.nome || "").split(" ")[0])}</b><span class="t4niv">Nível ${nv.nivel}</span>${t.eu.titulo ? `<span class="t4titulo">${esc(t.eu.titulo)}</span>` : ""}</div>
      <div class="t4pat">${pa.ins} ${esc(pa.nome)} · ${esc(pa.navio)}</div>
      <div class="t4xp" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <small class="t4muted">${nv.prox != null ? `${nv.xp.toLocaleString("pt-BR")} XP · faltam ${faltam.toLocaleString("pt-BR")} para o nível ${nv.nivel + 1}` : "nível máximo"} · ${t4n(t.baus?.conquistados)} 🪎 conquistados na vida</small></div>
    <div class="t4joias t4joias8">${T4_ORDEM.map((k) => `<div class="t4joia ${T4_BREVE.includes(k) ? "breve" : ""}" title="${T4_JOIA[k][2]}${T4_BREVE.includes(k) ? " · em breve" : ""}"><span>${T4_JOIA[k][0]}</span><b>${T4_BREVE.includes(k) ? "—" : t4n(t.saldo[k])}</b><small>${k === "tesouro" ? "baús guardados" : k === "medalha" ? "medalhas" : T4_JOIA[k][2]}</small></div>`).join("")}</div>
    ${np ? `<button type="button" class="btn ouro9 t4col" data-t4coletar="tudo">🎁 Coletar tudo (${np})</button>` : ""}
  </section>`;
}
function t4inicio() {
  const t = s.tes, nv = t.nivel.nivel;
  const frentes = (t.frentes || []).map((f) => { let n = 1; T4_FRENTE_NIV.forEach((x, i) => { if (f.score >= x) n = i + 1; }); const prox = T4_FRENTE_NIV[n]; return { ...f, n, prox }; });
  return `<div class="t4g2">
    <section class="pl6sec t4cx"><h3>Suas frentes</h3><p class="t4muted" style="margin:0 0 10px">Cada rota entregue numa frente soma o score dela. O nível de cada frente vai de 1 a 10.</p>
      ${frentes.map((f) => `<div class="t4fr"><div class="t4frl"><b>${esc(t4frente(f.frente))}</b><span>Nív. ${f.n}</span></div><div class="t4frb"><i style="width:${f.prox ? Math.min(100, 100 * f.score / f.prox) : 100}%"></i></div><small class="t4muted">score ${t4n(f.score)} · ${f.rotas} ${f.rotas === 1 ? "rota" : "rotas"}${f.prox ? ` · faltam ${t4n(f.prox - f.score)} para o nível ${f.n + 1}` : " · nível máximo"}</small></div>`).join("") || '<p class="t4muted">Ainda sem rota entregue com frente.</p>'}</section>
    <section class="pl6sec t4cx"><h3>Patentes da Marinha</h3><p class="t4muted" style="margin:0 0 8px">Sobem com o seu nível. Cada interação no ALFY vale XP: ação ou comentário 1, dia com o app aberto 3, rota entregue 5 (até 60 por dia).</p>
      <ol class="t4pats">${T4_PATENTES.map(([m, n, ins, navio], i) => { const prox = T4_PATENTES[i + 1]?.[0] ?? 101, aqui = nv >= m && nv < prox; return `<li class="${nv >= m ? "ja" : ""} ${aqui ? "aqui" : ""}"><span>${ins}</span><b>${n}</b><small>nível ${m}${aqui ? " · você" : ""} · ${navio}</small></li>`; }).join("")}</ol></section>
  </div>
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>Valor das joias</h3><div class="t4valor">${T4_ORDEM.map((k) => `<span>${T4_JOIA[k][0]} 1 ${T4_JOIA[k][1]} ${T4_BREVE.includes(k) ? "· em breve" : `= ${t4n(t4valor()[k])} 🪙`}</span>`).join("")}</div>
    <p class="t4muted" style="margin:8px 0 0">🪎 vem das rotas (1 a 10 por rota) · 🪙 de abrir baús, desafios, conquistas e Trilha · 🔥 de cada dia com venda lançada na Nave · 💧 de elogio de cliente com o seu nome (em breve) · 💎 de super missão e, raríssimo, do baú · 🎖️ só do reconhecimento do Miguel.</p></section>
  ${t4titulos()}`;
}
function t4titulos() {
  const v = s.tes.vitrine || [], uso = s.tes.eu.titulo;
  return `<section class="pl6sec t4cx" style="margin-top:14px"><h3>🏷️ Títulos</h3><p class="t4muted" style="margin:0 0 8px">Raros: saem de abrir baús e da Roda do Leme. O título escolhido aparece ao lado do seu nome.</p>
    ${v.length ? `<div class="t4tits">${v.map((x) => `<button type="button" class="chip" aria-pressed="${uso === x}" data-t4titulo="${esc(x)}">${esc(x)}</button>`).join("")}${uso ? `<button type="button" class="chip" data-t4titulo="">Tirar título</button>` : ""}</div>` : '<p class="t4muted" style="margin:0">Você ainda não tem título.</p>'}</section>`;
}
function t4estadoDesafio(m) {
  const g = (s.tes.ganhos || []).filter((x) => x.missao === m.id);
  const ref = m.cat === "diaria" ? "d:" + t4hoje() : m.cat === "semanal" ? "w:" + t4seg() : "unica";
  if (m.id === "mesmo_dia") { const dia = (v) => v ? new Date(v).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) : ""; const hoje = g.filter((x) => dia(x.em) === t4hoje()); return { prontos: g.filter((x) => x.estado === "pronta"), feito: hoje.filter((x) => x.estado === "coletada").length }; }
  const prontos = g.filter((y) => y.estado === "pronta"), x = g.find((y) => y.ref === ref);
  return { prontos, feito: x && x.estado === "coletada" ? 1 : 0 };
}
// prêmio em quadradinhos com moldura (como as recompensas das missões do MU)
function t4slots(pr, tes) {
  const l = []; if (+tes) l.push(["🪎", tes]);
  T4_ORDEM.forEach((k) => { if (pr && +pr[k] && !(k === "tesouro" && +tes)) l.push([T4_JOIA[k][0], pr[k], k]); });
  if (pr && +pr.atividade) l.push(["✦", pr.atividade, "atividade"]);
  return `<div class="t4slots">${l.map(([e, q, k]) => `<span class="t4slot ${k === "atividade" ? "ativ" : k === "diamante" || k === "medalha" ? "raro" : ""}" title="${k === "atividade" ? "pontos de atividade" : T4_JOIA[k]?.[2] || "baús"}"><i>${e}</i><b>${t4n(q)}</b></span>`).join("")}</div>`;
}
const T4_IR = { comentar_dia: "rotas", concluir_dia: "rotas", mesmo_dia: "rotas", concluir_semana: "rotas", prazo_semana: "rotas" };
function t4linhaDesafio(m) {
  const e = t4estadoDesafio(m), ids = e.prontos.map((x) => x.id).join(","), alvo = +(m.regra?.n || 1), at = +((s.tes.progresso || {})[m.id] ?? (e.feito ? alvo : 0));
  const agora = new Date(), fora = m.cat === "campanha" ? (m.fim && new Date(m.fim) <= agora ? "encerrada" : m.inicio && new Date(m.inicio) > agora ? "começa em " + new Date(m.inicio).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }) : "") : "";
  const feito = e.feito && m.id !== "mesmo_dia" && !e.prontos.length;
  const st = e.prontos.length ? "pronta" : feito ? "feita" : fora || m.em_breve ? "bloq" : "andamento";
  const alvoF = m.id === "carta_embarque" ? 5 : alvo, atF = Math.min(at, alvoF);
  const acao = e.prontos.length ? `<button type="button" class="btn ouro9 peq t4mbtn" data-t4coletar="${ids}">Coletar</button>`
    : feito ? `<span class="t4mok">✓ Concluído</span>`
    : m.em_breve ? `<span class="t4mlk">🔒 Em breve</span>`
    : fora ? `<span class="t4mlk">${esc(fora)}</span>`
    : m.id === "carta_embarque" ? `<button type="button" class="btn turq peq t4mbtn" data-fichalink="1">Ir</button>`
    : T4_IR[m.id] ? `<button type="button" class="btn peq t4mbtn" data-aba="rotas">Ir</button>` : `<span class="t4mlk">em andamento</span>`;
  const falta = m.id === "carta_embarque" && (m.falta || []).length ? ` · falta ${esc(m.falta.join(", "))}` : "";
  return `<article class="t4m ${st}"><span class="t4mic" aria-hidden="true">${m.icone || "🎯"}</span>
    <div class="t4mct"><b>${esc(m.nome)}</b><small>${esc(m.descricao || "")}${falta}</small>
      ${m.em_breve ? "" : `<div class="t4mpb" aria-label="${atF} de ${alvoF}"><span><i style="width:${Math.min(100, 100 * atF / Math.max(1, alvoF))}%"></i></span><small>${m.id === "mesmo_dia" ? `${at} hoje (até 5)` : `${atF}/${alvoF}`}</small></div>`}</div>
    ${t4slots(m.premio, m.tesouros)}<div class="t4mac">${acao}</div></article>`;
}
// barra de atividade do dia com 3 baús (como o "Ativo" das missões diárias do MU)
function t4atividade() {
  const a = s.tes.atividade || {}, hoje = +a.hoje || 0, max = Math.max(+a.max || 100, ...(a.marcos || []).map((m) => +m[0]));
  const gs = (s.tes.ganhos || []).filter((g) => g.missao === "atividade" && String(g.ref).startsWith("d:" + a.dia + ":"));
  return `<section class="t4ativ"><div class="t4ativh"><b>Atividade de hoje</b><span><b class="t4ativn">${hoje}</b>/${max}</span></div>
    <div class="t4ativb"><span class="t4ativf" style="width:${Math.min(100, 100 * hoje / max)}%"></span>
      ${(a.marcos || []).map((m, i) => { const g = gs.find((x) => x.ref === `d:${a.dia}:${i + 1}`), st = g?.estado === "coletada" ? "aberto" : g?.estado === "pronta" ? "pronto" : "fechado";
        return `<button type="button" class="t4ativc ${st}" style="left:${Math.min(100, 100 * m[0] / max)}%" ${g?.estado === "pronta" ? `data-t4coletar="${g.id}"` : "disabled"} title="${m[0]} de atividade: ${esc(t4premio(m[1]))}"><i>${st === "aberto" ? "📭" : "🎁"}</i><small>${m[0]}</small></button>`; }).join("")}</div>
    ${(() => { const old = (s.tes.ganhos || []).filter((g) => g.missao === "atividade" && g.estado === "pronta" && !String(g.ref).startsWith("d:" + a.dia + ":")); return old.length ? `<div class="t4ativold">🎁 ${old.length} baú${old.length > 1 ? "s" : ""} de atividade de dias anteriores <button type="button" class="btn ouro9 peq" data-t4coletar="${old.map((g) => g.id).join(",")}">Coletar ${esc(t4premio(old.reduce((x, g) => { Object.entries(g.premio || {}).forEach(([k, v]) => { x[k] = (x[k] || 0) + +v; }); return x; }, {})))}</button></div>` : ""; })()}
    <small class="t4muted">Cada desafio do dia coletado soma ✦ pontos de atividade. Ao chegar em ${(a.marcos || []).map((m) => m[0]).join(", ")}, um baú de atividade se abre (${(a.marcos || []).map((m) => t4premio(m[1])).join(" · ")}).</small></section>`;
}
function t4desafios() {
  const ms = (s.tes.missoes || []).filter((m) => m.cat !== "conquista");
  const CAT = [["diaria", "🌅 Diários"], ["semanal", "🧭 Semanais"], ["jornada", "⚓ Jornada"], ["campanha", "🗺️ Campanhas"], ["breve", "🔜 Em breve"]];
  const de = (c) => c === "breve" ? ms.filter((m) => m.em_breve) : ms.filter((m) => !m.em_breve && (m.cat === c || (c === "jornada" && m.cat === "mensal")));
  const conta = (c) => de(c).reduce((n, m) => n + t4estadoDesafio(m).prontos.length, 0);
  let cat = s.t4dc || "diaria"; if (!de(cat).length) cat = CAT.find(([c]) => de(c).length)?.[0] || "diaria";
  const ordem = { pronta: 0, andamento: 1, bloq: 2, feita: 3 };
  const lista = de(cat).map((m) => ({ m, h: t4linhaDesafio(m) })).sort((x, y) => ordem[x.h.match(/class="t4m (\w+)"/)[1]] - ordem[y.h.match(/class="t4m (\w+)"/)[1]]);
  return `<div class="t4mis"><nav class="t4mcat" aria-label="Tipos de desafio">${CAT.filter(([c]) => de(c).length).map(([c, n]) => `<button type="button" class="t4mcb" aria-pressed="${cat === c}" data-t4dc="${c}">${n}${conta(c) ? ` <b class="t4bd">${conta(c)}</b>` : ""}</button>`).join("")}</nav>
    <div class="t4mpainel">${cat === "diaria" ? t4atividade() : ""}
      <div class="t4mlista">${lista.map((x) => x.h).join("") || '<p class="t4muted">Nada aqui.</p>'}</div>
      <p class="t4muted" style="margin:10px 2px 0">Tudo aqui o sistema confere sozinho, na hora. Ninguém precisa aprovar nada.${cat === "campanha" ? " Super missão vale 💎, no máximo 1 por pessoa por semestre." : ""}</p></div></div>`;
}
const T4_ROM = ["I", "II", "III", "IV", "V"];
function t4conquistas() {
  const t = s.tes, f = s.t4fc || "todas";
  const lista = (t.missoes || []).filter((m) => m.cat === "conquista").map((m) => {
    const r = m.regra || {}, niveis = r.niveis || [], premios = r.premios || [], at = +(t.contadores?.[r.contador] || 0);
    const gs = (t.ganhos || []).filter((g) => g.missao === m.id), feitos = niveis.filter((x) => at >= x).length;
    const prontos = gs.filter((g) => g.estado === "pronta"), coletados = gs.filter((g) => g.estado === "coletada").length;
    const st = prontos.length ? "prontas" : coletados >= niveis.length ? "recebidas" : at === 0 ? "nao" : "andamento";
    return { m, niveis, premios, at, feitos, prontos, coletados, st, prox: niveis[feitos] };
  });
  const F = { todas: "Todas", prontas: "Prontas para coletar", andamento: "Em progresso", nao: "Não iniciadas", recebidas: "Recebidas" };
  const cats = [...new Set(lista.map((x) => x.m.categoria))];
  const vis = lista.filter((x) => f === "todas" || x.st === f);
  return `<div class="t4filtros">${Object.entries(F).map(([k, n]) => `<button type="button" class="chip" aria-pressed="${f === k}" data-t4fc="${k}">${n} <b class="t4bd2">${k === "todas" ? lista.length : lista.filter((x) => x.st === k).length}</b></button>`).join("")}</div>
    ${cats.map((c) => { const l = vis.filter((x) => x.m.categoria === c); return l.length ? `<section class="pl6sec t4cx"><h3>${esc(c)}${l.some((x) => x.prontos.length) ? ` <b class="t4bd">${l.filter((x) => x.prontos.length).length} pronta${l.filter((x) => x.prontos.length).length > 1 ? "s" : ""}</b>` : ""}</h3><div class="t4conqs">${l.map((x) => {
      const nivCol = x.prontos.length ? x.coletados : Math.min(x.feitos, x.niveis.length - 1), pr = x.premios[nivCol] || {};
      return `<article class="t4conq ${x.prontos.length ? "pronta" : ""} ${x.st === "nao" ? "apagada" : ""}"><span class="t4ic" aria-hidden="true">${x.m.icone}</span>
        <div class="t4ct"><div><b class="t4rec">+${t4premio(pr)}</b> <span class="t4tag">${x.feitos ? "Nív. " + T4_ROM[x.feitos - 1] : "Nív. 0"}</span></div><b>${esc(x.m.nome)}</b><small>${x.prox != null ? `Nível ${T4_ROM[x.feitos]}: ${x.prox} ${esc(x.m.descricao)}` : `Todos os níveis: ${esc(x.m.descricao)}`}</small>
        ${x.prontos.length ? `<button type="button" class="btn ouro9 peq" data-t4coletar="${x.prontos.map((g) => g.id).join(",")}">Coletar +${t4premio(x.prontos.reduce((a, g) => { Object.entries(g.premio || {}).forEach(([k, v]) => { a[k] = (a[k] || 0) + +v; }); return a; }, {}))}</button>`
          : `<div class="t4pb"><span><i style="width:${x.prox ? Math.min(100, 100 * x.at / x.prox) : 100}%"></i></span><small>${x.at}/${x.prox ?? x.niveis[x.niveis.length - 1]}</small></div>`}</div></article>`; }).join("")}</div></section>` : ""; }).join("") || '<p class="t4muted">Nenhuma conquista aqui.</p>'}`;
}
function t4trilha() {
  const t = s.tes, marcos = t.trilha.marcos || [], g = +t.ganho_mes || 0, mes = t.trilha.mes;
  const st = (i) => { const x = (t.ganhos || []).find((y) => y.missao === "trilha" && y.ref === `${mes}:${i + 1}`); return x ? x : null; };
  const idx = marcos.filter((m) => g >= m[0]).length, prox = marcos[idx];
  return `<section class="pl6sec t4cx"><h3>Trilha do mês</h3><p class="t4muted" style="margin:0 0 6px">Cada baú conquistado no mês leva o barco adiante. Abrir baús, girar a Roda ou comprar no Mercado não volta o barco.</p>
    <div class="t4trh"><b>${t4n(g)} 🪎 conquistados no mês</b><span class="t4muted">${prox ? `próximo marco em ${prox[0]} 🪎` : "trilha completa! 🎉"}</span></div>
    <div class="t4trilha">${marcos.map((m, i) => { const x = st(i), ok = g >= m[0]; return `<div class="t4marco ${x?.estado === "coletada" ? "coletado" : x?.estado === "pronta" ? "pronto" : "bloq"}"><div class="t4med">${x?.estado === "coletada" ? "✓" : t4premio(m[1]).split(" ").pop()}</div><b>${m[0]} 🪎</b><small>${t4premio(m[1])}</small>
      ${x?.estado === "pronta" ? `<button type="button" class="btn ouro9 peq" data-t4coletar="${x.id}">Coletar</button>` : !ok ? `<small class="t4muted">faltam ${t4n(m[0] - g)}</small>` : ""}</div>`; }).join("")}</div></section>`;
}
function t4falta(preco) { const sd = s.tes.saldo, f = []; Object.entries(preco || {}).forEach(([k, v]) => { const d = +v - (+sd[k] || 0); if (d > 0) f.push(`${t4n(d)} ${T4_JOIA[k][0]}`); }); return f; }
function t4mercado() {
  const m = s.t4mm || "loja";
  return `<div class="t4filtros t4mm"><button type="button" class="chip" aria-pressed="${m === "loja"}" data-t4mm="loja">🏪 Loja</button><button type="button" class="chip" aria-pressed="${m === "cais"}" data-t4mm="cais">⚓ Cais da tripulação${(s.cais?.ofertas || []).filter((o) => !o.minha).length ? ` <b class="t4bd2">${s.cais.ofertas.filter((o) => !o.minha).length}</b>` : ""}</button></div>` + (m === "cais" ? t4cais() : t4loja());
}
const t4j = (k, n) => `${t4n(n)} ${T4_JOIA[k][0]}`;
const t4dia = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" });
function t4cais() {
  const c = s.cais; if (!c) return '<p class="t4muted">Carregando o Cais…</p>';
  const cfg = c.cfg || {}, outras = (c.ofertas || []).filter((o) => !o.minha), minhas = (c.ofertas || []).filter((o) => o.minha), sd = s.tes.saldo;
  const linha = (o) => { const f = (+sd[o.quer] || 0) < +o.preco;
    return `<div class="t4tr t4tr2" role="row"><span class="t4item"><span class="t4ic" aria-hidden="true">${T4_JOIA[o.moeda][0]}</span><span><b>${o.minha ? "Você está" : esc(o.vendedor) + " está"} vendendo ${t4j(o.moeda, o.qtd)} por ${t4j(o.quer, o.preco)}</b><small>${esc(o.codigo)} · sai do Cais em ${t4dia(o.vence_em)}</small></span></span>
      <span>${o.minha ? `<button type="button" class="btn peq" data-t4retirar="${o.id}">Retirar</button>` : c.congelado ? `<button type="button" class="btn peq" disabled>Pausado</button>` : f ? `<button type="button" class="btn peq" disabled>Faltam ${t4j(o.quer, o.preco - (+sd[o.quer] || 0))}</button>` : `<button type="button" class="btn ouro9 peq" data-t4caiscomprar="${o.id}">Comprar</button>`}</span></div>`; };
  const opt = T4_ORDEM.filter((k) => +c.vendavel[k] > 0);
  return `<p class="t4muted" style="margin:0 0 10px">Trocas entre a tripulação, só com joias do jogo. Quem compra paga o preço, ${cfg.taxa_pct}% dele some do jogo (taxa do Cais) e o resto vai para quem vendeu. O que entrou nos últimos ${cfg.carencia_dias} dias fica em carência antes de poder ser vendido.</p>
    <div class="t4tabela" role="table">${outras.map(linha).join("") || '<p class="t4muted" style="padding:10px 12px;margin:0">Ninguém está vendendo agora.</p>'}</div>
    <div class="t4g2" style="margin-top:14px">
      <section class="pl6sec t4cx"><h3>Pôr à venda</h3>
        ${c.congelado ? '<p class="t4muted">Suas trocas estão pausadas pelo comando.</p>' : !opt.length ? '<p class="t4muted">Você ainda não tem joia fora da carência para vender.</p>' : `<form data-t4form="cais" class="t4form">
          <label>Vender<select name="moeda">${opt.map((k) => `<option value="${k}">${T4_JOIA[k][0]} ${T4_JOIA[k][2]} (até ${t4n(c.vendavel[k])})</option>`).join("")}</select></label>
          <label>Quantidade<input name="qtd" type="number" min="1" step="1" value="1" required></label>
          <label>Quero receber em<select name="quer"><option value="tesouro">🪎 tesouros</option><option value="moeda">🪙 moedas</option></select></label>
          <label>Preço<input name="preco" type="number" min="1" step="0.5" required></label>
          <small class="t4muted" data-t4caisdica></small>
          <button type="submit" class="btn ouro9">Pôr no Cais</button></form>`}
        ${minhas.length ? `<h3 style="margin-top:14px">À venda agora</h3><div class="t4tabela">${minhas.map(linha).join("")}</div>` : ""}
        ${(c.minhas || []).length ? `<h3 style="margin-top:14px">Suas vendas</h3>${c.minhas.map((o) => `<div class="t4rec2"><b>${t4j(o.moeda, o.qtd)} por ${t4j(o.quer, o.preco)}</b> <small class="t4muted">${{ vendida: `vendida para ${esc(o.comprador || "?")}, você recebeu ${t4j(o.quer, o.preco - o.taxa)}`, retirada: "retirada, voltou para você", vencida: "venceu, voltou para você", estornada: "estornada pelo comando" }[o.estado]} · ${t4dia(o.em)}</small></div>`).join("")}` : ""}</section>
      <section class="pl6sec t4cx"><h3>De onde vieram suas joias</h3><p class="t4muted" style="margin:0 0 8px">Cada joia tem origem registrada e um selo que denuncia qualquer mexida no livro.</p>
        <div class="t4ext">${(c.extrato || []).map((x) => `<div><span class="${+x.qtd > 0 ? "t4ok" : "t4muted"}">${+x.qtd > 0 ? "+" : "−"}${t4j(x.moeda, Math.abs(x.qtd))}</span><b>${esc(x.txt)}</b><small>${t4dia(x.em)} · selo ${esc(x.selo)}</small></div>`).join("") || '<p class="t4muted">Nada no livro ainda. Tesouro de rota entra direto no saldo.</p>'}</div></section>
    </div>`;
}
function t4caisDica(f) {
  const el = f.querySelector("[data-t4caisdica]"), cfg = s.cais?.cfg; if (!el || !cfg) return;
  const fd = new FormData(f), m = fd.get("moeda"), q = fd.get("quer"), n = +fd.get("qtd") || 0, pr = +fd.get("preco") || 0, ref = cfg.valor_ref || T4_VALOR, fx = cfg.faixa || [0.5, 1.5];
  if (!m || !n) { el.textContent = ""; return; }
  if (m === q) { el.textContent = "Escolha receber em outra joia."; return; }
  const base = n * ref[m] / ref[q], lo = Math.ceil(base * fx[0] * 10) / 10, hi = Math.floor(base * fx[1] * 10) / 10, tx = Math.round(pr * cfg.taxa_pct / 10) / 10;
  el.textContent = `Faixa do Cais: de ${t4n(lo)} a ${t4n(hi)} ${T4_JOIA[q][0]}.` + (pr ? ` Se vender por ${t4n(pr)}, você recebe ${t4n(pr - tx)} ${T4_JOIA[q][0]} (taxa ${t4n(tx)}).` : "");
}
function t4loja() {
  const t = s.tes, cat = s.t4mc || "todas", itens = (t.mercado || []).filter((i) => cat === "todas" || i.categoria === cat), cats = [...new Set((t.mercado || []).map((i) => i.categoria))];
  const nome = (id) => (t.mercado || []).find((i) => i.id === id);
  return `<div class="t4filtros"><button type="button" class="chip" aria-pressed="${cat === "todas"}" data-t4mc="todas">Tudo</button>${cats.map((c) => `<button type="button" class="chip" aria-pressed="${cat === c}" data-t4mc="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="t4tabela" role="table">
      <div class="t4tr t4th" role="row"><span>Item</span><span>Preço</span><span></span></div>
      ${itens.map((i) => { const f = t4falta(i.preco), esg = i.fechado; return `<div class="t4tr" role="row"><span class="t4item"><span class="t4ic" aria-hidden="true">${i.icone}</span><span><b>${esc(i.nome)}</b><small>${esc(i.descricao || "")}${i.so_clt ? " · <b>só CLT</b>" : ""}${i.estoque != null ? ` · ${i.estoque > 0 ? `restam ${i.estoque}` : "esgotado"}` : ""}${i.estoque_mes != null ? ` · ${i.estoque_mes} por mês` : ""}</small></span></span>
        <span class="t4preco">${T4_ORDEM.filter((k) => i.preco[k]).map((k) => `<span class="t4pj">${T4_JOIA[k][0]} ${t4n(i.preco[k])}</span>`).join("")}${i.efeito ? ` <span class="t4muted">→ ${t4premio(i.efeito)}</span>` : Object.keys(i.preco).some((k) => k !== "moeda") ? ` <small class="t4eq">≈ ${t4n(i.em_moedas ?? t4moedas(i.preco))} 🪙</small>` : ""}</span>
        <span>${esg ? `<button type="button" class="btn peq" disabled>${esc(esg)}</button>` : i.so_clt && !t.eu.clt ? `<button type="button" class="btn peq" disabled>Só CLT</button>` : f.length ? `<button type="button" class="btn peq" disabled title="Faltam ${esc(f.join(", "))}">Faltam ${esc(f.join(" + "))}</button>` : `<button type="button" class="btn ouro9 peq" data-t4comprar="${esc(i.id)}">${i.efeito ? "Trocar" : "Comprar"}</button>`}</span></div>`; }).join("")}
    </div>
    ${(t.pedidos || []).length ? `<section class="pl6sec t4cx" style="margin-top:14px"><h3>Meus pedidos</h3>${t.pedidos.map((p) => `<div class="t4ped"><span>${p.icone || nome(p.item)?.icone || "🎟️"}</span><b>${esc(p.nome || nome(p.item)?.nome || p.item)}${p.origem && p.origem !== "mercado" ? " · vale de baú" : ""}</b><code>${esc(p.codigo)}</code><small class="${p.estado === "entregue" ? "t4ok" : "t4muted"}">${{ pedido: "aguardando entrega", entregue: "✓ entregue", cancelado: "cancelado, devolvido" }[p.estado]}</small></div>`).join("")}<p class="t4muted" style="margin:8px 0 0">Mostre o código para quem entrega. A data de serviço e folga é combinada com o gerente.</p></section>` : ""}`;
}
function t4chances(tab) {
  const tot = tab.reduce((a, x) => a + +x.p, 0), med = tab.reduce((a, x) => a + (+x.p / tot) * t4valorPremio(x.premio), 0);
  return { med, html: `<table class="t4ch"><tbody>${tab.map((x) => `<tr><td>${t4premio(x.premio)}</td><td>${String(x.p).replace(".", ",")}%</td></tr>`).join("")}</tbody></table>` };
}
function t4valorPremio(pr) { const v = t4valor(); let n = 0; T4_ORDEM.forEach((k) => { n += (+pr[k] || 0) * (+v[k] || 0); }); if (pr.vale) n += { cafe: 1500, copo: 2500, camisa: 5000 }[pr.vale] || 0; if (pr.gratis) n += +(s.tes.abrir?.custo || 10) * v.tesouro * .87; return n; }
const T4_RAR = [["comum", "Comum"], ["incomum", "Incomum"], ["raro", "Raro"], ["mitico", "Mítico"], ["lendario", "Lendário"], ["imortal", "Imortal"], ["arcana", "Arcana"]];
function t4rar(pr) {
  if (pr.diamante) return 6; if (pr.titulo || pr.vale) return 5;
  const m = +pr.moeda || 0; if (m >= 500) return 4; if (m >= 200 || pr.gratis) return 3; if (m >= 100 || pr.tesouro) return 2; if (m >= 60) return 1; return 0;
}
function t4baus() {
  const a = s.tes.abrir || {}, g = +s.tes.saldo.tesouro || 0, ab = +a.abrivel || 0, n = Math.floor(ab / +(a.custo || 10)), ch = t4chances(a.tabela || []);
  return `<div class="t4g2"><section class="pl6sec t4cx t4bauw"><h3>📦 Abrir Baús</h3>
      <button type="button" class="t4bauv" data-t4abrir="1" ${n && !s.t4abrindo ? "" : "disabled"} aria-label="Abrir 1 baú"><span class="t4raios" aria-hidden="true"></span><span class="t4bau">🪎</span></button>
      <div class="t4saiu">Você tem <b>${t4n(g)} 🪎</b> guardados${ab < g ? ` (${t4n(g - ab)} de rotas de hoje abrem amanhã)` : ""}. Cada abertura usa <b>${a.custo} 🪎</b>.</div>
      <div class="t4row" style="justify-content:center">
        <button type="button" class="btn ouro9" data-t4abrir="1" ${n && !s.t4abrindo ? "" : "disabled"}>${n ? `Abrir ${a.custo} 🪎` : `Faltam ${t4n(a.custo - ab)} 🪎`}</button>
        ${n > 1 ? `<button type="button" class="btn ouro9 t4todos" data-t4abrir="todos" ${s.t4abrindo ? "disabled" : ""}>Abrir todos (${n})</button>` : ""}</div>
      <small class="t4muted">Abrir não mexe nos baús conquistados: sua patente e sua parte no prêmio da tripulação continuam iguais.</small></section>
    <section class="pl6sec t4cx"><h3>O que pode vir</h3>
      <table class="t4ch"><tbody>${(a.tabela || []).map((x) => `<tr><td><span class="t4rarp r${t4rar(x.premio)}">${T4_RAR[t4rar(x.premio)][1]}</span> ${t4premio(x.premio)}</td><td>${String(x.p).replace(".", ",")}%</td></tr>`).join("")}</tbody></table>
      <p class="t4muted" style="margin:8px 0 0">As chances são sempre estas. Em média cada abertura de ${a.custo} 🪎 (${t4n(a.custo * t4valor().tesouro)} 🪙) devolve uns ${t4n(Math.round(ch.med))} 🪙. Nunca vem elemento nem 🎖️. Sem limite por dia.</p></section></div>`;
}
// efeito de abrir (estilo caixa do Dota): baú treme, brilha na cor da maior raridade, explode em luz e revela as cartas
function t4abrirFx(lista) {
  const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches, max = lista.reduce((a, x) => Math.max(a, t4rar(x.premio)), 0);
  const tot = {}; lista.forEach((x) => Object.entries(x.premio || {}).forEach(([k, v]) => { if (typeof v === "number" && k !== "gratis") tot[k] = (tot[k] || 0) + v; }));
  const esp = lista.filter((x) => x.premio.titulo || x.premio.vale), grat = lista.filter((x) => x.premio.gratis).length;
  const vis = lista.length > 60 ? lista.slice().sort((a, b) => t4rar(b.premio) - t4rar(a.premio)).slice(0, 60) : lista;
  const carta = (x, i) => `<div class="t4pr r${t4rar(x.premio)}" style="animation-delay:${reduz ? 0 : 1600 + i * (lista.length > 1 ? 55 : 0)}ms"><i>${x.premio.titulo ? "🏷️" : x.premio.vale ? x.premio.icone || "🎟️" : x.premio.diamante ? "💎" : x.premio.gratis ? "🔁" : x.premio.tesouro ? "🪎" : "🪙"}</i><b>${esc(t4premio(x.premio))}</b><small>${T4_RAR[t4rar(x.premio)][1]}</small></div>`;
  let el = document.getElementById("t4abre"); if (el) el.remove();
  el = document.createElement("div"); el.id = "t4abre"; el.className = `t4ab r${max} ${reduz ? "sem" : ""}`; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Baús abertos");
  el.innerHTML = `<div class="t4abfx" aria-hidden="true"><span class="t4abraios"></span><span class="t4abbau">🪎</span><span class="t4abflash"></span>${Array.from({ length: 14 }, (_, i) => `<span class="t4abfa" style="--a:${i * 360 / 14}deg"></span>`).join("")}</div>
    <div class="t4abres"><h3>${lista.length === 1 ? T4_RAR[max][1] + "!" : `${lista.length} baús abertos`}</h3>
      <div class="t4cartas ${lista.length === 1 ? "uma" : ""}">${vis.map(carta).join("")}</div>
      ${lista.length > 1 ? `<p class="t4abtot">Total: <b>${t4premio(tot) === "sem prêmio" ? "" : t4premio(tot)}</b>${esp.length ? ` · ${esp.map((x) => esc(t4premio(x.premio))).join(" · ")}` : ""}${grat ? ` · ${grat} ${grat > 1 ? "aberturas grátis" : "abertura grátis"}` : ""}</p>` : ""}
      ${lista.some((x) => x.premio.vale) ? '<p class="t4muted">O vale virou pedido: o código está em Mercado › Meus pedidos.</p>' : ""}
      <div class="t4row" style="justify-content:center"><button type="button" class="btn" data-t4abfechar="1">Fechar</button>${Math.floor((+s.tes.abrir?.abrivel || 0) / +(s.tes.abrir?.custo || 10)) ? `<button type="button" class="btn ouro9" data-t4abrir="1">Abrir mais 1</button>` : ""}</div></div>`;
  document.body.appendChild(el);
  el.querySelector("[data-t4abfechar]").focus?.();
}
function t4ponte() {
  const p = s.ponte; if (!p) return '<p class="t4muted">Carregando a Ponte…</p>';
  const cmd = p.eu === "comando", pessoas = (p.equipe || []).filter((x) => x.id !== s.tes.eu.id && (cmd || x.papel === "colaborador"));
  const orc = p.orcamento || {}, usado = p.usado || {};
  const frentes = (typeof FRENTES !== "undefined" ? FRENTES : []).filter((f) => !String(f).includes("Pessoal"));
  return `<div class="t4g2">
    <section class="pl6sec t4cx"><h3>🏅 Reconhecer e dar pontos extras</h3>
      <form data-t4form="rec" class="t4form"><label>Quem<select name="pessoa" required><option value="">Escolha</option>${pessoas.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></label>
        <label>Por quê (aparece para a pessoa${cmd ? " e no grupo, se divulgar" : ""})<textarea name="motivo" rows="2" required minlength="10" placeholder="Ex.: segurou sozinha o atendimento do sábado"></textarea></label>
        <div class="t4row">${["tesouro", "moeda"].concat(cmd ? ["medalha"] : []).filter((k) => cmd || +(p.orcamento || {})[k] > 0).map((k) => `<label class="t4mini">${T4_JOIA[k][0]} ${T4_JOIA[k][2]}<input name="${k}" type="number" min="0" max="${k === "medalha" ? 1 : cmd ? 1000 : Math.max(0, (+(p.orcamento || {})[k] || 0) - (+(p.usado || {})[k] || 0))}" step="1" value="0"></label>`).join("")}</div>
        ${cmd ? `<label class="t4chk"><input type="checkbox" name="divulgar"> 🦜 Divulgar no ${esc("🏆 GRUPO ILHA 🏝️")} (só nome e motivo, sem valores)</label>` : `<small class="t4muted">Seu limite do mês: ${["tesouro", "moeda"].map((k) => `${T4_JOIA[k][0]} ${t4n(usado[k] || 0)} de ${t4n(orc[k] || 0)}`).join(" · ")}</small>`}
        <button type="submit" class="btn turq">Reconhecer</button></form></section>
    <section class="pl6sec t4cx"><h3>🏪 Entregas do Mercado · ${(p.pedidos || []).length}</h3>
      ${(p.pedidos || []).map((x) => `<div class="t4ped"><span>${x.icone}</span><b>${esc(x.quem)} · ${esc(x.item)}${x.so_clt ? " (só CLT)" : ""}${x.vale ? " · vale de baú" : ""}</b><code>${esc(x.codigo)}</code><span class="t4pedac"><button type="button" class="btn turq peq" data-t4entregar="${x.id}">Entregue</button><button type="button" class="btn peq" data-t4cancelar="${x.id}" data-t4vale="${x.vale ? 1 : ""}">${x.vale ? "Cancelar vale (vira 🪙)" : "Cancelar e devolver"}</button></span></div>`).join("") || '<p class="t4muted">Nada para entregar.</p>'}
      <h3 style="margin-top:16px">Últimos reconhecimentos</h3>
      ${(p.reconhecimentos || []).slice(0, 6).map((r) => `<div class="t4rec2"><b>${esc((r.quem || "").split(" ")[0])}</b> por ${esc((r.por || "").split(" ")[0])}: <i>${esc(r.motivo)}</i> <small class="t4muted">${t4premio(r.premio)}${r.divulgar ? ` · 🦜 ${r.envio === "enviado" ? "divulgado" : r.envio === "erro" ? "⚠️ não saiu no grupo" : "divulgando"}` : ""}</small></div>`).join("") || '<p class="t4muted">Nenhum ainda.</p>'}</section>
  </div>
  ${cmd ? `<div class="t4g2" style="margin-top:14px">
    <section class="pl6sec t4cx"><h3>🗺️ Nova campanha</h3><form data-t4form="camp" class="t4form">
      <label>Nome<input name="nome" required minlength="3" placeholder="Ex.: Semana Forte da VDB"></label>
      <div class="t4row"><label class="t4mini">Regra<select name="conta"><option value="rotas">Concluir rotas</option><option value="prazo">Rotas no prazo</option></select></label><label class="t4mini">Quantas<input name="n" type="number" min="1" value="5" required></label></div>
      <label>Só da frente (opcional)<select name="frente"><option value="">Qualquer frente</option>${frentes.map((f) => `<option>${esc(f)}</option>`).join("")}</select></label>
      <div class="t4row"><label class="t4mini">Começa<input name="inicio" type="date" required value="${t4hoje()}"></label><label class="t4mini">Termina<input name="fim" type="date" required></label></div>
      <div class="t4row">${["tesouro", "moeda"].map((k) => `<label class="t4mini">${T4_JOIA[k][0]}<input name="${k}" type="number" min="0" value="0"></label>`).join("")}<label class="t4mini">💎 super missão<input name="diamante" type="number" min="0" max="1" value="0"></label></div>
      <small class="t4muted">Super missão vale no máximo 1 💎, e cada pessoa ganha no máximo 1 💎 de super missão por semestre.</small>
      <button type="submit" class="btn turq">Criar campanha</button></form>
      ${(p.campanhas || []).map((c) => `<div class="t4rec2"><b>${esc(c.nome)}</b> <small class="t4muted">${c.regra?.n} ${c.regra?.conta === "prazo" ? "no prazo" : "rotas"}${c.regra?.frente ? " · " + esc(t4frente(c.regra.frente)) : ""} · ${t4premio(c.premio, c.tesouros)} · ${esc(c.limite || "")}</small></div>`).join("")}</section>
    <section class="pl6sec t4cx"><h3>📊 Economia do mês</h3>
      <div class="t4eco">${T4_ORDEM.map((k) => { const e = (p.economia || {})[k] || {}; return `<div><span>${T4_JOIA[k][0]}</span><b>+${t4n(e.entrou || 0)}</b><small>−${t4n(e.saiu || 0)}</small></div>`; }).join("")}</div>
      <small class="t4muted">Entrou e saiu no livro de joias no mês (o baú das rotas não entra aqui). Aberturas de baú: ${p.abrir_mes ?? 0}.</small>
      ${cmd && p.orcamento_mes ? `<h3 style="margin-top:16px">💰 Orçamento do Mercado no mês</h3>
      <div class="t4orc"><span><i style="width:${Math.min(100, 100 * p.orcamento_mes.usado / Math.max(1, p.orcamento_mes.teto))}%"></i></span><b>R$ ${t4rs(p.orcamento_mes.usado)} de R$ ${t4rs(p.orcamento_mes.teto)}</b></div>
      ${(p.orcamento_mes.itens || []).map((x) => `<div class="t4rec2">${x.icone} ${esc(x.item)} <small class="t4muted">${x.n}x · R$ ${t4rs(x.rs)}</small></div>`).join("")}
      <form data-t4form="orc" class="t4inl"><input name="teto" type="number" min="0" step="10" value="${p.orcamento_mes.teto}" aria-label="Teto do mês em reais"><button type="submit" class="btn peq">Salvar teto</button></form>
      <small class="t4muted">Bateu o teto, fecham sozinhos os itens que custam dinheiro (até virar o mês). Conta a parte em 🪙, 🪎 e elementos (1 🪙 = R$ 0,01); 💎 e 🎖️ têm teto próprio.</small>` : ""}
      <h3 style="margin-top:16px">🚀 Lançamento</h3>
      <p class="t4muted" style="margin:0 0 8px">${p.lancado === "todos" ? "A equipe inteira está vendo o sistema novo." : "Só você está vendo. A equipe vê a tela antiga."}</p>
      <button type="button" class="btn ${p.lancado === "todos" ? "" : "ouro9"}" data-t4lancar="${p.lancado === "todos" ? "comando" : "todos"}">${p.lancado === "todos" ? "Voltar a mostrar só para mim" : "Lançar para a equipe"}</button></section>
  </div>
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>🏪 Catálogo do Mercado</h3><p class="t4muted" style="margin:0 0 8px">Ajuste preço, estoque total, estoque do mês e se o item aparece. Vazio = sem limite. Todo preço mostra o equivalente em 🪙. Custo R$ vazio = o sistema usa o equivalente da parte em 🪙/🪎/elementos (preencha o custo de verdade nos itens pagos em 💎 ou 🎖️).</p>
    <div class="t4cat">${(p.catalogo || []).map((i) => `<form data-t4form="item" data-id="${esc(i.id)}" class="t4catl"><span class="t4ic">${i.icone}</span><b>${esc(i.nome)}</b>${T4_ORDEM.filter((k) => !T4_BREVE.includes(k)).map((k) => `<label class="t4mini">${T4_JOIA[k][0]}<input name="${k}" type="number" min="0" value="${+(i.preco[k] || 0)}"></label>`).join("")}<label class="t4mini">estoque<input name="estoque" type="number" min="0" value="${i.estoque ?? ""}"></label><label class="t4mini">por mês<input name="estoque_mes" type="number" min="0" value="${i.estoque_mes ?? ""}"></label>${i.efeito ? "" : `<label class="t4mini">custo R$<input name="custo_real" type="number" min="0" step="0.01" value="${i.custo_real ?? ""}" placeholder="${t4rs(i.custo_calc)}"></label>`}<small class="t4muted">≈ ${t4n(i.em_moedas ?? t4moedas(i.preco))} 🪙</small><label class="t4chk"><input type="checkbox" name="ativo" ${i.ativo ? "checked" : ""}> à venda</label><button type="submit" class="btn peq">Salvar</button></form>`).join("")}</div></section>` : ""}
  ${cmd ? t4lastro() : ""}
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>👥 Tripulação</h3><p class="t4muted" style="margin:0 0 6px">Em ordem alfabética, de propósito.${cmd ? " Marque quem é CLT: só essas pessoas podem trocar itens de folga." : ""}</p>
    <div class="t4equipe">${(p.equipe || []).map((x) => `<div><b>${esc(x.nome)}</b><small>Nív. ${x.nivel} · ${esc(x.patente)} · ${t4n(x.ganho_mes)} 🪎 no mês</small>${cmd ? `<label class="t4chk t4clt"><input type="checkbox" data-t4clt="${x.id}" ${x.clt ? "checked" : ""}> CLT (pode trocar folga)</label>` : ""}</div>`).join("")}</div></section>`;
}

function t4lastro() {
  const l = s.lastro; if (!l) return '<section class="pl6sec t4cx" style="margin-top:14px"><h3>🏦 Lastro das joias</h3><p class="t4muted">Carregando…</p></section>';
  const pe = l.pessoa, eq = (s.ponte?.equipe || []);
  return `<section class="pl6sec t4cx" style="margin-top:14px"><h3>🏦 Lastro das joias</h3>
    <p style="margin:0 0 8px">${l.corrente.ok ? `<span class="t4ok">✓ Livro íntegro</span>: ${l.corrente.linhas} linhas, todas com selo e ligadas em corrente (ponta <code>${esc(l.corrente.ponta || "")}</code>).` : `<b style="color:var(--perigo,#c0392b)">⚠ O livro foi mexido fora do sistema.</b> Veja os alertas.`}</p>
    ${(l.alertas || []).length ? `<div class="t4alertas">${l.alertas.map((a) => `<div class="${a.grave ? "t4grave" : ""}">${a.grave ? "⚠" : "•"} ${esc(a.txt)}</div>`).join("")}</div>` : '<p class="t4muted" style="margin:0 0 8px">Sem alertas: toda joia tem origem, toda troca fecha a conta, ninguém negativo, emissão abaixo do teto.</p>'}
    <div class="t4tabela t4eco2" role="table"><div class="t4tr t4th" role="row"><span>Joia</span><span>Criou no mês</span><span>Queimou</span><span>Trocou</span><span>Em circulação</span><span>Teto/mês</span></div>
      ${T4_ORDEM.map((k) => { const m = l.moedas[k] || {}; return `<div class="t4tr" role="row"><span>${T4_JOIA[k][0]} ${T4_JOIA[k][2]}</span><span>${t4n(m.criou)}</span><span>${t4n(m.queimou)}</span><span>${t4n(m.trocou)}</span><span>${t4n(m.circula)}${+m.guardado ? ` <small class="t4muted">(+${t4n(m.guardado)} no Cais)</small>` : ""}</span><span>${m.teto != null ? t4n(m.teto) : "—"}</span></div>`; }).join("")}</div>
    <small class="t4muted">Tesouro de rota é criado pela própria rota concluída; o teto vale para desafios, Roda, reconhecimento e ajustes.</small>
    <h3 style="margin-top:16px">Trocas do Cais</h3>
    ${(l.trocas || []).map((o) => `<div class="t4rec2"><b>${esc(o.vendedor)} → ${esc(o.comprador)}</b> <small class="t4muted">${t4j(o.moeda, o.qtd)} por ${t4j(o.quer, o.preco)} · ${esc(o.codigo)} · ${t4dia(o.em)}</small>
      ${o.estado === "vendida" ? `<form data-t4form="estorno" data-id="${o.id}" class="t4inl"><input name="motivo" placeholder="Motivo do estorno" minlength="5" required><button type="submit" class="btn peq">Estornar</button></form>` : '<small class="t4muted">estornada</small>'}</div>`).join("") || '<p class="t4muted">Nenhuma troca ainda.</p>'}
    <h3 style="margin-top:16px">Rastrear joias de alguém</h3>
    <select data-t4rastrear><option value="">Escolha a pessoa</option>${eq.map((x) => `<option value="${x.id}" ${pe?.id === x.id ? "selected" : ""}>${esc(x.nome)}</option>`).join("")}</select>
    ${pe ? `<div style="margin-top:10px"><b>${esc(pe.nome)}</b> <small class="t4muted">${T4_ORDEM.map((k) => t4j(k, pe.saldo[k] || 0)).join(" · ")}</small>
      <label class="t4chk"><input type="checkbox" data-t4congelar="${pe.id}" ${pe.congelado ? "checked" : ""}> Pausar as trocas desta pessoa</label>
      <div class="t4ext">${pe.linhas.map((x) => `<div><span class="${+x.qtd > 0 ? "t4ok" : "t4muted"}">${+x.qtd > 0 ? "+" : "−"}${t4j(x.moeda, Math.abs(x.qtd))}</span><b>${esc(x.txt)}</b><small>${t4dia(x.em)} · linha ${x.id} · selo ${esc(x.selo)}${x.contra_id ? ` · <button type="button" class="t4lk" data-t4rastro="${x.contra_id}">seguir para ${esc(x.contra)}</button>` : ""}</small></div>`).join("") || '<p class="t4muted">Nada no livro.</p>'}</div></div>` : ""}
  </section>`;
}

/* ---------- ações ---------- */
function t4ganhou(pr) { const txt = t4premio(pr); return txt === "sem prêmio" ? "" : txt; }
async function t4click(d, b) {
  if (d.tsub) { s.tsub = d.tsub; s.t4saiu = ""; if (d.tsub === "ponte") { s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); if (s.tes?.eu?.papel === "comando") s.lastro = await chamar("alfy_lastro", { p_pessoa: s.lastro?.pessoa?.id || null }).catch(() => s.lastro); } render(); return true; }
  if (d.t4fc) { s.t4fc = d.t4fc; render(); return true; }
  if (d.t4mc) { s.t4mc = d.t4mc; render(); return true; }
  if (d.t4mm) { s.t4mm = d.t4mm; if (d.t4mm === "cais") s.cais = await chamar("alfy_cais").catch(() => s.cais); render(); return true; }
  if (d.t4caiscomprar) {
    const o = (s.cais?.ofertas || []).find((x) => String(x.id) === d.t4caiscomprar); if (!o) return true;
    if (!confirmaT4(`Comprar ${t4j(o.moeda, o.qtd)} de ${o.vendedor} por ${t4j(o.quer, o.preco)}?`, b)) return true;
    try { await chamar("alfy_cais_comprar", { p_oferta: o.id }); aviso(`⚓ Comprado: +${t4j(o.moeda, o.qtd)} de ${o.vendedor}.`); await t4carregar(); render(); } catch (er) { falhou(er); await t4carregar(); render(); }
    return true;
  }
  if (d.t4retirar) {
    if (!confirmaT4("Retirar do Cais? As joias voltam para você.", b)) return true;
    try { await chamar("alfy_cais_retirar", { p_oferta: +d.t4retirar }); aviso("Retirado. As joias voltaram para você."); await t4carregar(); render(); } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4rastro) { s.lastro = await chamar("alfy_lastro", { p_pessoa: d.t4rastro }).catch(() => s.lastro); render(); return true; }
  if (d.t4coletar) {
    try {
      let tot = {};
      const ids = d.t4coletar === "tudo" ? [null] : d.t4coletar.split(",").map(Number);
      const avs = []; for (const id of ids) { const x = await chamar("alfy_coletar", { p_id: id }); if (x?.aviso && !avs.includes(x.aviso)) avs.push(x.aviso); Object.entries(x?.premio || {}).forEach(([k, v]) => { tot[k] = (tot[k] || 0) + +v; }); }
      const g = t4ganhou(tot), at = +tot.atividade || 0; aviso((g || at ? `🎁 Coletado: ${[g, at ? `+${at} ✦ de atividade` : ""].filter(Boolean).join(" · ")}` : "Nada novo para coletar.") + (avs.length ? " " + avs.join(" ") : ""));
      await t4carregar(); render();
    } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4dc) { s.t4dc = d.t4dc; render(); return true; }
  if (d.t4titulo !== undefined) { try { await chamar("alfy_titulo_usar", { p_titulo: d.t4titulo }); aviso(d.t4titulo ? `🏷️ Agora você é ${d.t4titulo}.` : "Título tirado."); await t4carregar(); render(); } catch (er) { falhou(er); } return true; }
  if (d.t4abfechar) { document.getElementById("t4abre")?.remove(); render(); return true; }
  if (d.t4abrir) {
    if (s.t4abrindo) return true;
    s.t4abrindo = true; document.getElementById("t4abre")?.remove(); render();
    try {
      const lista = [];
      if (d.t4abrir === "todos") {
        for (let i = 0; i < 40; i++) {   // até 2.000 aberturas por toque, de 50 em 50
          const x = await chamar("alfy_abrir_baus", { p_vezes: 50 }); lista.push(...(x.aberturas || []));
          if (!(+x.abrivel >= +(s.tes.abrir?.custo || 10)) || !(x.aberturas || []).length) break;
        }
      } else { const x = await chamar("alfy_abrir_baus", { p_vezes: 1 }); lista.push(...(x.aberturas || [])); }
      await t4carregar();
      if (lista.length) t4abrirFx(lista);
    } catch (er) { falhou(er); await t4carregar(); }
    s.t4abrindo = false; render(); return true;
  }
  if (d.t4comprar) {
    const i = (s.tes.mercado || []).find((x) => x.id === d.t4comprar);
    if (!i || !confirmaT4(`${i.efeito ? "Trocar" : "Comprar"} ${i.nome} por ${t4premio(i.preco)}?`, b)) return true;
    try { const x = await chamar("alfy_mercado_comprar", { p_item: i.id }); aviso(i.efeito ? `✓ Troca feita: +${t4premio(i.efeito)}` : `✓ Comprado! Código ${x.codigo}. Aparece em Meus pedidos.`); await t4carregar(); render(); } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4entregar || d.t4cancelar) {
    if (d.t4cancelar && !confirmaT4(d.t4vale ? "Cancelar o vale? A pessoa recebe o valor em 🪙." : "Cancelar e devolver as joias para a pessoa?", b)) return true;
    try { await chamar("alfy_mercado_entregar", { p_pedido: +(d.t4entregar || d.t4cancelar), p_cancelar: !!d.t4cancelar }); aviso(d.t4cancelar ? "Cancelado e devolvido." : "✓ Marcado como entregue."); s.ponte = await chamar("alfy_ponte"); render(); } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4lancar) {
    if (!confirmaT4(d.t4lancar === "todos" ? "Lançar as Rotas do Tesouro para a equipe inteira?" : "Voltar a mostrar só para você?", b)) return true;
    try { await chamar("alfy_tesouros_lancar", { p_modo: d.t4lancar }); aviso(d.t4lancar === "todos" ? "🚀 Lançado! A equipe já vê o sistema novo." : "Voltou a ficar só com você."); await t4carregar(); render(); } catch (er) { falhou(er); }
    return true;
  }
  return false;
}
// confirmação em 2 toques no próprio botão (o app não usa confirm() do navegador)
function confirmaT4(txt, b) {
  if (b.dataset.t4conf === "1") { delete b.dataset.t4conf; return true; }
  b.dataset.t4conf = "1"; const antes = b.textContent; b.textContent = "Toque de novo para confirmar"; b.title = txt; aviso(txt + " Toque de novo no botão para confirmar.");
  setTimeout(() => { if (b.dataset.t4conf === "1") { delete b.dataset.t4conf; b.textContent = antes; } }, 4000);
  return false;
}
document.addEventListener("submit", async (e) => {
  const f = e.target; if (!f.dataset?.t4form) return;
  e.preventDefault();
  const fd = new FormData(f), num = (k) => Math.max(0, Math.floor(+fd.get(k) || 0)), btn = f.querySelector("[type=submit]");
  if (btn?.disabled) return; if (btn) btn.disabled = true;
  try {
    if (f.dataset.t4form === "rec") {
      const pr = {}; ["tesouro", "moeda", "medalha"].forEach((k) => { if (num(k)) pr[k] = num(k); });
      const x = await chamar("alfy_reconhecer", { p_pessoa: fd.get("pessoa"), p_motivo: String(fd.get("motivo") || "").trim(), p_premio: pr, p_divulgar: !!fd.get("divulgar") });
      aviso(x?.envio ? "🏅 Reconhecido! O Contramestre está divulgando no grupo." : "🏅 Reconhecido!"); f.reset();
    } else if (f.dataset.t4form === "camp") {
      const pr = {}; ["moeda", "diamante"].forEach((k) => { if (num(k)) pr[k] = num(k); });
      await chamar("alfy_campanha_salvar", { p_nome: String(fd.get("nome") || "").trim(), p_conta: fd.get("conta"), p_n: num("n"), p_frente: fd.get("frente") || "", p_inicio: fd.get("inicio"), p_fim: fd.get("fim"), p_tesouros: num("tesouro"), p_premio: pr });
      aviso("🗺️ Campanha criada. Ela aparece em Desafios e o sistema confere sozinho."); f.reset();
    } else if (f.dataset.t4form === "cais") {
      const x = await chamar("alfy_cais_vender", { p_moeda: fd.get("moeda"), p_qtd: +fd.get("qtd"), p_quer: fd.get("quer"), p_preco: +fd.get("preco") });
      aviso(`⚓ No Cais! Código ${x.codigo}. Fica lá por ${s.cais?.cfg?.vence_dias || 7} dias ou até alguém comprar.`);
      await t4carregar(); render(); if (btn) btn.disabled = false; return;
    } else if (f.dataset.t4form === "orc") {
      await chamar("alfy_orcamento_salvar", { p_reais: +fd.get("teto") }); aviso("✓ Teto do mês salvo.");
    } else if (f.dataset.t4form === "estorno") {
      await chamar("alfy_cais_estornar", { p_oferta: +f.dataset.id, p_motivo: String(fd.get("motivo") || "").trim() });
      aviso("Troca estornada. As linhas novas ficaram no livro.");
      s.lastro = await chamar("alfy_lastro", { p_pessoa: s.lastro?.pessoa?.id || null }).catch(() => s.lastro);
    } else if (f.dataset.t4form === "item") {
      const pr = {}; T4_ORDEM.forEach((k) => { if (num(k)) pr[k] = num(k); });
      const est = String(fd.get("estoque") ?? "").trim();
      const em = String(fd.get("estoque_mes") ?? "").trim(), cr = String(fd.get("custo_real") ?? "").trim();
      await chamar("alfy_mercado_item_salvar", { p_id: f.dataset.id, p_preco: pr, p_estoque: est === "" ? null : Math.max(0, Math.floor(+est)), p_ativo: !!fd.get("ativo"), p_estoque_mes: em === "" ? null : Math.max(0, Math.floor(+em)), p_custo_real: cr === "" ? null : Math.max(0, +cr) });
      aviso("✓ Item salvo.");
    }
    s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); await t4carregar(); render();
  } catch (er) { falhou(er); }
  if (btn) btn.disabled = false;
});
document.addEventListener("input", (e) => { const f = e.target.closest?.("form[data-t4form=cais]"); if (f) t4caisDica(f); });
document.addEventListener("change", async (e) => {
  const fc = e.target.closest?.("form[data-t4form=cais]"); if (fc) { t4caisDica(fc); return; }
  const r = e.target.closest?.("[data-t4rastrear]");
  if (r) { s.lastro = await chamar("alfy_lastro", { p_pessoa: r.value || null }).catch(() => s.lastro); render(); return; }
  const g = e.target.closest?.("[data-t4congelar]");
  if (g) { try { await chamar("alfy_cais_congelar", { p_pessoa: g.dataset.t4congelar, p_sim: g.checked }); aviso(g.checked ? "Trocas desta pessoa pausadas." : "Trocas liberadas."); s.lastro = await chamar("alfy_lastro", { p_pessoa: g.dataset.t4congelar }).catch(() => s.lastro); render(); } catch (er) { g.checked = !g.checked; falhou(er); } return; }
  const c = e.target.closest?.("[data-t4clt]"); if (!c) return;
  try { await chamar("alfy_pessoa_clt", { p_pessoa: c.dataset.t4clt, p_clt: c.checked }); aviso(c.checked ? "✓ Marcado como CLT." : "Desmarcado: não é CLT."); s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); }
  catch (er) { c.checked = !c.checked; falhou(er); }
});
window.t4Click = t4click; window.t4Carregar = t4carregar; window.vistaTesouros = vistaTesouros;

// 🪎 Rotas do Tesouro v4 (22/11/2026): joias, XP e nível 1 a 100, patentes da Marinha, frentes, desafios automáticos,
// conquistas I a V, Trilha do mês, Mercado multi-moeda, Roda do Leme, reconhecimento e Ponte de Comando.
// Toda conta e todo sorteio acontecem no banco (alfy_tesouros, alfy_coletar, alfy_roleta_girar, alfy_mercado_comprar, alfy_reconhecer...).
// Usa os globais do alfy.js: s, token, chamar, esc, render, aviso, falhou, comando, vistaPlacar.
/* global s, token, chamar, esc, render, aviso, falhou, comando, vistaPlacar, frenteCurta */
"use strict";
const T4_JOIA = { tesouro: ["🪎", "tesouro", "tesouros"], moeda: ["🪙", "moeda", "moedas"], diamante: ["💎", "diamante", "diamantes"], estrela: ["⭐", "estrela", "estrelas"], perola: ["🦪", "pérola", "pérolas"] };
const T4_ORDEM = ["tesouro", "moeda", "diamante", "estrela", "perola"];
const T4_VALOR = { tesouro: 1, moeda: 0.4, diamante: 20, estrela: 25, perola: 100 };
const T4_PATENTES = [[1, "Recruta", "▫️", "Bote"], [5, "Marinheiro", "▪️", "Bote"], [10, "Cabo", "🔻", "Lancha"], [15, "Terceiro-Sargento", "🔺", "Lancha"], [20, "Segundo-Sargento", "🔺", "Navio-Patrulha"], [25, "Primeiro-Sargento", "🔺", "Navio-Patrulha"], [30, "Suboficial", "🔶", "Corveta"], [35, "Guarda-Marinha", "⚓", "Corveta"], [40, "Segundo-Tenente", "⭐", "Fragata"], [45, "Primeiro-Tenente", "⭐", "Fragata"], [50, "Capitão-Tenente", "🎖️", "Contratorpedeiro"], [60, "Capitão de Corveta", "🎖️", "Contratorpedeiro"], [70, "Capitão de Fragata", "🏅", "Cruzador"], [80, "Capitão de Mar e Guerra", "🏅", "Cruzador"], [88, "Contra-Almirante", "🌟", "Porta-Aviões"], [94, "Vice-Almirante", "🌟", "Porta-Aviões"], [100, "Almirante de Esquadra", "👑", "Capitânia da Esquadra"]];
const T4_FRENTE_NIV = [0, 5, 15, 30, 60, 100, 160, 250, 400, 600];
const t4n = (n) => (Math.round((+n || 0) * 10) / 10).toLocaleString("pt-BR");
const t4premio = (pr, tes) => { const l = []; if (+tes) l.push(`${t4n(tes)} 🪎`); T4_ORDEM.forEach((k) => { if (pr && +pr[k]) l.push(`${t4n(pr[k])} ${T4_JOIA[k][0]}`); }); return l.join(" + ") || "sem prêmio"; };
const t4hoje = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
const t4seg = () => { const h = new Date(t4hoje() + "T12:00:00Z"), d = (h.getUTCDay() + 6) % 7; h.setUTCDate(h.getUTCDate() - d); return h.toISOString().slice(0, 10); };
const t4frente = (f) => (typeof frenteCurta === "function" ? frenteCurta(f) : f);
const t4ok = () => s.tes && !s.tes.bloqueado;

// presença: 1 vez por carregamento do app (vale XP e o desafio "Bom dia, Guardião")
(function t4presenca() { if (typeof token !== "undefined" && token) chamar("alfy_presenca").catch(() => {}); else setTimeout(t4presenca, 5000); })();

async function t4carregar() {
  s.tes = await chamar("alfy_tesouros").catch(() => s.tes);
  if (t4ok() && ["comando", "gerente"].includes(s.tes.eu?.papel)) s.ponte = await chamar("alfy_ponte").catch(() => s.ponte);
}

/* ---------- tela ---------- */
function vistaTesouros() {
  if (!t4ok()) return vistaPlacar();
  const t = s.tes, sub = s.tsub || "inicio", mand = ["comando", "gerente"].includes(t.eu.papel);
  const prontos = (t.ganhos || []).filter((g) => g.estado === "pronta");
  const abas = [["inicio", "⚓ Início"], ["desafios", "🎯 Desafios"], ["conquistas", "🏅 Conquistas"], ["trilha", "🗺️ Trilha"], ["mercado", "🏪 Mercado"], ["roda", "☸️ Roda do Leme"], ["bau", "🪎 Baú"]].concat(mand ? [["ponte", "🎛️ Ponte"]] : []);
  const conta = { desafios: prontos.filter((g) => !g.missao.startsWith("c_") && g.missao !== "trilha").length, conquistas: prontos.filter((g) => g.missao.startsWith("c_")).length, trilha: prontos.filter((g) => g.missao === "trilha").length, ponte: mand ? (s.ponte?.pedidos || []).length : 0 };
  const V = { inicio: t4inicio, desafios: t4desafios, conquistas: t4conquistas, trilha: t4trilha, mercado: t4mercado, roda: t4roda, bau: () => vistaPlacar(), ponte: t4ponte }[sub] || t4inicio;
  return `<div class="t4">${t4topo(prontos.length)}
    <div class="t4abas" role="tablist">${abas.map(([k, n]) => `<button type="button" role="tab" class="chip" aria-pressed="${sub === k}" data-tsub="${k}">${n}${conta[k] ? ` <b class="t4bd">${conta[k]}</b>` : ""}</button>`).join("")}</div>
    ${t.lancado !== "todos" && t.eu.papel === "comando" ? `<p class="t4aviso">🔒 Só você está vendo. A equipe continua na tela antiga até você tocar em <b>Lançar para a equipe</b>, na Ponte.</p>` : ""}
    <div class="t4tela">${V()}</div></div>`;
}
function t4topo(np) {
  const t = s.tes, nv = t.nivel, pa = nv.patente, faltam = nv.prox != null ? nv.prox - nv.xp : 0, pct = nv.prox != null ? Math.round(100 * (nv.xp - nv.ini) / (nv.prox - nv.ini)) : 100;
  return `<section class="t4topo">
    <div class="t4navio" aria-hidden="true">${pa.ni}</div>
    <div class="t4quem"><div class="t4nome"><b>${esc((t.eu.nome || "").split(" ")[0])}</b><span class="t4niv">Nível ${nv.nivel}</span></div>
      <div class="t4pat">${pa.ins} ${esc(pa.nome)} · ${esc(pa.navio)}</div>
      <div class="t4xp" aria-hidden="true"><i style="width:${pct}%"></i></div>
      <small class="t4muted">${nv.prox != null ? `${nv.xp.toLocaleString("pt-BR")} XP · faltam ${faltam.toLocaleString("pt-BR")} para o nível ${nv.nivel + 1}` : "nível máximo"} · o nível nunca cai</small></div>
    <div class="t4joias">${T4_ORDEM.map((k) => `<div class="t4joia" title="${T4_JOIA[k][2]}"><span>${T4_JOIA[k][0]}</span><b>${t4n(t.saldo[k])}</b><small>${T4_JOIA[k][2]}</small></div>`).join("")}</div>
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
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>Valor das joias</h3><div class="t4valor">${T4_ORDEM.map((k) => `<span>${T4_JOIA[k][0]} 1 ${T4_JOIA[k][1]} ≈ ${t4n(T4_VALOR[k])} 🪎</span>`).join("")}</div>
    <p class="t4muted" style="margin:8px 0 0">🪎 vem das rotas · 🪙 dos desafios do dia e da semana · 💎 das conquistas · ⭐ só de reconhecimento · 🦪 é raríssima (Roda, Trilha e Carreira).</p></section>`;
}
function t4estadoDesafio(m) {
  const g = (s.tes.ganhos || []).filter((x) => x.missao === m.id);
  const ref = m.cat === "diaria" ? "d:" + t4hoje() : m.cat === "semanal" ? "w:" + t4seg() : "unica";
  if (m.id === "mesmo_dia") { const dia = (v) => v ? new Date(v).toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) : ""; const hoje = g.filter((x) => dia(x.em) === t4hoje()); return { prontos: g.filter((x) => x.estado === "pronta"), feito: hoje.filter((x) => x.estado === "coletada").length }; }
  const x = g.find((y) => y.ref === ref);
  return { prontos: x && x.estado === "pronta" ? [x] : [], feito: x && x.estado === "coletada" ? 1 : 0 };
}
function t4cardDesafio(m) {
  const e = t4estadoDesafio(m), ids = e.prontos.map((x) => x.id).join(",");
  const acao = e.prontos.length ? `<button type="button" class="btn ouro9 peq" data-t4coletar="${ids}">Coletar ${t4premio(m.premio, m.tesouros * e.prontos.length)}</button>`
    : e.feito && m.id !== "mesmo_dia" ? `<span class="t4ok">✓ Feito</span>`
    : m.id === "carta_embarque" ? `<button type="button" class="btn turq peq" data-fichalink="1">Ir preencher</button>` : "";
  const agora = new Date(), fora = m.cat === "campanha" ? (m.fim && new Date(m.fim) <= agora ? "encerrada" : m.inicio && new Date(m.inicio) > agora ? "começa em " + new Date(m.inicio).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }) : "") : "";
  if (fora && !e.prontos.length) return `<article class="t4card feita"><span class="t4ic" aria-hidden="true">${m.icone || "🎯"}</span><div class="t4ct"><b class="t4rec">+${t4premio(m.premio, m.tesouros)}</b><b>${esc(m.nome)}</b><small>${esc(m.descricao || "")}</small><small class="t4muted">${fora}</small></div><div class="t4ac"></div></article>`;
  const falta = m.id === "carta_embarque" && (m.falta || []).length ? `<small class="t4falta">Falta: ${esc(m.falta.join(", "))}</small>` : "";
  return `<article class="t4card ${e.prontos.length ? "pronta" : ""} ${e.feito && m.id !== "mesmo_dia" ? "feita" : ""}"><span class="t4ic" aria-hidden="true">${m.icone || "🎯"}</span>
    <div class="t4ct"><b class="t4rec">+${t4premio(m.premio, m.tesouros)}</b><b>${esc(m.nome)}</b><small>${esc(m.descricao || "")}</small>${falta}
    <small class="t4muted">${esc(m.limite || "")}${m.id === "mesmo_dia" && e.feito ? ` · ${e.feito} hoje` : ""} · confere sozinho</small></div><div class="t4ac">${acao}</div></article>`;
}
function t4desafios() {
  const ms = (s.tes.missoes || []).filter((m) => m.cat !== "conquista");
  const grupo = (titulo, l) => l.length ? `<section class="pl6sec t4cx"><h3>${titulo}</h3><div class="t4lista">${l.map(t4cardDesafio).join("")}</div></section>` : "";
  const ativos = ms.filter((m) => !m.em_breve);
  return `<p class="t4muted" style="margin:0 0 12px">Tudo aqui o sistema confere sozinho, na hora. Ninguém precisa aprovar nada.</p>
    ${grupo("🗺️ Campanhas", ativos.filter((m) => m.cat === "campanha"))}
    ${grupo("🌅 Do dia", ativos.filter((m) => m.cat === "diaria"))}
    ${grupo("🧭 Da semana", ativos.filter((m) => m.cat === "semanal"))}
    ${grupo("⚓ Jornada", ativos.filter((m) => m.cat === "jornada"))}
    ${ms.some((m) => m.em_breve) ? `<section class="pl6sec t4cx t4breve"><h3>🔜 Em breve</h3><p class="t4muted" style="margin:0 0 8px">Já desenhados, entram quando a conferência automática estiver ligada.</p>${ms.filter((m) => m.em_breve).map((m) => `<div class="t4brl"><span>${m.icone}</span><b>${esc(m.nome)}</b><small>${esc(m.descricao || "")} · ${t4premio(m.premio, m.tesouros)}</small></div>`).join("")}</section>` : ""}`;
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
  return `<section class="pl6sec t4cx"><h3>Trilha do mês</h3><p class="t4muted" style="margin:0 0 6px">Cada tesouro ganho no mês leva o barco adiante. Gastar tesouro na Roda ou no Mercado não volta o barco.</p>
    <div class="t4trh"><b>${t4n(g)} 🪎 ganhos no mês</b><span class="t4muted">${prox ? `próximo marco em ${prox[0]} 🪎` : "trilha completa! 🎉"}</span></div>
    <div class="t4trilha">${marcos.map((m, i) => { const x = st(i), ok = g >= m[0]; return `<div class="t4marco ${x?.estado === "coletada" ? "coletado" : x?.estado === "pronta" ? "pronto" : "bloq"}"><div class="t4med">${x?.estado === "coletada" ? "✓" : t4premio(m[1]).split(" ").pop()}</div><b>${m[0]} 🪎</b><small>${t4premio(m[1])}</small>
      ${x?.estado === "pronta" ? `<button type="button" class="btn ouro9 peq" data-t4coletar="${x.id}">Coletar</button>` : !ok ? `<small class="t4muted">faltam ${t4n(m[0] - g)}</small>` : ""}</div>`; }).join("")}</div></section>`;
}
function t4falta(preco) { const sd = s.tes.saldo, f = []; Object.entries(preco || {}).forEach(([k, v]) => { const d = +v - (+sd[k] || 0); if (d > 0) f.push(`${t4n(d)} ${T4_JOIA[k][0]}`); }); return f; }
function t4mercado() {
  const t = s.tes, cat = s.t4mc || "todas", itens = (t.mercado || []).filter((i) => cat === "todas" || i.categoria === cat), cats = [...new Set((t.mercado || []).map((i) => i.categoria))];
  const nome = (id) => (t.mercado || []).find((i) => i.id === id);
  return `<div class="t4filtros"><button type="button" class="chip" aria-pressed="${cat === "todas"}" data-t4mc="todas">Tudo</button>${cats.map((c) => `<button type="button" class="chip" aria-pressed="${cat === c}" data-t4mc="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="t4tabela" role="table">
      <div class="t4tr t4th" role="row"><span>Item</span><span>Preço</span><span></span></div>
      ${itens.map((i) => { const f = t4falta(i.preco), esg = i.estoque != null && i.estoque <= 0; return `<div class="t4tr" role="row"><span class="t4item"><span class="t4ic" aria-hidden="true">${i.icone}</span><span><b>${esc(i.nome)}</b><small>${esc(i.descricao || "")}${i.so_clt ? " · <b>só CLT</b>" : ""}${i.estoque != null ? ` · ${i.estoque > 0 ? `restam ${i.estoque}` : "esgotado"}` : ""}</small></span></span>
        <span class="t4preco">${T4_ORDEM.filter((k) => i.preco[k]).map((k) => `<span class="t4pj">${T4_JOIA[k][0]} ${t4n(i.preco[k])}</span>`).join("")}${i.efeito ? ` <span class="t4muted">→ ${t4premio(i.efeito)}</span>` : ""}</span>
        <span>${esg ? `<button type="button" class="btn peq" disabled>Esgotado</button>` : i.so_clt && !t.eu.clt ? `<button type="button" class="btn peq" disabled>Só CLT</button>` : f.length ? `<button type="button" class="btn peq" disabled title="Faltam ${esc(f.join(", "))}">Faltam ${esc(f.join(" + "))}</button>` : `<button type="button" class="btn ouro9 peq" data-t4comprar="${esc(i.id)}">${i.efeito ? "Trocar" : "Comprar"}</button>`}</span></div>`; }).join("")}
    </div>
    ${(t.pedidos || []).length ? `<section class="pl6sec t4cx" style="margin-top:14px"><h3>Meus pedidos</h3>${t.pedidos.map((p) => `<div class="t4ped"><span>${nome(p.item)?.icone || "🎟️"}</span><b>${esc(nome(p.item)?.nome || p.item)}</b><code>${esc(p.codigo)}</code><small class="${p.estado === "entregue" ? "t4ok" : "t4muted"}">${{ pedido: "aguardando entrega", entregue: "✓ entregue", cancelado: "cancelado, devolvido" }[p.estado]}</small></div>`).join("")}<p class="t4muted" style="margin:8px 0 0">Mostre o código para quem entrega. A data de serviço e folga é combinada com o gerente.</p></section>` : ""}`;
}
function t4roda() {
  const r = s.tes.roleta, tab = r.tabela || [], tot = tab.reduce((a, x) => a + +x.p, 0);
  let a0 = -90; const cx = 150, cy = 150, R = 136, cores = ["#2C3238", "#23282D", "#1E7F79", "#2C3238", "#23282D", "#1E7F79", "#2C3238", "#B8913A", "#E8C468"];
  const fat = tab.map((x, i) => { const ang = 360 * x.p / tot, a1 = a0 + ang, rad = (v) => v * Math.PI / 180, meio = rad(a0 + ang / 2), tr = ang < 8 ? R * .82 : R * .62;
    const p = `<path d="M${cx},${cy} L${(cx + R * Math.cos(rad(a0))).toFixed(1)},${(cy + R * Math.sin(rad(a0))).toFixed(1)} A${R},${R} 0 ${ang > 180 ? 1 : 0} 1 ${(cx + R * Math.cos(rad(a1))).toFixed(1)},${(cy + R * Math.sin(rad(a1))).toFixed(1)} Z" fill="${cores[i % cores.length]}" stroke="#15181B" stroke-width="2"/><text x="${(cx + tr * Math.cos(meio)).toFixed(1)}" y="${(cy + tr * Math.sin(meio)).toFixed(1)}" font-size="${ang < 8 ? 10 : 16}" text-anchor="middle" dominant-baseline="central">${t4premio(x.premio).split(" ").pop()}</text>`;
    x._a0 = a0 + 90; x._a1 = a1 + 90; a0 = a1; return p; }).join("");
  const raios = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${(cx + (R + 2) * Math.cos(a)).toFixed(1)}" y1="${(cy + (R + 2) * Math.sin(a)).toFixed(1)}" x2="${(cx + (R + 16) * Math.cos(a)).toFixed(1)}" y2="${(cy + (R + 16) * Math.sin(a)).toFixed(1)}" stroke="#8C6A2A" stroke-width="8" stroke-linecap="round"/><circle cx="${(cx + (R + 18) * Math.cos(a)).toFixed(1)}" cy="${(cy + (R + 18) * Math.sin(a)).toFixed(1)}" r="7" fill="#B8913A"/>`; }).join("");
  const pode = +s.tes.saldo.tesouro >= +r.custo && +r.hoje < +r.max_dia;
  return `<div class="t4g2"><section class="pl6sec t4cx t4rodabox"><h3>Roda do Leme</h3>
      <div class="t4rodaw"><span class="t4pont" aria-hidden="true"></span><svg id="t4roda" viewBox="-25 -25 350 350" role="img" aria-label="Roda do Leme" style="transform:rotate(${s.t4rot || 0}deg)"><g>${raios}<circle cx="${cx}" cy="${cy}" r="${R + 3}" fill="none" stroke="#B8913A" stroke-width="5"/>${fat}<circle cx="${cx}" cy="${cy}" r="24" fill="#2C3238" stroke="#B8913A" stroke-width="4"/><text x="${cx}" y="${cy}" font-size="18" text-anchor="middle" dominant-baseline="central">🦜</text></g></svg></div>
      <div class="t4saiu" aria-live="polite">${s.t4saiu || `Cada giro custa <b>${r.custo} 🪎</b> · ${r.hoje} de ${r.max_dia} hoje`}</div>
      <button type="button" class="btn ouro9" data-t4girar="1" ${pode && !s.t4girando ? "" : "disabled"}>${+r.hoje >= +r.max_dia ? "Volta amanhã" : +s.tes.saldo.tesouro < +r.custo ? `Faltam ${t4n(r.custo - s.tes.saldo.tesouro)} 🪎` : `Girar por ${r.custo} 🪎`}</button></section>
    <section class="pl6sec t4cx"><h3>Chances de cada giro</h3><table class="t4ch"><tbody>${tab.map((x) => `<tr><td>${t4premio(x.premio)}</td><td>${String(x.p).replace(".", ",")}%</td></tr>`).join("")}</tbody></table>
      <p class="t4muted" style="margin:8px 0 0">A Roda só paga joias, nunca dinheiro nem serviço. Em média devolve uns 8 🪎 por giro de ${r.custo}. No máximo ${r.max_dia} giros por dia.</p></section></div>`;
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
        <div class="t4row">${["tesouro", "diamante", "estrela", "moeda"].filter((k) => cmd || +(p.orcamento || {})[k] > 0).map((k) => `<label class="t4mini">${T4_JOIA[k][0]} ${T4_JOIA[k][2]}<input name="${k}" type="number" min="0" max="${cmd ? 1000 : Math.max(0, (+(p.orcamento || {})[k] || 0) - (+(p.usado || {})[k] || 0))}" step="1" value="0"></label>`).join("")}</div>
        ${cmd ? `<label class="t4chk"><input type="checkbox" name="divulgar"> 🦜 Divulgar no ${esc("🏆 GRUPO ILHA 🏝️")} (só nome e motivo, sem valores)</label>` : `<small class="t4muted">Seu limite do mês: ${["tesouro", "diamante", "estrela"].map((k) => `${T4_JOIA[k][0]} ${t4n(usado[k] || 0)} de ${t4n(orc[k] || 0)}`).join(" · ")}</small>`}
        <button type="submit" class="btn turq">Reconhecer</button></form></section>
    <section class="pl6sec t4cx"><h3>🏪 Entregas do Mercado · ${(p.pedidos || []).length}</h3>
      ${(p.pedidos || []).map((x) => `<div class="t4ped"><span>${x.icone}</span><b>${esc(x.quem)} · ${esc(x.item)}${x.so_clt ? " (só CLT)" : ""}</b><code>${esc(x.codigo)}</code><span class="t4pedac"><button type="button" class="btn turq peq" data-t4entregar="${x.id}">Entregue</button><button type="button" class="btn peq" data-t4cancelar="${x.id}">Cancelar e devolver</button></span></div>`).join("") || '<p class="t4muted">Nada para entregar.</p>'}
      <h3 style="margin-top:16px">Últimos reconhecimentos</h3>
      ${(p.reconhecimentos || []).slice(0, 6).map((r) => `<div class="t4rec2"><b>${esc((r.quem || "").split(" ")[0])}</b> por ${esc((r.por || "").split(" ")[0])}: <i>${esc(r.motivo)}</i> <small class="t4muted">${t4premio(r.premio)}${r.divulgar ? ` · 🦜 ${r.envio === "enviado" ? "divulgado" : r.envio === "erro" ? "⚠️ não saiu no grupo" : "divulgando"}` : ""}</small></div>`).join("") || '<p class="t4muted">Nenhum ainda.</p>'}</section>
  </div>
  ${cmd ? `<div class="t4g2" style="margin-top:14px">
    <section class="pl6sec t4cx"><h3>🗺️ Nova campanha</h3><form data-t4form="camp" class="t4form">
      <label>Nome<input name="nome" required minlength="3" placeholder="Ex.: Semana Forte da VDB"></label>
      <div class="t4row"><label class="t4mini">Regra<select name="conta"><option value="rotas">Concluir rotas</option><option value="prazo">Rotas no prazo</option></select></label><label class="t4mini">Quantas<input name="n" type="number" min="1" value="5" required></label></div>
      <label>Só da frente (opcional)<select name="frente"><option value="">Qualquer frente</option>${frentes.map((f) => `<option>${esc(f)}</option>`).join("")}</select></label>
      <div class="t4row"><label class="t4mini">Começa<input name="inicio" type="date" required value="${t4hoje()}"></label><label class="t4mini">Termina<input name="fim" type="date" required></label></div>
      <div class="t4row">${["tesouro", "moeda", "diamante", "estrela"].map((k) => `<label class="t4mini">${T4_JOIA[k][0]}<input name="${k}" type="number" min="0" value="0"></label>`).join("")}</div>
      <button type="submit" class="btn turq">Criar campanha</button></form>
      ${(p.campanhas || []).map((c) => `<div class="t4rec2"><b>${esc(c.nome)}</b> <small class="t4muted">${c.regra?.n} ${c.regra?.conta === "prazo" ? "no prazo" : "rotas"}${c.regra?.frente ? " · " + esc(t4frente(c.regra.frente)) : ""} · ${t4premio(c.premio, c.tesouros)} · ${esc(c.limite || "")}</small></div>`).join("")}</section>
    <section class="pl6sec t4cx"><h3>📊 Economia do mês</h3>
      <div class="t4eco">${T4_ORDEM.map((k) => { const e = (p.economia || {})[k] || {}; return `<div><span>${T4_JOIA[k][0]}</span><b>+${t4n(e.entrou || 0)}</b><small>−${t4n(e.saiu || 0)}</small></div>`; }).join("")}</div>
      <small class="t4muted">Entrou e saiu no livro de joias no mês (o tesouro das rotas não entra aqui). Giros na Roda: ${p.roleta_mes}.</small>
      <h3 style="margin-top:16px">🚀 Lançamento</h3>
      <p class="t4muted" style="margin:0 0 8px">${p.lancado === "todos" ? "A equipe inteira está vendo o sistema novo." : "Só você está vendo. A equipe vê a tela antiga."}</p>
      <button type="button" class="btn ${p.lancado === "todos" ? "" : "ouro9"}" data-t4lancar="${p.lancado === "todos" ? "comando" : "todos"}">${p.lancado === "todos" ? "Voltar a mostrar só para mim" : "Lançar para a equipe"}</button></section>
  </div>
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>🏪 Catálogo do Mercado</h3><p class="t4muted" style="margin:0 0 8px">Ajuste preço, estoque e se o item aparece. Estoque vazio = sem limite.</p>
    <div class="t4cat">${(p.catalogo || []).map((i) => `<form data-t4form="item" data-id="${esc(i.id)}" class="t4catl"><span class="t4ic">${i.icone}</span><b>${esc(i.nome)}</b>${T4_ORDEM.map((k) => `<label class="t4mini">${T4_JOIA[k][0]}<input name="${k}" type="number" min="0" value="${+(i.preco[k] || 0)}"></label>`).join("")}<label class="t4mini">estoque<input name="estoque" type="number" min="0" value="${i.estoque ?? ""}"></label><label class="t4chk"><input type="checkbox" name="ativo" ${i.ativo ? "checked" : ""}> à venda</label><button type="submit" class="btn peq">Salvar</button></form>`).join("")}</div></section>` : ""}
  <section class="pl6sec t4cx" style="margin-top:14px"><h3>👥 Tripulação</h3><p class="t4muted" style="margin:0 0 6px">Em ordem alfabética, de propósito.${cmd ? " Marque quem é CLT: só essas pessoas podem trocar itens de folga." : ""}</p>
    <div class="t4equipe">${(p.equipe || []).map((x) => `<div><b>${esc(x.nome)}</b><small>Nív. ${x.nivel} · ${esc(x.patente)} · ${t4n(x.ganho_mes)} 🪎 no mês</small>${cmd ? `<label class="t4chk t4clt"><input type="checkbox" data-t4clt="${x.id}" ${x.clt ? "checked" : ""}> CLT (pode trocar folga)</label>` : ""}</div>`).join("")}</div></section>`;
}

/* ---------- ações ---------- */
function t4ganhou(pr) { const txt = t4premio(pr); return txt === "sem prêmio" ? "" : txt; }
async function t4click(d, b) {
  if (d.tsub) { s.tsub = d.tsub; s.t4saiu = ""; if (d.tsub === "ponte") s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); render(); return true; }
  if (d.t4fc) { s.t4fc = d.t4fc; render(); return true; }
  if (d.t4mc) { s.t4mc = d.t4mc; render(); return true; }
  if (d.t4coletar) {
    try {
      let tot = {};
      const ids = d.t4coletar === "tudo" ? [null] : d.t4coletar.split(",").map(Number);
      for (const id of ids) { const x = await chamar("alfy_coletar", { p_id: id }); Object.entries(x?.premio || {}).forEach(([k, v]) => { tot[k] = (tot[k] || 0) + +v; }); }
      const g = t4ganhou(tot); aviso(g ? `🎁 Coletado: ${g}` : "Nada novo para coletar.");
      await t4carregar(); render();
    } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4girar) {
    if (s.t4girando) return true;
    s.t4girando = true; s.t4saiu = "";
    try {
      const x = await chamar("alfy_roleta_girar");
      const tab = s.tes.roleta.tabela || [], i = Math.max(0, tab.findIndex((y) => JSON.stringify(y.premio) === JSON.stringify(x.premio))), f = tab[i];
      const svg = document.getElementById("t4roda");
      if (svg && f && f._a0 != null) {
        const alvo = f._a0 + (f._a1 - f._a0) * (0.25 + Math.random() * 0.5), atual = s.t4rot || 0;
        s.t4rot = atual + 360 * 5 + ((360 - alvo - (atual % 360)) % 360 + 360) % 360;
        svg.style.transition = matchMedia("(prefers-reduced-motion: reduce)").matches ? "none" : "transform 3.6s cubic-bezier(.12,.67,.18,1)";
        svg.style.transform = `rotate(${s.t4rot}deg)`;
        await new Promise((r) => setTimeout(r, matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 3700));
      }
      s.t4saiu = `Saiu: <b>${t4premio(x.premio)}</b>`;
      await t4carregar();
    } catch (er) { falhou(er); }
    s.t4girando = false; render(); return true;
  }
  if (d.t4comprar) {
    const i = (s.tes.mercado || []).find((x) => x.id === d.t4comprar);
    if (!i || !confirmaT4(`${i.efeito ? "Trocar" : "Comprar"} ${i.nome} por ${t4premio(i.preco)}?`, b)) return true;
    try { const x = await chamar("alfy_mercado_comprar", { p_item: i.id }); aviso(i.efeito ? `✓ Troca feita: +${t4premio(i.efeito)}` : `✓ Comprado! Código ${x.codigo}. Aparece em Meus pedidos.`); await t4carregar(); render(); } catch (er) { falhou(er); }
    return true;
  }
  if (d.t4entregar || d.t4cancelar) {
    if (d.t4cancelar && !confirmaT4("Cancelar e devolver as joias para a pessoa?", b)) return true;
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
      const pr = {}; ["tesouro", "diamante", "estrela", "moeda"].forEach((k) => { if (num(k)) pr[k] = num(k); });
      const x = await chamar("alfy_reconhecer", { p_pessoa: fd.get("pessoa"), p_motivo: String(fd.get("motivo") || "").trim(), p_premio: pr, p_divulgar: !!fd.get("divulgar") });
      aviso(x?.envio ? "🏅 Reconhecido! O Contramestre está divulgando no grupo." : "🏅 Reconhecido!"); f.reset();
    } else if (f.dataset.t4form === "camp") {
      const pr = {}; ["moeda", "diamante", "estrela"].forEach((k) => { if (num(k)) pr[k] = num(k); });
      await chamar("alfy_campanha_salvar", { p_nome: String(fd.get("nome") || "").trim(), p_conta: fd.get("conta"), p_n: num("n"), p_frente: fd.get("frente") || "", p_inicio: fd.get("inicio"), p_fim: fd.get("fim"), p_tesouros: num("tesouro"), p_premio: pr });
      aviso("🗺️ Campanha criada. Ela aparece em Desafios e o sistema confere sozinho."); f.reset();
    } else if (f.dataset.t4form === "item") {
      const pr = {}; T4_ORDEM.forEach((k) => { if (num(k)) pr[k] = num(k); });
      const est = String(fd.get("estoque") ?? "").trim();
      await chamar("alfy_mercado_item_salvar", { p_id: f.dataset.id, p_preco: pr, p_estoque: est === "" ? null : Math.max(0, Math.floor(+est)), p_ativo: !!fd.get("ativo") });
      aviso("✓ Item salvo.");
    }
    s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); await t4carregar(); render();
  } catch (er) { falhou(er); }
  if (btn) btn.disabled = false;
});
document.addEventListener("change", async (e) => {
  const c = e.target.closest?.("[data-t4clt]"); if (!c) return;
  try { await chamar("alfy_pessoa_clt", { p_pessoa: c.dataset.t4clt, p_clt: c.checked }); aviso(c.checked ? "✓ Marcado como CLT." : "Desmarcado: não é CLT."); s.ponte = await chamar("alfy_ponte").catch(() => s.ponte); }
  catch (er) { c.checked = !c.checked; falhou(er); }
});
window.t4Click = t4click; window.t4Carregar = t4carregar; window.vistaTesouros = vistaTesouros;

// ⚓ Convés da Tripulação (24/11/2026, pedido do Miguel): feed estilo Instagram com foto, curtida em joia, comentário curto,
// pedido de apoio, boa ação 75/25, perfis da tripulação e a Lojinha da galera (o Cais em vitrine).
// Regras no banco (migr. 0095): 1 curtida por pessoa por post, com UMA joia (🪙 20 ou 50, ou 1 🔥 💧 ⚡ 🌱 💎); 1 comentário de até 140 letras.
/* global s, chamar, esc, aviso, falhou, render, renderSeguro, T4_JOIA, T4_ORDEM, t4n, t4j, t4dia, confirmaT4 */

const CV_JOIAS = [["moeda", 20], ["moeda", 50], ["fogo", 1], ["gota", 1], ["raio", 1], ["broto", 1], ["diamante", 1]];
const CV_TIPO = { apoio: "📣 Pedindo apoio", boa: "❤️ Homenagem", auto: "🏆 Conquista", viver: "🌴 Viver" };
s.cv = s.cv || { sub: "feed", filtro: "tudo", tipo: "post", fotos: {}, pedindo: {} };

function cvIni(nome) { return String(nome || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase(); }
function cvAv(id, tam = 42) {
  const p = s.cvFeed?.pessoas?.[id] || (s.rank?.lista || []).find((x) => x.id === id) || s.cvPerfil?.[id] || {}, foto = p.foto;
  return `<span class="cvav" style="width:${tam}px;height:${tam}px;font-size:${Math.round(tam * 0.36)}px">${foto ? `<img src="${foto}" alt="">` : esc(cvIni(p.nome))}</span>`;
}
function cvNome(id) { const p = s.cvFeed?.pessoas?.[id] || (s.rank?.lista || []).find((x) => x.id === id) || {}; return p.nome || "Alguém"; }
function cvLk(id) { return `<button type="button" class="cvnm" data-cvperfil="${id}">${esc(cvNome(id))}</button>`; }
function cvQuando(t) {
  const m = Math.round((Date.now() - new Date(t)) / 60000);
  return m < 1 ? "agora" : m < 60 ? `há ${m} min` : m < 1440 ? `há ${Math.round(m / 60)} h` : m < 2880 ? "ontem" : t4dia(t);
}

async function cvCarregar(maisAntigos) {
  const r = await chamar("alfy_conves", { p_antes: maisAntigos || null }).catch(() => null);
  if (!r) return;
  if (maisAntigos && s.cvFeed) { s.cvFeed.posts = s.cvFeed.posts.concat(r.posts); Object.assign(s.cvFeed.pessoas, r.pessoas); s.cvFeed.fim = r.posts.length < 30; }
  else { s.cvFeed = r; s.cvFeed.fim = r.posts.length < 30; }
  if (s.tes && r.saldo) s.tes.saldo = r.saldo;
  if (!s.rank) s.rank = await chamar("alfy_ranking").catch(() => null);
}
async function cvAbrirPerfil(id) {
  s.cv.sub = "perfil"; s.cv.quem = id; s.cvP = null; render(); scrollTo(0, 0);
  const [p, f] = await Promise.all([chamar("alfy_perfil", { p_pessoa: id }).catch(() => null), chamar("alfy_conves", { p_autor: id }).catch(() => null)]);
  s.cvP = p ? { ...p, posts: f?.posts || [] } : { erro: true };
  if (f?.pessoas) { s.cvFeed = s.cvFeed || { posts: [], pessoas: {} }; Object.assign(s.cvFeed.pessoas, f.pessoas); }
  renderSeguro();
}

function cvFoto(post) {
  if (!post.foto) return "";
  const f = s.cv.fotos[post.id];
  if (!f && !s.cv.pedindo[post.id]) { s.cv.pedindo[post.id] = true; chamar("alfy_post_foto", { p_post: post.id }).then((x) => { s.cv.fotos[post.id] = x || "x"; renderSeguro(); }).catch(() => { s.cv.fotos[post.id] = "x"; }); }
  return f && f !== "x" ? `<img class="cvfoto" src="${f}" alt="Foto da postagem" loading="lazy">` : `<div class="cvfoto cvfotoesp">${f === "x" ? "Foto indisponível" : "Carregando a foto…"}</div>`;
}
function cvCurtidas(p) {
  const c = p.curtidas || {}, ks = T4_ORDEM.filter((k) => c[k]);
  const quem = (p.quem_curtiu || []).map((x) => `${cvNome(x.p).split(" ")[0]} ${t4j(x.joia, x.qtd)}`).join(" · ");
  return ks.length ? `<div class="cvlikes" title="${esc(quem)}">${ks.map((k) => `<span class="cvlk ${p.minha?.joia === k ? "eu" : ""}">${T4_JOIA[k][0]} ${t4n(c[k].total)}</span>`).join("")}<small>${(p.quem_curtiu || []).length} curtida${(p.quem_curtiu || []).length === 1 ? "" : "s"}</small></div>` : "";
}
function cvPaleta(p) {
  const sd = s.tes?.saldo || {};
  return `<div class="cvpaleta" role="group" aria-label="Escolha a joia da curtida">${CV_JOIAS.map(([k, q]) => `<button type="button" data-cvcurtir="${p.id}" data-j="${k}" data-q="${q}" ${(+sd[k] || 0) < q ? "disabled" : ""}><span>${T4_JOIA[k][0]}</span><small>${q > 1 ? q : "1"}</small></button>`).join("")}</div>
    <small class="t4muted">Uma curtida por postagem, com uma joia só, que sai da sua carteira. ${p.tipo === "boa" && p.reconhecido ? `Homenagem: o presente se divide em 4 partes, 3 para ${esc(cvNome(p.reconhecido).split(" ")[0])} e 1 para ${esc(cvNome(p.autor).split(" ")[0])}, que homenageou (🪙 20 = 15 + 5; 🪙 50 = 38 + 12). Joia de uma unidade vai inteira para ${esc(cvNome(p.reconhecido).split(" ")[0])}.` : "Vai inteira para quem postou."}</small>`;
}
function cvPost(p) {
  const eu = s.tes?.eu?.id, m = p.meta, souRec = p.reconhecido === eu;
  const coment = p.comentarios || [], jaComentei = coment.some((c) => c.p === eu);
  return `<article class="cvpost">
    <header class="cvcab">${cvAv(p.autor)}<div>${cvLk(p.autor)}<small>${cvQuando(p.em)}</small></div>
      ${p.meu || s.tes?.eu?.papel === "comando" ? `<button type="button" class="cvmais" data-cvtirar="${p.id}" title="Tirar a postagem">Tirar</button>` : ""}</header>
    ${CV_TIPO[p.tipo] ? `<span class="cvtag ${p.tipo}">${CV_TIPO[p.tipo]}${p.tipo === "boa" && p.reconhecido ? ` · ${cvLk(p.reconhecido)}` : ""}${p.tipo === "viver" && p.missao ? ` · ${p.missao.icone} ${esc(p.missao.nome)}${p.viver_estado === "ok" ? " ✓ confirmada" : p.viver_estado === "recusada" ? " · não aceita" : ""}` : ""}</span>` : ""}
    ${cvFoto(p)}
    <p class="cvtxt">${esc(p.texto)}</p>
    ${m ? `<div class="cvmeta"><div class="cvbar"><i style="width:${Math.min(100, 100 * (+m.tem || 0) / m.qtd)}%"></i></div><small class="t4muted">${t4n(m.tem)} de ${t4n(m.qtd)} ${T4_JOIA[m.joia][0]} recebidos</small></div>` : ""}
    ${cvCurtidas(p)}
    ${coment.length ? `<div class="cvcoms">${coment.map((c) => `<div>${cvLk(c.p)} ${esc(c.texto)}</div>`).join("")}</div>` : ""}
    ${p.tipo === "viver" && p.viver_estado === "conferir" ? `<div class="cvvoto"><span>🌴 ${p.votos?.sim || 0} de ${p.votos?.precisa || 5} "valeu"${p.votos?.nao ? ` · ${p.votos.nao} "não valeu" (cada um pede +2)` : ""}</span>
      ${p.meu ? "" : p.votos?.meu != null ? `<small>Você marcou: ${p.votos.meu ? "✅ valeu" : "🚫 não valeu"}</small>` : `<button type="button" class="btn turq peq" data-cvvoto="${p.id}" data-v="1">✅ Valeu</button><button type="button" class="btn peq" data-cvvoto="${p.id}" data-v="0">🚫 Não valeu</button>`}</div>` : ""}
    <footer class="cvacoes">
      ${p.minha ? `<span class="cvfeito">💛 Você curtiu com ${t4j(p.minha.joia, p.minha.qtd)}</span>` : p.meu || souRec ? "" : s.cv.paleta === p.id ? cvPaleta(p) : `<button type="button" class="btn ouro9 peq" data-cvpaleta="${p.id}">💛 Curtir com joia</button>`}
      ${!jaComentei ? `<form data-cvform="com" data-id="${p.id}" class="cvcom"><input name="t" maxlength="140" placeholder="Comentário curto" aria-label="Comentário"><button type="submit" class="btn peq">Enviar</button></form>` : ""}
    </footer></article>`;
}
function cvCompor() {
  const t = s.cv.tipo, gente = (s.rank?.lista || []).filter((x) => x.id !== s.tes?.eu?.id).sort((a, b) => a.nome.localeCompare(b.nome));
  return `<section class="pl6sec t4cx cvcompor"><form data-cvform="post">
    <div class="t4filtros">${[["post", "📝 Postagem"], ["apoio", "📣 Pedir apoio"], ["boa", "❤️ Homenagem"]].map(([k, n]) => `<button type="button" class="chip" aria-pressed="${t === k}" data-cvtipo="${k}">${n}</button>`).join("")}</div>
    ${t === "boa" ? `<label class="cvlab">Quem você quer homenagear<select name="rec" required><option value="">Escolha</option>${gente.map((x) => `<option value="${x.id}">${esc(x.nome)}</option>`).join("")}</select></label>` : ""}
    <textarea name="t" maxlength="400" rows="3" required placeholder="${t === "apoio" ? "Conte para que você está juntando (ex.: girar a Roda do Leme)" : t === "boa" ? "Conte o que essa pessoa fez de bom" : "Conta para a tripulação o que rolou hoje"}"></textarea>
    ${t === "apoio" ? `<div class="cvlinha"><label class="cvlab">Quero juntar<input name="mq" type="number" min="1" value="2" required></label><label class="cvlab">de<select name="mj">${["fogo", "moeda", "gota", "raio", "broto", "diamante"].map((k) => `<option value="${k}">${T4_JOIA[k][0]} ${T4_JOIA[k][2]}</option>`).join("")}</select></label></div>` : ""}
    ${t === "boa" ? `<small class="t4muted">Homenagear gasta 1 💚 mimo (você tem ${t4n(s.tes?.saldo?.verde || 0)}; ganha 1 por dia ao entrar no ALFY) e dá 1 ❤️ carinho para a pessoa. Quem curtir a homenagem dá um presente que se divide em 4 partes: 3 para a pessoa homenageada e 1 para você. Ex.: curtida de 🪙 20 = 15 para ela e 5 para você.</small>` : ""}
    <div class="cvlinha">
      <label class="btn peq cvfotobtn">📷 ${s.cv.prev ? "Trocar foto" : "Foto"}<input type="file" accept="image/*" data-cvfoto hidden></label>
      ${s.cv.prev ? `<img class="cvprev" src="${s.cv.prev}" alt="Prévia"><button type="button" class="cvmais" data-cvsemfoto="1">Tirar foto</button>` : ""}
      <button type="submit" class="btn turq" style="margin-left:auto" ${t === "boa" && !(+s.tes?.saldo?.verde > 0) ? "disabled title=\"Você está sem 💚 mimo. Ganha 1 amanhã ao entrar.\"" : ""}>${t === "boa" ? "Homenagear (1 💚 mimo)" : "Postar"}</button></div></form></section>`;
}
function cvFeed() {
  const f = s.cvFeed; if (!f) { cvCarregar().then(renderSeguro); return '<p class="t4muted">Carregando o Nosso Barco…</p>'; }
  const l = f.posts.filter((p) => s.cv.filtro === "tudo" || p.tipo === s.cv.filtro);
  const ofertas = (s.cais?.ofertas || []).filter((o) => !o.minha).slice(0, 4);
  return `<div class="cvg2"><div class="cvcol">${cvCompor()}
      <div class="t4filtros">${[["tudo", "Tudo"], ["boa", "❤️ Homenagens"], ["viver", "🌴 Viver"], ["apoio", "📣 Pedidos de apoio"], ["post", "📝 Postagens"]].map(([k, n]) => `<button type="button" class="chip" aria-pressed="${s.cv.filtro === k}" data-cvfiltro="${k}">${n}</button>`).join("")}</div>
      ${l.map(cvPost).join("") || '<p class="t4muted">Nada por aqui ainda. Faça a primeira postagem.</p>'}
      ${!f.fim && f.posts.length ? `<button type="button" class="btn" data-cvmais="1">Ver mais antigas</button>` : ""}</div>
    <aside class="cvcol cvlado"><section class="pl6sec t4cx"><h3>Como funciona</h3><div class="t4muted cvregras">
      <span>💛 <b>Curtir com joia</b>: escolha 🪙 20 ou 50, ou 1 🔥 💧 ⚡ 🌱, ou 1 💎. A joia vai para quem postou.</span>
      <span>Uma curtida e um comentário curto por postagem.</span>
      <span>📣 <b>Pedir apoio</b> mostra uma meta que enche com as curtidas.</span>
      <span>❤️ <b>Homenagem</b> gasta 1 💚 <b>mimo</b>. Você ganha 1 mimo por dia ao entrar no ALFY (até 30 no mês).</span><span>Quem é homenageado ganha 1 ❤️ <b>carinho</b>. Carinho não se gasta: mostra o quanto a tripulação gosta de você.</span><span><b>Curtiu uma homenagem? O presente se divide.</b> 3 de cada 4 partes vão para quem foi homenageado e 1 para quem homenageou. Ex.: 🪙 20 = 15 + 5. Joia de uma unidade (🔥 💧 ⚡ 🌱 💎) vai inteira para o homenageado.</span>
      <span>Comentário é livre: um por postagem. Presente não conta como coleta, mas tem ranking próprio: 🥇 Ranking › 💛 Curtidas e ❤️ Carinhos.</span></div></section>
      <section class="pl6sec t4cx"><h3>⚓ Na Doca de Comércio</h3>${ofertas.map((o) => `<div class="cvloja1">${esc(o.vendedor)} vende <b>${t4j(o.moeda, o.qtd)}</b> por <b>${t4j(o.quer, o.preco)}</b></div>`).join("") || '<p class="t4muted" style="margin:0">Ninguém vendendo agora.</p>'}
        <button type="button" class="btn peq" style="margin-top:8px" data-tsub="mercado" data-cvdoca="1">Ir à Doca</button></section></aside></div>`;
}
function cvTrip() {
  const l = (s.rank?.lista || []).slice().sort((a, b) => a.nome.localeCompare(b.nome));
  if (!s.rank) { chamar("alfy_ranking").then((x) => { s.rank = x; renderSeguro(); }); return '<p class="t4muted">Carregando a tripulação…</p>'; }
  return `<section class="pl6sec t4cx"><div class="cvgrade">${l.map((p) => `<button type="button" class="cvtrip" data-cvperfil="${p.id}">${cvAv(p.id, 46)}<span><b>${esc(p.nome)}</b><small>${p.patente?.ins || ""} ${esc(p.patente?.nome || "")}</small></span><span class="cvnv">Nív. ${p.nivel}</span></button>`).join("")}</div></section>`;
}
function cvPerfil() {
  const p = s.cvP; if (!p) return '<p class="t4muted">Abrindo o perfil…</p>'; if (p.erro) return '<p class="t4muted">Não deu para abrir esse perfil.</p>';
  const ct = p.contadores || {}, rec = p.recebeu || {};
  const conqs = (p.conquistas || []).map((c) => { const v = +ct[c.contador] || 0, niv = c.niveis || [], f = niv.filter((x) => v >= x).length;
    return `<div class="cvcq ${f ? "tem" : ""}"><span class="ic">${c.icone}</span><b>${esc(c.nome)}</b><span class="cvpips">${niv.map((_, i) => `<i class="${i < f ? "on" : ""}"></i>`).join("")}</span><small>${f ? `${f} de ${niv.length}` : `falta ${niv[0] - v}`}</small></div>`; }).join("");
  return `<button type="button" class="cvvolta" data-cvsub="trip">← Tripulação</button>
    <section class="pl6sec t4cx"><div class="cvhero"><span class="cvavg">${p.foto ? `<img src="${p.foto}" alt="">` : esc(cvIni(p.nome))}<i>${p.patente?.ni || "🚣"}</i></span>
      <div><div class="cvhn">${esc(p.nome)} <span class="cvnvl">Nível ${p.nivel}</span></div><div class="t4muted">${p.patente?.ins || ""} ${esc(p.patente?.nome || "")}${(p.frentes || []).length ? " · " + esc(p.frentes.join(", ")) : ""}</div>${p.titulo ? `<span class="t4titulo">${esc(p.titulo)}</span>` : ""}</div></div>
      <div class="cvnums"><div><b>${t4n(p.baus)}</b><small>🪎 baús conquistados</small></div><div><b>${p.rotas}</b><small>🗺️ rotas entregues</small></div><div><b>${t4n(p.coracoes)}</b><small>❤️ carinhos recebidos</small></div><div><b>${p.curtidas_n}</b><small>💛 curtidas recebidas</small></div></div></section>
    <div class="cvg2"><div class="cvcol"><h3 class="cvh">Postagens</h3>${(p.posts || []).map(cvPost).join("") || '<p class="t4muted">Ainda não postou nada.</p>'}</div>
      <aside class="cvcol"><section class="pl6sec t4cx"><h3>💛 Ganhou em curtidas</h3><div class="cvlikes">${T4_ORDEM.filter((k) => +rec[k]).map((k) => `<span class="cvlk">${T4_JOIA[k][0]} ${t4n(rec[k])}</span>`).join("") || '<span class="t4muted">Nada ainda.</span>'}</div></section>
        <section class="pl6sec t4cx"><h3>🏅 Conquistas</h3><div class="cvconqs">${conqs}</div></section></aside></div>`;
}
function cvLoja() {
  const c = s.cais; if (!c) { chamar("alfy_cais").then((x) => { s.cais = x; renderSeguro(); }); return '<p class="t4muted">Abrindo a Doca…</p>'; }
  const sd = s.tes?.saldo || {}, of = (c.ofertas || []).slice().sort((a, b) => (b.minha ? 1 : 0) - (a.minha ? 1 : 0));
  return `<section class="pl6sec t4cx"><div class="cvlojatopo"><div><h3 style="margin:0 0 4px">⚓ Doca de Comércio</h3><p class="t4muted" style="margin:0">Joias à venda pela tripulação. Quem compra paga o preço, ${c.cfg?.taxa_pct ?? 10}% some do jogo e o resto vai para quem vendeu.</p></div>
      <button type="button" class="btn ouro9" data-t4mm="vender">💰 Vender as minhas joias</button></div>
    <div class="cvvitrine">${of.map((o) => { const falta = (+sd[o.quer] || 0) < +o.preco;
      return `<div class="cvof ${o.minha ? "minha" : ""}">${o.minha ? '<span class="cvselo">sua oferta</span>' : ""}<div class="cvbig">${T4_JOIA[o.moeda][0]} ${t4n(o.qtd)}</div>
        <div class="cvpor">por <b>${t4j(o.quer, o.preco)}</b></div><div class="cvvend">${o.minha ? "Você" : esc(o.vendedor)} · sai em ${t4dia(o.vence_em)}</div>
        ${o.minha ? `<button type="button" class="btn peq" data-t4retirar="${o.id}">Retirar</button>` : c.congelado ? `<button type="button" class="btn peq" disabled>Pausado</button>` : falta ? `<button type="button" class="btn peq" disabled>Faltam ${t4j(o.quer, o.preco - (+sd[o.quer] || 0))}</button>` : `<button type="button" class="btn turq peq" data-t4caiscomprar="${o.id}">Comprar</button>`}</div>`; }).join("") || '<p class="t4muted">Ninguém está vendendo agora. Que tal abrir a sua barraca?</p>'}</div></section>`;
}
function t4conves() {
  const sub = s.cv.sub, saldo = s.tes?.saldo || {};
  return `<div class="cvtopo"><div class="t4filtros">${[["feed", "📰 Feed"], ["trip", "👥 Tripulação"]].map(([k, n]) => `<button type="button" class="chip" aria-pressed="${sub === k || (k === "trip" && sub === "perfil")}" data-cvsub="${k}">${n}</button>`).join("")}</div>
    <div class="cvsaldo">${["verde", "vermelho", "moeda", "fogo", "gota", "raio", "broto", "diamante"].map((k) => `<span title="${T4_JOIA[k][2]}">${T4_JOIA[k][0]} ${t4n(saldo[k] || 0)}</span>`).join("")}</div></div>
    ${sub === "trip" ? cvTrip() : sub === "perfil" ? cvPerfil() : cvFeed()}`;
}

// foto: reduz para no máximo 1280 px e JPEG antes de mandar
function cvReduzir(arq) {
  return new Promise((ok, erro) => {
    const r = new FileReader(); r.onerror = () => erro(new Error("Não deu para ler a foto."));
    r.onload = () => { const img = new Image(); img.onerror = () => erro(new Error("Esse arquivo não é uma foto."));
      img.onload = () => { const k = Math.min(1, 1280 / Math.max(img.width, img.height)), cv = document.createElement("canvas");
        cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k); cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height); ok(cv.toDataURL("image/jpeg", 0.82)); };
      img.src = r.result; };
    r.readAsDataURL(arq);
  });
}
function cvTrocaPost(novo) { const troca = (l) => (l || []).map((x) => (x.id === novo.id ? { ...x, ...novo } : x)); if (s.cvFeed) s.cvFeed.posts = troca(s.cvFeed.posts); if (s.cvP?.posts) s.cvP.posts = troca(s.cvP.posts); }

document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-cvvoto],[data-cvsub],[data-cvperfil],[data-cvfiltro],[data-cvtipo],[data-cvpaleta],[data-cvcurtir],[data-cvtirar],[data-cvmais],[data-cvsemfoto],[data-cvvender]");
  if (!b) return; const d = b.dataset;
  try {
    if (d.cvvoto) {
      b.disabled = true; const x = await chamar("alfy_viver_votar", { p_post: +d.cvvoto, p_vale: d.v === "1" }); cvTrocaPost(x.post);
      aviso(x.post.viver_estado === "ok" ? "🌴 Validada pela tripulação! A missão valeu." : "Voto registrado. Obrigado por conferir."); return render();
    }
    if (d.cvsub) { s.cv.sub = d.cvsub; s.cv.paleta = null; if (d.cvsub === "loja") s.cais = await chamar("alfy_cais").catch(() => s.cais); render(); return; }
    if (d.cvperfil) { if (s.tsub !== "conves") { s.tsub = "conves"; } return cvAbrirPerfil(d.cvperfil); }
    if (d.cvfiltro) { s.cv.filtro = d.cvfiltro; return render(); }
    if (d.cvtipo) { s.cv.tipo = d.cvtipo; return render(); }
    if (d.cvpaleta) { s.cv.paleta = +d.cvpaleta; return render(); }
    if (d.cvsemfoto) { s.cv.prev = null; return render(); }
    if (d.cvvender) { s.tsub = "mercado"; s.t4mm = "cais"; render(); return; }
    if (d.cvmais) { b.disabled = true; await cvCarregar(s.cvFeed.posts[s.cvFeed.posts.length - 1]?.id); return render(); }
    if (d.cvcurtir) {
      const j = d.j, q = +d.q;
      if (j === "diamante" && !confirmaT4("Curtir com 1 💎? O diamante sai da sua carteira.", b)) return;
      b.disabled = true;
      const x = await chamar("alfy_curtir", { p_post: +d.cvcurtir, p_joia: j, p_qtd: q });
      s.cv.paleta = null; if (s.tes) s.tes.saldo = x.saldo; cvTrocaPost(x.post);
      aviso(`💛 Você deu ${t4j(x.joia, x.qtd)} de presente.`); return render();
    }
    if (d.cvtirar) {
      if (!confirmaT4("Tirar esta postagem do Nosso Barco?", b)) return;
      await chamar("alfy_post_esconder", { p_post: +d.cvtirar });
      if (s.cvFeed) s.cvFeed.posts = s.cvFeed.posts.filter((p) => p.id !== +d.cvtirar); if (s.cvP?.posts) s.cvP.posts = s.cvP.posts.filter((p) => p.id !== +d.cvtirar);
      aviso("Postagem retirada."); return render();
    }
  } catch (er) { b.disabled = false; falhou(er); }
});
document.addEventListener("change", async (e) => {
  const i = e.target.closest?.("[data-cvfoto]"); if (!i || !i.files?.[0]) return;
  try { s.cv.prev = await cvReduzir(i.files[0]); render(); } catch (er) { falhou(er); }
});
document.addEventListener("submit", async (e) => {
  const f = e.target; if (!f.dataset?.cvform) return;
  e.preventDefault();
  const fd = new FormData(f), btn = f.querySelector("[type=submit]"); if (btn?.disabled) return; if (btn) btn.disabled = true;
  try {
    if (f.dataset.cvform === "post") {
      const t = s.cv.tipo, foto = s.cv.prev;
      await chamar("alfy_postar", { p_texto: String(fd.get("t") || "").trim(), p_tipo: t, p_foto: foto ? foto.split(",")[1] : null, p_foto_tipo: foto ? "image/jpeg" : null,
        p_meta_joia: t === "apoio" ? fd.get("mj") : null, p_meta_qtd: t === "apoio" ? +fd.get("mq") : null, p_reconhecido: t === "boa" ? fd.get("rec") || null : null });
      s.cv.prev = null; s.cv.tipo = "post"; await cvCarregar(); aviso("📰 Postado no Nosso Barco."); render(); scrollTo(0, 0);
    } else if (f.dataset.cvform === "com") {
      const x = await chamar("alfy_post_comentar", { p_post: +f.dataset.id, p_texto: String(fd.get("t") || "").trim() });
      cvTrocaPost(x.post); render();
    }
  } catch (er) { falhou(er); }
  if (btn) btn.disabled = false;
});
window.t4conves = t4conves; window.cvLoja = cvLoja; window.cvFoto = cvFoto; window.cvReduzir = cvReduzir; window.cvCarregar = cvCarregar; window.cvAbrirPerfil = cvAbrirPerfil;

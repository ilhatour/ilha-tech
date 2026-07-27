#!/usr/bin/env node
/* ============================================================
   ILHA TECH — gerador estático (sem dependências)
   Lê data/site.json → escreve index.html, sitemap.xml, robots.txt, favicon.svg
   Rode:  node build/generate.mjs
   Design: "Centro de Controle" · Paleta oficial Velvet Lima · Poppins
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(ROOT, p), "utf8");
const write = (p, c) => { mkdirSync(dirname(join(ROOT, p)), { recursive: true }); writeFileSync(join(ROOT, p), c); };

const D = JSON.parse(read("data/site.json"));

/* ---- Constantes da marca ---- */
const SITE = D.marca.dominio;             // https://ilhatech.io
const NOME = D.marca.nome;
const WA = D.marca.whatsapp;              // 5521965166262
const waLink = (msg) => `https://wa.me/${WA}${msg ? "?text=" + encodeURIComponent(msg) : ""}`;
const GA4 = "G-VTDV3DTT6C"; // GA4 "Ilha Tech" (conta Ilha Tour a150469498), fluxo web ilhatech.io
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ============================================================
   ÍCONES — traço geométrico (tech), currentColor
   ============================================================ */
const I = {
  cpu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5" rx=".5"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="m3 13 9 5 9-5"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.4 7.7 8 9 4.6-1.3 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z"/><path d="M8.5 12h.01M12 12h.01M15.5 12h.01"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h16"/><path d="m7 14 3-3 3 3 5-6"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  plug: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6M15 2v6M7 8h10v3a5 5 0 0 1-10 0V8Z"/><path d="M12 16v6"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v5h-5"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>`,
  menu: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411z"/></svg>`,
};
/* mark da "Nave" (losango orbital) p/ cards de produto */
function naveMark() {
  return `<svg class="nave__mark" viewBox="0 0 40 40" fill="none" aria-hidden="true">
    <circle cx="20" cy="20" r="17" stroke="var(--uva)" stroke-width="1" opacity=".35"/>
    <path d="M20 8 L30 20 L20 32 L10 20 Z" fill="var(--uva)"/>
    <path d="M20 13 L25 20 L20 27 L15 20 Z" fill="var(--lilas)"/>
    <circle cx="20" cy="20" r="2.4" fill="var(--velvet)"/>
  </svg>`;
}
const icon = (k) => I[k] || "";

/* marca interina = emoji oficial 👾 (logo definitivo a refazer) */
function logoMark() {
  return `<span class="brand__mark" role="img" aria-label="${NOME}">👾</span>`;
}

/* ============================================================
   ASSINATURA — Console orbital da Nave-Mãe (hero)
   Nave-Mãe no centro; sistemas reais orbitando com status Lima.
   ============================================================ */
function orbital() {
  const sats = [
    { r: 118, a: -32, label: "Sites" },
    { r: 118, a: 74,  label: "Atendimento" },
    { r: 170, a: 160, label: "Dados" },
    { r: 170, a: 22,  label: "Integrações" },
    { r: 220, a: 218, label: "SEO" },
  ];
  const cx = 240, cy = 240;
  const node = ({ r, a, label }, i) => {
    const rad = (a * Math.PI) / 180;
    const x = cx + r * Math.cos(rad);
    const y = cy + r * Math.sin(rad);
    return `<g class="orb-sat" style="--d:${i * 0.4}s">
      <line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="var(--uva)" stroke-width="1" opacity=".22"/>
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5.5" fill="var(--velvet-claro)" stroke="var(--uva)" stroke-width="1.4"/>
      <circle class="orb-led" cx="${(x + 9).toFixed(1)}" cy="${(y - 9).toFixed(1)}" r="2.6" fill="var(--lima)"/>
      <text x="${(x).toFixed(1)}" y="${(y + 22).toFixed(1)}" text-anchor="middle" class="orb-label">${label}</text>
    </g>`;
  };
  return `<div class="orbital" aria-hidden="true">
    <svg viewBox="0 0 480 480" fill="none">
      <defs>
        <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="var(--uva)" stop-opacity="0"/>
          <stop offset="1" stop-color="var(--uva)" stop-opacity=".5"/>
        </linearGradient>
      </defs>
      <g class="orb-rings">
        <circle cx="${cx}" cy="${cy}" r="118" stroke="var(--uva)" stroke-width="1" opacity=".16"/>
        <circle cx="${cx}" cy="${cy}" r="170" stroke="var(--uva)" stroke-width="1" opacity=".13"/>
        <circle cx="${cx}" cy="${cy}" r="220" stroke="var(--uva)" stroke-width="1" opacity=".10" stroke-dasharray="3 7"/>
      </g>
      <line class="orb-sweep" x1="${cx}" y1="${cy}" x2="${cx + 220}" y2="${cy}" stroke="url(#sweep)" stroke-width="2.5"/>
      <g class="orb-sats">${sats.map(node).join("")}</g>
      <g class="orb-core">
        <circle cx="${cx}" cy="${cy}" r="46" fill="var(--uva)" opacity=".14"/>
        <path d="M240 202 L278 240 L240 278 L202 240 Z" fill="var(--uva)"/>
        <path d="M240 214 L266 240 L240 266 L214 240 Z" fill="var(--velvet)"/>
        <circle cx="${cx}" cy="${cy}" r="6" fill="var(--lima)"/>
      </g>
      <text x="${cx}" y="308" text-anchor="middle" class="orb-core-label">NAVE-MÃE</text>
    </svg>
  </div>`;
}

/* ============================================================
   DIVISOR geométrico (overshoot p/ nunca deixar filete de 1px)
   corta de prevColor para nextColor com um plano diagonal.
   ============================================================ */
function divider(prevColor, nextColor, flip = false) {
  const path = flip
    ? "M0,120 L1440,20 L1440,122 L0,122 Z"
    : "M0,20 L1440,120 L1440,122 L0,122 Z";
  return `<div class="divider" style="background:${prevColor}">
    <svg viewBox="0 0 1440 122" preserveAspectRatio="none" aria-hidden="true">
      <path fill="${nextColor}" d="${path}"></path>
    </svg></div>`;
}

/* ============================================================
   HEAD — SEO / OG / JSON-LD
   ============================================================ */
function head({ title, desc, canonical }) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: NOME,
    alternateName: "Ilha Tech · Grupo Ilha",
    url: SITE,
    logo: SITE + "/apple-touch-icon.png",
    description: desc,
    parentOrganization: { "@type": "Organization", name: D.marca.grupo },
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "SoftwareApplication",
        name: "Nave-Mãe",
        applicationCategory: "BusinessApplication",
        description: "Software de gestão de turismo 360°.",
      },
    },
  };
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:locale" content="pt_BR">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE}/assets/img/og-ilha-tech.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="${NOME}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE}/assets/img/og-ilha-tech.png">
<meta name="theme-color" content="#14062F">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" type="image/png" sizes="32x32" href="/assets/img/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/assets/img/favicon-16.png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Gugi&family=Poppins:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/css/styles.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>${GA4 ? `
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA4}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA4}');</script>` : ""}
</head>`;
}

/* ============================================================
   COMPONENTES
   ============================================================ */
const eyebrow = (t) => `<p class="eyebrow"><span class="eyebrow__tick"></span>${esc(t)}</p>`;

function nav() {
  const links = D.rodape.links.map((l) => `<a href="${l.href}">${esc(l.texto)}</a>`).join("");
  return `<header class="nav" id="top">
    <div class="nav__inner">
      <a class="brand" href="#top" aria-label="${NOME}">
        ${logoMark()}
        <span class="brand__word">Ilha<b>Tech</b></span>
      </a>
      <nav class="nav__links" aria-label="Navegação principal">${links}</nav>
      <a class="btn btn--cta nav__cta" href="${waLink(D.contato.wa_msg)}" target="_blank" rel="noopener">${icon("whatsapp")} ${esc(D.contato.cta_header)}</a>
      <button class="nav__toggle" aria-label="Abrir menu" aria-expanded="false">${icon("menu")}</button>
    </div>
    <div class="nav__mobile" hidden>
      ${D.rodape.links.map((l) => `<a href="${l.href}">${esc(l.texto)}</a>`).join("")}
      <a class="btn btn--cta" href="${waLink(D.contato.wa_msg)}" target="_blank" rel="noopener">${icon("whatsapp")} ${esc(D.contato.cta_header)}</a>
    </div>
  </header>`;
}

function hero() {
  const h = D.hero;
  const tele = h.telemetria.map((t) => {
    const core = t.estado === "núcleo";
    return `<li class="tele${core ? " tele--core" : ""}"><span class="tele__dot"></span>${esc(t.nome)}<span class="tele__state">${esc(t.estado)}</span></li>`;
  }).join("");
  return `<section class="hero">
    <div class="hero__grid-bg" aria-hidden="true"></div>
    <div class="hero__inner">
      <div class="hero__copy">
        ${eyebrow(h.eyebrow)}
        <h1 class="hero__title">${esc(h.titulo).replace(/Nave-Mãe/g, '<span class="nb">Nave-Mãe</span>')}</h1>
        <p class="hero__sub">${esc(h.sub)}</p>
        <div class="hero__cta">
          <a class="btn btn--cta" href="#navemae">${esc(h.cta)} ${icon("arrow")}</a>
          <a class="btn btn--ghost" href="#operamos">${esc(h.cta_sec)}</a>
        </div>
        <ul class="hero__tele">${tele}</ul>
      </div>
      <div class="hero__viz">${orbital()}</div>
    </div>
  </section>`;
}

function bloco_oque() {
  const o = D.oque;
  const pil = o.pilares.map((p) => `<article class="pill">
      <span class="pill__ic">${icon(p.icone)}</span>
      <h3>${esc(p.titulo)}</h3>
      <p>${esc(p.texto)}</p>
    </article>`).join("");
  return `<section class="sec sec--light" id="oque">
    <div class="wrap">
      <div class="sec__head">
        ${eyebrow(o.eyebrow)}
        <h2>${esc(o.titulo)}</h2>
        <p class="sec__lead">${esc(o.texto)}</p>
      </div>
      <div class="pill-grid">${pil}</div>
    </div>
  </section>`;
}

function bloco_historia() {
  const h = D.historia;
  const paras = h.paragrafos.map((p) => `<p>${esc(p)}</p>`).join("");
  return `<section class="sec sec--mist hist" id="historia">
    <div class="wrap hist__grid">
      <div class="hist__body">
        ${eyebrow(h.eyebrow)}
        <h2>${esc(h.titulo)}</h2>
        <div class="hist__text">${paras}</div>
      </div>
      <aside class="hist__card">
        <span class="hist__quote-mark" aria-hidden="true">&ldquo;</span>
        <p class="hist__quote">${esc(h.quote)}</p>
        <div class="hist__sign">
          <img class="hist__avatar" src="/assets/img/miguel-ceo.png" width="168" height="168" alt="${esc(h.assinatura_nome)}" decoding="async" loading="lazy">
          <span class="hist__who"><b>${esc(h.assinatura_nome)}</b>${esc(h.assinatura_cargo)}</span>
        </div>
      </aside>
    </div>
  </section>`;
}

function bloco_navemae() {
  const n = D.navemae;
  const mods = n.modulos.map((m) => `<article class="mod${m._placeholder ? " mod--todo" : ""}">
      <div class="mod__top">
        <span class="mod__state">${esc(m.estado)}</span>
      </div>
      <h3>${esc(m.titulo)}</h3>
      <p>${esc(m.texto)}</p>
    </article>`).join("");
  return `<section class="sec sec--dark" id="navemae">
    <div class="wrap">
      <div class="nm__head">
        <div>
          ${eyebrow(n.eyebrow)}
          <h2 class="nm__title">${esc(n.titulo)}</h2>
          <p class="nm__sub">${esc(n.sub)}</p>
          <p class="nm__text">${esc(n.texto)}</p>
        </div>
        <div class="nm__badge" aria-hidden="true">
          <span class="nm__badge-360">360°</span>
          <span class="nm__badge-lbl">gestão de turismo</span>
        </div>
      </div>
      <div class="mod-grid">${mods}</div>
    </div>
  </section>`;
}

function bloco_produtos() {
  const p = D.produtos;
  const cards = p.itens.map((it, i) => `<article class="nave${i === 0 ? " nave--flag" : ""}">
      <div class="nave__head">${naveMark()}<span class="nave__tag">${esc(it.tag)}</span></div>
      <h3>${esc(it.nome)}</h3>
      <p>${esc(it.resolve)}</p>
    </article>`).join("");
  return `<section class="sec sec--mist" id="produtos">
    <div class="wrap">
      <div class="sec__head">
        ${eyebrow(p.eyebrow)}
        <h2>${esc(p.titulo)}</h2>
        <p class="sec__lead">${esc(p.texto)}</p>
      </div>
      <div class="nave-grid">${cards}</div>
    </div>
  </section>`;
}

function bloco_mercado() {
  const m = D.mercado;
  const pts = m.pontos.map((p) => `<article class="mkt">
      <h3>${esc(p.titulo)}</h3>
      <p>${esc(p.texto)}</p>
    </article>`).join("");
  return `<section class="sec sec--dark mkt-sec" id="mercado">
    <div class="wrap">
      <div class="sec__head">
        ${eyebrow(m.eyebrow)}
        <h2>${esc(m.titulo)}</h2>
        <p class="sec__lead">${esc(m.texto)}</p>
      </div>
      <div class="mkt-grid">${pts}</div>
    </div>
  </section>`;
}

function bloco_operamos() {
  const o = D.operamos;
  const cards = o.areas.map((a, i) => `<article class="area">
      <span class="area__n">${String(i + 1).padStart(2, "0")}</span>
      <span class="area__ic">${icon(a.icone)}</span>
      <h3>${esc(a.titulo)}</h3>
      <p>${esc(a.texto)}</p>
    </article>`).join("");
  return `<section class="sec sec--light" id="operamos">
    <div class="wrap">
      <div class="sec__head">
        ${eyebrow(o.eyebrow)}
        <h2>${esc(o.titulo)}</h2>
        <p class="sec__lead">${esc(o.texto)}</p>
      </div>
      <div class="area-grid">${cards}</div>
      <p class="operamos__proof">Tudo isso no ar hoje — veja a operação em <a href="https://ilhatour.com" target="_blank" rel="noopener">ilhatour.com ${icon("arrow")}</a></p>
    </div>
  </section>`;
}

function bloco_cultura() {
  const c = D.cultura;
  const vals = c.valores.map((v) => `<li class="val"><span class="val__emoji">${v.emoji}</span>${esc(v.nome)}</li>`).join("");
  return `<section class="sec sec--mist" id="cultura">
    <div class="wrap">
      <div class="sec__head">
        ${eyebrow(c.eyebrow)}
        <h2>${esc(c.titulo)}</h2>
        <p class="sec__lead">${esc(c.texto)}</p>
      </div>
      <ul class="val-grid">${vals}</ul>
    </div>
  </section>`;
}

function bloco_numeros() {
  const n = D.numeros;
  const st = n.stats.map((s) => `<div class="stat${s.real ? "" : " stat--todo"}">
      <span class="stat__v">${esc(s.valor)}</span>
      <span class="stat__l">${esc(s.label)}</span>
    </div>`).join("");
  return `<section class="sec sec--dark sec--stats" id="numeros">
    <div class="wrap">
      <div class="sec__head sec__head--center">
        ${eyebrow(n.eyebrow)}
        <h2>${esc(n.titulo)}</h2>
        ${n.sub ? `<p class="sec__lead">${esc(n.sub)}</p>` : ""}
      </div>
      <div class="stat-grid">${st}</div>
    </div>
  </section>`;
}

function bloco_contato() {
  const c = D.contato;
  return `<section class="sec sec--dark sec--contato" id="contato">
    <div class="wrap contato">
      ${eyebrow(c.eyebrow)}
      <h2>${esc(c.titulo)}</h2>
      <p class="contato__lead">${esc(c.texto)}</p>
      <a class="btn btn--cta btn--lg" href="${waLink(c.wa_msg)}" target="_blank" rel="noopener">${icon("whatsapp")} ${esc(c.cta)}</a>
      <p class="contato__mail">${esc(D.marca.telefone_exibicao)} · WhatsApp</p>
      <span class="contato__emblem" aria-hidden="true">👾</span>
    </div>
  </section>`;
}

function footer() {
  const r = D.rodape;
  const links = r.links.map((l) => `<a href="${l.href}">${esc(l.texto)}</a>`).join("");
  const year = "2026";
  return `<footer class="foot">
    <div class="wrap foot__grid">
      <div class="foot__brand">
        <a class="brand" href="#top">${logoMark()}<span class="brand__word">Ilha<b>Tech</b></span></a>
        <p>${esc(r.sobre)}</p>
      </div>
      <nav class="foot__links" aria-label="Rodapé">${links}</nav>
    </div>
    <div class="wrap foot__base">
      <span>© ${year} ${esc(NOME)} · ${esc(D.marca.grupo)}</span>
      <span class="foot__tag">${esc(D.marca.tagline)}</span>
    </div>
  </footer>`;
}

/* ============================================================
   PÁGINA 404
   ============================================================ */
function page404() {
  return `${head({
    title: "Página não encontrada — Ilha Tech",
    desc: "A página que você procura não existe ou foi movida.",
    canonical: SITE + "/404.html",
  })}
<body>
<main class="err">
  <div class="err__inner">
    <span class="err__logo" role="img" aria-label="${NOME}">👾</span>
    <p class="err__code">404</p>
    <h1 class="err__title">Rota fora do radar</h1>
    <p class="err__lead">A página que você procura não existe ou saiu de órbita. Vamos te levar de volta ao centro de controle.</p>
    <a class="btn btn--cta btn--lg" href="/">Voltar ao início ${icon("arrow")}</a>
  </div>
</main>
</body>
</html>`;
}

/* ============================================================
   PÁGINA
   ============================================================ */
function page() {
  return `${head({
    title: "Ilha Tech — a tecnologia que pilota o Grupo Ilha",
    desc: "Ilha Tech é a franquia de tecnologia do Grupo Ilha. Desenvolvemos a Nave-Mãe, software de gestão de turismo 360°, e mantemos os sistemas digitais que administram a Ilha Tour.",
    canonical: SITE + "/",
  })}
<body>
${nav()}
<main>
${hero()}
${divider("var(--velvet)", "var(--branco)")}
${bloco_oque()}
${divider("var(--branco)", "var(--lilas)")}
${bloco_historia()}
${divider("var(--lilas)", "var(--velvet)")}
${bloco_navemae()}
${divider("var(--velvet)", "var(--lilas)")}
${bloco_produtos()}
${divider("var(--lilas)", "var(--velvet)")}
${bloco_mercado()}
${divider("var(--velvet)", "var(--branco)", true)}
${bloco_operamos()}
${bloco_cultura()}
${divider("var(--lilas)", "var(--velvet)")}
${bloco_numeros()}
${bloco_contato()}
</main>
${footer()}
<script src="/assets/js/main.js" defer></script>
</body>
</html>`;
}

/* ============================================================
   ARTEFATOS AUXILIARES
   ============================================================ */
function faviconSVG() {
  // marca oficial = emoji 👾 (color emoji renderizado pelos navegadores modernos)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><text x="16" y="17" font-size="28" text-anchor="middle" dominant-baseline="central">👾</text></svg>`;
}

function sitemap() {
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
</urlset>`;
}

function robots() {
  return `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`;
}

/* ============================================================
   BUILD
   ============================================================ */
write("index.html", page());
write("404.html", page404());
write("favicon.svg", faviconSVG());
write("sitemap.xml", sitemap());
write("robots.txt", robots());

console.log("✅ Ilha Tech gerado: index.html · favicon.svg · sitemap.xml · robots.txt");

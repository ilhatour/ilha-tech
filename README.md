# Ilha Tech — site institucional

Site estático (one-page) da **Ilha Tech**, a franquia de tecnologia do Grupo Ilha.
Conceito de design: **"Centro de Controle"** · paleta oficial **Velvet Lima** · tipografia **Poppins**.

## Stack
- Gerador estático em Node puro, **zero dependências** (`build/generate.mjs`).
- Conteúdo canônico em `data/site.json` (separado do código).
- CSS/JS editados à mão em `assets/`.
- Deploy: Hostinger Business com auto-deploy do GitHub (push na `main` → no ar).
- `.htaccess` com `no-cache, must-revalidate` desde o dia 1.

## Fluxo de update
```
editar data/site.json (ou css/js)  →  node build/generate.mjs  →  git commit  →  git push
```
NÃO editar `index.html` à mão (é regenerado por cima).

## Fonte da verdade
Playbook Tech + Identidade Visual no Notion. Regra de ouro: **nunca inventar** conteúdo da empresa.

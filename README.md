# AllTools — Starter (FR)

Monorepo minimal pour lancer un SaaS utilitaire (PHOTO • VIDÉO • AUDIO • PDF).

## Prérequis
- Node 20+, pnpm
- Un bucket S3/R2 en Europe
- Un Redis managé (Upstash EU)
- FFmpeg est fourni via binaire npm

## Installation

```bash
pnpm i -w
cd apps/web && pnpm i && pnpm dev
```

Dans un autre terminal :

```bash
cd packages/workers
pnpm i
pnpm dev
```

Renseigne `.env` à la racine (copie `.env.example`) dans **apps/web** et **packages/workers** (les deux lisent les mêmes variables d'env au déploiement).

## Démarrage rapide
1. Crée un bucket + variables S3 (voir `.env.example`).
2. Lance `apps/web` (http://localhost:3000) et ouvre **Vidéo → Extraire l'audio**.
3. Dans `packages/workers`, lance le **worker**. Upload un MP4 → tu récupères un MP3.
4. Essaie **PDF → Fusionner** avec 2 fichiers.

## Déploiement
- Web (Next.js) : Vercel
- Worker : Render (Background worker) ou Fly.io
- Redis : Upstash EU
- Stockage : Cloudflare R2 (EU) ou AWS S3 (Paris eu-west-3)

## Légal (France)
- Pas de téléchargement depuis plateformes tierces sans autorisation.
- Contenu uploadé par l'utilisateur uniquement.
- Suppression automatique des fichiers (prévois un cron côté worker).

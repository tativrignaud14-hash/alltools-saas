# Deploiement AllTools

## Architecture recommandee

- Web Next.js: Vercel, projet racine `apps/web`.
- Worker BullMQ: Render Background Worker via `render.yaml`.
- Redis: Upstash Redis avec URL `rediss://...`.
- Fichiers: Cloudflare R2 ou S3 compatible.

## Variables a mettre sur Vercel et Render

Les deux services ont besoin des memes variables:

- `REDIS_URL`
- `S3_REGION`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`

Ne mets pas `ALLTOOLS_STORAGE_DIR` ni `ALLTOOLS_ALLOW_LOCAL_JOBS` en production, sauf pour un test volontaire sans Redis/S3.

## Vercel

1. Importer le repo.
2. Choisir `apps/web` comme Root Directory.
3. Ajouter les variables d'environnement.
4. Deployer.

Le fichier `apps/web/vercel.json` force les commandes monorepo PNPM.

## Render

1. Connecter le meme repo.
2. Creer le worker depuis `render.yaml`.
3. Ajouter les variables d'environnement.
4. Lancer le deploy.

## Points externes

- `remove-bg` demande `rembg` installe dans l'environnement worker. Si Render ne fournit pas Python/rembg, il faudra passer par une image Docker custom ou remplacer par un provider IA.
- `colorize` et `product-background-ai` demandent encore un provider IA image.

# Déploiement Vercel

## Prérequis

- Projet Vercel lié au dépôt GitHub.
- Node.js 22 ou supérieur (configurer le runtime du projet Vercel sur Node.js 22).
- Migrations Supabase de `supabase/` appliquées dans l’ordre documenté dans le README.
- Endpoint Stripe configuré sur `https://www.vemo-technology.com/api/stripe/webhook` avec au minimum l’événement `checkout.session.completed`.

## Variables obligatoires

Configurer les environnements Preview et Production à partir de `.env.example` :

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `VEMO_ADMIN_PASSWORD`
- `VEMO_ADMIN_SECRET` (valeur aléatoire d’au moins 32 caractères)

Ne jamais copier `.env.local` dans Git ni exposer les clés serveur avec le préfixe `NEXT_PUBLIC_`.

## Pipeline

1. Exécuter `npm ci` puis `npm run check`.
2. Déployer une Preview Vercel.
3. Exécuter `PLAYWRIGHT_BASE_URL=https://URL-DE-LA-PREVIEW npm run test:e2e`, puis vérifier `/api/health`, la connexion client et admin et un paiement Stripe en mode test.
4. Vérifier dans Stripe que le webhook répond en `2xx` et qu’une seule commande est provisionnée.
5. Vérifier l’envoi Resend et l’accès aux documents par URL signée.
6. Promouvoir la Preview validée en Production.
7. Répéter la recette courte et surveiller les journaux structurés Vercel.

## Retour arrière

Utiliser le rollback Vercel vers le dernier déploiement sain. Une migration destructive de base de données doit toujours disposer de son propre plan de restauration ; les migrations fournies ici sont additives ou de durcissement.

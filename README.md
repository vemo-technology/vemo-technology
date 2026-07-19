# VEMO Technology

Application bilingue FR/EN de création de LLC américaine pour non-résidents. Elle couvre le devis serveur, Stripe, les virements, l’activation Supabase, l’espace client et l’administration.

## Prérequis

- Node.js 22 ou supérieur (WebSocket natif requis par le client Supabase actuel)
- projet Supabase
- compte Stripe et webhook
- compte Resend avec domaine expéditeur vérifié
- projet Vercel

Copier `.env.example` vers `.env.local` et remplacer toutes les valeurs. Les variables `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `VEMO_ADMIN_PASSWORD` et `VEMO_ADMIN_SECRET` sont strictement serveur.

## Commandes

```bash
npm install
npm run dev
npm run check
npm run test:e2e
```

`npm run check` exécute TypeScript, ESLint sans avertissement, les tests unitaires et le build de production.
Pour tester un déploiement réel sans démarrer le serveur local, utiliser `PLAYWRIGHT_BASE_URL=https://URL-DE-LA-PREVIEW npm run test:e2e`.

## Architecture

- `src/app`: pages et Route Handlers Next.js 16
- `src/components/start`: parcours LLC actif
- `src/components/client-portal`: portail client authentifié
- `src/lib/adminAuth.ts`: sessions admin signées et autorisation Supabase
- `src/lib/clientAuth.ts`: vérification du Bearer JWT Supabase client
- `src/lib/llcPricing.ts`: résolution exclusive du tarif catalogue côté serveur
- `src/proxy.ts`: redirection optimiste des zones admin ; chaque API reste autorisée séparément
- `supabase`: migrations SQL versionnées
- `tests/unit` et `tests/e2e`: non-régressions sécurité et parcours publics

## Invariants de sécurité

- Le navigateur ne décide jamais du prix facturé : `/api/llc/checkout` résout le catalogue serveur.
- Une commande est marquée payée uniquement après récupération Stripe d’une session payée ou webhook signé, avec correspondance du montant et de l’ID commande.
- La service role Supabase n’est jamais envoyée au navigateur.
- L’identité client provient du JWT Supabase, jamais d’un email dans l’URL.
- Les documents et justificatifs résident dans des buckets privés ; l’accès client utilise une URL signée de cinq minutes.
- Les routes admin appellent `verifyAdminRequest`; `src/proxy.ts` n’est qu’une première barrière.
- Les fichiers clients, justificatifs et données runtime ne doivent jamais être ajoutés à `public/` ou Git.

## Initialisation Supabase

Appliquer les scripts SQL dans cet ordre sur l’instance cible :

1. `supabase/admin-space.sql`
2. `supabase/secure-payment-proofs.sql`
3. `supabase/harden-client-data.sql`

Vérifier ensuite que `client-documents`, `payment-proofs` et `llc-documents` ont `public = false`. Les routes serveur utilisent la service role ; les clients ne peuvent sélectionner que leurs lignes via les politiques RLS.

## Stripe

Configurer le webhook vers `/api/stripe/webhook` avec au minimum :

- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

Le secret de signature doit être enregistré dans `STRIPE_WEBHOOK_SECRET`. Effectuer une transaction Stripe test complète avant toute promotion en production.

## Déploiement et exploitation

1. Configurer toutes les variables de `.env.example` dans Vercel pour Preview et Production.
2. Exécuter `npm run check`.
3. Déployer en Preview et exécuter `npm run test:e2e` contre la Preview si le pipeline le permet.
4. Vérifier `/api/health` : HTTP 200 sans détail de secret.
5. Tester Stripe, virement, activation, connexion, documents, messages et administration en FR/EN.
6. Promouvoir en Production puis surveiller les logs JSON `application.start`, les webhooks Stripe et les échecs Resend.

Les secrets doivent être renouvelés après toute exposition. Les sauvegardes Supabase et la rétention des documents doivent suivre la politique de confidentialité et les obligations applicables.

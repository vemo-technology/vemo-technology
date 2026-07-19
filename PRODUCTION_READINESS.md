# État de préparation production

Dernière vérification : 2026-07-19 (Africa/Casablanca).

Le projet n'est pas encore déclaré prêt pour la production. Ce document ne contient aucun secret.

## Preuves acquises

- TypeScript (code 0), ESLint sans avertissement (code 0), 6 fichiers de tests et 22 tests unitaires (22/22), build Next.js de 123 routes (code 0).
- `npm audit` : 0 vulnérabilité sur 545 paquets.
- La clé Stripe locale s'authentifie auprès de l'API Stripe en lecture seule et appartient au mode test ; aucune clé live ni secret webhook n'est disponible localement.
- Build de production compilé avec Next.js 16.2.10.
- Les parcours HTTP de développement `/fr`, `/fr/connexion`, `/fr/commencer`, `/fr/contact`, `/en`, `/en/connexion` répondent 200 ; `/en/commencer` redirige vers `/en/start`.
- L'instrumentation refuse le démarrage production lorsque les secrets obligatoires manquent, sont faibles ou lorsque les clés Stripe test/live sont incohérentes.
- La recette HTTP du build avec configuration temporaire complète valide les routes publiques FR/EN, `/api/health` en 200, les redirections admin, le refus API admin en 401 et les en-têtes CSP/HSTS/anti-frame/anti-MIME/referrer.
- Le commit `ae992f2` est publié sur `origin/main`; les déploiements Vercel `vemo-technology` et `vemo-technology-new` sont tous deux en succès et le domaine public sert le nouveau healthcheck et les nouveaux en-têtes.
- L'audit de 4 264 objets Git ne détecte aucun motif de clé Stripe, webhook Stripe, Resend, Supabase secret ou JWT complet dans l'historique versionné.
- Les événements critiques Stripe et Resend utilisent des logs JSON structurés ; les champs sensibles sont expurgés et les erreurs normalisées.
- `instrumentation.ts` capture aussi les erreurs serveur via `onRequestError` de Next.js 16.
- Supabase distant : les cinq tables attendues répondent en 200; `client-documents`, `payment-proofs` et `llc-documents` existent avec `public=false`; une insertion anonyme contrôlée dans `llc_orders` est refusée en 401/`42501`, preuve de la protection RLS.
- Le workflow GitHub Actions Node 22/Chromium est préparé localement, mais le jeton GitHub courant ne possède pas le scope `workflow` requis pour le publier.

## Blocages à lever avant promotion

- Supabase : le schéma, les buckets privés et RLS sont vérifiés sur le projet lié. La table interne d'historique de migrations reste non consultable par la CLI sans le mot de passe PostgreSQL; archiver cette dernière preuve lorsque cet accès sera disponible.
- Secrets : considérer les anciennes clés locales Supabase/Stripe et les identifiants admin comme compromis. Révoquer/renouveler les clés chez chaque fournisseur, puis supprimer les anciennes. Ne pas réutiliser les valeurs locales.
- Vercel : les deux déploiements Git sont réussis, mais `/api/health` retourne 503 sur les deux domaines Vercel et sur `www.vemo-technology.com`. Compléter Preview/Production avec toutes les variables de `.env.example` et Node.js 22.
- Stripe : `STRIPE_WEBHOOK_SECRET` absent ; créer le webhook production, vérifier les trois événements documentés et effectuer un paiement test complet.
- Resend : `RESEND_API_KEY` absent ; vérifier le domaine expéditeur, configurer `MAIL_FROM` et valider un email réel.
- E2E local : Chromium 149 ne démarre pas sur macOS 10.15.7 car `AVFAudio.framework` manque. Exécuter les six scénarios via GitHub Actions/Preview sur Ubuntu ou sur une machine compatible.
- GitHub Actions : publier `.github/workflows/ci.yml` avec un jeton disposant du scope `workflow`, puis conserver les résultats qualité et E2E.
- Recette production : la configuration locale manque `NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `ADMIN_NOTIFICATION_EMAIL`, et le secret admin local est trop court. Le serveur production refuse donc volontairement de servir du trafic.

## Critères de clôture

Ne déclarer terminé qu'après conservation des preuves suivantes : migrations distantes alignées, buckets privés et RLS vérifiés, anciennes clés révoquées, variables Preview/Production complètes, webhook Stripe en 2xx sans double provisionnement, email Resend reçu, `/api/health` en 200, E2E 6/6, build vert, recette FR/EN et parcours client/admin validés sur la Preview puis en production.

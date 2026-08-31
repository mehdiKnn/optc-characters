# Prototype UI du team builder

- Label: wayfinder:prototype
- Status: closed
- Assignee: mehdik
- Blocked by: [Spécification du team builder](006-spec-team-builder.md) (closed), [Moteur de conditions et recherche intelligente](007-moteur-conditions-recherche.md) (closed)

## Question

À quoi ressemble l'écran de construction d'équipe — slots, panneau des conditions avec compteurs et cases, liste de candidats filtrée ? (HITL — /prototype : maquette cliquable jetable sur données réelles de la box, pour réagir avant d'écrire la spec.)

## Prototype (2026-08-31) — en attente de réaction

Maquette cliquable : [team-builder-ui.html](../prototype/team-builder-ui.html) — ouvrir le fichier dans un navigateur (double-clic suffit ; portraits chargés depuis le CDN 2shankz).

Trois variantes structurellement différentes, commutables via `?variant=A|B|C`, la barre flottante en bas ou les flèches ← → :

- **A — Trois colonnes** : équipe à gauche (slots verticaux, supports en pastille), candidats au centre, panneau de conditions à droite.
- **B — Plateau de jeu** : équipe en rang horizontal façon jeu en haut, conditions en bandeau de cartes horizontal, candidats pleine largeur dessous.
- **C — Conditions d'abord** : le panneau de conditions est la colonne maîtresse à gauche, candidats à droite, équipe réduite en dock bas.

Contenu commun : box réelle (381 unités d'index.json), moteur minimal des deux régimes de coche (promotion/exclusion, score « +n », tri, ✓ rempli), compteurs par famille (seuil, seuil OR-é, roster, arc-en-ciel, scaler ×n, membre nommé, « or fewer », badge must-be-captain, résidu non cochable grisé), équipe pré-remplie (Luffy & Zoro capitaine, Saturn friend, Zoro membre). Coûts fictifs (absents d'index.json) ; pas de persistance ; anti-doublons non maquetté.

## Résolution (2026-08-31)

**La variante C — « Conditions d'abord » — gagne**, telle quelle : le panneau de conditions est la colonne maîtresse à gauche, la liste de candidats filtrée occupe la droite, l'équipe vit en dock compact en bas de l'écran (slots capitaine/friend/membres avec supports en pastille, bateau). La spec de l'écran de construction reprend cette hiérarchie : les conditions sont le plan de l'équipe, pas une annexe.

Le prototype reste la source primaire : [team-builder-ui.html](../prototype/team-builder-ui.html) (les variantes A et B y restent visibles via `?variant=`).

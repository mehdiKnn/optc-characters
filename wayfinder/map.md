# Carte : Plateforme d'équipes OPTC

Label : `wayfinder:map` — tracker local (pas de git ni de tracker distant). Les tickets sont les fichiers de [tickets/](tickets/) ; conventions en tête de chaque ticket : `Status: open|closed`, `Assignee:` (vide = non réclamé, le renseigner AVANT de travailler), `Blocked by:` (débloqué quand tous les tickets bloquants sont closed). Le **frontier** = tickets open, non bloqués, non assignés.

## Destination

Une **spec complète et prête à implémenter** pour la plateforme d'équipes OPTC : app web statique (UI française, termes de jeu en anglais), base optc-db complète embarquée + box = liste d'IDs possédés, navigation/filtrage des personnages de la box façon optc-db, team builder PVE (2 capitaines + 4 membres + supports + bateau affiché) et PVP (Rumble), compteurs de conditions de composition auto-remplis à chaque ajout, recherche intelligente par conditions cochées, persistance localStorage, portraits via CDN. La carte est finie quand plus rien n'est à décider avant d'implémenter — l'implémentation est un effort séparé.

**✅ Destination atteinte le 2026-08-31 — livrable : [SPEC.md](../SPEC.md).** Aucun ticket ouvert.

## Notes

- Domaine : One Piece Treasure Cruise (OPTC). Référence UI/données : https://2shankz.github.io/optc-db.github.io/characters/#/search/
- Glossaire : [CONTEXT.md](../CONTEXT.md) — consulter en début de session, maintenir via /domain-modeling.
- Tickets HITL : toujours invoquer /grilling + /domain-modeling.
- Wayfinder = planification : les tickets résolvent des décisions, pas de code d'app dans cette carte.
- Les findings de recherche vont dans [research/](research/).

## Decisions so far

- [Rédiger la spec finale](tickets/009-rediger-spec.md) — livrable produit : [SPEC.md](../SPEC.md), 11 sections assemblant toutes les décisions ; tranche au passage l'option laissée ouverte par le pipeline : pas de chunks à la demande, un index unique enrichi suffit sans fiche détail.
- [Stack et pipeline de build](tickets/010-stack-et-pipeline.md) — GitHub Pages (git init dans ce dossier, GPLv3) ; React + TypeScript + Vite + Tailwind/DaisyUI ; index léger complet toujours chargé + fiches en chunks par centaine d'ID à la demande ; parsing des conditions au build (pipeline node, seul le SHA épinglé commité) ; cron hebdo + dispatch manuel pour avancer le SHA ; portraits servis par 2shankz.github.io (préfixe configurable).
- [Prototype UI du team builder](tickets/008-prototype-ui.md) — la variante « Conditions d'abord » gagne : panneau de conditions en colonne maîtresse à gauche, candidats à droite, équipe en dock compact en bas ; prototype conservé comme source primaire.
- [Moteur de conditions et recherche intelligente](tickets/007-moteur-conditions-recherche.md) — deux régimes de coche : les conditions positives promeuvent les candidats qui les font progresser, les négatives excluent les violeurs ; une condition remplie reste cochée mais cesse de filtrer ; tri par nb de conditions actives progressées puis ID desc ; compteur par famille (union pour les OR-és, n/N pour les rosters, checklist arc-en-ciel, ×n pour les scalers, badge « must be captain ») ; même moteur en PVP sur les conditions structurées de rumble.json.
- [Grammaire des cibles de support](tickets/011-grammaire-cibles-support.md) — couverture 100 % mesurée (2 259/2 259 cibles, 6 règles + résolveur de noms) ; deux familles dominantes : listes de noms propres (59 %, résolues via families.js) et groupes classe/type/tag (38 %, tags = vocabulaire fermé de 128) ; caveat : tags.js sparse (1 408/4 613 unités) → verdict « indéterminé » sur cibles à tags.
- [Spécification du team builder (PVE et PVP)](tickets/006-spec-team-builder.md) — PVE : 5 supports max (1 par personnage possédé, jamais sur le friend captain), validateur de cible non bloquant (« effet non applicable »), doublons interdits par famille, plafond de coût saisi et bloquant (friend captain exclu, supports inclus), compteurs sur les 6 membres seulement ; PVP : 8 slots, plafond distinct, drapeau de mode Assault/normal, modificateurs de saison saisis manuellement (indicateur de bénéfice, pas de stats ajustées) ; équipes nommées/illimitées/duplicables, type fixé à la création.
- [Grammaire des conditions de composition](tickets/004-grammaire-conditions.md) — parseur à 11 regex validé : 99,95 % de couverture mesurée (2 083/2 084 clauses, 708 unités) ; 2 familles dominantes (seuil « N+ X characters » et roster « consist of any N of: LISTE ») ; `superSpecialCriteria` mixte (298 rosters, 58 conditions d'état) ; discriminateur des faux amis « crew has <buff> » établi.
- [Structure d'une équipe PVP (Pirate Rumble)](tickets/003-structure-equipe-pvp.md) — équipe = jusqu'à 8 persos, sans capitaine/supports/banc ; kit Rumble distinct du kit PVE ; conditions Rumble **déjà structurées** dans `rumble.json` (`composition: true`), aucun parsing texte côté PVP ; variantes Grand Party / Assault Rumble.
- [Format des données optc-db](tickets/002-format-donnees-optc-db.md) — fork 2shankz (maintenu, upstream mort) ; `units.js` objet id→champs nommés (JSON strict), `details.js` 12,4 Mo via eval node, `superSpecial`/`superSpecialCriteria` confirmés sur Saturn 4380 ; images dans le repo, URL déductible de l'ID ; build via raw GitHub + SHA épinglé ; GPLv3.
- [Gestion de la box et batch-add par IDs](tickets/005-gestion-box.md) — input à jetons unique (espace ou collage élit chaque ID, validation immédiate avec nom, check +1 sur inconnu avec validation manuelle, acceptation partielle) ; retrait individuel avec confirmation ; filtre « ma box » par défaut dans le navigateur + panneau Box ; IDs exacts sans équivalence d'évolution ; pas d'export/import ; migration jetable par seed embarqué au premier lancement.
- [Cadrage initial (grilling)](tickets/001-cadrage-initial.md) — 14 décisions fondatrices : la destination est une spec ; données = base optc-db complète, box = liste d'IDs ; batch-add par IDs ; équipes PVE avec supports + bateau affiché ; friend captain limité à la box ; localStorage ; UI FR ; toutes les conditions de composition tracées quelle que soit la section ; extraction automatique ; recherche par conditions cochées ; PVP composition seulement ; portraits CDN sans fallback.

## Not yet specified

_(vide — tout le fog restant est gradué en tickets.)_

## Out of scope

- L'implémentation de l'app elle-même — effort séparé une fois la spec finie ([Cadrage initial](tickets/001-cadrage-initial.md), Q1).
- Effets du bateau dans les compteurs — le bateau est choisi et affiché, pas simulé (Q14).
- Conditions temps réel PVP (secondes restantes, HP, buffs) dans le filtre — affichées pour information seulement (Q11).
- Friend captain hors de la box (Q5).
- Grand Party dans le builder PVP — l'utilisateur n'y joue pas ; se rebâtirait sur la brique « équipe 8 slots » si le besoin émerge ([Spécification du team builder](tickets/006-spec-team-builder.md)).
- Fallback d'images hors CDN (Q12).
- Fiche détail d'un personnage dans l'app — aucune vue détail ; le navigateur de box et les builders suffisent ([Fiche détail d'un personnage](tickets/012-fiche-detail-personnage.md), fermé sans résolution).

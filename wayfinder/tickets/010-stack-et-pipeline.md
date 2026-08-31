# Stack et pipeline de build recommandés par la spec

- Label: wayfinder:grilling
- Status: closed
- Assignee: mehdik
- Blocked by: —

## Question

Quelle stack la spec recommande-t-elle pour l'app statique, et quel pipeline pour les données ? (HITL — /grilling + /domain-modeling)

À décider, sur la base du [format des données confirmé](002-format-donnees-optc-db.md) (units.js JSON-strict, details.js 12,4 Mo à évaluer via node, images dans le repo) : framework ou vanilla ; pipeline de build qui télécharge/épingle/transforme les données (et découpe les 12,4 Mo en un bundle raisonnable pour le navigateur — box seulement vs base complète chargée à la demande) ; fréquence et déclencheur de mise à jour des données ; hébergement (local vs GitHub Pages — patch de fog associé).

## Résolution (2026-08-31)

- **Hébergement : GitHub Pages.** Ce dossier devient le repo du projet (`git init` ici — la carte, le glossaire, les outils et le seed y vivent déjà ; les 410 fiches markdown disparaîtront une fois la migration par seed implémentée). Déploiement Pages via GitHub Actions à chaque push.
- **Stack : React + TypeScript + Vite, Tailwind + DaisyUI.** App statique, pas de backend.
- **Découpage des données** : un **index léger complet** toujours chargé (champs de filtrage/recherche de toute la base dérivés d'`units.js` + conditions pré-parsées, ~1-2 Mo) ; les **fiches détaillées à la demande**, en chunks JSON par centaine d'ID, mis en cache côté client. Ni bundle monolithique de 14 Mo, ni restriction à la box (la recherche intelligente et le check +1 portent sur toute la base).
- **Parsing au build** : le parseur à 11 regex des conditions et les 6 règles de cibles de support tournent dans le pipeline ; le navigateur ne reçoit que du JSON structuré. L'eval node de `details.js` reste confiné au pipeline.
- **Pipeline en node** (imposé par l'eval de `details.js`). **Seul le SHA épinglé du fork 2shankz est commité** (fichier de config) ; index et chunks sont générés au build CI, jamais versionnés.
- **Mise à jour des données : cron hebdomadaire GitHub Actions + `workflow_dispatch` manuel.** Le job avance le SHA épinglé sur le HEAD du fork, régénère, redéploie.
- **Portraits : `2shankz.github.io` directement** (pattern d'URL vérifié HTTP 200) ; l'URL de base est un préfixe de config, bascule triviale si le site du fork meurt.
- **Licence du repo : GPLv3**, par compatibilité avec les données optc-db.

Post-scriptum (même jour) : la [fiche détail](012-fiche-detail-personnage.md) est sortie du périmètre. Les chunks à la demande restent justifiés par les textes de capacités affichés dans les builders (specials, cibles de support…) ; si la spec constate que l'index couvre tout ce que l'UI montre, elle peut supprimer les chunks — décision déléguée à [Rédiger la spec finale](009-rediger-spec.md).

# Cadrage initial (grilling)

- Label: wayfinder:grilling
- Status: closed
- Assignee: mehdik + Claude (session de charting)
- Blocked by: —

## Question

Fixer la destination et les décisions fondatrices de la plateforme d'équipes OPTC.

## Résolution (2026-08-31)

Grilling en 2 rounds, 14 décisions :

1. **Destination = spec** prête à implémenter ; l'implémentation est un effort séparé.
2. **App web statique**, en exploitant optc-db (https://2shankz.github.io/optc-db.github.io/).
3. **Box mise à jour par batch d'IDs** (input de l'app) ; aujourd'hui manuelle.
4. **Équipe PVE** = 6 persos + supports + **bateau**.
5. **Friend captain limité à la box.**
6. **Persistance : localStorage** (+ export/import envisageable).
7. **UI en français**, termes de jeu en anglais.
8. **« EX » = toute condition de composition**, quelle que soit la section (Captain, Special, Super Special — ex. Saturn 4380 —, Sailor).
9. **Extraction automatique des conditions** depuis les données optc-db (pas de curation manuelle).
10. **Recherche intelligente** : compteurs par condition, cases à cocher, candidats filtrés et triés sur « fait progresser au moins une condition cochée ».
11. **PVP : composition uniquement** dans le moteur ; les autres conditions (temps réel) affichées pour information.
12. **Portraits via CDN, sans fallback.**
13. **Architecture données : base optc-db complète + box = liste d'IDs** ; le dossier markdown devient un artefact d'amorçage.
14. **Bateau : affiché seulement**, effets non pris en compte dans les compteurs.

Contexte factuel (survey du dossier) : 381 fiches markdown + `index.json` (id, name, types, classes, tags, dtags) ; conditions de composition dans ~158 fiches, grammaire « If your crew has N(+/or more/or fewer) X characters », pré-filtrables par le tag `Requirement: Team Composition` ; aucune image dans les fiches ; conditions Rumble dans une grammaire distincte.

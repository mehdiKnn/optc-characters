# Structure d'une équipe PVP (Pirate Rumble)

- Label: wayfinder:research
- Status: closed
- Assignee: agent de recherche (lancé au charting)
- Blocked by: —

## Question

De quoi se compose exactement une équipe Pirate Rumble (PVP) dans OPTC, et quelles données Rumble optc-db expose-t-il ?

À établir : nombre de membres, existence d'un capitaine/leader, banc/remplaçants, supports, contraintes de coût ; en quoi la construction diffère du PVE ; quelles capacités Rumble dépendent de la composition (grammaire « When there is N or more [X] crew members ») vs du temps réel ; et où ces données vivent côté optc-db.

Findings → `wayfinder/research/003-structure-equipe-pvp.md`.

## Résolution (2026-08-31)

Rapport complet : [research/003-structure-equipe-pvp.md](../research/003-structure-equipe-pvp.md). L'essentiel :

- **Équipe Rumble = jusqu'à 8 personnages**, tous sur le terrain : pas de capitaine, pas de supports PVE, pas de banc ; combats auto (~90 s). Variantes : Grand Party (3 formations, best-of-3, leader GP + Burst manuel) et Assault Rumble.
- Les kits PVE sont inertes en Rumble (seuls ATK/HP/RCV de base comptent) ; le kit Rumble = Special (10 niveaux, cooldown en secondes), Ability (5 niveaux), résiliences, DEF/SPD, `rumbleType` ∈ {ATK, DEF, SPT, DBF, RCV} + un `cost` (1–99, ajout du fork).
- **Les conditions Rumble sont structurées en JSON** dans `common/data/rumble.json` : les conditions de composition sont marquées `{"type":"crew","composition":true,"comparator":"more","count":4,"targets":[...]}` (+ type `character`/`families`) — les temps réel sont d'autres types (`time`, `stat`, `trigger`…). **Aucun parsing de texte nécessaire côté PVP** ; le texte anglais du site est généré depuis ce JSON.
- Données : fork 2shankz vivant (4 626 unités, 10,5 Mo) vs upstream mort ; records `Unit` ou `Reference {id, basedOn}` avec overrides `global`/`japan`. Caveat : le `rumble.schema.json` publié est en retard sur les données (`composition`, `mode`… absents du schéma).

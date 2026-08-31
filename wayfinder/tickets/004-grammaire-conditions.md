# Grammaire des conditions de composition dans les données optc-db

- Label: wayfinder:research
- Status: closed
- Assignee: agent de recherche
- Blocked by: [Format des données optc-db](002-format-donnees-optc-db.md) (closed)

## Question

Sur les vraies données optc-db (pas les fiches markdown locales), quelles formulations exactes portent les conditions de composition, et une extraction automatique par règles couvre-t-elle tout ?

À établir : l'inventaire des variantes (« N+ », « N or more », « N or fewer », compte exact, groupes OR-és, chaînes composées), les sections porteuses (Captain, Special, Super Special/EX, Sailor, Potentials type « Damage Limit Break: Class/Type »), l'existence d'un pré-filtre structuré (équivalent du tag `Requirement: Team Composition`), les cas dégénérés (conditions « crew has » qui parlent de buffs, pas de composition), et le taux de couverture estimé d'un parseur à règles avec fallback texte brut.

Findings → `wayfinder/research/004-grammaire-conditions.md`.

## Résolution (2026-08-31)

Rapport complet : [research/004-grammaire-conditions.md](../research/004-grammaire-conditions.md). L'essentiel, mesuré par script node sur le corpus complet du fork (4 534 entrées details.js) :

- **Un parseur à règles suffit : 11 regex couvrent 2 083/2 084 clauses de composition (99,95 %)**, sur 708 unités distinctes. Unique fallback texte brut : l'unité 4100.
- 10 familles de formulations, deux dominantes : le seuil « crew has N(+/or more) X characters » (~700) et le **roster nommé** « crew must consist of any N of the following…: LISTE » (~788) — cette 2e famille n'existait pas dans les fiches markdown locales.
- `superSpecialCriteria` (356 unités) n'est **pas** toujours de la composition : 298 rosters, 58 conditions d'état (buffs, HP, usages de special) — à afficher pour info, pas à tracer.
- Faux amis : ~700 « crew has » d'état de buffs. Discriminateur fiable : composition ssi le complément matche `(\d+\+? |only )…characters` ou « NAME as a member » ; piège connu : « characters with at least one of each: […] orb ».
- Pas de pré-filtre structuré dans units.js/flags.js ; filtres partiels = les noms de champs (`superSpecialCriteria`, `superTandem.characterCondition`) ; toute clause de composition contient le mot « crew ».
- Les scalers continus s'écrivent tous « depending on/based on the number of X characters on the crew » (259), jamais « for each X in your crew » (0).

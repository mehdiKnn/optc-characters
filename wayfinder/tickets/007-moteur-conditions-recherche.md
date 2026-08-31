# Moteur de conditions et recherche intelligente

- Label: wayfinder:grilling
- Status: closed
- Assignee: mehdik + Claude
- Blocked by: [Grammaire des conditions](004-grammaire-conditions.md) (closed)

## Question

Comment le moteur de conditions et la recherche intelligente se comportent-ils dans les cas limites ? (HITL — /grilling + /domain-modeling)

À décider, sur la base de la grammaire confirmée (voir la [résolution du ticket grammaire](004-grammaire-conditions.md) : la famille « roster nommé » — « crew must consist of any N of: LISTE », ~788 clauses — est aussi fréquente que les seuils et demande sa propre UX de compteur) : affichage d'une condition à groupes OR-és (« 4+ [Navy] or [SWORD] ») ; conditions « or fewer » (cocher = éviter d'ajouter ?) et comptes exacts ; conditions continues (« +0.1 par Slasher ») ; le capitaine/friend captain comptent-ils ; interaction entre le filtre par conditions cochées et les filtres classiques (type, classe, tags) ; tri des candidats ; comportement quand aucune condition n'est cochée.

## Résolution (2026-08-31)

Grilling en 2 rounds, 15 décisions — toutes les recommandations acceptées. Glossaire mis à jour dans [CONTEXT.md](../../CONTEXT.md). Rappel des acquis : compteurs évalués sur les 6 membres d'équipage (friend captain inclus, supports exclus — [ticket 006](006-spec-team-builder.md)) ; conditions d'état et temps réel affichées, jamais tracées.

### Régimes de coche (le cœur du moteur)

- **Deux régimes** : une condition **positive** (seuil, roster, arc-en-ciel, scaler, membre nommé) cochée **promeut** les candidats qui la font progresser ; une condition **négative** (« or fewer », « only », absence, compte exact atteint) cochée **exclut** les candidats qui la violeraient. Un compte exact se traite en seuil tant qu'on est dessous, en contrainte une fois atteint.
- **Filtre global** : un candidat est montré s'il fait progresser au moins une positive **active** (cochée non remplie) — quand il y en a — ET ne viole aucune négative cochée. S'il ne reste aucune positive active (rien de coché en positif, ou tout est rempli), la liste = box entière moins les violeurs des négatives cochées.
- **Condition remplie** : elle cesse de piloter le filtre mais reste cochée, affichée ✓.
- **Aucune coche** : navigateur normal — la recherche intelligente est opt-in.
- **Filtres classiques** (type, classe, tags) : en intersection (ET) avec le filtre par conditions cochées.
- **Tri** : score = nombre de positives actives que le candidat fait progresser, décroissant ; départage par ID décroissant. Les négatives ne classent pas, elles retirent.
- **Doublons de conditions** : deux unités portant la même condition (même famille de phrasé, même groupe cible, même seuil) → une ligne fusionnée, porteurs listés.

### Compteurs par famille

- **Seuil OR-é** (« 4+ [Navy] or [SWORD] ») : un compteur unique sur l'**union** du groupe. Variante à seuils répétés (« 5+ Slasher or 5+ Driven », 9 cas) : une ligne par alternative, condition remplie si l'une l'est, un candidat progresse s'il avance n'importe laquelle.
- **Roster nommé** (« consist of any N of: LISTE », ~788 clauses) : compteur n/N = membres d'équipage figurant dans la liste ; cochée → candidats restreints à la liste croisée avec la box.
- **Arc-en-ciel** (« un [STR], [DEX], [QCK], [PSY] and [INT] ») : compteur en checklist par type ; un candidat progresse s'il couvre une case manquante.
- **Scaler continu** (« depending on the number of X », 259 cas) : compteur sans cible (« Free Spirit ×3 »), cochable, tout candidat du groupe progresse, jamais d'état « rempli ».
- **Membre nommé** (« crew has Zoro as a member or supporting this character ») : exception locale documentée à la règle des 6 membres — satisfaite par le personnage membre d'équipage **ou** support du porteur, conformément au texte ; correspondance par **famille** (cohérente avec l'anti-doublons).
- **Préfixe « This character must be captain »** (250 EX) : badge binaire de placement (porteur en slot capitaine ✓/✗), n'influence pas le filtre.
- **Résidu hors grammaire** (unité 4100 et futurs ratés du parseur) : texte brut affiché, non cochable — même traitement que les conditions d'état.

### PVP

Même moteur et même UX en Rumble : compteurs, coches, régimes et tri identiques, évalués sur les 8 slots ; la source est le JSON structuré de `rumble.json` (`crew` avec `composition: true`, `character`, `multi`) au lieu du parseur texte — aucun parsing côté PVP ([recherche 003](../research/003-structure-equipe-pvp.md)).

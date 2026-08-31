# 011 — Grammaire des cibles de support (`support[].Characters`, corpus optc-db, vérifié le 2026-08-31)

Corpus : `details.js` du fork 2shankz (12,4 Mo, 4 534 entrées, éval JS → JSON). Vocabulaires de résolution : `families.js` (859 noms de familles), `tags.js` + `availableTags.js` (128 tags), `units.js` (5 027 unités : classes, types, cost). Scripts de test : node, exécutés localement (`cover11.js`).

## Conclusions

1. **Un parseur à règles couvre 100 % du corpus actuel** : 6 règles de forme (S1–S6) + un résolveur de noms (vocabulaires fermés + 6 alias + 2 normalisations de tags) parsent **2 259 / 2 259 occurrences** (1 083 valeurs distinctes). Résidu actuel : 0 — le fallback « texte brut sans verdict » ne servira qu'aux phrasés futurs.
2. **2 261 unités portent un champ `support`**, dont **2 259 avec une cible `Characters`** (toujours exactement 1 entrée support par unité). Les 2 exceptions : ids 4210 et 4211 (unités « Luffy VS Kaido », `support: []`).
3. **Deux familles de phrasés dominent** : la **liste de noms propres** (1 332 occ, 59,0 % — de 1 à 18 noms) et le **groupe classe/type/tag + `characters`** (857 occ, 37,9 %). Le reste est marginal : `All characters` 42, seuil de cost 15, noms filtrés par type 10, suffixe Character Tag 3.
4. **Les noms propres se résolvent contre `families.js`, pas contre les noms d'unités** : sur 4 965 tokens de noms, 4 528 sont des noms de familles exacts, 412 des formes parenthésées « A (B) » (ex. « Edward Newgate (Whitebeard) ») où A et B sont chacun une famille — et les unités concernées portent **les deux** familles à la fois, donc matcher « famille de l'unité ∈ {A, B} » suffit. 23 tokens sont des noms d'unités exacts (« Pacifista PX-1 »), 6 exigent une table d'alias (§3).
5. **Les tags entre crochets se résolvent contre un vocabulaire fermé de 128 tags** (`availableTags.js`), avec 2 normalisations obligatoires : `[Navy]`→`Former / Navy` (idem Royalty, Whitebeard Pirates, Roger Pirates) et `[Mythical Zoan-type]`→`Mythical Zoan-type / Devil Fruit User` (19 occurrences concernées). **Caveat majeur : `tags.js` ne tagge que 1 408 / 4 613 entrées** — pour les ~121 occurrences de cibles à tags, une unité sans tags renseignés doit donner un verdict « indéterminé », pas « non applicable ».
6. **Sémantique du groupe** : juxtaposition = intersection (« [INT] Cerebral characters » = INT **et** Cerebral) ; virgule / `or` / `and` = union (« [STR], [DEX] and [PSY] characters ») ; `/` = union de classes (« Slasher/Striker ») ; « All characters » = toujours vrai ; « cost N or more/less » se teste contre `units.js.cost`.
7. **Aucune implémentation de référence n'existe** : le site optc-db n'exploite jamais `support[].Characters` (seul un filtre booléen « has support », `characters/js/table.js:485`) — le champ y est purement affiché. Ce parseur est la première lecture machine du champ.

## 1. Inventaire des phrasés (occurrences mesurées sur les 2 259 champs)

| # | Famille | Exemple verbatim (id) | Occurrences | % |
|---|---|---|---|---|
| S3 | Liste de noms propres (1–18 noms, `,` / `and` / `or`) | "Monkey D. Luffy" (nombreux) ; "Portgas D. Ace and Edward Newgate (Whitebeard)" ; "Monkey D. Luffy, Roronoa Zoro, Nami, Usopp, Vinsmoke Sanji, Nico Robin, Franky and Brook" ; "Sakazuki (Akainu) and Kuzan (Aokiji)" | **1 332** (dont 264 nom seul, 332 paires, 736 listes ≥3) | 59,0 |
| S2 | Groupe classe/type/tag + `characters` | "Driven characters" ; "[STR] characters" ; "[Egghead Arc] characters" ; "[INT] Cerebral characters" (3680) ; "[QCK] [Blackbeard Pirates] characters" ; "[STR], [DEX] and [PSY] characters" ; "Striker class characters" | **857** — types purs 288, classes pures 370, tags purs 83, mixtes 118 ; ~700 à token unique, ~100 intersections, ~57 unions/mixtes | 37,9 |
| S1 | Universel | "All characters" (4, 73, 989…) | **42** | 1,9 |
| S6 | Seuil de cost | "Characters with cost 99 or more" (4380, 4410…) ; "Characters with Cost 70 or more" ; "Characters with cost 29 or less" | **15** (4 formes : 99+/70+/40−/29−) | 0,7 |
| S4 | Noms filtrés par type | "[INT] of the following: Roronoa Zoro, Nami, …" ; "[STR] or [INT] of the following: Dr. Vegapunk (Stella), Borsalino (Kizaru)" (4546) | **10** | 0,4 |
| S5 | Suffixe Character Tag | "[PSY] characters with the following Character Tag: [Giant]" (4634) ; "Striker class characters with the following Character Tag: [Giant]" (4638) | **3** | 0,1 |
| S7 | Type/classe + nom propre | "[QCK] Monkey D. Luffy" (4418) ; "[DEX] Free Spirit Franky" (en tête de liste) | **2** (absorbé par S3) | 0,1 |

Distribution des longueurs de listes S3 (occurrences) : 1→264, 2→332, 3→257, 4→143, 5→88, 6→28, 7→30, 8→72 (équipages Straw Hat), 9→32, 10→29, 11→22, 12–18→43.

## 2. Résolution des cibles : contre quoi chaque token se vérifie

| Token | Vocabulaire | Taille | Notes |
|---|---|---|---|
| Nom propre | `families.js` (noms de familles) | 859 noms, 4 531 unités couvertes | 4 528/4 965 tokens = familles exactes ; « Sanji » et « Vinsmoke Sanji » sont deux familles distinctes toutes deux présentes |
| « A (B) » | familles A **ou** B | 412 tokens | les unités portent les deux familles (vérifié : les 36 unités Whitebeard ont `["Edward Newgate", "Whitebeard", …]`) ; tolérer `Sir `/`Dr. ` en préfixe (« Sir Crocodile (Mr. 0) ») |
| Nom d'unité exact | `units.js.name` | 23 tokens | « Pacifista PX-1 »…« PX-5 », « Mamboshi », « Curly Dadan » |
| `[TYPE]` | {STR, DEX, QCK, PSY, INT} | 5 | jamais [RCV]/[TND] en cible de support |
| Classe | {Fighter, Slasher, Striker, Shooter, Free Spirit, Cerebral, Powerhouse, Driven, Evolver, Booster} | 10 | `units.js.class` ; variantes « class characters », « Slasher/Striker » |
| `[Tag]` | `availableTags.js` (fermé — tout tag porté par une unité dans `tags.js` en fait partie) | 128 | 2 normalisations : `Former / X` (Navy, Royalty, Whitebeard Pirates, Roger Pirates) ; `X / Devil Fruit User` (Mythical/Ancient Zoan-type, Paramythia-type) — 19 occ |
| cost | `units.js.cost` | — | entier, comparaison ≥ / ≤ |

### Table d'alias résiduelle (6 entrées nécessaires)

| Texte | Résolution | Contexte |
|---|---|---|
| Howling Gabu | famille `Gabu` | listes Red Hair Pirates (8 occ) |
| Building Snake | famille `Snake` | idem (8 occ) |
| Gen | famille `Genzo` | 4179-era Coco Village (1 occ) |
| Mr. Tom | famille `Tom` | Galley-La (1 occ) |
| Onion / Pepper | unité « Onion, Pepper & Carrot » | Usopp Pirates (id 4179, 1 occ) |

Ambiguïté connue (1 valeur, id 4179) : dans « …, Onion, Pepper, Carrot », « Carrot » résout aussi vers la famille `Carrot` (le mink) — faux positif potentiel à trancher à la main.

## 3. Jeu de règles (draft testé — script `cover11.js`)

```
CLASS = Fighter|Slasher|Striker|Shooter|Free Spirit|Cerebral|Powerhouse|Driven|Evolver|Booster
U     = \[[^\]]+\] | CLASS(/CLASS)*          # unité de groupe : [TYPE], [Tag] ou classe
AG    = U( U)*                               # juxtaposition = intersection (AND)
G     = AG((,? (or|and) |, )AG)*             # virgule / or / and = union (OR)

S1  all          ^All characters$
S2  groupe       ^G( class)? [Cc]haracters?$
S6  cost         ^Characters with [Cc]ost (\d+) or (more|less)$
S5  tag-suffix   ^(G( class)? )?[Cc]haracters? with the following Character Tags?: \[Tag\]…$
S4  typed-names  ^G of the following: LISTE_NOMS$
S3  noms         ^LISTE_NOMS$
S7  groupe+nom   token de LISTE_NOMS de la forme «G NOM»   (ex. "[QCK] Monkey D. Luffy")
```

`LISTE_NOMS` : découpe au niveau supérieur sur `,` / ` and ` / ` or ` **hors parenthèses** (« Bentham (Mr. 2 Bon Clay) » ne doit pas être coupé), `&` conservé dans le token (« Mohji & Richie » est une unité) ; chaque nom résolu contre familles ∪ noms d'unités ∪ table d'alias, avec la règle « A (B) → A ou B » et strip `Sir `/`Dr. `.

Chaque token de groupe est **validé contre son vocabulaire** (type/classe/tag) — une forme qui matche la regex mais contient un token inconnu part au fallback, pas en verdict.

### Couverture mesurée (script `cover11.js`, corpus complet)

| Métrique | Valeur |
|---|---|
| Unités avec champ `support` | 2 261 |
| Champs `support[0].Characters` (= 1 par unité) | 2 259 (exceptions : 4210, 4211, `support: []`) |
| Valeurs distinctes | 1 083 |
| Occurrences parsées | **2 259 / 2 259 (100 %)** |
| Hits par règle | S3 1 332 · S2 857 · S1 42 · S6 15 · S4 10 · S5 3 (S7 dans S3) |
| Tokens de noms résolus | 4 965 (familles 4 528, alias « A (B) » 412, unités 23, groupe+nom 2) |
| Résidu | 0 valeur |

## 4. Caveats pour le validateur de cible (ticket 006)

1. **Sparsité des tags** : `tags.js` couvre 1 408 / 4 613 entrées (les anciennes unités n'ont aucun tag). Pour une cible à tag (~121 occ : S2 à tags 118 + S5 3), si l'unité candidate a `tags = []`, rendre « indéterminé » (afficher la cible brute) plutôt que « non applicable ».
2. **Familles multiples** : `families.js` donne une **liste** de familles par unité (ex. les Whitebeard en portent 2, les Vegapunk jusqu'à 6 variantes nommées) ; le match est « ∃ famille de l'unité ∈ cibles ». 4 531 / 5 027 unités ont une entrée famille — une unité sans famille ne peut matcher un nom que par son `name` exact.
3. **Formes duales** : 207 entrées de `tags.js` sont des tableaux par forme (`[[tags forme 1],[tags forme 2]]`) — aplatir pour le validateur.
4. **Fallback** : toute valeur non parsée ou tout token hors vocabulaire → afficher le texte brut de `Characters` sans verdict (décision du ticket 006 : validateur non bloquant). Résidu actuel nul, mais chaque batch mensuel peut introduire un phrasé neuf (les 19 normalisations de tags datent des batchs 2025–2026, ids 4402+).
5. **Le champ est stable et mono-valeur** : jamais plus d'une entrée `support` par unité, pas de HTML, pas de clauses multiples — contrairement aux conditions de composition (004), pas besoin de découpage en clauses.

## 5. Méthodologie (reproductible)

- Téléchargement : `details.js`, `families.js`, `units.js`, `tags.js`, `availableTags.js` depuis `raw.githubusercontent.com/2Shankz/optc-db.github.io/master/common/data/`.
- Chargement : `node -e "window={}; eval(fs.readFileSync(f))"` → JSON (details 4 534, families 4 531, units 5 027, tags 4 613, availableTags 128).
- Extraction : tout `details[id].support[].Characters` → 2 259 paires (id, valeur), 1 083 valeurs distinctes, comptage d'occurrences.
- Classification : `cover11.js` (scratchpad de session) — règles S1–S7 appliquées valeur par valeur, chaque token vérifié contre son vocabulaire ; sortie = hits par règle, formes de groupes, longueurs de listes, résidu.
- Vérifications croisées : familles « Whitebeard »/« Edward Newgate » portées par les mêmes 36 unités ; vocabulaire de tags clos (128) ; absence de logique support côté site (grep `support` dans `characters/js/*.js`).

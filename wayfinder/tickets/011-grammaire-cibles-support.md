# Grammaire des cibles de support

- Label: wayfinder:research
- Status: closed
- Assignee: agent de recherche (lancé à la résolution de 006)
- Blocked by: —

## Question

Inventorier la grammaire du champ **cible des supports** dans `details.js` (fork 2shankz) : `support[].Characters`, texte libre — noms propres, familles, classes, types, tags, seuils (« Characters with cost 99 or more »)… — et mesurer la couverture qu'un parseur à règles peut atteindre, comme fait pour les conditions de composition ([Grammaire des conditions](004-grammaire-conditions.md)).

Objectif : le **validateur de cible** du team builder ([Spécification du team builder](006-spec-team-builder.md)) — décider si le support posé sur un personnage s'applique, ou doit être marqué « effet non applicable ».

À établir : inventaire des phrasés avec occurrences mesurées ; règles de parsing candidates ; taux de couverture ; résidu et stratégie de fallback (texte brut affiché sans verdict).

Findings → `wayfinder/research/011-grammaire-cibles-support.md`.

## Résolution (2026-08-31)

- **Couverture 100 %** : 6 règles de forme + résolveur de noms parsent 2 259/2 259 cibles de support (1 083 valeurs distinctes) — résidu actuel nul, le fallback « texte brut sans verdict » ne servira qu'aux phrasés futurs.
- 2 261 unités ont un champ `support` (toujours 1 seule entrée) ; 2 seules exceptions sans `Characters` : 4210/4211 (unités VS).
- Deux familles dominent : **listes de noms propres** (1 332 occ, 59 %, de 1 à 18 noms) et **groupes classe/type/tag + `characters`** (857 occ, 38 %) ; marginal : `All characters` 42, seuil de cost 15, `[TYPE] of the following: noms` 10, suffixe Character Tag 3.
- Les noms se résolvent contre **`families.js`** (4 528/4 965 tokens exacts + 412 formes « A (B) » où l'unité porte les deux familles) ; 6 alias résiduels seulement (Howling Gabu→Gabu, etc.).
- Les tags se résolvent contre un **vocabulaire fermé de 128 tags** (`availableTags.js`) avec 2 normalisations (`[Navy]`→`Former / Navy` ; `[Mythical Zoan-type]`→`… / Devil Fruit User`).
- Sémantique : juxtaposition = intersection, `,`/`or`/`and` = union, `/` = union de classes ; cost ↔ `units.js.cost`.
- **Caveat validateur** : `tags.js` ne tagge que 1 408/4 613 unités → cible à tag + unité sans tags = verdict « indéterminé », pas « non applicable ».
- Le site optc-db n'exploite jamais ce champ (affichage brut) — pas d'implémentation de référence.

Rapport complet : [011-grammaire-cibles-support.md](../research/011-grammaire-cibles-support.md).

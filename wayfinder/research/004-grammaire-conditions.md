# 004 — Grammaire des conditions de composition d'équipage (corpus optc-db, vérifié le 2026-08-31)

Corpus : `details.js` du fork 2shankz (12,4 Mo, 4 534 entrées, éval JS → JSON), 124 821 champs texte aplatis. Scripts de test : node, exécutés localement.

## Conclusions

1. **Oui, un parseur à règles couvre quasiment tout** : 11 règles regex parsent **2 083 / 2 084 clauses** de condition de composition (99,95 %), soit **1 925 / 1 926 champs texte** entièrement parsés, répartis sur **708 unités distinctes**. Résidu : **1 seule clause** (id 4100, condition exotique sur Potential Abilities) → fallback texte brut.
2. La grammaire tient en **10 familles de phrasés** (inventaire §1). Les deux dominantes : le seuil `crew has N(+/or more) X characters` (~700 clauses) et le roster nommé `crew must consist of any N of the following …: LISTE` (~788 clauses, superSpecialCriteria + superTandem).
3. **`superSpecialCriteria` n'est PAS toujours une condition de composition** : sur 356 unités qui l'ont, 298 portent le roster « consist of any N of the following » ; les 58 autres sont des conditions de buff, de PV, ou de compteur d'utilisation de specials (§2).
4. **Faux amis nombreux** (~700 occurrences de `crew has` sont des états de buff, pas de la composition). Discriminant fiable : le **nom qui suit le quantificateur** — `characters` = composition ; `buffs / orbs / specials / turns of X / nom d'effet capitalisé` = état de combat (§3).
5. **Aucun pré-filtre structuré global** : ni `units.js`, ni `flags.js` (clés = acquisition uniquement : global, rr, lrr…) ne taggent « Requirement: Team Composition ». En revanche, les conditions vivent dans des **sous-champs nommés** qui servent de pré-filtre partiel : `superSpecialCriteria`, `superTandem.characterCondition[5]`, `lastTap.condition`, `rush.characterCondition[5]` (ces deux derniers = surtout conditions de gameplay, pas de composition) (§4).
6. Le mot-pivot unique est **`crew`** : toute condition de composition contient `crew` dans sa clause. Scanner clause par clause (split sur `.` / `;` / `<br>` / `<li>`) les champs texte suffit.

## 1. Inventaire des phrasés (occurrences mesurées sur tout le corpus)

| # | Famille | Exemple verbatim | Occurrences |
|---|---|---|---|
| A | Seuil : `crew has N (or more/+) X characters` | "your crew has 3 or more [STR] characters" / "crew has 6 Shooter characters" / "crew has 4+ [Elbaph Arc] characters" | ~700 clauses (dont 176 "or more", ~350 exactes, ~180 en `N+`) |
| B | Seuil inverse : `N or fewer/less` | "crew has 3 or fewer Slasher characters" | 4 (rarissime) |
| C | Quantificateurs répétés en OU | "crew has 5+ Slasher or 5+ Driven characters", "1+ [Seraphim] or 2+ [Vegapunk]" | 9 |
| D | Exclusivité : `crew has only X characters` | "crew has only Fighter characters", "only [STR], [DEX] or [QCK] characters" | 20 |
| E | Présence « arc-en-ciel » (1 de chaque) | "If there is a [STR], [DEX], [QCK], [PSY] and [INT] character in your crew" | 234 |
| F | Absence : `no X characters` | "If there are no [PSY] or [INT] characters on your crew" | 15 |
| G | Scaler continu | "boosts … by 5x-6x **depending on the number of** Free Spirit characters **on the crew**", "based on number of Powerhouse characters on the crew", "depending on how many … are on the crew" | 259 |
| H | Roster nommé (EX/Tandem) | "your crew must consist of any 2 of the following, excluding Supports and counting only 1 per unit: Roronoa Zoro, Nami, …" | 788 |
| I | Membre nommé | "crew has Roronoa Zoro as a member or supporting this character", "crew has Sabo, Belo Betty or Nico Robin as a member" | 20–36 |
| J | Tags juxtaposés (récent, 2025+) | "If 3 or more [Straw Hat Pirates] [Four Emperors] [Giant] characters are on the crew" (sémantique = union des tags) | ~20 |

Points de grammaire notables :
- Le groupe cible est une liste de `[Tag]`/`[TYPE]`/NomDeClasse jointe par `,` / `or` / `and` : "[Neo Marine] or [Navy]", "Fighter or Free Spirit". Le `and` dans la famille E signifie « un de chaque » ; le `or` dans A signifie « comptés ensemble ».
- Le scaler « for each X character in your crew » n'existe **pas** dans ce corpus (0 occurrence) — les scalers continus passent tous par « number of / how many … on the crew ». Les ~2 600 « for each » concernent hits PERFECT, ennemis, orbes, tours.
- Champs porteurs (1 926 champs conditions, distribution) : superTandem 385, special 356, superSpecialCriteria 311, captain 291, potential 275, lLimit 84, limit 72, rush 70, sailor 58, lastTap 22, specialNotes 2.

## 2. `superSpecialCriteria` (unités « EX ») — 356 unités

- **298/356** : `crew must consist of any N of the following, excluding Supports and counting only 1 per unit: LISTE` — N : 1→148, 2→77, 3→49, 4→12, 5→4, 6→8. La LISTE mêle noms propres, classes et tags ("Cerebral or [INT] characters"). Variantes à double seuil : "any 6 or 1 of the following", "any 2 or 5 of the following".
- Préfixes : **250** "This character must be captain", **104** "Can be launched as crewmate."
- **58/356 sans clause « consist »** — donc PAS composition :
  - état de buff (~25) : "If your crew has a HP Overfill buff or an ATK Up buff with an effect of 8x or more", "your crew must have Chain Addition, Chain Limit, Chain Lock or Chain Boundary" ;
  - seuil de PV (~6) : "HP must be below 50%" ;
  - compteur (~8) : "a special ability must be used 2 times", "When crew has used 8 specials" ;
  - composition par classe sans liste nommée (~5) : "your crew must consist of 6 Powerhouse or Driven characters", "consist of all of the following…: Fighter, Slasher, … characters" ;
  - divers : orbe requis ("[BOMB] or [SUPERBOMB] orb"), ATK relatif, "When any 3 [Giant] characters … are on the crew" (4634).
- Conclusion : parser `superSpecialCriteria` = règle H + les mêmes règles A/J + un fallback buff/PV/compteur.

## 3. Faux amis : `crew has` sans composition (~700 occurrences)

| Motif | Exemple verbatim | Discriminant |
|---|---|---|
| Nom d'effet capitalisé | "If your crew has Orb Amplification when the special is activated" (88×), "crew has ATK Up/UP" (176×), Chain Lock/Addition, Percent Damage Reduction, Base/Status ATK Boost, Normal Attack Only, Color Affinity… | pas de quantificateur numérique, pas du tout le mot `characters` dans le complément (avant la virgule) |
| Durée de buff | "crew has 10+ turns of End of Turn Healing", "crew has Additional Damage Buff for 3 or more turns" | `turns of` / `buff` |
| Compte de buffs | "crew has 2 or more buffs" / "1 or fewer buffs" | nom = `buffs` |
| Orbes | "If your crew has 6 [TND] orbs" | nom = `orbs` |
| **Piège** : orbes portés par les personnages | "If your crew has characters with at least one of each: [STR], [DEX], [QCK], [PSY] and [INT] **orb**" | contient `characters` mais sans quantificateur devant, et `orb` dans la clause |
| Compteur d'actions | "When crew has used 8 specials" | verbe `used`, nom = `specials` |
| Territoire / champ | "If field has Territory: Striker" (champ `field has`, pas `crew has`) | mot-pivot `field` |

**Règle de tri fiable (testée)** : dans la clause, après `crew has `, c'est de la composition ssi le complément (sans franchir une virgule) matche `(\d+\+? |only )…characters` ou `NOM as a member`. Tout le reste est un état de combat.

## 4. Pré-filtre structuré : inexistant, mais…

- `units.js` : uniquement stats/type/classe/coût — aucun champ tag/flag de condition.
- `flags.js` : clés = provenance (global, rr, rro, lrr, tmlrr, kclrr, pflrr, superlrr, inkable, slrr, special, annilrr, shop, promo, tmshop). Rien sur les conditions.
- Pré-filtres partiels par **structure de champ** dans `details.js` :
  - présence de `superSpecialCriteria` ⇒ unité EX à condition (356 unités) ;
  - `superTandem.characterCondition` (composition dans ~77 unités : "Your crew must consist of 3+ Cerebral characters, and…") ;
  - `rush.characterCondition` (23 unités) et `lastTap.condition` : conditions de **gameplay** (tap sur dernier stage, orbe porté), pas de composition ;
  - `VSCondition` (18) : consommation d'orbes/tours, pas de composition.
- Pour captain/special/sailor/potential/limit : **scan texte obligatoire**. Filtre cheap : `grep crew` clause par clause (le mot `crew` est présent dans 100 % des clauses de composition détectées).

## 5. Jeu de règles (draft, testé — 11 regex, ordre = priorité)

`T` = `\[[^\]]+\]|[A-Z][A-Za-z'.\- ]+?` (tag ou classe) ; `G` = `T((,\s*|,?\s+(or|and)\s+)T)*` (liste) ; `NAMES` = idem avec noms propres ; clause = segment séparé par `.` `;` `<br>` `<li>`.

```
R1  seuil        crew has (\d+)(\+| or more| or fewer| or less)? (G )?characters?\b
R1b multi-seuil  crew has \d+\+? G((,| or) (\d+\+? )?G)* characters?
R2  exclusif     crew has only G characters
R3  présence     If (there('s| is| are) |you have )(an? )?G characters? (on|in) (the|your) crew
R4  absence      If there are no G characters? (on|in) (the|your) crew
R5  you-have-N   If you(r crew)? ha(ve|s) (\d+)( or more|\+)? G characters?\b
R6  scaler       (based on|depending on) ((the )?number of|how many) G characters? (are )?on (the|your) crew
R7  roster       crew must consist of (any \d+( or \d+)? of the following[^:]*:|all of the following[^:]*:|\d+\+? Class( or Class)? characters)
R8  membre       crew has NAMES as a member
R9  on-crew      If (\d+)(\+| or more)? ((\[tag\]\s*)+|G )?characters?( of the same type)? are on the crew
R9b any-on-crew  When any (\d+ )?(of the following characters|G characters?)[^.;]{0,80}are on the crew
```

Détection amont (quelles clauses scanner) : clause contenant `crew` ET (`crew must consist of` | `crew has … as a member` | `characters (on|in) (the|your) crew` précédé d'un intro conditionnel | `crew has (\d+\+? |only )[^,.;]*characters` | `characters … are on the crew`).

### Couverture mesurée (script cover4.js, corpus complet)

| Métrique | Valeur |
|---|---|
| Clauses de composition détectées | 2 084 |
| Clauses parsées par R1–R9b | **2 083 (99,95 %)** |
| Champs texte porteurs de condition | 1 926 |
| Champs entièrement parsés | **1 925 (99,9 %)** |
| Unités distinctes concernées | 708 |
| Hits par règle (1er match) | R1 698 · R7 788 · R6 259 · R3 234 · R9 30 · R8 20 · R4 15 · R2 14 · R5 13 · R1b 9 · R9b 3 |
| Résidu (fallback texte brut) | 1 clause : id 4100, "crew has 5 other characters with Enrage/Reduce Increase Damage Taken duration Potential Ability" |

Limites connues du draft : les regex valident la **forme** (elles capturent N et l'opérateur) mais l'extraction fine du groupe cible (liste de tags/classes) demande une 2e passe de tokenisation de `G` — triviale, le vocabulaire est fermé (7 classes, 5 types + [RCV]/[TND], ~80 tags `[…]`). Sémantique à encoder : `and` en famille E = un-de-chaque ; `or` en A = compte cumulé ; tags juxtaposés (J) = union ; `excluding Supports and counting only 1 per unit` = clause fixe du roster H.

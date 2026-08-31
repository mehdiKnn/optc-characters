# 003 — Structure d'une équipe PVP (Pirate Rumble) et données Rumble d'optc-db

Recherche du 2026-08-31. Sources primaires : dépôts GitHub optc-db + fork 2Shankz (données brutes téléchargées et analysées), wiki Fandom (via API MediaWiki), GameWith (JP).

## Conclusions

1. **Équipe Pirate Rumble = jusqu'à 8 personnages, sans capitaine, sans soutiens PVE, sans banc.** Les 8 combattent tous sur le terrain (les conditions de composition dans les données vont jusqu'à `count: 8`, ex. « 8+ persos [QCK] »). Combat 100 % auto, ~90 s. Un champ `cost` par unité (1–99) existe dans les données récentes (fork 2Shankz) → limite de coût d'équipe dans les modes récents.
2. **Grand Party (GP) n'est pas un mode séparé de zéro : c'est une variante du Pirate Rumble** jouée en **3 formations** (victoire = 2 manches sur 3), avec un **leader GP** doté d'un **GP Burst** (déclenché manuellement, à nombre d'utilisations limité — `uses` dans les données, pas de cooldown). Il existe aussi une variante **« Assault Rumble »** (présente comme condition `{"type":"mode","mode":"Assault Rumble"}` dans les données).
3. **Construire une équipe Rumble ≠ PVE** : capitaines, specials et sailors PVE sont ignorés ; seules les stats de base (ATK/HP/RCV) sont reprises. Ce qui compte : le kit Rumble propre à chaque unité — Rumble Special (10 niveaux, cooldown en secondes), Rumble Ability (passif, 5 niveaux), Resistance/« resilience », nouvelles stats **DEF** et **SPD**, et la classe rumble `rumbleType` ∈ {ATK, DEF, SPT, DBF, RCV}, plus le pattern d'attaque et la priorité de ciblage.
4. **Les données Rumble vivent dans `common/data/rumble.json`** (+ `rumble.schema.json` pour la forme). Upstream `optc-db/optc-db.github.io` : 1 429 unités, dernier push 2024-08. **Fork actif : `2Shankz/optc-db.github.io`** (push 2026-08-28) : 4 626 unités, 10,5 Mo, avec champs supplémentaires (`cost`, `superspecial`, `gpability/gpspecial/gpcondition`, `llb*`). Les conditions y sont **structurées** (pas du texte) : distinguer composition d'équipe vs état temps réel est trivial.

## 1. Structure d'équipe

Wiki Fandom (https://onepiecetreasurecruiseglobal.fandom.com/wiki/Pirate_Rumble_Festival, récupéré via `api.php?action=parse`) :

> "It allows you to make a team of up to 8 characters that you can match against a similar team of another player, three times a day [...] The matches are done on 'auto' and you have no manual control over what will happen. [...] only base stats (attack, HP, RSV) carry over, there are no captains or captain abilities, all units have new rumble-only specials and 'sailor abilities' aka 'rumble abilities'"

> "Matches last about 90 seconds, so a special with CT 30 can be used ~2 times"

- Pas de slot capitaine/ami, pas de personnages de soutien (support PVE), pas de réserve dans le mode de base ; on place les 8 unités dans une formation.
- Coût : le fork 2Shankz ajoute `cost` sur 4 155 unités (valeurs 1 à 99) — utilisé pour les plafonds de coût des variantes récentes.
- **Grand Party** (GameWith, https://xn--pck6bvfc.gamewith.jp/article/show/368142) : « 3つの編成で行う変速型の海賊祭 » (« un Pirate Festival à format modifié joué avec 3 formations ») ; 2 victoires sur 3 pour gagner ; leader GP avec technique exclusive (GP Burst) à déclenchement manuel (flick) ; niveau pirate 160+ requis ; 3 essais/jour non récupérables aux gemmes.
- **Assault Rumble** : variante attestée dans les données (`condition {"type":"mode","mode":"Assault Rumble"}`, 261 occurrences dans le rumble.json du fork) — certains effets ne s'activent que dans ce mode.

## 2. PVE vs PVP : ce qui compte

Le kit PVE (captain ability, special, sailor, sockets…) est inerte en Rumble. Chaque unité a un kit Rumble dédié :

| Élément | Détail (schéma rumble) |
|---|---|
| Rumble Special | 10 niveaux, `cooldown` en secondes + `effects` (damage fixed/cut/atk, buffs, hindrances…) |
| Rumble Ability | passif, 5 niveaux, `effects` conditionnels |
| Resilience (Resistance) | 3 formes : `debuff` (ex. 100 % contre Half Stats), `damage` (ex. −30 % dégâts [PSY]), `healing` |
| Stats rumble | `stats: {rumbleType, def, spd}` — `rumbleType` ∈ **ATK, DEF, SPT, DBF, RCV** ; DEF et SPD sont des stats propres au mode |
| Pattern | séquence d'actions `attack` (Normal/Power/Full) et `heal` (zone Self/Small/Medium/Large) |
| Target | priorité de ciblage, ex. `{"criteria":"near"}` ou `highest ATK` |
| Super Special | `superspecial` (unités récentes), à condition d'activation (ex. temps) |
| Kit GP | `gpability` (5 niv.), `gpspecial` (5 niv., champ `uses` au lieu de `cooldown`), `gpcondition` |
| Kit LLB | `llbability`/`llbspecial`/`llbresilience`/`llbsuperspecial` : kit amélioré après Level Limit Break |

Le wiki confirme que c'est le kit rumble qui « makes or breaks » une unité : « target priority and behavior pattern are mostly irrelevant [...] What makes or breaks the units are their rumble specials and abilities (and only those two elements can be leveled up). »

## 3. Conditions : composition d'équipe vs état temps réel

Les conditions sont structurées (`Condition.type`). Répartition dans le rumble.json du fork 2Shankz : time 665, crew 594, stat 329, mode 261, trigger 216, character 131, multi 83, specialreceived 67, enemies 55, divers 29.

**Dépendent de la COMPOSITION de l'équipe (statiques, connues avant le combat) :**
- `crew` avec `composition: true` (523 des 594 `crew`) — ex. unité 4583 (Elbaph) :
  `{"type":"crew","composition":true,"comparator":"more","count":4,"targets":["[Elbaph Arc]"]}` → « When there are 4 or more [Elbaph Arc] crew members » ; autres ex. : 5+ Slasher, 8+ [QCK].
- `character` — présence d'un personnage précis : `{"type":"character","families":["Monkey D. Luffy"],"team":"crew"}` ; multi-familles : `["Boa Hancock","Boa Sandersonia"]`.
- `multi` — conjonction and/or de sous-conditions, souvent de composition.
- `mode` — statique aussi, mais dépend du mode de la saison, pas de l'équipe : `{"type":"mode","mode":"Assault Rumble"}`.

**Dépendent de l'ÉTAT TEMPS RÉEL du combat :**
- `time` : `{"type":"time","comparator":"remaining","count":50}` (« 50 s restantes »), `"first"`/`"after"` 40 s.
- `stat` : `{"type":"stat","stat":"HP","comparator":"below","count":30}` (« HP sous 30 % »).
- `crew` **sans** `composition` : nombre de membres encore en vie, ex. `{"type":"crew","comparator":"less","count":3}`.
- `enemies` (ennemis restants, parfois `relative: true`), `defeat` (KO subis), `trigger` (ex. après 2 coups critiques), `specialreceived`/`dmgreceived`/`dbfreceived`/`heal`, `debuff` (ex. sous Half Stats).

⚠️ Le schéma upstream (`rumble.schema.json`) ne connaît pas `composition`, `targets` dans Condition, ni les types `mode`/`multi`/`specialreceived` : le fork 2Shankz a fait évoluer le format au-delà du schéma publié.

## 4. Où vivent les données dans optc-db

- **Fichier** : `common/data/rumble.json` — https://raw.githubusercontent.com/2Shankz/optc-db.github.io/master/common/data/rumble.json (10,5 Mo, 4 626 unités ; upstream optc-db : 7 Mo, 1 429 unités). Schéma : `common/data/rumble.schema.json` (+ `format-rumble-json.sh`).
- **Forme** : `{"units":[...]}`, indexé par `id` = id d'unité optc-db. Deux types d'entrées :
  - `Reference` : `{"id": N, "basedOn": M}` (471 entrées dans le fork) — l'unité recopie le kit d'une autre (évolutions).
  - `Unit` : `id, ability[5], special[10] ({cooldown, effects}), pattern[], target, stats {rumbleType, def, spd}`, plus optionnels : `cost`, `resilience[]`, `superspecial`, `gpability[5]`, `gpspecial[5] ({uses, effects})`, `gpcondition`, `llbability/llbspecial[10]/llbresilience/llbsuperspecial`, et overrides régionaux `global`/`japan`. Les niveaux 2–5/10 utilisent souvent `{"override": {...}}` (delta par rapport au niveau 1).
- **Consommation par le site** : `characters/js/controllers.js` (DetailsCtrl) charge `../common/data/rumble.json` ; `common/js/utils.js` l'indexe par id numérique (`window.rumble[numericId]`, avec split `character1`/`character2` pour les unités VS).
- Le texte anglais lisible (« When there is... ») est **généré par le site à partir du JSON structuré** — il n'est pas stocké dans `details.js`.

## Sources

- https://github.com/optc-db/optc-db.github.io (upstream ; dernier push 2024-08-14)
- https://github.com/2Shankz/optc-db.github.io (fork actif ; dernier push 2026-08-28)
- https://raw.githubusercontent.com/optc-db/optc-db.github.io/master/common/data/rumble.schema.json
- https://onepiecetreasurecruiseglobal.fandom.com/wiki/Pirate_Rumble_Festival (et /wiki/Pirate_Rumble_Character_Guide)
- https://xn--pck6bvfc.gamewith.jp/article/show/368142 (Grand Party, JP) ; /article/show/199976 (compo 海賊祭)
- https://github.com/ThePieBandit/optc-pirate-rumble-db (DB tierce synchronisée sur optc-db, `rumble.json`)

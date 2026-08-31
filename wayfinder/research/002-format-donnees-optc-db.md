# 002 — Format des données optc-db (sources primaires, vérifié le 2026-08-31)

## Conclusions

1. **Utiliser le fork `2shankz/optc-db.github.io`** comme source : dernier push le **2026-08-28** ("Aug EoM Batch", commits quasi quotidiens), alors que l'upstream `optc-db/optc-db.github.io` est **mort depuis le 2024-08-14**. Le fork est le parent direct (`parent: optc-db/optc-db.github.io`) et alimente le site live.
2. Toutes les données vivent dans **`common/data/*.js`** : des fichiers JS qui font `window.X = {...}` — pas de JSON servi. Deux niveaux de parseabilité :
   - **JSON strict après strip du préfixe** : `units.js` (vérifié : 5 027 entrées via `json.loads`), `cooldowns.js`, `flags.js` (clés numériques non quotées pour flags → JSON5/eval).
   - **Éval JS obligatoire** (`node -e "window={}; eval(fs.readFileSync(...))"`) : `details.js` (clés non quotées, commentaires `//`, virgules finales — vérifié : 4 534 entrées), `families.js` (spread `...MonkeyDLuffy`), `aliases.js` (IIFE), `ships.js` (**contient des fonctions JS** → non sérialisable telle quelle).
3. Le fork a **restructuré `units.js`** : upstream = tableau de tableaux positionnels (682 Ko) ; fork = **objet clé→id avec champs nommés** (1,4 Mo), incluant des ids de variantes (`"1983-1"`). Les détails modernes (superSpecial, support, potential, rush, limit break) sont dans les deux, mais seul le fork couvre 2024→2026 (ids jusqu'à ~5056).
4. Images : hébergées **dans le repo même** sous `/api/images/`, padding **4 chiffres** (pas 5), dossier calculé depuis l'id. Vérifié HTTP 200 sur glo/jap/full pour 4380.
5. Licence : **GPL v3** (`LICENSE.md`). GitHub la classe "Other/NOASSERTION" mais le fichier est la GPLv3 intégrale. Données de jeu = propriété Bandai Namco (fan project).

## 1. Emplacement et format des fichiers (`common/data/`, fork 2shankz)

| Fichier | Taille | Assignation | Contenu / forme |
|---|---|---|---|
| `units.js` | 1 397 441 o | `window.units = {…}` | stats de base par id (voir ci-dessous) — JSON strict après strip |
| `details.js` | 12 419 518 o | `window.details = {…}` | textes captain/special/sailor/superSpecial/support/potential/rush — eval JS |
| `cooldowns.js` | 81 100 o | `window.cooldowns = {…}` | `"1": [3,2]` = [CD initial, CD max niveau] |
| `evolutions.js` | 143 741 o | `window.evolutions = {…}` | `1: { evolution: 2, evolvers: [78] }` (ou tableaux pour multi-évolutions) |
| `flags.js` | 155 090 o | `window.flags = {…}` | `2: { global: 1, rr: 1 }` — clés vues : global, rr, rro, lrr, tmlrr, kclrr, pflrr, superlrr, inkable, slrr, special, annilrr, shop, promo, tmshop |
| `families.js` | 164 071 o | IIFE + `window.families = {…}` | `1: [ ...MonkeyDLuffy ]` — spread de constantes → eval JS |
| `aliases.js` | 353 153 o | IIFE + `window.aliases = {…}` | `1: ["モンキー・D・ルフィ", "Monkey D. Luffy"]` |
| `ships.js` | 46 782 o | `window.ships = [...]` | tableau ordonné, objets avec fonctions |
| autres | — | — | `specials.js`, `captains.js`, `sailors.js` (effets structurés pour le damage calculator), `festival.js`, `rumble.json` (PVP, JSON pur, 10,5 Mo), `version.js` (`window.dbVersion = 36;`) |

### Structure d'une entrée `units.js` (fork — champs nommés)

```js
window.units = {
    "4": {"id":"4","name":"Monkey D. Luffy - Gear 2","type":"STR",
          "class":["Fighter","Free Spirit"],"stars":"5","cost":15,"combo":8,
          "sockets":3,"maxLevel":99,"maxEXP":3000000,"minHP":902,"minATK":473,
          "minRCV":74,"maxHP":1772,"maxATK":1313,"maxRCV":227,"growth":null},
```
(`class` : string ou tableau ; `stars` : string, ex. `"6+"` ; ids variantes type `"1983-1"` présents.)

Upstream (pour mémoire, ordre positionnel) : `[ name, type, class, stars, cost, combo, sockets, maxLevel, maxEXP, minHP, minATK, minRCV, maxHP, maxATK, maxRCV, growthRate ]`.

### Structure d'une entrée `details.js`

Clés observées (unité moderne) : `captain, captainNotes?, special, specialNotes, specialName, sailor {base, level1, level2?}, superSpecial, superSpecialCriteria, support [{Characters, description[5]}], limit [par nœud], potential [{Name, description[5]}], rush {characterCondition[5], description[5], stats[5]}`, plus selon l'unité : `festAbility`, `festSpecial`, `swap`, `versus`.

## 2. Unité 4380 (Saturn) — extrait verbatim (`details.js`, ligne ~168921)

```js
4380: {//6* Saturn
    captain: "Reduces Special Cooldown of [Five Elders] and [Celestial Dragon] characters by 15 turns at the start of the fight, boosts ATK of ... by 6x, by 6.6x instead if they have the applicable tag, ...",
    special: "Deals 20% of enemies' current HP in True damage to all enemies, ... applies Territory: Driven to the field for 3 turns. ...",
    specialNotes: "<br><b>ATK Up:</b> 499-: 4x, 500-599: 4.25x, ...",
    specialName: "Perforating Thrust of the War God",
    sailor: {
        base: "Boosts base ATK, HP and RCV of Driven characters by 150; makes [INT] orbs beneficial for Driven characters.",
        level1: "This character cannot be Blown Away, restores Special Cooldown of this character completely when it is rewinded, ..."
    },
    superSpecial: "Reduces ATK Down duration by 10 turns, reduces enemies' Driven Resistance by -50% for 1 turn, transforms [INT] characters into Super [INT] characters, and transforms Driven characters into Super Driven characters.",
    superSpecialCriteria: "This character must be captain. If your crew has a HP Overfill buff or an ATK Up buff with an effect of 8 x or more",
    support: [ { Characters: "Characters with cost 99 or more", description: [ /* 5 niveaux */ ] } ],
    limit: [ "Boosts base ATK by 10", /* ... 40 nœuds, dont "LOCKED WITH KEY" */ ],
    potential: [ { Name: "Enrage/Reduce Increase Damage Taken duration", description: [/*5*/] }, ... ],
    rush: { characterCondition: [/*5*/], description: [/*5*/], stats: [/*5*/] }
}
```
Les champs s'appellent donc bien **`superSpecial`** et **`superSpecialCriteria`** (735 occurrences de `superSpecial` dans le fork, 404 dans l'upstream).

## 3. Navires (`common/data/ships.js` — identique upstream/fork, 46 782 o)

Tableau **ordonné** (commentaire : « Do NOT change the order of the ships »), index = id du navire. Chaque entrée mélange données et **fonctions de calcul** :

```js
{ // 0
    name: 'Dinghy',
    thumb: 'ship_0001_t2.png',
    description: 'Boosts HP by 1.3x, boosts captain\'s RCV by 120 ...',
    hp: function(p) { return p.boatLevel < 6 ? 1.0 : p.boatLevel < 10 ? 1.1 : 1.3; },
    rcvStatic: function(p) { ... }
}
```
→ pour un site statique, ne garder que `name`/`thumb`/`description` (regex ou eval + toString des fonctions). Images : `res/ship_XXXX_t2.png` (padding 4).

## 4. Consommation reproductible pour un build statique

- URLs raw stables : `https://raw.githubusercontent.com/2shankz/optc-db.github.io/master/common/data/units.js` (idem pour details, cooldowns, flags, evolutions, families, aliases, ships). Pour figer : remplacer `master` par un SHA de commit.
- Tailles à télécharger : units 1,4 Mo ; details 12,4 Mo ; le reste < 400 Ko chacun. Pas besoin de cloner (le repo contient des dizaines de milliers d'images).
- Recette de parsing éprouvée ici :
  - `units.js` : `s.split('=',1)[1]` puis `json.loads` → OK (5 027 entrées).
  - `details.js`, `families.js`, `aliases.js`, `evolutions.js`, `flags.js` : `node -e "window={}; eval(fs.readFileSync(f,'utf8')); fs.writeFileSync(out, JSON.stringify(window.details))"` → OK (4 534 entrées détails).
  - `ships.js` : eval possible mais les valeurs fonctions se perdent en JSON — extraire name/thumb/description seulement.
- Versionnage : `version.js` (`window.dbVersion = 36`) + date du dernier commit via `https://api.github.com/repos/2shankz/optc-db.github.io/commits?per_page=1`.

## 5. Motifs d'URL des images (depuis `common/js/utils.js` du fork)

```js
// getThumbnailUrl(n): pad 4 chiffres, dossier = floor(id/1000) + "/" + floor((id%1000)/100) + "00"
var id = ("0000" + n).slice(-4);
var folder = Math.trunc(n / 1000) + "/" + Math.trunc((n % 1000) / 100) + "00";
return { jap: basePath + "jap/" + folder + "/" + id + ".png",
         glo: basePath + "glo/" + folder + "/" + id + ".png" };
// getBigThumbnailUrl(n):
return relPathToRoot + "/api/images/full/transparent/" + folder + "/" + id + ".png";
```
- Thumbnail (vérifié 200) : `https://2shankz.github.io/optc-db.github.io/api/images/thumbnail/glo/4/300/4380.png` (variante `jap/` : 200 aussi ; 152 fichiers dans `glo/4/300`).
- Grand portrait (vérifié 200) : `.../api/images/full/transparent/4/300/4380.png`.
- Équivalents raw GitHub : `https://raw.githubusercontent.com/2shankz/optc-db.github.io/master/api/images/thumbnail/glo/4/300/4380.png`.
- Padding **4 chiffres**, pas 5 (le 5 chiffres, style `f00001`, est le nommage des assets officiels Bandai, pas celui de ce repo). Cas spéciaux gérés par la fonction : `skull-XXX`, variantes VS `"3787-1"`, variantes type `"1234-STR"`, fallback `noimage.png`.

## 6. Fork 2shankz vs upstream

| | upstream `optc-db` | fork `2shankz` |
|---|---|---|
| Dernier push | 2024-08-14 | **2026-08-28** (actif, batchs réguliers : "Loki Batch", "Aug EoM Batch") |
| `units.js` | tableau positionnel, 682 Ko | **objet id→champs nommés**, 1,4 Mo, + ids variantes `"1983-1"` |
| `details.js` | 10,8 Mo | 12,4 Mo (unités 2024→2026, ids → ~5056) |
| `getThumbnailUrl` | switch avec cas spéciaux EX/ghost, retour string | réécrit, retour `{jap, glo}` systématique |
| Extra | — | `unitVariants.js`, filtres PVP/PVE, icônes corrigées |

**Verdict : le fork 2shankz est la seule source à jour.**

## 7. Licence

`LICENSE.md` (racine, 35 Ko) = **GNU GPL v3** intégrale. GitHub API la remonte comme `Other/NOASSERTION` (format markdown non détecté). Code réutilisable sous conditions GPLv3 ; textes/images du jeu © Bandai Namco (fan database non affiliée).

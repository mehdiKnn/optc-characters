# Format des données optc-db

- Label: wayfinder:research
- Status: closed
- Assignee: agent de recherche (lancé au charting)
- Blocked by: —

## Question

Quel est le format exact des données du repo optc-db (fork 2shankz vs upstream optc-db/optc-db.github.io) et comment les consommer au build d'une app statique ?

À établir : où vivent les données personnages (units, details, familles, flags, alias…) et bateaux ; leur format (JS/JSON, structure d'un enregistrement) ; comment le site les consomme ; comment les télécharger de façon reproductible (raw GitHub) ; volumétrie ; licence ; le pattern d'URL des portraits/vignettes par ID ; ce que le fork 2shankz change par rapport à l'upstream ; et à quoi ressemble un « EX / Super Special » moderne dans ces données (vérifier l'unité 4380, Saturn).

Findings → `wayfinder/research/002-format-donnees-optc-db.md`.

## Résolution (2026-08-31)

Rapport complet : [research/002-format-donnees-optc-db.md](../research/002-format-donnees-optc-db.md). L'essentiel :

- **Utiliser le fork 2shankz** (dernier push 2026-08-28, batches réguliers) ; l'upstream optc-db est mort depuis 2024-08.
- Toutes les données sont dans `common/data/*.js` en `window.X = {...}` (pas de JSON servi). `units.js` (1,4 Mo, 5 027 entrées) est un objet clé-par-id à champs nommés — JSON strict après retrait du préfixe. `details.js` (12,4 Mo, 4 534 entrées) exige un eval node (clés non quotées, virgules traînantes).
- **Saturn 4380 confirmé** : champs `superSpecial` + `superSpecialCriteria`, à côté de captain/special/sailor/support/limit/potential/rush.
- Bateaux : `ships.js` (47 Ko), tableau indexé par id ; seuls name/thumb/description sont extractibles (le reste = fonctions JS).
- Images : padding 4 chiffres, dossier `floor(id/1000)/floor((id%1000)/100)00` → `/api/images/thumbnail/{glo|jap}/4/300/4380.png` (vérifié HTTP 200) ; les images sont dans le repo.
- Build reproductible : raw.githubusercontent.com avec SHA de commit épinglé ; `json.loads` pour units, `node -e eval` pour le reste ; `version.js` expose `dbVersion`.
- Annexes : cooldowns `[initial,max]`, evolutions, flags, families (eval), aliases. Licence GPLv3 ; le contenu du jeu reste la propriété de Bandai Namco.

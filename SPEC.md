# SPEC — Plateforme d'équipes OPTC

Spec d'implémentation, assemblée le 2026-08-31 depuis la [carte wayfinder](wayfinder/map.md). Chaque section pointe vers le ticket qui porte le détail de la décision ; les grammaires complètes vivent dans [wayfinder/research/](wayfinder/research/). Le glossaire canonique est [CONTEXT.md](CONTEXT.md) — les termes en gras ci-dessous y sont définis.

## 1. Produit

App web **statique** de construction d'équipes One Piece Treasure Cruise : navigation/filtrage de la **box** du joueur façon optc-db, team builder **PVE** et **PVP** (Pirate Rumble), **compteurs** de **conditions de composition** auto-remplis, **recherche intelligente** par **conditions cochées**. UI en français, termes de jeu en anglais. Un seul utilisateur, données locales (localStorage), pas de backend.

**Hors périmètre** ([carte](wayfinder/map.md), section Out of scope) : fiche détail d'un personnage ; effets du bateau dans les compteurs (affiché seulement) ; conditions temps réel PVP dans le filtre (affichées pour information) ; friend captain hors box ; Grand Party ; fallback d'images hors CDN ; export/import de la box.

## 2. Stack et hébergement — [ticket 010](wayfinder/tickets/010-stack-et-pipeline.md)

- **React + TypeScript + Vite**, **Tailwind + DaisyUI**. App 100 % statique.
- **Hébergement : GitHub Pages**, déployé par GitHub Actions à chaque push. Ce dossier devient le repo (`git init`) ; licence **GPLv3** (compatibilité optc-db). Les 410 fiches markdown historiques sont supprimées une fois la migration par seed en place (§10).
- Persistance : **localStorage** uniquement.

## 3. Source de données — [ticket 002](wayfinder/tickets/002-format-donnees-optc-db.md), [rapport](wayfinder/research/002-format-donnees-optc-db.md)

- Source unique : le fork **`2shankz/optc-db.github.io`** (l'upstream est mort). Téléchargement par fichier via `raw.githubusercontent.com`, **épinglé sur un SHA de commit** — le SHA est la seule donnée versionnée dans ce repo (fichier de config du pipeline).
- Fichiers consommés (`common/data/`) : `units.js` (JSON strict après strip du préfixe), `details.js` (12,4 Mo, **eval node obligatoire**), `families.js`, `tags.js` + `availableTags.js`, `flags.js`, `ships.js` (extraire name/thumb/description seulement), `rumble.json` (JSON pur), `version.js` (`dbVersion`).
- **Portraits : CDN `2shankz.github.io`**, sans fallback. URL de base = constante de config. Pattern (vérifié) : pad 4 chiffres, dossier `floor(id/1000)/floor((id%1000)/100)00` → `https://2shankz.github.io/optc-db.github.io/api/images/thumbnail/glo/{dossier}/{id4}.png` (grand portrait : `api/images/full/transparent/…`). Bateaux : `res/ship_XXXX_t2.png`.

## 4. Pipeline de build — [ticket 010](wayfinder/tickets/010-stack-et-pipeline.md)

Scripts **node** (l'eval de `details.js` l'impose), exécutés en CI ; les artefacts générés ne sont **jamais commités**.

1. Télécharger les fichiers de données au SHA épinglé.
2. Parser : `units.js` en JSON ; `details.js`/`families.js`/`tags.js`/`flags.js` via `window={}; eval(...)` ; `rumble.json` tel quel.
3. **Parser les conditions de composition** (11 regex R1–R9b, [rapport 004](wayfinder/research/004-grammaire-conditions.md)) et les **cibles de support** (règles S1–S6 + résolveur de noms, [rapport 011](wayfinder/research/011-grammaire-cibles-support.md)). Tout résidu part en fallback texte brut (§7, §8) — le build ne casse jamais sur un phrasé neuf.
4. Émettre **un index unique** (§5) + le **seed de migration** (§10).
5. Builder l'app Vite qui embarque l'index.

**Un seul index, pas de chunks.** La fiche détail étant hors périmètre, l'index porte tout ce que l'UI affiche (~2-3 Mo bruts, servi gzippé) ; aucun chargement à la demande. (Tranche le post-scriptum du [ticket 010](wayfinder/tickets/010-stack-et-pipeline.md).)

**Mise à jour des données** : workflow GitHub Actions **cron hebdomadaire + `workflow_dispatch`** — avance le SHA épinglé sur le HEAD du fork, régénère, redéploie. Le deploy à chaque push couvre les changements de code.

## 5. Index généré (contrat de données de l'app)

Par unité (clé = id, y compris variantes type `"1983-1"`) :

- **Identité** : id, name, type(s), classes, stars, cost, combo — depuis `units.js`.
- **Résolution** : families (liste, `families.js`), tags (aplatis, sparse — `tags.js`), flags d'acquisition.
- **Conditions de composition pré-parsées** : liste d'objets `{famille de grammaire, section porteuse, N, comparateur, groupe cible (tokens typés tag/type/classe/noms), texte original}` (§7). Les conditions d'état et le résidu : `{texte, cochable: false}`.
- **Cible de support** pré-parsée : `{règle S1–S6, tokens résolus, texte original}` ou `{texte}` seul si non parsée ; pas de descriptions d'effets (pas de fiche détail).
- **Kit Rumble (résumé)** : `rumbleType`, DEF, SPD, `cost` Rumble, et les conditions structurées de `rumble.json` (`crew` avec `composition: true`, `character`, `multi` → cochables ; les autres types → information). Résoudre les entrées `Reference {id, basedOn}` au build.

Plus : la table des bateaux (id, name, thumb, description) et le seed de migration. `dbVersion` + SHA affichés dans l'app (pied de page).

## 6. Écrans

Trois zones : **panneau Box**, **navigateur de personnages**, **builders** (PVE/PVP). La liste des équipes sauvegardées sert de page d'accueil.

### 6.1 Navigateur + panneau Box — [ticket 005](wayfinder/tickets/005-gestion-box.md)

- Navigateur façon optc-db : grille de vignettes, filtres type/classe/tags/nom, **filtre « ma box » actif par défaut**.
- Panneau Box : compteur, et le **batch-add** — un input à jetons unique. Taper un ID + espace élit un **jeton** ; un collage est découpé sur tout non-chiffre. Validation immédiate : connu → nom affiché ; inconnu → erreur + **check +1** (un seul essai à ID+1, suggestion avec nom, **validation manuelle obligatoire**). Bouton « Ajouter à la box » : **acceptation partielle** (jetons valides + suggestions acceptées ; doublons dédupliqués silencieusement) ; les jetons restants servent de rapport.
- Retrait : bouton sur la vignette en vue « ma box », **avec confirmation**. Pas de batch-remove, pas de vidage.
- **IDs exacts** : aucune équivalence pré-évolution ↔ évolution.
- **Bateaux possédés** : cochables dans la box, purement informatif (une équipe embarque n'importe quel bateau).

### 6.2 Builder — disposition « Conditions d'abord » — [ticket 008](wayfinder/tickets/008-prototype-ui.md)

Variante C du prototype ([team-builder-ui.html](wayfinder/prototype/team-builder-ui.html) — source primaire de la disposition) :

- **Colonne maîtresse à gauche : le panneau de conditions** (compteurs + cases à cocher).
- **À droite : les candidats** filtrés/triés (vignettes CDN + score « +n »).
- **Dock compact en bas : l'équipe** — slots capitaine / friend captain / 4 membres avec supports en pastille, bateau (PVE) ; 8 slots à plat (PVP).

### 6.3 Règles du builder PVE — [ticket 006](wayfinder/tickets/006-spec-team-builder.md)

- Structure : capitaine + friend captain + 4 membres ; **friend captain limité à la box** ; bateau choisi dans toute la base, affiché seulement.
- **Supports** : au plus 1 par personnage possédé (jamais sur le friend captain) → 5 max. Validateur **non bloquant** : cible non satisfaite → support plaçable, marqué « effet non applicable » (§8).
- **Doublons interdits par famille** (`families.js`), tous emplacements confondus (équipage, friend captain, supports) ; conflit dès qu'une famille est partagée.
- **Plafond de coût** : saisi par le joueur, mémorisé (un PVE, un PVP). Friend captain exclu, supports inclus. Dépassement **bloquant** à l'ajout ; une équipe sauvegardée dépassant un plafond abaissé reste sauvegardée, marquée en dépassement.
- **Compteurs évalués sur les 6 membres d'équipage** (friend captain inclus, supports exclus) — exception : condition « membre nommé », satisfaite aussi par le support du porteur (§7).

### 6.4 Règles du builder PVP — [tickets 003](wayfinder/tickets/003-structure-equipe-pvp.md) / [006](wayfinder/tickets/006-spec-team-builder.md)

- Jusqu'à **8 personnages à plat** — pas de capitaine, supports ni banc. Coût = somme des costs Rumble, plafond PVP distinct, mêmes règles de blocage.
- **Mode** par équipe : Rumble normal / **Assault Rumble** (drapeau ; certains effets `{"type":"mode"}` en dépendent).
- **Modificateurs PVP** saisis manuellement, portés par l'équipe : cible (type, classe PVE, classe Rumble, famille ou tag) + multiplicateurs HP/ATK/RCV/DEF/SPD. L'app **marque les membres bénéficiaires et met en avant les candidats bénéficiaires** ; jamais de stats ajustées calculées.
- Affichage par slot : `rumbleType`, DEF/SPD, cost (depuis l'index).

### 6.5 Cycle de vie des équipes — [ticket 006](wayfinder/tickets/006-spec-team-builder.md)

Nommées librement, illimitées, duplicables (les modificateurs PVP suivent), suppression confirmée, sauvegardables incomplètes. **Type PVE/PVP fixé à la création, aucune conversion.**

## 7. Moteur de conditions et recherche intelligente — [ticket 007](wayfinder/tickets/007-moteur-conditions-recherche.md)

Le cœur de l'app. Sources : PVE = conditions pré-parsées au build (grammaire [rapport 004](wayfinder/research/004-grammaire-conditions.md)) ; PVP = JSON structuré de `rumble.json`, **même moteur, même UX**, évalué sur les 8 slots.

### Régimes de coche

- **Condition positive** cochée (seuil, roster, arc-en-ciel, scaler, membre nommé) : **promeut** les candidats qui la font progresser.
- **Condition négative** cochée (« or fewer », « only », absence, compte exact atteint) : **exclut** les candidats qui la violeraient. Un compte exact = seuil en dessous, contrainte une fois atteint.
- Filtre : candidat montré s'il fait progresser ≥ 1 positive **active** (quand il en existe) ET ne viole aucune négative cochée. Aucune positive active → box entière moins les violeurs.
- **Condition remplie** : reste cochée, affichée ✓, cesse de filtrer.
- **Aucune coche → navigateur normal** (recherche intelligente opt-in). Filtres classiques (type/classe/tags) en **intersection** avec les coches.
- **Tri** : score = nb de positives actives que le candidat fait progresser, décroissant ; départage ID décroissant. Les négatives ne classent pas.
- **Fusion des doublons** : même phrasé + même groupe + même seuil → une ligne, porteurs listés.

### Compteurs par famille de grammaire

| Famille | Compteur / comportement |
|---|---|
| Seuil OR-é (« 4+ [Navy] or [SWORD] ») | compteur unique sur l'**union** ; variante à seuils répétés : une ligne par alternative, remplie si l'une l'est |
| Roster nommé (« consist of any N of: LISTE ») | **n/N** = membres dans la liste ; cochée → candidats = liste ∩ box |
| Arc-en-ciel (un de chaque type) | checklist par type ; progresse = couvre une case manquante |
| Scaler continu (« depending on the number of X ») | « X ×n » sans cible, cochable, jamais rempli |
| Membre nommé (« Zoro as a member or supporting ») | satisfaite par membre d'équipage **ou** support du porteur ; correspondance par **famille** |
| « This character must be captain » (préfixe EX) | badge binaire ✓/✗ (porteur en slot capitaine), hors filtre |
| Résidu / conditions d'état / temps réel | texte brut affiché, **non cochable** |

## 8. Validateur de cible de support — [ticket 011](wayfinder/tickets/011-grammaire-cibles-support.md), [rapport](wayfinder/research/011-grammaire-cibles-support.md)

Évalue **uniquement** la cible (`support[].Characters`) contre le personnage soutenu, à partir de l'AST de l'index :

- Noms propres → « ∃ famille du soutenu ∈ cibles » (règle « A (B) » = A ou B ; noms d'unités exacts et 6 alias gérés au build).
- Groupes : juxtaposition = ET, `,`/`or`/`and`/`/` = OU ; types/classes depuis l'index ; cost comparé à `units.cost`.
- **Verdicts** : applicable / non applicable (marqué « effet non applicable », non bloquant) / **indéterminé** — obligatoire quand la cible utilise des tags et que le soutenu n'a pas de tags renseignés (`tags.js` sparse), ou quand la cible n'est pas parsée (texte brut affiché sans verdict).

## 9. Persistance (localStorage)

Clés versionnées (`optc.v1.*`) : `box` (IDs personnages), `ships` (IDs bateaux possédés), `teams` (équipes PVE et PVP, avec nom, type, slots, supports, bateau/mode/modificateurs), `costCaps` (`{pve, pvp}`). Écriture synchrone à chaque mutation ; un changement de schéma futur passe par un bump de version + migration au chargement.

## 10. Migration initiale — [ticket 005](wayfinder/tickets/005-gestion-box.md)

Le build génère un **seed** = les 381 IDs uniques de l'`index.json` historique. Au premier lancement (localStorage vide), la box est remplie depuis le seed. Le seed et les fiches markdown sont supprimables une fois la box vivante.

## 11. Ordre d'implémentation suggéré

1. Pipeline node (téléchargement épinglé → parseurs → index + seed) — testable seul, hors UI.
2. Box + navigateur (batch-add, check +1, filtre « ma box »).
3. Builder PVE + moteur de conditions + recherche intelligente (le prototype fait foi pour la disposition).
4. Supports + validateur de cible.
5. Builder PVP (rumble.json, modificateurs).
6. CI : build + deploy Pages, cron de mise à jour.

Chaque parseur (conditions, cibles de support) embarque le harnais de couverture des rapports de recherche (cover4/cover11) comme test de non-régression : toute chute de couverture après un bump de SHA est signalée, jamais bloquante.

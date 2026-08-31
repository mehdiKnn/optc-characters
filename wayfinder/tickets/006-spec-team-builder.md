# Spécification du team builder (PVE et PVP)

- Label: wayfinder:grilling
- Status: closed
- Assignee: mehdik + Claude
- Blocked by: [Structure d'une équipe PVP](003-structure-equipe-pvp.md) (closed)

## Question

Quelles sont les règles et le flux exacts du team builder ? (HITL — /grilling + /domain-modeling)

À décider : disposition des slots PVE (capitaine, friend captain, 4 membres, supports par membre, bateau) et PVP (selon la structure confirmée par la recherche) ; les supports comptent-ils dans les compteurs de conditions (les données disent parfois « except as Support Characters ») ; contraintes (doublons, coût) ; nommage/sauvegarde/duplication des équipes ; bascule PVE↔PVP.

## Résolution (2026-08-31)

Grilling en 3 rounds (l'UI est exclue du ticket — elle relève du [Prototype UI](008-prototype-ui.md)). Glossaire mis à jour dans [CONTEXT.md](../../CONTEXT.md).

### Équipe PVE

- **Structure** : capitaine + friend captain + 4 membres ; au plus **1 support par personnage possédé** (capitaine et 4 membres → 5 supports max, **jamais sur le friend captain**) ; un bateau, choisi librement dans toute la base (la possession des bateaux est tracée dans la box mais reste informative).
- **Supports** : le validateur n'évalue que la **cible** (`support[].Characters`, texte libre) ; un support dont le soutenu ne satisfait pas la cible reste plaçable, marqué « effet non applicable ». Les conditions enfouies dans la description de l'effet ne sont pas évaluées. → nouveau ticket de recherche [Grammaire des cibles de support](011-grammaire-cibles-support.md).
- **Doublons** : interdits par **personnage du lore** = par famille (`families.js`) ; conflit dès qu'une famille est partagée (ex. « Monkey D. Luffy » vs « Luffy & Law ») ; s'applique à tous les emplacements (équipage, friend captain, supports).
- **Coût** : plafond **saisi par le joueur et mémorisé** ; friend captain exclu du total, **supports inclus** ; le dépassement est **bloquant** — l'ajout qui ferait dépasser est refusé. Une équipe sauvegardée qui dépasse un plafond abaissé après coup reste sauvegardée, marquée en dépassement.
- **Compteurs** : les conditions de composition sont évaluées sur les **6 membres d'équipage uniquement** (friend captain inclus), jamais sur les supports — conforme aux données (« excluding Supports », « except as Support Characters »).

### Équipe PVP

- **Structure** : jusqu'à 8 personnages à plat, sans capitaine, supports ni banc (recherche [Structure d'une équipe PVP](003-structure-equipe-pvp.md)).
- **Coût** : plafond PVP **distinct** du PVE, saisi et mémorisé ; total = somme des costs Rumble des 8 ; mêmes règles de blocage qu'en PVE.
- **Mode** : drapeau **Rumble normal / Assault Rumble** par équipe — même structure, seuls certains effets sont conditionnés au mode.
- **Modificateurs PVP** : bonus de saison **saisis manuellement** (absents de `rumble.json`), liste portée par l'équipe (pas de bibliothèque partagée ; la duplication de l'équipe les duplique). Forme : une cible (type, classe PVE, classe Rumble, famille ou tag) + des multiplicateurs de stats Rumble (HP, ATK, RCV, DEF, SPD). L'app **indique quels membres bénéficient** d'un modificateur et **met en avant les candidats bénéficiaires** ; elle ne calcule **pas** de stats ajustées (stats réelles de la box inconnues).
- **Grand Party : hors scope** (l'utilisateur n'y joue pas) → Out of scope sur la carte.

### Cycle de vie des équipes

- Équipes **nommées librement**, en nombre **illimité** ; **duplication** ; **suppression confirmée** ; une équipe **incomplète** (slots vides) est sauvegardable ; persistance localStorage.
- Le **type (PVE ou PVP) est fixé à la création** — aucune conversion : la « bascule PVE↔PVP » de la question devient « deux types d'équipes distincts ».

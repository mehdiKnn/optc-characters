# Gestion de la box et batch-add par IDs

- Label: wayfinder:grilling
- Status: closed
- Assignee: mehdik + Claude
- Blocked by: —

## Question

Comment l'utilisateur gère-t-il sa box dans l'app ? (HITL — /grilling + /domain-modeling)

À décider : format accepté par le batch-add (séparateurs, plages ?), validation des IDs inconnus, retrait de personnages, vue « ma box », migration des 381 IDs actuels de `index.json`, gestion des évolutions (posséder une pré-évolution ≙ posséder l'évolution ? — patch de fog associé), export/import de la box.

## Résolution (2026-08-31)

Grilling en 3 rounds (13 questions), toutes décisions confirmées individuellement :

1. **Saisie = input à jetons unique** : taper un ID puis espace l'élit en jeton. Pas de plages (`2400-2410`).
2. **Le collage tokenise pareil** : le texte collé est découpé sur tout non-chiffre, chaque nombre devient un jeton (usage quotidien de quelques IDs — pas de collage massif d'initialisation).
3. **Validation immédiate à l'élection du jeton** : jeton connu = nom du personnage affiché ; jeton inconnu = en erreur.
4. **Check +1** : sur ID inconnu seulement, un seul essai à ID+1 ; s'il existe, suggestion avec nom du personnage et **validation manuelle** avant entrée en box ; si ID+1 inconnu aussi, inconnu sec.
5. **Acceptation partielle** : le bouton « Ajouter à la box » ajoute les jetons valides + suggestions acceptées ; les jetons eux-mêmes servent de rapport (doublons/déjà possédés dédupliqués).
6. **Retrait individuel avec confirmation**, via un bouton sur la vignette en vue « ma box ». Pas de batch-remove, pas de « vider la box ».
7. **Pas de page de navigation dédiée** : le navigateur de personnages porte un filtre « ma box », actif par défaut. La gestion (input à jetons, compteur) vit dans un petit panneau « Box » à part.
8. **Évolutions : IDs exacts seulement**, aucune équivalence implicite pré-évo ↔ évo (le check +1 est une suggestion explicitement validée, pas une équivalence).
9. **Pas d'export/import** (revient sur le « envisageable » du cadrage initial, décision 6).
10. **Migration jetable par seed embarqué** : les 381 IDs d'`index.json` (uniques, 261–4633) génèrent un seed au build ; au premier lancement, localStorage vide → box remplie depuis le seed ; le seed est supprimable une fois la box vivante.

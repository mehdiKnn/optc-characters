# Rédiger la spec finale

- Label: wayfinder:task
- Status: closed
- Assignee: mehdik
- Blocked by: [Gestion de la box](005-gestion-box.md) (closed), [Spécification du team builder](006-spec-team-builder.md) (closed), [Moteur de conditions et recherche intelligente](007-moteur-conditions-recherche.md) (closed), [Prototype UI](008-prototype-ui.md) (closed), [Stack et pipeline de build](010-stack-et-pipeline.md) (closed), [Grammaire des cibles de support](011-grammaire-cibles-support.md) (closed), [Fiche détail d'un personnage](012-fiche-detail-personnage.md) (closed, hors périmètre)

## Question

Assembler toutes les décisions de la carte en une spec unique prête à implémenter (le livrable de la destination) : architecture données, pipeline de build, modèle de domaine (depuis CONTEXT.md), écrans, moteur de conditions, recherche, persistance, stack recommandée. C'est ici que les derniers patchs de fog (stack, fiche détail, hébergement) doivent avoir été gradués ou tranchés.

## Résolution (2026-08-31)

**Livrable : [SPEC.md](../../SPEC.md)** — 11 sections assemblant les 9 tickets résolus : produit et hors-périmètre, stack/hébergement, source de données, pipeline de build, contrat de l'index généré, écrans (disposition « Conditions d'abord » du prototype), moteur de conditions, validateur de supports, persistance localStorage, migration par seed, ordre d'implémentation suggéré. Les grammaires détaillées restent dans les rapports de [research/](../research/) (référencés), le glossaire dans [CONTEXT.md](../../CONTEXT.md), la disposition dans le [prototype](../prototype/team-builder-ui.html).

Décision prise en rédigeant (déléguée par le post-scriptum du [ticket 010](010-stack-et-pipeline.md)) : **pas de chunks à la demande** — la fiche détail étant hors périmètre, un index unique enrichi (~2-3 Mo) couvre tout ce que l'UI affiche.

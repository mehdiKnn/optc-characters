# OPTC Crew Lab

Application web statique en français pour gérer sa box One Piece Treasure Cruise et construire des équipes PVE ou Pirate Rumble. Les données restent dans `localStorage` ; aucun backend ni compte n’est nécessaire.

## Développement

```bash
npm install
npm run dev
```

Le premier lancement télécharge les données optc-db au SHA épinglé dans `data-source.json`, puis génère `src/generated/index.json`. Cet artefact et le cache de téléchargement ne sont pas versionnés.

```bash
npm test       # tests du moteur métier
npm run build  # génération des données, typecheck et bundle Vite
```

## Données et déploiement

- Source : fork `2shankz/optc-db.github.io`, épinglé sur un commit.
- `npm run data:update` avance uniquement le SHA vers le HEAD du fork.
- GitHub Pages est construit à chaque push.
- Un workflow hebdomadaire met à jour le SHA, contrôle les parseurs et redéploie.

Projet fan non affilié à Bandai Namco. Code sous GNU GPLv3 ; les données et visuels du jeu restent la propriété de leurs ayants droit.

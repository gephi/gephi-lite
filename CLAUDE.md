# Instructions pour Claude Code

- Lors des commits, ne jamais ajouter de ligne "Co-Authored-By:".
- Éviter la duplication de code : toujours factoriser dans des constantes, des fonctions ou des méthodes partagées plutôt que copier-coller entre fichiers, pour que le code reste maintenable et qu'une même fonctionnalité n'ait jamais deux comportements différents selon l'endroit où elle est appelée.
- Une même action déclenchable de plusieurs façons (touche du clavier, bouton, entrée de menu, geste tactile, bouton Retour du système…) doit passer par un seul et même code. Si je demande une modification en désignant un seul de ces modes de déclenchement, elle s'applique à tous les autres, sauf si je dis explicitement le contraire.

## Flux de déploiement

- **Pré-production** (branche `develop`, déployée sur `https://jeangarf.github.io/gephi-lite/preprod/`) : je peux merger dans `develop` et pousser **sans demander**.
- **Production** (branche `main_jg`, déployée sur `https://jeangarf.github.io/gephi-lite/`) : je dois **toujours demander** avant de merger `develop` dans `main_jg` et de pousser.
- Après avoir propagé en production, **toujours revenir sur `develop`**.

## Synchronisation des branches

- Si une branche de feature est en retard sur `develop`, la mettre à jour avec un **merge `--no-ff`** de `develop` dans la branche de feature (jamais de fast-forward), pour conserver la visualisation parallèle des branches dans l'historique.
- Le fast-forward est réservé aux **pull** (synchronisation d'une branche locale avec son remote) — ce n'est pas un merge de feature.

## Vocabulaire de propagation

- **"Propager en pré-prod"** : merger une branche de feature dans `develop`, puis pusher `develop`.
- **"Propager en prod"** : merger `develop` dans `main_jg`, puis pusher `main_jg`, puis revenir sur `develop`. On ne propage **jamais** en prod sans être d'abord passé par `develop` : tout changement (y compris du `CLAUDE.md`) est propagé en pré-prod avant la prod.

## Choix de la branche de feature

Une amélioration ou une correction qui prolonge un sujet déjà en cours doit se faire **sur la branche de feature existante de ce sujet**, et non sur une nouvelle : l'historique Git doit montrer qu'il s'agit de la suite.

Avant de créer une branche, chercher une branche existante sur le même sujet parmi :
- les features en pré-prod mais pas encore en prod : `git branch -r --merged origin/develop --no-merged origin/main_jg` ;
- les features pas encore propagées du tout : `git branch -r --no-merged origin/develop`.

Ensuite :
- **Une branche de ce périmètre traite le même sujet** : la reprendre, en l'annonçant en une phrase (« je reprends `feature/xxx` »). Ne merger `develop` dedans que si c'est nécessaire (la correction dépend de code arrivé depuis sur `develop`, ou conflit) — sinon chaque merge ajoute un nœud inutile au graphe.
- **Le sujet correspond à une feature déjà passée en prod, OU il y a un doute entre plusieurs branches, OU sur le rattachement** : demander, en proposant la branche candidate.
- **Aucune branche ne correspond** : créer une nouvelle branche.

Les branches de feature sont préfixées par `feature/` et nommées **par sujet** plutôt que par changement précis (ex. `feature/feuille-detail` plutôt que `feature/sheet-branches-et-copie`), pour qu'une suite s'y rattache naturellement.

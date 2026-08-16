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

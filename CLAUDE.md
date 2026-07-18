# Instructions pour Claude Code

- Lors des commits, ne jamais ajouter de ligne "Co-Authored-By:".
- Éviter la duplication de code : factoriser dans des fonctions ou des constantes partagées plutôt que copier-coller entre fichiers.

## Flux de déploiement

- **Pré-production** (branche `develop`, déployée sur `https://jeangarf.github.io/gephi-lite/preprod/`) : je peux merger dans `develop` et pousser **sans demander**.
- **Production** (branche `main_jg`, déployée sur `https://jeangarf.github.io/gephi-lite/`) : je dois **toujours demander** avant de merger `develop` dans `main_jg` et de pousser.

## Synchronisation des branches

- Si une branche de feature est en retard sur `develop`, la mettre à jour avec un **merge `--no-ff`** de `develop` dans la branche de feature (jamais de fast-forward), pour conserver la visualisation parallèle des branches dans l'historique.
- Le fast-forward est réservé aux **pull** (synchronisation d'une branche locale avec son remote) — ce n'est pas un merge de feature.

# Instructions pour Claude Code

- Lors des commits, ne jamais ajouter de ligne "Co-Authored-By:".
- Éviter la duplication de code : factoriser dans des fonctions ou des constantes partagées plutôt que copier-coller entre fichiers.

## Flux de déploiement

- **Pré-production** (branche `develop`, déployée sur `https://jeangarf.github.io/gephi-lite/preprod/`) : je peux merger dans `develop` et pousser **sans demander**.
- **Production** (branche `main_jg`, déployée sur `https://jeangarf.github.io/gephi-lite/`) : je dois **toujours demander** avant de merger `develop` dans `main_jg` et de pousser.

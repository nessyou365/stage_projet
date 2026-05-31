# Firebase Rules Setup

Fichiers à publier dans Firebase :

- `C:\Users\pc\Downloads\talentai-complete\firestore.rules`
- `C:\Users\pc\Downloads\talentai-complete\storage.rules`

## Bucket Storage

Utilisez ce bucket :

- `ai-recruitment-system-44349.appspot.com`

## Comment publier

Dans Firebase Console :

1. Ouvrir le projet `ai-recruitment-system-44349`
2. Aller dans `Firestore Database` → `Rules`
3. Coller le contenu de `firestore.rules`
4. Aller dans `Storage` → `Rules`
5. Coller le contenu de `storage.rules`
6. Publier

## Important

Ces règles sont adaptées pour faire fonctionner l’application actuelle.

Limite importante :

- le mobile candidat n’utilise pas encore Firebase Authentication,
- donc ces règles permettent le flux candidat/RH,
- mais ce n’est pas une sécurité finale idéale pour la production.

Pour une version vraiment sécurisée, il faudra connecter aussi le mobile candidat à Firebase Auth.

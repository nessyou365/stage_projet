# stage_projet

Projet de stage pour une plateforme de recrutement composee de deux applications:

- `web/`: application web RH/admin construite avec React, Vite, Tailwind CSS et Firebase.
- `mobile/`: application mobile candidat construite avec Flutter et Firebase.

## Structure

```text
stage_projet/
├── web/                    # Frontend web RH/admin
├── mobile/                 # Application mobile candidat
├── firestore.rules         # Regles Firestore
├── storage.rules           # Regles Firebase Storage
├── firebase.json           # Configuration Firebase
├── .firebaserc             # Projet Firebase
├── FIREBASE_INTEGRATION_GUIDE.md
└── FIREBASE_RULES_SETUP.md
```

## Prerequis

- Node.js 18+
- npm
- Flutter SDK 3.4+
- Firebase CLI, si vous voulez deployer les regles Firebase

## Lancer l'application web

```bash
cd web
npm install
npm run dev
```

Copiez `web/.env.example` vers `web/.env` puis ajoutez les variables Firebase avant de lancer l'application.

## Lancer l'application mobile

```bash
cd mobile
flutter pub get
flutter run
```

## Firebase

Les regles sont a la racine du projet:

```bash
firebase deploy --only firestore:rules
```

## Preparation GitHub

Les dossiers generes et locaux comme `node_modules/`, `dist/`, `build/`, `.dart_tool/`, `.idea/` et les fichiers `.env` sont ignores par `.gitignore`.

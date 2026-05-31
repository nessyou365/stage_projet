# HireQ Web

Application web pour les RH et administrateurs de la plateforme de recrutement.

## Stack

- React 18 + Vite 5
- Tailwind CSS 3
- React Router DOM 6
- Recharts
- Lucide React
- Firebase

## Installation

```bash
npm install
npm run dev
```

Copiez `.env.example` vers `.env` et renseignez les variables Firebase.

## Structure

```text
src/
├── App.jsx
├── main.jsx
├── index.css
├── assets/
├── components/
│   └── layout/
├── contexts/
├── hooks/
├── lib/
├── pages/
└── services/
```

## Routes principales

| Route | Page |
|-------|------|
| `/dashboard` | KPIs, graphiques et pipeline |
| `/jobs` | Gestion des offres |
| `/candidates` | Liste des candidats |
| `/pipeline` | Kanban recrutement |
| `/ai-analysis` | Analyse IA |
| `/ranking` | Classement candidats |
| `/interviews` | Entretiens |
| `/spontaneous` | Candidatures spontanees |
| `/decisions` | Decisions de recrutement |
| `/notifications` | Centre de notifications |
| `/settings` | Parametres |

# My Electron App

Une application Electron qui affiche une page web avec authentification HTTP basique et gère des liens spéciaux.

## Fonctionnalités

- Affichage de la page `http://127.0.0.1:3000/frontend/` avec authentification automatique
- Authentification HTTP basique avec credentials préconfigurés
- Mise à jour automatique de l'application
- Gestion des liens spéciaux commençant par `mpv://`

## Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- TypeScript

## Installation

```bash
# Cloner le dépôt
git clone <votre-repo-url>
cd my-electron-app

# Installer les dépendances
npm install
```

## Développement

```bash
# Lancer l'application
npm start

# Compiler TypeScript en mode watch (dans un terminal séparé)
npm run watch
```

## Construction de l'application

```bash
# Créer un package pour la plateforme actuelle
npm run build
```

## Publication d'une mise à jour

Pour publier une nouvelle version et déclencher la mise à jour automatique chez les utilisateurs:

1. `npm run release` pour créer une nouvelle version
2. `npm run publish` pour publier la nouvelle version (peut nécessiter les droits admin)
   nécessite `GH_TOKEN=xxxxx` dans le fichier `.env`

Si besoin de recréer un token : 
* Va sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
* Clique sur "Generate new token (classic)"
* Donne-lui un nom (ex: electron-builder)
* Coche la permission `public_repo`
* Clique "Generate token" et copie-le immédiatement

## Configuration de l'authentification

Les identifiants par défaut sont:
- Nom d'utilisateur: `user`
- Mot de passe: `password`

Pour modifier ces identifiants, modifiez la variable `authConfig` dans `main.js`.

## Gestion des liens mpv://

L'application intercepte les liens commençant par `mpv://` et exécute une action spécifique sans naviguer ailleurs. Pour personnaliser cette action, modifiez la fonction `handleMpvLink` dans `main.js`.
# Jellyplay Client

Une application Electron qui affiche une page web avec authentification HTTP basique et gère des liens spéciaux.

## Fonctionnalités

- Affichage de la page `http://127.0.0.1:3000/frontend/` avec authentification automatique
- Authentification HTTP basique avec credentials préconfigurés
- Mise à jour automatique de l'application
- Gestion des liens spéciaux commençant par `mpv://`

## Installation

### Windows

Télécharger et exécuter le fichier `.exe` depuis la [dernière release GitHub](https://github.com/max-collomb/jellyplay-client/releases/latest).

### Linux

Coller la commande suivante dans un terminal :

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/max-collomb/jellyplay-client/master/scripts/install-linux.sh)
```

Cette commande :
- télécharge automatiquement la dernière version
- installe l'AppImage dans `/opt`
- crée un raccourci dans le lanceur d'applications (épinglable au dock)

Les mises à jour suivantes sont gérées automatiquement par l'application.

## Développement

### Prérequis

- Node.js (v20 ou supérieur)
- npm
- TypeScript

### Lancer en mode développement

```bash
# Cloner le dépôt
git clone https://github.com/max-collomb/jellyplay-client.git
cd jellyplay-client

# Installer les dépendances
npm install

# Lancer l'application
npm start

# Ou compiler TypeScript en mode watch (dans un terminal séparé)
npm run watch
```

## Publication d'une mise à jour

Pour publier une nouvelle version et déclencher la mise à jour automatique chez les utilisateurs :

1. `npm run release` — incrémente la version, crée un tag git et pousse
2. `npm run publish` — build et publie sur GitHub Releases

> Nécessite `GH_TOKEN=xxxxx` dans le fichier `.env`.
> Pour créer un token : GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → cocher `public_repo`.

## Configuration de l'authentification

Les identifiants sont configurables au premier lancement via l'interface de l'application.

## Gestion des liens mpv://

L'application intercepte les liens commençant par `mpv://` et exécute une action spécifique sans naviguer ailleurs.

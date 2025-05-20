import * as path from 'path';
import { ipcMain, BrowserWindow } from 'electron';
import { Auth } from './types';
import { secureStore } from './secure-store';
import { ctx } from './context';

// Récupération de la configuration d'authentification : depuis secureStore ou via une fenêtre de dialogue
export async function loadAuthConfig(): Promise<void> {
  let storedConfig = secureStore.get('auth') as Auth | null;

  if (!storedConfig) {
    // Créer une fenêtre de dialogue personnalisée pour la configuration
    storedConfig = await showAuthWindow();
  }
  ctx.auth = storedConfig

}

export async function showAuthWindow(): Promise<Auth> {
  // préparation de la fenêtre
  const authWindow = new BrowserWindow({
    width: 500,
    height: 400,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    parent: BrowserWindow.getAllWindows()[0],
    modal: true,
    show: true
  });
  authWindow.removeMenu();

  // Chargement du fichier HTML de la fenêtre d'authentification
  await authWindow.loadFile(path.join(__dirname, 'auth.html'));
  
  // Gestion de la fermeture de la fenêtre
  return new Promise((resolve) => {
    ipcMain.once('submit-auth', (_event, config: Auth) => {
      secureStore.set('auth', config);
      ctx.auth.username = config.username;
      ctx.auth.password = config.password;
      authWindow.close();
      resolve(config);
    });
  });
}
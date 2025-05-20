import { app, BrowserWindow } from 'electron';
import * as path from 'path';

import { secureStore } from './secure-store';
import { ctx } from './context';

export async function createWindow(url: string): Promise<BrowserWindow> {
  // Obtenir la configuration de la fenêtre
  ctx.windowState = secureStore.get('windowState');

  console.log('ctx: ', ctx);
  // Préparation de la fenêtre principale
  const mainWindow = new BrowserWindow({
    width: ctx.windowState?.width || 1200,
    height: ctx.windowState?.height || 800,
    x: ctx.windowState?.x,
    y: ctx.windowState?.y,
    backgroundColor: '#0c0d0e',
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    title: 'Jellyplay Electron client',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow.removeMenu();

  if (ctx.windowState?.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.loadURL(url);

  mainWindow.title = `Jellyplay Electron client v${app.getVersion()} - ${url}`;

  // on attends avant d'afficher la fenêtre pour éviter un clignotement
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Ajouter le raccourci F12 pour ouvrir les DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
      event.preventDefault();
    }
  });

  return mainWindow;
}
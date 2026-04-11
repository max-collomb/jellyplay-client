import { app, ipcMain } from 'electron';
import * as path from 'path';

import { ctx } from './context';
import { createWindow } from './main-window';
import { setupAutoUpdater, checkForUpdates, getPendingVersion, updateAndRestart } from './auto-updater';
import { ConnectionManager } from './connection-manager';
import { setupDownloadHandler } from './download-handler';
import { setupBasicAuthHeaders } from './basic-auth-headers';
import { loadAuthConfig } from './auth';
import { setupFrameHandler } from './frame-handler';
import { setupCode401Handler } from './code-401-handler';
import { setupWindowStatePersistence } from './window-state-persistence';
import { setupProtocolsHandler } from './protocols-handler';

ipcMain.handle('get-auth', () => ctx.auth);
ipcMain.handle('check-for-updates', checkForUpdates);
ipcMain.handle('get-pending-version', getPendingVersion);
ipcMain.handle('update-and-restart', updateAndRestart);

const urls = ['http://127.0.0.1:3000/*', 'http://192.168.0.99:3000/*', 'http://nas.colors.ovh:3000/*', 'https://jellyplay.synology.me:37230/*'];
const connectionManager = new ConnectionManager(
  'http://192.168.0.99:3000/frontend/', // localAddress
  'https://jellyplay.synology.me:37230/frontend/', // publicAddress
);

if (process.platform === 'win32') {
  const mpvDir = app.isPackaged
    ? path.join(process.resourcesPath, 'mpv-binaries', 'windows-x64')
    : path.join(path.dirname(__dirname), 'mpv-binaries', 'windows-x64');
  ctx.mpvPath = path.join(mpvDir, 'mpv.exe');
  ctx.mpvIpcSocket = '\\\\.\\pipe\\mpvsocket';
} else {
  // Linux : on utilise le mpv installé sur la machine
  ctx.mpvPath = 'mpv';
  ctx.mpvIpcSocket = '/tmp/mpvsocket';
}

// Créer la fenêtre principale lorsque Electron est prêt
app.whenReady().then(async () => {
  // Si pas d'authentification, on quitte immédiatement
  await loadAuthConfig();
  if (!ctx.auth) return;

  const url = app.isPackaged
    ? await connectionManager.getOptimalServerUrl() // 'https://jellyplay.synology.me:37230/frontend/'
    : 'http://127.0.0.1:3000/frontend/';
  const mainWindow = await createWindow(url);
  setupWindowStatePersistence(mainWindow);
  setupProtocolsHandler(mainWindow);
  setupDownloadHandler(mainWindow);
  setupFrameHandler(mainWindow);
  setupCode401Handler(mainWindow);
  setupAutoUpdater(mainWindow);
  setupBasicAuthHeaders(urls);

  // mode debug
  if (!app.isPackaged) {
    mainWindow.title += ' - unpackaged';
    mainWindow.webContents.openDevTools();
  }
});

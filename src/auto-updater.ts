import * as path from 'path';
import { BrowserWindow } from "electron";
import { autoUpdater } from 'electron-updater';

let newVersionPending: string = "";

export function checkForUpdates(): void {
  if (newVersionPending) return;
  // autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml');
  // autoUpdater.forceDevUpdateConfig = true;
  // autoUpdater.autoDownload = false
  // autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.checkForUpdates();
}

export function setupAutoUpdater(mainWindow: BrowserWindow): void {  
  autoUpdater.on('update-downloaded', (info) => {
    newVersionPending = info.version;
    console.log('update-downloaded: ', info);
    mainWindow.loadFile(path.join(__dirname, 'update.html'));
  });

  checkForUpdates();
  setInterval(checkForUpdates, 3600000); // Vérifier les mises à jour toutes les heures
}

export function getPendingVersion(): string {
  return newVersionPending;
}

export function updateAndRestart(): void {
  if (newVersionPending) {
    autoUpdater.quitAndInstall();
  }
}
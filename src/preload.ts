import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from './types';

// Expose les API au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  submitAuth: (config: { username: string; password: string }) => ipcRenderer.send('submit-auth', config),
  getAuth: () => ipcRenderer.invoke('get-auth'),
  getPendingVersion: () => { return ipcRenderer.invoke('get-pending-version'); },
  checkForUpdates: () => { ipcRenderer.invoke('check-for-updates'); },
  updateAndRestart: () => { ipcRenderer.invoke('update-and-restart'); },
} as ElectronAPI);

// Expose _mpvSchemeSupported au processus de rendu
contextBridge.exposeInMainWorld('_mpvSchemeSupported', true);

// Déclarer le type global pour TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    _mpvSchemeSupported: boolean;
    _setPosition: (position: number) => void;
  }
}

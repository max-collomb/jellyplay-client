import { contextBridge, ipcRenderer } from 'electron';

// Importer le type ElectronAPI depuis types.ts
import { ElectronAPI } from './types';

// Exposer des API sécurisées au processus de rendu
contextBridge.exposeInMainWorld('electronAPI', {
  submitAuth: (config: { username: string; password: string }) => 
    ipcRenderer.send('submit-auth', config),
  getAuthConfig: () => ipcRenderer.invoke('get-auth-config'),
  getNewVersion: () => ipcRenderer.invoke('get-new-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  updateAndRestart: () => ipcRenderer.invoke('update-and-restart'),
} as ElectronAPI);

// Exposer _mpvSchemeSupported au processus de rendu
contextBridge.exposeInMainWorld('_mpvSchemeSupported', true);

// Déclarer le type global pour TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    _mpvSchemeSupported: boolean;
    _setPosition: (position: number) => void;
  }
}

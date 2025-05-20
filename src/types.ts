// authentification auprès du serveur
export interface Auth {
  username: string;
  password: string;
}

// position et état de la fenêtre
export interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// infos de mise à jour
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

export interface SecureStore {
  get(key: 'auth'): Auth | null;
  get(key: 'windowState'): WindowState | null;
  set(key: 'auth', value: Auth): void;
  set(key: 'windowState', value: WindowState): void;
}

// API exposée au renderer
export interface ElectronAPI {
  getAuth: () => Promise<Auth | null>;
  submitAuth: (config: Auth) => void;
  getPendingVersion: () => Promise<string>;
  checkForUpdates: () => void;
  updateAndRestart: () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

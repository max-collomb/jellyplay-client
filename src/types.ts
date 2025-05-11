// Types pour l'authentification
export interface AuthConfig {
  username: string;
  password: string;
}

export interface WindowConfig {
  x?: number;
  y?: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

// Types pour les mises à jour
export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string;
}

// Types pour les événements de l'application
export interface AppEvent {
  type: string;
  payload?: any;
}

// Types pour l'API Electron exposée au renderer
export interface ElectronAPI {
  getAuthConfig: () => Promise<AuthConfig | null>;
  submitAuth: (config: AuthConfig) => void;
}

export interface ElectronStore {
  get(key: 'authConfig'): AuthConfig | null;
  get(key: 'windowConfig'): WindowConfig | null;
  set(key: 'authConfig', value: AuthConfig): void;
  set(key: 'windowConfig', value: WindowConfig): void;
  delete: (key: string) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

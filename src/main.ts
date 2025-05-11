import { app, BrowserWindow, session, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as path from 'path';
import Store from 'electron-store';
import { AuthConfig, ElectronStore, WindowConfig } from './types';
import { handleMpvUri } from './mpv-handler';
import { ConnectionManager } from './connection-manager';
import { ctx } from './context';
import { setupDownloadHandler } from './download-handler';

const store = new Store({
  name: 'auth-config',
  encryptionKey: 'UniqueK3y4Auth',
  clearInvalidConfig: true
}) as unknown as ElectronStore;

// Fonction pour obtenir la configuration d'authentification
async function getAuthConfig(): Promise<AuthConfig | null> {
  let storedConfig = store.get('authConfig') as AuthConfig | null;
  
  if (!storedConfig) {
    // Créer une fenêtre de dialogue personnalisée pour la configuration
    storedConfig = await showAuthWindow();
  }
  ctx.basicLogin = storedConfig.username;
  ctx.basicPassword = storedConfig.password;

  return storedConfig;
}

async function showAuthWindow(): Promise<AuthConfig> {
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

  await authWindow.loadFile(path.join(__dirname, 'auth.html'));
  authWindow.webContents.on('did-finish-load', () => {
    authWindow.webContents.send('load-auth-config', store.get('authConfig'));
  });
  return new Promise((resolve) => {
    ipcMain.once('submit-auth', (_event, config: AuthConfig) => {
      store.set('authConfig', config);
      authConfig = config;
      ctx.basicLogin = config.username;
      ctx.basicPassword = config.password;
      authWindow.close();
      resolve(config);
    });
  });
}

ipcMain.handle('get-auth-config', async () => {
  const storedConfig = store.get('authConfig') as AuthConfig | null;
  return storedConfig;
});

// Variable globale pour la configuration d'authentification
let authConfig: AuthConfig | null = null;
let windowConfig: WindowConfig | null = null;

// Vérification des mises à jour
function checkForUpdates(): void {
  autoUpdater.checkForUpdatesAndNotify();
}

let mainWindow: BrowserWindow | null;

async function createWindow(): Promise<void> {
  // Obtenir la configuration d'authentification
  authConfig = await getAuthConfig();
  if (!authConfig) return;

  // Obtenir la configuration de la fenêtre
  windowConfig = store.get('windowConfig');

  // Créer la fenêtre du navigateur
  mainWindow = new BrowserWindow({
    width: windowConfig?.width || 1200,
    height: windowConfig?.height || 800,
    x: windowConfig?.x,
    y: windowConfig?.y,
    backgroundColor: '#0c0d0e',
    show: false,
    icon: path.join(__dirname, '..', 'assets', 'icon.ico'),
    title: 'Jellyplay Electron client',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (windowConfig?.isMaximized) {
    mainWindow.maximize();
  }

  mainWindow.removeMenu();
  // Intercepter les requêtes pour ajouter l'authentification HTTP basique
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ['http://127.0.0.1:3000/*', 'http://192.168.0.99:3000/*', 'http://nas.colors.ovh:3000/*', 'https://jellyplay.synology.me:37230/*'] },
    (details, callback) => {
      if (!authConfig) {
        callback({ cancel: true });
        return;
      }
      const authCredentials = Buffer.from(`${authConfig.username}:${authConfig.password}`).toString('base64');
      details.requestHeaders['Authorization'] = `Basic ${authCredentials}`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  // Attend que la page soit chargée pour éviter un clignotement avec une page blanche
  var connectionManager = new ConnectionManager(
    "http://192.168.0.99:3000/frontend/", // localAddress
    "https://jellyplay.synology.me:37230/frontend/" // publicAddress
  );
  const optimalUrl = app.isPackaged
    ? await connectionManager.getOptimalServerUrl()
    : 'http://127.0.0.1:3000/frontend/';
  mainWindow.loadURL(optimalUrl);
  mainWindow.title = 'Jellyplay Electron client - ' + optimalUrl;
  mainWindow.once('ready-to-show', () => mainWindow?.show());

  // Gérer les liens externes et les liens mpv://
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Intercepter les liens mpv://
    if (parsedUrl.protocol === 'mpv:') {
      event.preventDefault();
      handleMpvLink(navigationUrl);
    }
    if (parsedUrl.protocol === 'jellyplay:') {
      event.preventDefault();
      handleJellyplayLink(navigationUrl);
    }
  });

  mainWindow.webContents.on('will-frame-navigate', (details) => {
    console.log('Frame navigation starting: ' + details.url);
    // Autorisation d'affichage en iframe
    if (!details.isMainFrame) {
      session.defaultSession.webRequest.onHeadersReceived((headersDetails, callback) => {
        const responseHeaders = { ...headersDetails.responseHeaders };
        responseHeaders['Content-Security-Policy'] = ["frame-ancestors 'self' *"];

        callback({ responseHeaders });
      });
    }
  });

  mainWindow.webContents.on('did-navigate', async (_event, _url, httpResponseCode) => {
    if (httpResponseCode === 200) {
      mainWindow?.webContents.executeJavaScript(`window._mpvSchemeSupported = true;`);
    } else if (httpResponseCode === 401) {
      const newAuthConfig = await showAuthWindow();
      if (newAuthConfig) {
        mainWindow?.webContents.reload();
      }
    }
  });

  mainWindow.webContents.on('did-frame-finish-load', async (_event, isMainFrame) => {
    try {
      if (!isMainFrame) {
        // Get the onloaded script from data attribute
        const onloaded = await mainWindow.webContents.executeJavaScript(
          `document.querySelector('iframe').dataset.onloaded`
        );

        // Get and process the upload URL
        const uploadUrl = await mainWindow.webContents.executeJavaScript(
          `new URL(document.querySelector('iframe').dataset.uploadurl, document.baseURI).href`
        );

        // Store the uploadUrl for later use (depending on your application's needs)
        ctx.uploadUrl = uploadUrl;

        // Execute the onloaded script in the iframe context
        if (mainWindow.webContents.mainFrame.frames.length > 0) {
          mainWindow.webContents.mainFrame.frames[0].executeJavaScript(`eval(${JSON.stringify(onloaded)})`);
        }

        console.log('Frame script executed successfully, upload URL:', uploadUrl);
      }
    } catch (error) {
      console.error('Error in frame navigation completion:', error);
    }
  });

  setupDownloadHandler(mainWindow);

  // Ouvrir les DevTools en développement
  if (!app.isPackaged) {
    mainWindow.webContents.openDevTools();
  }

  // Événement de fermeture de la fenêtre
  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  const onResizeOrMove = () => {
    if (mainWindow && windowConfig) {
      if (mainWindow.isMaximized()) {
        windowConfig = { ...windowConfig, isMaximized: true };
      } else {
        windowConfig = { ...mainWindow.getBounds(), isMaximized: false };
      }
    }
  };

  mainWindow.on('resize', onResizeOrMove);

  mainWindow.on('move', onResizeOrMove);

  // Sauvegarder la configuration de la fenêtre avant la fermeture
  mainWindow.on('close', () => {
    if (windowConfig) {
      store.set('windowConfig', windowConfig);
    }
  });

  // Ajouter le raccourci F12 pour ouvrir les DevTools
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow?.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
}

// Fonction pour gérer les liens mpv://
function handleMpvLink(mpvUrl: string): void {
  handleMpvUri(mpvUrl, authConfig?.username || '', authConfig?.password || '', (command: string) => {
    mainWindow?.webContents.executeJavaScript(command);
  });
}

// Fonction pour gérer les liens mpv://
async function handleJellyplayLink(url: string): Promise<void> {
  if (url == 'jellyplay://logform') {
    const newAuthConfig = await showAuthWindow();
    if (newAuthConfig) {
      mainWindow.webContents.reload();
    }
  }
}

// Créer la fenêtre principale lorsque Electron est prêt
app.whenReady().then(async () => {
  await createWindow();
  checkForUpdates();

  // Vérifier les mises à jour toutes les heures
  setInterval(checkForUpdates, 3600000);

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Configuration des événements pour l'auto-updater
autoUpdater.on('checking-for-update', () => {
  console.log('Recherche de mises à jour...');
});

autoUpdater.on('update-available', (info) => {
  console.log('Mise à jour disponible:', info);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('Pas de mise à jour disponible.');
});

autoUpdater.on('error', (err) => {
  console.log('Erreur durant la recherche de mises à jour:', err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let logMessage = `Vitesse: ${progressObj.bytesPerSecond} - Téléchargé ${progressObj.percent}%`;
  console.log(logMessage);
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Mise à jour téléchargée. Elle sera installée au redémarrage.');
});
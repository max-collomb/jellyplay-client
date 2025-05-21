import { BrowserWindow, shell } from 'electron';

import { handleMpvUri } from './mpv-handler';
import { ctx } from './context';
import { showAuthWindow } from './auth';

export function setupProtocolsHandler(mainWindow: BrowserWindow): void {

  // Gestion des différents protocoles mpv://, jellyplay:// et browser://
  mainWindow.webContents.on('will-navigate', async (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    if (parsedUrl.protocol === 'mpv:' || parsedUrl.protocol === 'mpvs:') {
      event.preventDefault();
      handleMpvUri(navigationUrl, ctx.auth.username, ctx.auth.password, (command: string) => {
        mainWindow?.webContents.executeJavaScript(command);
      });
    }

    if (parsedUrl.protocol === 'jellyplay:') {
      event.preventDefault();
      if (navigationUrl == 'jellyplay://logform') {
        const newAuthConfig = await showAuthWindow();
        if (newAuthConfig) {
          mainWindow.webContents.reload();
        }
      }
    }

    if (parsedUrl.protocol === 'browser:') {
      event.preventDefault();
      const decodedUrl = decodeURIComponent(navigationUrl.substring(10));
      shell.openExternal(decodedUrl);
    }
  });
}
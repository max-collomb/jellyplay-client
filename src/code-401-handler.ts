import { BrowserWindow } from 'electron';
import { showAuthWindow } from './auth';

export function setupCode401Handler(mainWindow: BrowserWindow): void {
  mainWindow.webContents.on('did-navigate', async (_event, _url, httpResponseCode) => {
    // if (httpResponseCode === 200) {
    //   mainWindow?.webContents.executeJavaScript(`window._mpvSchemeSupported = true;`);
    // }
    if (httpResponseCode === 401) {
      const newAuthConfig = await showAuthWindow();
      if (newAuthConfig) {
        mainWindow?.webContents.reload();
      }
    }
  });
}

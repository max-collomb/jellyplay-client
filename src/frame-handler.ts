import { BrowserWindow, session } from 'electron';
import { ctx } from './context';

export function setupFrameHandler(mainWindow: BrowserWindow): void {
  mainWindow.webContents.on('will-frame-navigate', (details) => {
    console.log('Frame navigation starting: ' + details.url);
    // Autorisation d'affichage en iframe
    if (!details.isMainFrame) {
      session.defaultSession.webRequest.onHeadersReceived((headersDetails, callback) => {
        const responseHeaders = { ...headersDetails.responseHeaders };
        responseHeaders['Content-Security-Policy'] = ['frame-ancestors \'self\' *'];

        callback({ responseHeaders });
      });
    }
  });

  mainWindow.webContents.on('did-frame-finish-load', async (_event, isMainFrame) => {
    try {
      if (!isMainFrame) {
        // Get the onloaded script from data attribute
        const onloaded = await mainWindow.webContents.executeJavaScript('document.querySelector(\'iframe\').dataset.onloaded');

        // Get and process the upload URL
        const uploadUrl = await mainWindow.webContents.executeJavaScript('new URL(document.querySelector(\'iframe\').dataset.uploadurl, document.baseURI).href');

        // Store the uploadUrl for later use (depending on your application's needs)
        ctx.uploadUrl = uploadUrl;

        // Execute the onloaded script in the iframe context
        if (mainWindow.webContents.mainFrame.frames.length > 0) {
          let hasJquery = await mainWindow.webContents.mainFrame.frames[0].executeJavaScript('typeof $ == \'function\'');
          while (!hasJquery) {
            await new Promise((resolve) => setTimeout(resolve, 250));
            hasJquery = await mainWindow.webContents.mainFrame.frames[0].executeJavaScript('typeof $ == \'function\'');
          }
          if (hasJquery) {
            mainWindow.webContents.mainFrame.frames[0].executeJavaScript(`eval(${JSON.stringify(onloaded)})`);
          }
        }
      }
    } catch (error) {
      console.error('Error in frame navigation completion:', error);
    }
  });
}

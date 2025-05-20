import { BrowserWindow } from "electron";
import { ctx } from "./context";
import { secureStore } from "./secure-store";

export function setupWindowStatePersistence(mainWindow: BrowserWindow): void {
  const onResizeOrMove = () => {
    if (mainWindow.isMaximized()) {
      ctx.windowState = { ...ctx.windowState, isMaximized: true };
    } else {
      ctx.windowState = { ...mainWindow.getBounds(), isMaximized: false };
    }
  };

  mainWindow.on('resize', onResizeOrMove);
  mainWindow.on('move', onResizeOrMove);

  // Sauvegarder la configuration de la fenêtre avant la fermeture
  mainWindow.on('close', () => {
    secureStore.set('windowState', ctx.windowState);
  }); 
}
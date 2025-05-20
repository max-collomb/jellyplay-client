import { session } from 'electron';
import { ctx } from './context';

export function setupBasicAuthHeaders(urls: string[]): void {
  // Intercepte les requêtes pour ajouter l'authentification HTTP basique
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls },
    (details, callback) => {
      if (!ctx.auth.username || !ctx.auth.password) {
        callback({ cancel: true });
        return;
      }
      const authCredentials = Buffer.from(`${ctx.auth.username}:${ctx.auth.password}`).toString('base64');
      details.requestHeaders['Authorization'] = `Basic ${authCredentials}`;
      callback({ requestHeaders: details.requestHeaders });
    }
  );
}
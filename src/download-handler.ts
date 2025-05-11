import { app, session, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import FormData from 'form-data';
import { ctx } from './context';


/**
 * Configure le gestionnaire de téléchargement pour Electron
 * @param mainWindow La fenêtre principale de l'application
 */
export function setupDownloadHandler(mainWindow: Electron.BrowserWindow): void {
  // Configurer le gestionnaire de téléchargement
  session.defaultSession.on('will-download', (event, item, _webContents) => {
    // Set the save path, making Electron not to prompt a save dialog.
    const filePath = path.join(app.getPath('temp'), item.getFilename());

    // Configurer le chemin de sauvegarde
    item.setSavePath(filePath);

    // Gestionnaire d'événement pour la fin du téléchargement
    item.once('done', async (event, state) => {
      if (state === 'completed' && filePath.toLowerCase().endsWith('.torrent') && ctx.uploadUrl) {
        console.log('Téléchargement complété: ' + filePath);

        try {
          // Lire le fichier
          const fileBytes = fs.readFileSync(filePath);

          // Créer les données du formulaire
          const formData = new FormData();
          formData.append('file', fileBytes, {
            filename: path.basename(filePath),
            contentType: 'application/x-bittorrent'
          });

          // Configurer les en-têtes avec l'authentification Basic
          const authHeader = Buffer.from(`${ctx.basicLogin}:${ctx.basicPassword}`).toString('base64');

          // Envoyer le fichier au serveur
          const response = await axios.post(ctx.uploadUrl, formData, {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Basic ${authHeader}`
            }
          });

          // Supprimer le fichier temporaire
          fs.unlinkSync(filePath);

          // Afficher un message de réussite ou d'échec
          if (response.status >= 200 && response.status < 300) {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Téléchargement',
              message: 'Téléchargement en cours dur la SeedBox...\nAller dans l\'onglet "Téléchargements" pour suivre la progression'
            });
          } else {
            dialog.showMessageBox(mainWindow, {
              type: 'error',
              title: 'Erreur',
              message: `Erreur du téléchargement. Code: ${response.status}`
            });
          }
        } catch (error) {
          console.error('Erreur lors de l\'envoi du fichier:', error);
          dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: 'Erreur',
            message: `Erreur lors de l'envoi du fichier: ${error.message}`
          });

          // Supprimer le fichier en cas d'erreur
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      }
    });
  });
}
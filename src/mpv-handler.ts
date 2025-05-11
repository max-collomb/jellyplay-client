import { spawn } from 'child_process';
import * as path from 'path';
import { MpvApi } from './mpv-api';

export function handleMpvUri(uri: string, basicLogin: string, basicPassword: string, executeJavaScript: (string) => void): Promise<void> {
  const match = uri.match(/mpv([s]{0,1}):\/\/(.*)\?pos=([0-9]*)(&hasSrt)?/);

  if (match) {
    const url = "http" + match[1] + "://" + match[2];
    const position = match[3].length > 0 ? parseInt(match[3], 10) : -1;
    const srtUrl = match[4]?.length > 0 ? url + ".srt" : "";

    console.log("url = " + url);
    console.log("position = " + position);

    // Déterminer le chemin de l'exécutable mpv
    const exeFilePath = path.dirname(__dirname); // le fichier courant est dans le dossier src / dist => on remonte d'un cran
    const mpvPath = path.join(exeFilePath, "mpv-binaries", "windows-x64", "mpv.exe");

    // Préparer les arguments
    const args = [
      url,
      `--http-header-fields=Authorization: Basic ${Buffer.from(basicLogin + ":" + basicPassword).toString('base64')}`,
      (position > -1) ? `--start=${position}` : "",
      srtUrl ? `--sub-file=${srtUrl}` : "",
      "--input-ipc-server=\\\\.\\pipe\\mpvsocket"
    ].filter(arg => arg !== ""); // Supprimer les arguments vides

    console.log(mpvPath + " " + args.join(" "));
    executeJavaScript(`console.log(${JSON.stringify(mpvPath + " " + args.join(" "))});`);

    try {
      // Lancer mpv
      const proc = spawn(mpvPath, args, {
        // windowsHide: true,
        // stdio: 'ignore'
      });

      const mpvApi = new MpvApi((position) => {
        // Utilisez le mécanisme approprié pour mettre à jour votre webView
        executeJavaScript(`window._setPosition(${position});`);
      });

      // Démarrer le polling
      mpvApi.startPolling();

      // Attendre que le processus se termine
      return new Promise<void>((resolve) => {
        proc.on('exit', (code) => {
          executeJavaScript(`window._exited(); console.log("exited with code ${code}");`);
          resolve();
        });
      });
    } catch (error) {
      console.error("Error spawning mpv:", error);
    }
  }
}
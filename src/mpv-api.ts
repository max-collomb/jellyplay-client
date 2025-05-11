import * as net from 'net';

export class MpvApi {
  private onPositionChanged: (position: number) => void;
  private isPolling: boolean = false;
  private client: net.Socket | null = null;

  constructor(onPositionChanged: (position: number) => void) {
    this.onPositionChanged = onPositionChanged;
  }

  public startPolling(): void {
    this.isPolling = true;
    this.pollPlaybackTime();
  }

  public stopPolling(): void {
    this.isPolling = false;
    if (this.client) {
      this.client.end();
      this.client.destroy();
    }
  }

  private pollPlaybackTime(): void {
    // Attendre un peu que mpv crée le pipe
    setTimeout(() => {
      this.connectAndPoll();
    }, 500);
  }

  private connectAndPoll(): void {
    try {
      // Pour Windows, on utilise un pipe nommé
      this.client = net.connect('\\\\.\\pipe\\mpvsocket');

      let buffer = '';
      let requestId = 1;

      this.client.on('connect', () => {
        console.log('Connected to mpv socket');
        this.sendCommand(requestId);
      });

      this.client.on('data', (data) => {
        if (!this.isPolling) return;

        buffer += data.toString();

        // Traiter chaque ligne complète reçue
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Garder la dernière ligne incomplète dans le buffer

        for (const line of lines) {
          if (line.trim()) {
            this.processResponse(line, requestId);
          }
        }

        // Planifier la prochaine requête
        setTimeout(() => {
          requestId++;
          this.sendCommand(requestId);
        }, 3000);
      });

      this.client.on('error', (err) => {
        console.error('Socket error:', err);
        // this.reconnect();
      });

      this.client.on('close', () => {
        console.log('Socket closed');
        // this.reconnect();
      });
    } catch (error) {
      console.error('Failed to connect to mpv socket:', error);
      // this.reconnect();
    }
  }

  private sendCommand(requestId: number): void {
    if (!this.client || !this.isPolling) return;

    try {
      const command = JSON.stringify({
        command: ["get_property_string", "playback-time"],
        request_id: requestId
      }) + '\n';

      this.client.write(command);
    } catch (error) {
      console.error('Error sending command:', error);
    }
  }

  private processResponse(response: string, requestId: number): void {
    try {
      const data = JSON.parse(response);

      if (data.request_id === requestId && data.error === 'success' && data.data) {
        const position = Math.floor(parseFloat(data.data));
        if (position > 0) {
          this.onPositionChanged(position);
        }
      }
    } catch (error) {
      console.error('Error processing response:', error);
    }
  }

  private reconnect(): void {
    if (!this.isPolling) return;

    // Nettoyer l'ancienne connexion
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end();
      this.client.destroy();
      this.client = null;
    }

    // Attendre avant de reconnecter
    setTimeout(() => {
      if (this.isPolling) {
        this.connectAndPoll();
      }
    }, 2000);
  }
}
import * as net from 'net';

export class MpvApi {
  private onPositionChanged: (position: number) => void;
  private isPolling: boolean = false;
  private client: net.Socket | null = null;
  private timer: NodeJS.Timeout | null = null;
  private requestId: number = 1;

  constructor(onPositionChanged: (position: number) => void) {
    this.onPositionChanged = onPositionChanged;
    setTimeout(this.pollPlaybackTime.bind(this), 3000);
  }

  private clear(): void {
    if (this.timer)
      clearInterval(this.timer);
    if (this.client) {
      this.client.removeAllListeners();
      this.client.end();
      this.client.destroy();
      this.client = null;
    }
  }

  public pollPlaybackTime(): void {
    try {
      this.isPolling = true;
      this.client = net.connect('\\\\.\\pipe\\mpvsocket'); // Pour Windows, on utilise un pipe nommé
      
      this.client.on('connect', () => {
        this.timer = setInterval(() => {
          if (!this.client || !this.isPolling) return;
          try {
            this.requestId++;
            const command = JSON.stringify({ command: ["get_property_string", "playback-time"], request_id: this.requestId }) + '\n';
            this.client.write(command);
          } catch (error) {
            console.error('Error sending command:', error);
          }      
        }, 3000);
      });

      this.client.on('data', (data) => {
        if (!this.isPolling) return;
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (data.request_id === this.requestId && data.error === 'success' && data.data) {
                const position = Math.floor(parseFloat(data.data));
                if (position > 0) {
                  this.onPositionChanged(position);
                }
              }
            } catch (error) {
              console.error('Error processing response:', error);
            }
          }
        }
      });

      this.client.on('error', () => this.clear());
      this.client.on('close', () => this.clear());
    } catch (error) {
      console.error('Failed to connect to mpv socket:', error);
      this.clear();
    }
  }

}
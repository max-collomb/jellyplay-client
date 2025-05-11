export class ConnectionManager {
  private _localAddress: string;
  private _publicAddress: string;

  constructor(localAddress: string, publicAddress: string) {
    this._localAddress = localAddress;
    this._publicAddress = publicAddress;
  }

  public async getOptimalServerUrl(): Promise<string> {
    if (await this.isServerReachable(this._localAddress)) {
      return this._localAddress;
    }
    return this._publicAddress;
  }

  private async isServerReachable(url: string): Promise<boolean> {
    try {
      const uri = new URL(url);
      const host = uri.hostname;
      const port = uri.port ? parseInt(uri.port) : (uri.protocol === 'https:' ? 443 : 80);

      // En TypeScript/JavaScript, nous n'avons pas d'équivalent direct pour TcpClient
      // Nous utilisons donc un fetch avec un AbortController pour gérer le timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1 seconde timeout

      try {
        // Tentative de connexion
        await fetch(url, {
          method: 'HEAD',
          signal: controller.signal
        });

        // Si on arrive ici, la connexion a réussi
        clearTimeout(timeoutId);
        return true;
      } catch (error) {
        clearTimeout(timeoutId);

        // Si l'erreur est due à notre propre abort, le serveur n'est pas atteignable dans le délai
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log(`Connection timed out for ${url}`);
          return false;
        }

        // Pour les autres erreurs, on suppose également que le serveur n'est pas atteignable
        throw error;
      }
    } catch (error) {
      console.log(`Connection test failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}

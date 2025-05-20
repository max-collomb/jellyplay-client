import Store from 'electron-store';
import { SecureStore } from './types';

export const secureStore = new Store({
  name: 'auth-config',
  encryptionKey: 'UniqueK3y4Auth',
  clearInvalidConfig: true
}) as unknown as SecureStore;



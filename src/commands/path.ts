import { getStoragePath, isGlobalStorage } from '../utils/storage.js';
import { info } from '../utils/cli.js';

export async function pathCommand(): Promise<void> {
  const storagePath = await getStoragePath();
  const isGlobal = await isGlobalStorage();

  console.log(`\nCurrent storage path: ${storagePath}`);
  info(isGlobal ? 'Using global storage' : 'Using local storage');
}

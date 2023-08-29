import path from 'path';
import { fileURLToPath } from 'node:url';

export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');
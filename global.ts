import path from 'path';
import { fileURLToPath } from 'node:url';

export const cliPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '../');

const __filenameNew = fileURLToPath(import.meta.url);

export const __dirnameNew = path.dirname(__filenameNew);
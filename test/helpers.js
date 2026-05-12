import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function fixturePath(filename) {
  return path.join(__dirname, 'fixtures', filename);
}

export async function readFixture(filename) {
  return readFile(fixturePath(filename), 'utf8');
}

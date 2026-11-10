import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const roots = ['api/src', 'api/test', 'api/scripts', 'api/shared/src', 'web/src'];
const extensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.css']);
const skipped = new Set(['node_modules', 'dist', '.next', 'coverage', '.nest', '.swc']);
const violations = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (skipped.has(entry.name)) continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(file);
    } else if (entry.isFile() && extensions.has(path.extname(entry.name))) {
      const content = await readFile(file, 'utf8');
      const lines = content.split(/\r?\n/).length - Number(content.endsWith('\n'));
      if (lines > 200) violations.push(`${file}: ${lines} líneas`);
    }
  }
}

for (const root of roots) await inspect(root);
if (violations.length) {
  process.stderr.write(`${violations.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write('Todos los archivos de código tienen 200 líneas o menos.\n');
}

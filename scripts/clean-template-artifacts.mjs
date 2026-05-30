import fs from 'node:fs/promises';
import path from 'node:path';

const templateRoot = path.resolve('templates/base');
const directArtifacts = [
  'apps/api/tmp/cache',
  'apps/api/tmp/local_secret.txt',
  'apps/web/dist',
  'packages/types/dist',
  'packages/types/node_modules/.cache',
];

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function removeIfExists(filePath) {
  await fs.rm(filePath, { recursive: true, force: true });
}

async function removeNestedNodeModules(directory) {
  if (!(await pathExists(directory))) return;

  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory() && entry.name === 'node_modules') {
      await removeIfExists(entryPath);
      continue;
    }

    if (entry.isDirectory()) {
      await removeNestedNodeModules(entryPath);
    }
  }
}

async function truncateLogs() {
  const logDir = path.join(templateRoot, 'apps/api/log');
  if (!(await pathExists(logDir))) return;

  const entries = await fs.readdir(logDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
      .map((entry) => fs.rm(path.join(logDir, entry.name), { force: true }))
  );
}

await removeNestedNodeModules(templateRoot);
await Promise.all(directArtifacts.map((artifact) => removeIfExists(path.join(templateRoot, artifact))));
await truncateLogs();

import assert from 'node:assert/strict';
import fs from 'fs-extra';
import os from 'node:os';
import path from 'node:path';
import { generateLoomRailsApp, validateProjectName, type DatabaseAdapter } from './generator';

const combinations = [
  { includeWeb: true, includeMobile: true, database: 'postgresql', includeKamal: true },
  { includeWeb: true, includeMobile: true, database: 'postgresql', includeKamal: false },
  { includeWeb: true, includeMobile: true, database: 'sqlite3', includeKamal: true },
  { includeWeb: false, includeMobile: true, database: 'sqlite3', includeKamal: false },
  { includeWeb: true, includeMobile: false, database: 'postgresql', includeKamal: true },
  { includeWeb: false, includeMobile: false, database: 'postgresql', includeKamal: false },
  { includeWeb: true, includeMobile: false, database: 'sqlite3', includeKamal: true },
  { includeWeb: false, includeMobile: false, database: 'sqlite3', includeKamal: false },
] satisfies Array<{
  includeWeb: boolean;
  includeMobile: boolean;
  database: DatabaseAdapter;
  includeKamal: boolean;
}>;

async function assertPathExists(filePath: string) {
  assert.equal(await fs.pathExists(filePath), true, `Expected path to exist: ${filePath}`);
}

async function assertPathMissing(filePath: string) {
  assert.equal(await fs.pathExists(filePath), false, `Expected path to be missing: ${filePath}`);
}

async function testProjectNameValidation() {
  assert.equal(validateProjectName('my-app'), 'my-app');
  assert.throws(() => validateProjectName(''), /Project name is required/);
  assert.throws(() => validateProjectName('../escape'), /may only contain/);
  assert.throws(() => validateProjectName('my app'), /may only contain/);
}

async function testNonEmptyTargetThrows(tmpRoot: string) {
  const targetDirectory = path.join(tmpRoot, 'non-empty');
  await fs.ensureDir(targetDirectory);
  await fs.writeFile(path.join(targetDirectory, 'existing.txt'), 'already here');

  let exitCalled = false;
  const originalExit = process.exit;
  (process as NodeJS.Process & { exit: (code?: number) => never }).exit = ((code?: number) => {
    exitCalled = true;
    throw new Error(`process.exit(${code}) called`);
  }) as NodeJS.Process['exit'];

  try {
    await assert.rejects(
      () =>
        generateLoomRailsApp({
          projectName: 'non-empty',
          targetDirectory,
          installDependencies: false,
          initializeGit: false,
          quiet: true,
        }),
      /Target directory is not empty/
    );
    assert.equal(exitCalled, false, 'generateLoomRailsApp should throw instead of calling process.exit');
  } finally {
    process.exit = originalExit;
  }
}

async function testScaffoldCombination(tmpRoot: string, index: number, options: (typeof combinations)[number]) {
  const projectName = `case-${index}`;
  const targetDirectory = path.join(tmpRoot, projectName);

  await generateLoomRailsApp({
    projectName,
    targetDirectory,
    ...options,
    installDependencies: false,
    initializeGit: false,
    quiet: true,
  });

  await assertPathExists(path.join(targetDirectory, 'package.json'));
  await assertPathExists(path.join(targetDirectory, '.github/workflows/ci.yml'));
  await assertPathMissing(path.join(targetDirectory, 'apps/api/.github'));
  await assertPathMissing(path.join(targetDirectory, 'node_modules'));
  await assertPathMissing(path.join(targetDirectory, '.git'));

  const packageJson = await fs.readJson(path.join(targetDirectory, 'package.json'));
  assert.equal(packageJson.name, projectName);

  const routes = await fs.readFile(path.join(targetDirectory, 'apps/api/config/routes.rb'), 'utf8');
  assert.match(routes, /scope "\/api\/v1"/);

  const authConcern = await fs.readFile(
    path.join(targetDirectory, 'apps/api/app/controllers/concerns/authentication.rb'),
    'utf8'
  );
  assert.doesNotMatch(authConcern, /fallback_secret/);

  const gemfile = await fs.readFile(path.join(targetDirectory, 'apps/api/Gemfile'), 'utf8');
  const databaseYml = await fs.readFile(path.join(targetDirectory, 'apps/api/config/database.yml'), 'utf8');
  if (options.database === 'sqlite3') {
    assert.match(gemfile, /gem "sqlite3"/);
    assert.match(databaseYml, /adapter: sqlite3/);
    await assertPathMissing(path.join(targetDirectory, 'apps/api/Gemfile.lock'));
  } else {
    assert.match(gemfile, /gem "pg"/);
    assert.match(databaseYml, /adapter: postgresql/);
    await assertPathExists(path.join(targetDirectory, 'apps/api/Gemfile.lock'));
  }

  if (options.includeMobile) {
    await assertPathExists(path.join(targetDirectory, 'apps/mobile/package.json'));
  } else {
    await assertPathMissing(path.join(targetDirectory, 'apps/mobile'));
  }

  if (options.includeWeb) {
    await assertPathExists(path.join(targetDirectory, 'apps/web/package.json'));
  } else {
    await assertPathMissing(path.join(targetDirectory, 'apps/web'));
  }

  if (options.includeKamal) {
    await assertPathExists(path.join(targetDirectory, 'apps/api/Dockerfile'));
    await assertPathExists(path.join(targetDirectory, 'apps/api/config/deploy.yml'));
  } else {
    await assertPathMissing(path.join(targetDirectory, 'apps/api/Dockerfile'));
    await assertPathMissing(path.join(targetDirectory, 'apps/api/config/deploy.yml'));
  }
}

async function run() {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'loomrails-tests-'));

  try {
    await testProjectNameValidation();
    await testNonEmptyTargetThrows(tmpRoot);

    for (const [index, options] of combinations.entries()) {
      await testScaffoldCombination(tmpRoot, index + 1, options);
    }
  } finally {
    await fs.remove(tmpRoot);
  }

  console.log(`Scaffold tests passed for ${combinations.length} option combinations.`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

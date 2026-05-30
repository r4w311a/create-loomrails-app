import * as p from '@clack/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { generateLoomRailsApp, validateProjectName, type DatabaseAdapter } from './generator';
import { runDoctor } from './doctor';

const program = new Command();

interface CliOptions {
  yes?: boolean;
  web?: boolean;
  mobile?: boolean;
  database?: DatabaseAdapter;
  dbUser?: string;
  dbPassword?: string;
  dbPort?: string;
  kamal?: boolean;
  install?: boolean;
  git?: boolean;
}

function cancel() {
  p.cancel('Operation cancelled.');
  process.exit(0);
}

function parseDatabase(value: string): DatabaseAdapter {
  if (value !== 'postgresql' && value !== 'sqlite3') {
    throw new Error('Database must be either "postgresql" or "sqlite3".');
  }

  return value;
}

function ensurePromptValue<T>(value: T | symbol): T {
  if (p.isCancel(value)) cancel();
  return value as T;
}

async function resolveProject(projectNameArg: string | undefined, options: CliOptions) {
  const useDefaults = options.yes ?? false;

  const projectName = projectNameArg
    ? validateProjectName(projectNameArg)
    : useDefaults
      ? 'my-loomrails-app'
      : validateProjectName(
          ensurePromptValue(
            await p.text({
              message: 'What is your project named?',
              initialValue: 'my-loomrails-app',
              validate: (value) => {
                try {
                  validateProjectName(value ?? '');
                } catch (error) {
                  return error instanceof Error ? error.message : 'Invalid project name.';
                }
              },
            })
          )
        );

  const includeWeb = options.web ?? (useDefaults
    ? true
    : ensurePromptValue(
        await p.confirm({
          message: 'Include Web Application (React/Vite SPA)?',
          initialValue: true,
        })
      ));

  const includeMobile = options.mobile ?? (useDefaults
    ? true
    : ensurePromptValue(
        await p.confirm({
          message: 'Include Mobile Application (React Native/Expo)?',
          initialValue: true,
        })
      ));

  const database = options.database ?? (useDefaults
    ? 'postgresql'
    : ensurePromptValue(
        await p.select({
          message: 'Which database would you like to use for the Rails API?',
          options: [
            { value: 'postgresql', label: 'PostgreSQL' },
            { value: 'sqlite3', label: 'SQLite' },
          ],
          initialValue: 'postgresql',
        })
      ));

  let dbUser, dbPassword, dbPort;
  if (database === 'postgresql') {
    dbUser = options.dbUser ?? (useDefaults ? 'postgres' : ensurePromptValue(
      await p.text({ message: 'PostgreSQL username?', initialValue: 'postgres' })
    ));
    dbPassword = options.dbPassword ?? (useDefaults ? 'postgres' : ensurePromptValue(
      await p.text({ message: 'PostgreSQL password?', initialValue: 'postgres' })
    ));
    dbPort = options.dbPort ?? (useDefaults ? '5432' : ensurePromptValue(
      await p.text({ message: 'PostgreSQL port?', initialValue: '5432' })
    ));
  }

  const includeKamal = options.kamal ?? (useDefaults
    ? true
    : ensurePromptValue(
        await p.confirm({
          message: 'Include Kamal Infrastructure for deployment?',
          initialValue: true,
        })
      ));

  return {
    projectName,
    includeWeb,
    includeMobile,
    database: parseDatabase(database),
    dbUser,
    dbPassword,
    dbPort,
    includeKamal,
    installDependencies: options.install ?? true,
    initializeGit: options.git ?? true,
  };
}

program
  .name('create-loomrails-app')
  .description('Interactive and scriptable CLI to scaffold a LoomRails monorepo.')
  .version('1.0.5')
  .argument('[project-name]', 'The name of your new LoomRails project');

program
  .command('doctor')
  .description('Check local LoomRails development prerequisites and generated app health.')
  .action(async () => {
    const ok = await runDoctor();
    process.exitCode = ok ? 0 : 1;
  });

program
  .option('-y, --yes', 'Use default answers for prompts.')
  .option('--web', 'Include the React/Vite web app.')
  .option('--no-web', 'Skip the React/Vite web app.')
  .option('--mobile', 'Include the Expo React Native mobile app.')
  .option('--no-mobile', 'Skip the Expo React Native mobile app.')
  .option('--database <database>', 'Choose the Rails database: postgresql or sqlite3.', parseDatabase)
  .option('--db-user <user>', 'PostgreSQL username.')
  .option('--db-password <password>', 'PostgreSQL password.')
  .option('--db-port <port>', 'PostgreSQL port.')
  .option('--kamal', 'Include Kamal deployment files.')
  .option('--no-kamal', 'Skip Kamal deployment files.')
  .option('--install', 'Install pnpm and Ruby dependencies after scaffolding.')
  .option('--no-install', 'Skip dependency installation.')
  .option('--git', 'Initialize a git repository and initial commit.')
  .option('--no-git', 'Skip git initialization.')
  .action(async (projectNameArg: string | undefined, options: CliOptions) => {
    console.log();
    p.intro(
      pc.magenta(
        `\n  _                              _____       _ _     \n | |    ___  ___  _ __ ___      |  __ \\     (_) |    \n | |   / _ \\/ _ \\| '_ \` _ \\     | |__) |__ _ _| |___ \n | |  | (_) | (_) | | | | | |    |  _  // _\` | | / __|\n | |___\\___/ \\___/|_| |_| |_|    | | \\ \\ (_| | | \\__ \\\n |______\\___/ \\___/|_| |_| |_|    |_|  \\_\\__,_|_|_|___/\n`
      ) +
      '\n\n' +
      pc.bgCyan(pc.black(' CREATE-LOOMRAILS-APP '))
    );

    const project = await resolveProject(projectNameArg, options);

    await generateLoomRailsApp(project);

    p.note(
      `1. cd ${project.projectName}\n2. ${options.install === false ? 'pnpm install\n3. ' : ''}pnpm dev`,
      'Next Steps'
    );
    p.outro(pc.green(`💎 Project ${project.projectName} created successfully! 🚀`));
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  p.log.error(pc.red(message));
  process.exitCode = 1;
});

export { generateLoomRailsApp };

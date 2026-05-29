import * as p from '@clack/prompts';
import { Command } from 'commander';
import pc from 'picocolors';
import { generateLoomRailsApp } from './generator';

const program = new Command();

program
  .name('create-loomrails-app')
  .description('Interactive CLI to scaffold the LoomRails monorepo starter kit.')
  .version('1.0.0')
  .argument('[project-name]', 'The name of your new LoomRails project')
  .action(async (projectNameArgs) => {
    p.intro(pc.bgCyan(pc.black(' create-loomrails-app ')));

    const project = await p.group(
      {
        projectName: () =>
          p.text({
            message: 'What is your project named?',
            initialValue: projectNameArgs || 'my-loomrails-app',
            validate: (value) => {
              if (!value || value.trim().length === 0) return 'Project name is required!';
            },
          }),
        includeMobile: () =>
          p.confirm({
            message: 'Include Mobile Application (React Native/Expo)?',
            initialValue: true,
          }),
        database: () =>
          p.select({
            message: 'Which database would you like to use for the Rails API?',
            options: [
              { value: 'postgresql', label: 'PostgreSQL (Production ready)' },
              { value: 'sqlite3', label: 'SQLite (Quick prototyping)' },
            ],
            initialValue: 'postgresql',
          }),
        includeKamal: () =>
          p.confirm({
            message: 'Include Kamal Infrastructure for deployment?',
            initialValue: true,
          }),
      },
      {
        onCancel: () => {
          p.cancel('Operation cancelled.');
          process.exit(0);
        },
      }
    );

    await generateLoomRailsApp(project);

    p.outro(pc.green(`✅ Project ${project.projectName} created successfully!`));
  });

program.parse(process.argv);

export { generateLoomRailsApp };

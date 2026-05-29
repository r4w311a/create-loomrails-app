import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import * as p from '@clack/prompts';
import pc from 'picocolors';

export interface ProjectOptions {
  projectName: string;
  includeMobile: boolean;
  database: string;
  includeKamal: boolean;
}

export async function generateLoomRailsApp(options: ProjectOptions) {
  const targetDir = path.resolve(process.cwd(), options.projectName);

  const s = p.spinner();

  try {
    s.start('Copying base templates...');
    
    // In production, the templates directory will be relative to the built JS file.
    // For now, assuming we run it locally where templates is in the root.
    const templateDir = path.resolve(__dirname, '../templates/base');
    
    await fs.copy(templateDir, targetDir);

    // If mobile is not included, we need to remove the apps/mobile directory
    if (!options.includeMobile) {
      await fs.remove(path.join(targetDir, 'apps/mobile'));
      // We would also need to strip mobile from pnpm-workspace.yaml, but for now we'll just delete the folder
    }

    // Rewrite package.json name to match project
    const pkgJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(pkgJsonPath)) {
      const pkg = await fs.readJson(pkgJsonPath);
      pkg.name = options.projectName;
      await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
    }

    s.stop('Base templates copied!');

    // Type-Sync Pipeline and Dependency Resolution
    s.start('Installing dependencies via pnpm (this may take a minute)...');
    await execa('pnpm', ['install'], { cwd: targetDir });
    s.stop('Dependencies installed!');

    // Initialize git
    s.start('Initializing Git repository...');
    await execa('git', ['init'], { cwd: targetDir });
    await execa('git', ['add', '.'], { cwd: targetDir });
    await execa('git', ['commit', '-m', 'chore: initial commit from create-loomrails-app'], { cwd: targetDir });
    s.stop('Git initialized!');

  } catch (error: any) {
    s.stop('Error occurred during scaffolding!');
    p.log.error(pc.red(error.message));
    process.exit(1);
  }
}

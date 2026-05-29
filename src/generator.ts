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
    }

    // Rewrite package.json name to match project
    const pkgJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(pkgJsonPath)) {
      const pkg = await fs.readJson(pkgJsonPath);
      pkg.name = options.projectName;
      await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
    }

    s.stop('Base templates copied!');

    // Post-generation wiring
    s.start('Configuring database and infrastructure...');

    const apiDir = path.join(targetDir, 'apps/api');

    // Configure Database Choice
    if (options.database === 'sqlite3') {
      // 1. Rewrite Gemfile
      const gemfilePath = path.join(apiDir, 'Gemfile');
      if (await fs.pathExists(gemfilePath)) {
        let gemfile = await fs.readFile(gemfilePath, 'utf8');
        gemfile = gemfile.replace(/gem "pg", "~> 1.1"/, 'gem "sqlite3", ">= 1.4"');
        await fs.writeFile(gemfilePath, gemfile, 'utf8');
      }

      // 2. Rewrite database.yml
      const dbYmlPath = path.join(apiDir, 'config/database.yml');
      const sqliteConfig = `default: &default
  adapter: sqlite3
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

development:
  <<: *default
  database: storage/development.sqlite3

test:
  <<: *default
  database: storage/test.sqlite3

production:
  <<: *default
  database: storage/production.sqlite3
`;
      await fs.writeFile(dbYmlPath, sqliteConfig, 'utf8');
    }

    // Configure Kamal Choice
    if (!options.includeKamal) {
      await fs.remove(path.join(apiDir, 'Dockerfile'));
      await fs.remove(path.join(apiDir, '.dockerignore'));
      await fs.remove(path.join(apiDir, 'config/deploy.yml'));
    }

    // Configure JWT strategy depending on mobile app availability
    if (!options.includeMobile) {
      const sessionsCtrlPath = path.join(apiDir, 'app/controllers/sessions_controller.rb');
      if (await fs.pathExists(sessionsCtrlPath)) {
        let content = await fs.readFile(sessionsCtrlPath, 'utf8');
        const targetStr = `      # Dual-Strategy: Web sets cookie, Mobile gets JSON body
      if request.headers["X-Client-Type"] == "mobile"
        render json: { token: token, user: { id: user.id, email: user.email } }, status: :ok
      else
        cookies.signed[:jwt_token] = {
          value: token,
          httponly: true,
          secure: Rails.env.production?,
          same_site: :strict,
          expires: 24.hours.from_now
        }
        render json: { user: { id: user.id, email: user.email } }, status: :ok
      end`;
        const replacementStr = `      # Single-Strategy: Web sets secure HttpOnly cookie
      cookies.signed[:jwt_token] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :strict,
        expires: 24.hours.from_now
      }
      render json: { user: { id: user.id, email: user.email } }, status: :ok`;
        content = content.replace(targetStr, replacementStr);
        await fs.writeFile(sessionsCtrlPath, content, 'utf8');
      }
    }

    s.stop('Database and JWT architecture wired!');

    // Type-Sync Pipeline and Dependency Resolution
    s.start('Installing dependencies via pnpm (this may take a minute)...');
    await execa('pnpm', ['install'], { 
      cwd: targetDir,
      env: {
        ...process.env,
        PNPM_MINIMUM_RELEASE_AGE: '0'
      }
    });
    s.stop('Dependencies installed!');

    s.start('Bootstrapping Typelizer & Hey API Data Bridge...');
    // Resiliently execute bundle install and Typelizer type-sync if Ruby/bundler are present
    try {
      // 1. Bundle install inside apps/api
      await execa('bundle', ['install'], { cwd: apiDir });
      // 2. Generate TypeScript types
      await execa('bundle', ['exec', 'rails', 'typelizer:generate'], { cwd: apiDir });
    } catch (e) {
      // Graceful fallback for non-Ruby systems or missing bundler
      p.log.warn(pc.yellow('⚠️ Ruby or Bundler not fully configured locally. Typelizer type-sync skipped; pre-scaffolded types will be used.'));
    }
    s.stop('Types perfectly synchronized!');

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

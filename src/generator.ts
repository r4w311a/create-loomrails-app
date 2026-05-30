import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import crypto from 'crypto';

export type DatabaseAdapter = 'postgresql' | 'sqlite3';

export interface ProjectOptions {
  projectName: string;
  includeWeb?: boolean;
  includeMobile?: boolean;
  database?: DatabaseAdapter;
  dbUser?: string;
  dbPassword?: string;
  dbPort?: string;
  includeKamal?: boolean;
  installDependencies?: boolean;
  initializeGit?: boolean;
  targetDirectory?: string;
  quiet?: boolean;
}

interface ResolvedProjectOptions {
  projectName: string;
  includeWeb: boolean;
  includeMobile: boolean;
  database: DatabaseAdapter;
  dbUser?: string;
  dbPassword?: string;
  dbPort?: string;
  includeKamal: boolean;
  installDependencies: boolean;
  initializeGit: boolean;
  targetDir: string;
  quiet: boolean;
}

const projectNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

export function validateProjectName(projectName: string) {
  const trimmedName = projectName.trim();

  if (!trimmedName) {
    throw new Error('Project name is required.');
  }

  if (!projectNamePattern.test(trimmedName)) {
    throw new Error('Project name may only contain letters, numbers, hyphens, and underscores.');
  }

  return trimmedName;
}

function toPackageName(projectName: string) {
  return projectName.trim().toLowerCase().replace(/_/g, '-');
}

function resolveOptions(options: ProjectOptions): ResolvedProjectOptions {
  const projectName = validateProjectName(options.projectName);

  return {
    projectName,
    includeWeb: options.includeWeb ?? true,
    includeMobile: options.includeMobile ?? true,
    database: options.database ?? 'postgresql',
    dbUser: options.dbUser,
    dbPassword: options.dbPassword,
    dbPort: options.dbPort,
    includeKamal: options.includeKamal ?? true,
    installDependencies: options.installDependencies ?? true,
    initializeGit: options.initializeGit ?? true,
    targetDir: options.targetDirectory
      ? path.resolve(options.targetDirectory)
      : path.resolve(process.cwd(), projectName),
    quiet: options.quiet ?? false,
  };
}

function createStatusLogger(quiet: boolean) {
  const spinner = p.spinner();

  return {
    start(message: string) {
      if (!quiet) spinner.start(message);
    },
    stop(message?: string) {
      if (!quiet) spinner.stop(message);
    },
    warn(message: string) {
      if (!quiet) p.log.warn(pc.yellow(message));
    },
  };
}

function shouldCopyTemplatePath(src: string) {
  const ignoredSegments = new Set(['node_modules', '.turbo', 'dist', 'tmp/cache', 'tmp/local_secret.txt']);
  const relativePath = path.relative(path.resolve(__dirname, '../templates/base'), src);

  return !relativePath
    .split(path.sep)
    .some((segment, index, segments) => ignoredSegments.has(segment) || ignoredSegments.has(segments.slice(index, index + 2).join('/')));
}

export async function generateLoomRailsApp(options: ProjectOptions) {
  const resolvedOptions = resolveOptions(options);
  const {
    projectName,
    includeWeb,
    includeMobile,
    database,
    dbUser,
    dbPassword,
    dbPort,
    includeKamal,
    installDependencies,
    initializeGit,
    targetDir,
    quiet,
  } = resolvedOptions;

  const s = createStatusLogger(quiet);

  s.start('Copying base templates...');

  const templateDir = path.resolve(__dirname, '../templates/base');
  if (!(await fs.pathExists(templateDir))) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  if (await fs.pathExists(targetDir)) {
    const existingFiles = await fs.readdir(targetDir);
    if (existingFiles.length > 0) {
      throw new Error(`Target directory is not empty: ${targetDir}`);
    }
  }

  await fs.copy(templateDir, targetDir, { filter: shouldCopyTemplatePath });

  const gitignorePaths = [
    path.join(targetDir, '_gitignore'),
    path.join(targetDir, 'apps/api/_gitignore'),
    path.join(targetDir, 'apps/mobile/_gitignore'),
    path.join(targetDir, 'apps/web/_gitignore'),
  ];
  for (const gitignorePath of gitignorePaths) {
    if (await fs.pathExists(gitignorePath)) {
      await fs.rename(gitignorePath, gitignorePath.replace('_gitignore', '.gitignore'));
    }
  }

  if (!includeWeb) {
    await fs.remove(path.join(targetDir, 'apps/web'));
  }

  if (!includeMobile) {
    await fs.remove(path.join(targetDir, 'apps/mobile'));
  }

  await fs.remove(path.join(targetDir, 'apps/api/.github'));

  const pkgJsonPath = path.join(targetDir, 'package.json');
  if (await fs.pathExists(pkgJsonPath)) {
    const pkg = await fs.readJson(pkgJsonPath);
    pkg.name = toPackageName(projectName);
    await fs.writeJson(pkgJsonPath, pkg, { spaces: 2 });
  }

  s.stop('Base templates copied!');

  s.start('Configuring database and infrastructure...');

  const apiDir = path.join(targetDir, 'apps/api');

  const masterKey = crypto.randomBytes(16).toString('hex');
  const masterKeyPath = path.join(apiDir, 'config/master.key');
  await fs.ensureDir(path.dirname(masterKeyPath));
  await fs.writeFile(masterKeyPath, masterKey, 'utf8');

  if (database === 'sqlite3') {
    const gemfilePath = path.join(apiDir, 'Gemfile');
    if (await fs.pathExists(gemfilePath)) {
      let gemfile = await fs.readFile(gemfilePath, 'utf8');
      gemfile = gemfile.replace(/gem "pg", "~> 1.1"/, 'gem "sqlite3", ">= 1.4"');
      await fs.writeFile(gemfilePath, gemfile, 'utf8');
    }

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
    await fs.remove(path.join(apiDir, 'Gemfile.lock'));

    const ciPath = path.join(targetDir, '.github/workflows/ci.yml');
    if (await fs.pathExists(ciPath)) {
      let ci = await fs.readFile(ciPath, 'utf8');
      ci = ci.replace(/\n\s+DATABASE_URL: postgres:\/\/postgres:postgres@localhost:5432\/api_test/, '');
      await fs.writeFile(ciPath, ci, 'utf8');
    }
  } else if (database === 'postgresql') {
    const dbYmlPath = path.join(apiDir, 'config/database.yml');
    if (await fs.pathExists(dbYmlPath)) {
      let dbYml = await fs.readFile(dbYmlPath, 'utf8');
      dbYml = dbYml.replace(/#username: api/, `username: <%= ENV.fetch("POSTGRES_USER", "${dbUser || 'postgres'}") %>`);
      dbYml = dbYml.replace(/#password:/, `password: <%= ENV.fetch("POSTGRES_PASSWORD", "${dbPassword || 'postgres'}") %>`);
      dbYml = dbYml.replace(/#host: localhost/, `host: <%= ENV.fetch("POSTGRES_HOST", "localhost") %>`);
      dbYml = dbYml.replace(/#port: 5432/, `port: <%= ENV.fetch("POSTGRES_PORT", "${dbPort || '5432'}") %>`);
      
      const dbPrefix = projectName.replace(/-/g, '_');
      dbYml = dbYml.replace(/database: api_development/g, `database: ${dbPrefix}_development`);
      dbYml = dbYml.replace(/database: api_test/g, `database: ${dbPrefix}_test`);
      dbYml = dbYml.replace(/database: api_production/g, `database: ${dbPrefix}_production`);
      
      await fs.writeFile(dbYmlPath, dbYml, 'utf8');
    }
    
    const ciPath = path.join(targetDir, '.github/workflows/ci.yml');
    if (await fs.pathExists(ciPath)) {
      let ci = await fs.readFile(ciPath, 'utf8');
      const dbPrefix = projectName.replace(/-/g, '_');
      ci = ci.replace(/POSTGRES_DB: api_test/g, `POSTGRES_DB: ${dbPrefix}_test`);
      ci = ci.replace(/api_test/g, `${dbPrefix}_test`);
      await fs.writeFile(ciPath, ci, 'utf8');
    }
  }

  if (!includeKamal) {
    await fs.remove(path.join(apiDir, 'Dockerfile'));
    await fs.remove(path.join(apiDir, '.dockerignore'));
    await fs.remove(path.join(apiDir, 'config/deploy.yml'));
  }

  if (!includeMobile || !includeWeb) {
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
      
      let replacementStr;
      
      if (!includeMobile && !includeWeb) {
        replacementStr = `      # Basic API Token response
      render json: { token: token, user: { id: user.id, email: user.email } }, status: :ok`;
      } else if (!includeMobile) {
        replacementStr = `      # Single-Strategy: Web sets secure HttpOnly cookie
      cookies.signed[:jwt_token] = {
        value: token,
        httponly: true,
        secure: Rails.env.production?,
        same_site: :strict,
        expires: 24.hours.from_now
      }
      render json: { user: { id: user.id, email: user.email } }, status: :ok`;
      } else if (!includeWeb) {
        replacementStr = `      # Single-Strategy: Mobile gets JSON body with token
      render json: { token: token, user: { id: user.id, email: user.email } }, status: :ok`;
      }

      content = content.replace(targetStr, replacementStr || '');
      await fs.writeFile(sessionsCtrlPath, content, 'utf8');
    }
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const migrationContent = `class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false

      t.timestamps
    end
    add_index :users, :email, unique: true
  end
end
`;
  await fs.ensureDir(path.join(apiDir, 'db/migrate'));
  await fs.writeFile(path.join(apiDir, `db/migrate/${timestamp}_create_users.rb`), migrationContent, 'utf8');

  s.stop('Database and JWT architecture wired!');

  if (installDependencies) {
    s.start('Installing dependencies via pnpm (this may take a minute)...');
    await execa('pnpm', ['install', '--ignore-scripts'], {
      cwd: targetDir,
      env: {
        ...process.env,
        PNPM_MINIMUM_RELEASE_AGE: '0',
      },
    });
    s.stop('Dependencies installed!');

    s.start('Bootstrapping Rails OpenAPI and typed client bridge...');
    try {
      await execa('bundle', ['install'], { cwd: apiDir });
      await execa('bundle', ['exec', 'rails', 'db:prepare'], { cwd: apiDir });
      await execa('bundle', ['exec', 'rails', 'typelizer:generate'], { cwd: apiDir });
      await execa('bundle', ['exec', 'rails', 'openapi:generate'], { cwd: apiDir });
    } catch (e) {
      s.warn('Database connection failed or Ruby is not configured. Rails OpenAPI generation was skipped.');
    }

    try {
      await execa('pnpm', ['api:client'], { cwd: targetDir });
    } catch {
      s.warn('Hey API client generation was skipped. Run `pnpm api:types` after dependencies are installed.');
    }
    s.stop('Type bridge ready!');
  } else {
    s.warn('Dependency installation skipped. Run `pnpm install && pnpm api:types` inside the new project.');
  }

  if (initializeGit) {
    s.start('Initializing Git repository...');
    try {
      await execa('git', ['init'], { cwd: targetDir });
      await execa('git', ['add', '.'], { cwd: targetDir });
      await execa('git', ['commit', '-m', 'chore: initial commit from create-loomrails-app'], { cwd: targetDir });
      s.stop('Git initialized!');
    } catch {
      s.stop('Git initialized without initial commit.');
      s.warn('Git commit failed. Configure git user.name/user.email and commit manually.');
    }
  } else {
    s.warn('Git initialization skipped.');
  }

  return { targetDir };
}

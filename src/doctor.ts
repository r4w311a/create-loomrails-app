import fs from 'fs-extra';
import net from 'net';
import os from 'os';
import path from 'path';
import { execa } from 'execa';
import pc from 'picocolors';

interface DoctorCheck {
  label: string;
  ok: boolean;
  detail: string;
  required?: boolean;
}

async function commandVersion(command: string, args: string[] = ['--version']) {
  try {
    const result = await execa(command, args);
    return result.stdout.trim() || result.stderr.trim();
  } catch {
    return null;
  }
}

async function portIsOpen(port: number) {
  return new Promise<boolean>((resolve) => {
    const socket = net.createConnection({ port, host: '127.0.0.1' });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

function localLanAddresses() {
  return Object.values(os.networkInterfaces())
    .flatMap((interfaces) => interfaces ?? [])
    .filter((networkInterface) => networkInterface.family === 'IPv4' && !networkInterface.internal)
    .map((networkInterface) => networkInterface.address);
}

async function generatedAppChecks(cwd: string): Promise<DoctorCheck[]> {
  const apiDir = path.join(cwd, 'apps/api');
  const webDir = path.join(cwd, 'apps/web');
  const checks: DoctorCheck[] = [];

  if (!(await fs.pathExists(apiDir))) {
    return checks;
  }

  checks.push({
    label: 'Rails API app',
    ok: true,
    detail: apiDir,
    required: true,
  });

  checks.push({
    label: 'Rails master key',
    ok: await fs.pathExists(path.join(apiDir, 'config/master.key')),
    detail: 'Required for JWT signing and credentials.',
    required: true,
  });

  checks.push({
    label: 'Web app',
    ok: await fs.pathExists(webDir),
    detail: webDir,
    required: true,
  });

  return checks;
}

function printCheck(check: DoctorCheck) {
  const mark = check.ok ? pc.green('✔') : check.required ? pc.red('✖') : pc.yellow('⚠');
  const label = check.label.padEnd(25, '.');
  console.log(`  ${mark}  ${pc.bold(label)} ${pc.gray(check.detail)}`);
}

export async function runDoctor(cwd = process.cwd()) {
  const nodeVersion = await commandVersion('node');
  const pnpmVersion = await commandVersion('pnpm');
  const rubyVersion = await commandVersion('ruby', ['-v']);
  const bundlerVersion = await commandVersion('bundle', ['-v']);
  const postgresVersion = await commandVersion('pg_isready', ['--version']);
  const railsPortOpen = await portIsOpen(3000);
  const vitePortOpen = await portIsOpen(5173);
  const lanAddresses = localLanAddresses();

  const checks: DoctorCheck[] = [
    {
      label: 'Node.js',
      ok: Boolean(nodeVersion),
      detail: nodeVersion ?? 'Install Node.js 22 or newer.',
      required: true,
    },
    {
      label: 'pnpm',
      ok: Boolean(pnpmVersion),
      detail: pnpmVersion ?? 'Install pnpm 11 or enable it through corepack.',
      required: true,
    },
    {
      label: 'Ruby',
      ok: Boolean(rubyVersion),
      detail: rubyVersion ?? 'Install Ruby 3.3 or newer.',
      required: true,
    },
    {
      label: 'Bundler',
      ok: Boolean(bundlerVersion),
      detail: bundlerVersion ?? 'Install Bundler with `gem install bundler`.',
      required: true,
    },
    {
      label: 'PostgreSQL client',
      ok: Boolean(postgresVersion),
      detail: postgresVersion ?? 'Required only when using the PostgreSQL template.',
      required: false,
    },
    {
      label: 'Rails port 3000',
      ok: !railsPortOpen,
      detail: railsPortOpen ? 'Already in use.' : 'Available.',
      required: false,
    },
    {
      label: 'Vite port 5173',
      ok: !vitePortOpen,
      detail: vitePortOpen ? 'Already in use.' : 'Available.',
      required: false,
    },
    {
      label: 'Expo LAN address',
      ok: lanAddresses.length > 0,
      detail: lanAddresses.length > 0 ? lanAddresses.join(', ') : 'No LAN IPv4 address detected.',
      required: false,
    },
    ...(await generatedAppChecks(cwd)),
  ];

  console.log('\\n' + pc.bgCyan(pc.black(' LOOMRAILS DOCTOR ')) + '\\n');
  for (const check of checks) {
    printCheck(check);
  }

  return checks.every((check) => check.ok || !check.required);
}

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import inquirer from 'inquirer';
import chalk from 'chalk';
import sharp from 'sharp';
import { ensureAuthenticated } from '../lib/config';
import { getDb, admin } from '../lib/firebase-client';
import { Logo } from '../types';
import { createSpinner, succeed, fail, handleCliError } from '../utils/spinner';
import Table from 'cli-table3';

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

function getStorageBucket(): any {
  try {
    return admin.storage().bucket();
  } catch {
    throw new Error(
      'Firebase Storage not configured. Set FIREBASE_STORAGE_BUCKET env var or configure a default bucket in your Firebase project.'
    );
  }
}

export default function registerLogoCommands(program: Command) {
  const logo = program
    .command('logo')
    .description('Manage your business logos');

  logo
    .command('upload <file-path>')
    .description('Upload a logo')
    .option('-n, --name <name>', 'Logo name')
    .action(async (filePath: string, options) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const resolvedPath = path.resolve(filePath);

        if (!fs.existsSync(resolvedPath)) {
          console.error(chalk.red(`File not found: ${resolvedPath}`));
          process.exit(1);
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
          console.error(chalk.red(`Invalid file type "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
          process.exit(1);
        }

        const stats = fs.statSync(resolvedPath);
        if (stats.size > MAX_FILE_SIZE) {
          console.error(chalk.red(`File size ${(stats.size / 1024 / 1024).toFixed(2)}MB exceeds 5MB limit`));
          process.exit(1);
        }

        let logoName = options.name || path.basename(resolvedPath, ext);
        let uploadBuffer = fs.readFileSync(resolvedPath);
        let width: number | undefined;
        let height: number | undefined;

        if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
          const spinner = createSpinner('Resizing image...');
          const metadata = await sharp(uploadBuffer).metadata();
          width = metadata.width;
          height = metadata.height;

          if (width && width > 800) {
            uploadBuffer = await sharp(uploadBuffer)
              .resize({ width: 800, withoutEnlargement: true })
              .toBuffer();
            const newMeta = await sharp(uploadBuffer).metadata();
            width = newMeta.width;
            height = newMeta.height;
          }
          succeed(spinner, `Image processed (${width}x${height})`);
        }

        const spinner = createSpinner('Uploading logo...');
        const bucket = getStorageBucket();
        const storagePath = `users/${uid}/logos/${Date.now()}${ext}`;
        const file = bucket.file(storagePath);
        const contentType = ext === '.svg' ? 'image/svg+xml' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

        await file.save(uploadBuffer, { contentType });
        await file.makePublic();
        const [url] = await file.getSignedUrl({ action: 'read', expires: '2099-01-01' });

        const db = getDb();
        const brandingRef = db.collection('users').doc(uid).collection('branding').doc('logos');
        const brandingDoc = await brandingRef.get();
        const existingLogos: Logo[] = brandingDoc.exists ? (brandingDoc.data()?.logos || []) : [];

        const isFirst = existingLogos.length === 0;
        const newLogo: Logo = {
          id: Date.now().toString(),
          name: logoName,
          url,
          isDefault: isFirst,
          uploadedAt: new Date().toISOString(),
          width,
          height,
        };

        existingLogos.push(newLogo);
        await brandingRef.set({ logos: existingLogos }, { merge: true });

        succeed(spinner, chalk.green(`✓ Logo "${logoName}" uploaded successfully`));
        if (isFirst) {
          console.log(chalk.yellow('  Set as default logo (first upload)'));
        }
      } catch (error: any) {
        handleCliError(error, 'Failed to upload logo:');
      }
    });

  logo
    .command('list')
    .description('List all logos')
    .action(async () => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Fetching logos...');

        const db = getDb();
        const brandingDoc = await db.collection('users').doc(uid).collection('branding').doc('logos').get();
        const logos: Logo[] = brandingDoc.exists ? (brandingDoc.data()?.logos || []) : [];

        if (logos.length === 0) {
          succeed(spinner, chalk.yellow('No logos found. Upload one with: invoiceapp logo upload <file>'));
          return;
        }

        succeed(spinner, chalk.green(`Found ${logos.length} logo(s)`));
        const table = new Table({
          head: [chalk.cyan('#'), chalk.cyan('Name'), chalk.cyan('Default'), chalk.cyan('Uploaded')],
          style: { head: [], border: [] },
        });
        logos.forEach((l, i) => {
          table.push([i + 1, l.name, l.isDefault ? '*' : '', new Date(l.uploadedAt).toLocaleDateString()]);
        });
        console.log(table.toString());
      } catch (error: any) {
        handleCliError(error, 'Failed to list logos:');
      }
    });

  logo
    .command('set-default <name>')
    .description('Set a logo as default')
    .action(async (name: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Finding logo...');

        const db = getDb();
        const brandingRef = db.collection('users').doc(uid).collection('branding').doc('logos');
        const brandingDoc = await brandingRef.get();
        const logos: Logo[] = brandingDoc.exists ? (brandingDoc.data()?.logos || []) : [];

        const found = logos.find((l) => l.name.toLowerCase() === name.toLowerCase());
        if (!found) {
          fail(spinner, chalk.red(`No logo found with name "${name}"`));
          return;
        }

        logos.forEach((l) => { l.isDefault = false; });
        found.isDefault = true;
        await brandingRef.set({ logos }, { merge: true });

        succeed(spinner, chalk.green(`✓ "${found.name}" set as default logo`));
      } catch (error: any) {
        handleCliError(error, 'Failed to set default logo:');
      }
    });

  logo
    .command('remove <name>')
    .description('Remove a logo')
    .action(async (name: string) => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;
        const spinner = createSpinner('Finding logo...');

        const db = getDb();
        const brandingRef = db.collection('users').doc(uid).collection('branding').doc('logos');
        const brandingDoc = await brandingRef.get();
        const logos: Logo[] = brandingDoc.exists ? (brandingDoc.data()?.logos || []) : [];

        const found = logos.find((l) => l.name.toLowerCase() === name.toLowerCase());
        if (!found) {
          fail(spinner, chalk.red(`No logo found with name "${name}"`));
          return;
        }

        const { confirm } = await inquirer.prompt([
          { type: 'confirm', name: 'confirm', message: `Remove logo "${found.name}"?`, default: false },
        ]);
        if (!confirm) {
          console.log(chalk.yellow('Removal cancelled'));
          return;
        }

        try {
          const bucket = getStorageBucket();
          const urlParts = found.url.split('/');
          const storagePath = decodeURIComponent(urlParts.slice(-2).join('/'));
          await bucket.file(storagePath).delete();
        } catch {
          // Storage file may already be gone
        }

        const updated = logos.filter((l) => l.id !== found.id);
        if (found.isDefault && updated.length > 0) {
          updated[0].isDefault = true;
        }
        await brandingRef.set({ logos: updated }, { merge: true });

        succeed(spinner, chalk.green(`✓ Logo "${found.name}" removed successfully`));
      } catch (error: any) {
        handleCliError(error, 'Failed to remove logo:');
      }
    });

  logo
    .command('preview')
    .description('Show current default logo URL')
    .action(async () => {
      try {
        const config = ensureAuthenticated();
        const uid = config.userId!;

        const db = getDb();
        const brandingDoc = await db.collection('users').doc(uid).collection('branding').doc('logos').get();
        const logos: Logo[] = brandingDoc.exists ? (brandingDoc.data()?.logos || []) : [];

        const defaultLogo = logos.find((l) => l.isDefault);
        if (!defaultLogo) {
          console.log(chalk.yellow('No default logo set. Upload one with: invoiceapp logo upload'));
          return;
        }

        console.log(chalk.cyan(`Default logo: ${defaultLogo.name}`));
        console.log(defaultLogo.url);
      } catch (error: any) {
        handleCliError(error, 'Failed to preview logo:');
      }
    });
}

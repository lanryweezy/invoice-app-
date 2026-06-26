const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

async function build() {
  try {
    const rootDir = path.resolve(__dirname, '..');
    const distDir = path.join(rootDir, 'dist');
    const webDist = path.join(rootDir, 'apps/web/dist');
    const marketingDist = path.join(rootDir, 'apps/marketing/dist');

    console.log('--- Cleaning dist directory ---');
    await fs.remove(distDir);
    await fs.ensureDir(distDir);

    console.log('--- Building Web App (React) ---');
    execSync('npm run build', { cwd: path.join(rootDir, 'apps/web'), stdio: 'inherit' });

    console.log('--- Building Marketing App (Astro) ---');
    execSync('npm run build', { cwd: path.join(rootDir, 'apps/marketing'), stdio: 'inherit' });

    console.log('--- Organizing Build Output ---');
    
    // Move Web Dist to dist/web
    await fs.ensureDir(path.join(distDir, 'web'));
    await fs.copy(webDist, path.join(distDir, 'web'));
    console.log('✓ Web app moved to dist/web');

    // Move Marketing Dist to dist/marketing
    await fs.ensureDir(path.join(distDir, 'marketing'));
    await fs.copy(marketingDist, path.join(distDir, 'marketing'));
    console.log('✓ Marketing app moved to dist/marketing');

    console.log('--- Build Complete ---');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

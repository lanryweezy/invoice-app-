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
    
    // Copy Web Dist to root/web (Vercel serves from project root)
    const rootWeb = path.join(rootDir, 'web');
    await fs.remove(rootWeb);
    await fs.copy(webDist, rootWeb);
    console.log('✓ Web app copied to /web');

    // Copy Marketing Dist to root/marketing (Vercel serves from project root)
    const rootMarketing = path.join(rootDir, 'marketing');
    await fs.remove(rootMarketing);
    await fs.copy(marketingDist, rootMarketing);
    console.log('✓ Marketing app copied to /marketing');

    console.log('--- Build Complete ---');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();

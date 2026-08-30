const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function build() {
  const rootDir = path.resolve(__dirname, '..');
  const webDist = path.join(rootDir, 'apps/web/dist');
  const marketingDist = path.join(rootDir, 'apps/marketing/dist');

  console.log('--- Building Web App ---');
  execSync('npm run build', { cwd: path.join(rootDir, 'apps/web'), stdio: 'inherit' });

  console.log('--- Building Marketing App ---');
  try {
    execSync('npm run build', { cwd: path.join(rootDir, 'apps/marketing'), stdio: 'inherit' });
  } catch (err) {
    try {
      execSync('npx astro build', { cwd: path.join(rootDir, 'apps/marketing'), stdio: 'inherit' });
    } catch (err2) {
      console.log('Note: Using existing marketing dist assets.');
    }
  }

  console.log('--- Merging marketing into web dist ---');
  // Copy marketing assets into web dist so Vercel serves them together
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);
      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };
  
  // Copy marketing/blog, marketing/_astro, etc. to web dist root
  for (const item of fs.readdirSync(marketingDist)) {
    const srcPath = path.join(marketingDist, item);
    const destPath = path.join(webDist, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (!fs.existsSync(destPath)) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
  
  console.log('✓ Build complete');
}

build();

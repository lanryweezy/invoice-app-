import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { AppConfig } from '../types';

const CONFIG_DIR = path.join(os.homedir(), '.invoiceapp');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export function getConfig(): AppConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(data) as AppConfig;
    }
  } catch (error) {
    console.error('Error reading config:', error);
  }
  return {};
}

export function saveConfig(config: AppConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { encoding: 'utf-8', mode: 0o600 });
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
}

export function getApiKey(): string | undefined {
  const envKey = process.env.FIREBASE_API_KEY;
  if (envKey) return envKey;

  const config = getConfig();
  return config.idToken;
}

export function ensureAuthenticated(): AppConfig {
  const config = getConfig();
  if (!config.userId) {
    throw new Error('Not authenticated. Run "invoiceapp login" first.');
  }
  return config;
}

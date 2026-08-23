import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

vi.mock('fs');

const mockFs = vi.mocked(fs);

describe('config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfigPath', () => {
    it('returns path ending with .invoiceapp/config.json', async () => {
      const { getConfigPath } = await import('./config');
      const configPath = getConfigPath();
      expect(configPath).toMatch(/\.invoiceapp[\\/]config\.json$/);
    });
  });

  describe('getConfig', () => {
    it('returns empty object when config file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const { getConfig } = await import('./config');
      const config = getConfig();
      expect(config).toEqual({});
    });

    it('parses and returns config when file exists', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ userId: '123', email: 'test@test.com' }));

      const { getConfig } = await import('./config');
      const config = getConfig();
      expect(config).toEqual({ userId: '123', email: 'test@test.com' });
    });

    it('returns empty object on parse error', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('not json');

      const { getConfig } = await import('./config');
      const config = getConfig();
      expect(config).toEqual({});

      consoleSpy.mockRestore();
    });
  });

  describe('saveConfig', () => {
    it('writes config to the correct path with secure permissions', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => undefined as any);
      mockFs.writeFileSync.mockImplementation(() => undefined);

      const { saveConfig } = await import('./config');
      saveConfig({ userId: '123', email: 'test@test.com' });

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining('.invoiceapp'),
        { recursive: true, mode: 0o700 }
      );
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('config.json'),
        expect.stringContaining('"userId": "123"'),
        { encoding: 'utf-8', mode: 0o600 }
      );
    });
  });

  describe('ensureAuthenticated', () => {
    it('throws when not logged in', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const { ensureAuthenticated } = await import('./config');
      expect(() => ensureAuthenticated()).toThrow('Not authenticated');
    });

    it('returns config when authenticated', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ userId: '123' }));

      const { ensureAuthenticated } = await import('./config');
      const config = ensureAuthenticated();
      expect(config.userId).toBe('123');
    });
  });

  describe('getApiKey', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = process.env;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('returns FIREBASE_API_KEY from environment variables if set', async () => {
      process.env = { ...originalEnv, FIREBASE_API_KEY: 'env-api-key' };
      const { getApiKey } = await import('./config');
      expect(getApiKey()).toBe('env-api-key');
    });

    it('returns idToken from config if FIREBASE_API_KEY is not set', async () => {
      process.env = { ...originalEnv };
      delete process.env.FIREBASE_API_KEY;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ idToken: 'config-id-token' }));

      const { getApiKey } = await import('./config');
      expect(getApiKey()).toBe('config-id-token');
    });

    it('returns undefined if neither environment variable nor config has a key', async () => {
      process.env = { ...originalEnv };
      delete process.env.FIREBASE_API_KEY;

      mockFs.existsSync.mockReturnValue(false);

      const { getApiKey } = await import('./config');
      expect(getApiKey()).toBeUndefined();
    });
  });
});

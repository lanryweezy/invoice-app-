import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loginWithToken, getAuthToken, logout, getCurrentUser, isAuthenticated } from './auth';
import * as configModule from './config';
import { AppConfig } from '../types';

vi.mock('./config', () => ({
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
}));

describe('auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loginWithToken', () => {
    it('saves the provided token to the configuration', () => {
      const mockConfig: AppConfig = { userId: '123' };
      vi.mocked(configModule.getConfig).mockReturnValue(mockConfig);

      loginWithToken('new-token');

      expect(configModule.getConfig).toHaveBeenCalled();
      expect(configModule.saveConfig).toHaveBeenCalledWith({
        userId: '123',
        idToken: 'new-token',
      });
    });
  });

  describe('getAuthToken', () => {
    it('returns the idToken from the configuration', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({ idToken: 'test-token' });
      expect(getAuthToken()).toBe('test-token');
    });

    it('returns undefined if no idToken is present', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({});
      expect(getAuthToken()).toBeUndefined();
    });
  });

  describe('logout', () => {
    it('clears all authentication-related fields from the configuration', () => {
      const mockConfig: AppConfig = {
        userId: '123',
        email: 'test@example.com',
        idToken: 'token123',
        refreshToken: 'refresh123',
        businessName: 'My Business',
      };
      vi.mocked(configModule.getConfig).mockReturnValue(mockConfig);

      logout();

      expect(configModule.saveConfig).toHaveBeenCalledWith({
        businessName: 'My Business',
        userId: undefined,
        email: undefined,
        idToken: undefined,
        refreshToken: undefined,
      });
    });
  });

  describe('getCurrentUser', () => {
    it('returns the userId and email from the configuration', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        userId: '456',
        email: 'user@example.com',
        businessName: 'Other Data',
      });
      expect(getCurrentUser()).toEqual({
        userId: '456',
        email: 'user@example.com',
      });
    });

    it('returns undefined fields if they are not in the configuration', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({});
      expect(getCurrentUser()).toEqual({
        userId: undefined,
        email: undefined,
      });
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when both userId and idToken are present', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        userId: '123',
        idToken: 'token123',
      });
      expect(isAuthenticated()).toBe(true);
    });

    it('returns false when userId is missing', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        idToken: 'token123',
      });
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when idToken is missing', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({
        userId: '123',
      });
      expect(isAuthenticated()).toBe(false);
    });

    it('returns false when both are missing', () => {
      vi.mocked(configModule.getConfig).mockReturnValue({});
      expect(isAuthenticated()).toBe(false);
    });
  });
});

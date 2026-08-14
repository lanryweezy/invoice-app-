import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './error';

describe('error utils', () => {
  describe('getErrorMessage', () => {
    it('returns the message property if error is an instance of Error', () => {
      const err = new Error('test error');
      expect(getErrorMessage(err)).toBe('test error');
    });

    it('returns String representation if error is not an Error instance', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
      expect(getErrorMessage({ foo: 'bar' })).toBe('[object Object]');
    });
  });
});

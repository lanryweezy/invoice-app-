import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handleCliError, createSpinner, succeed, fail } from './spinner';
import ora from 'ora';

vi.mock('chalk', () => ({
  default: {
    cyan: vi.fn((str) => str),
    red: vi.fn((str) => str),
  },
}));

vi.mock('ora', () => {
  const mOra = {
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
  };
  return {
    default: vi.fn(() => mOra),
  };
});

describe('spinner utils', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('handleCliError', () => {
    it('should log the error and exit the process', () => {
      const error = new Error('Something went wrong');
      handleCliError(error, 'Test Error Message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Test Error Message', 'Something went wrong');
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should handle errors without a message property', () => {
      const error = { code: 'UNKNOWN_ERROR' };
      handleCliError(error, 'Test Error Message');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Test Error Message', undefined);
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('createSpinner', () => {
    it('should create and start an ora spinner', () => {
      const text = 'Loading...';
      const spinner = createSpinner(text);

      expect(ora).toHaveBeenCalledWith(text);
      expect(spinner.start).toHaveBeenCalled();
    });
  });

  describe('succeed', () => {
    it('should call succeed on the given spinner', () => {
      const spinner = createSpinner('Loading...');
      const successText = 'Done!';

      succeed(spinner, successText);

      expect(spinner.succeed).toHaveBeenCalledWith(successText);
    });
  });

  describe('fail', () => {
    it('should call fail on the given spinner', () => {
      const spinner = createSpinner('Loading...');
      const failText = 'Failed!';

      fail(spinner, failText);

      expect(spinner.fail).toHaveBeenCalledWith(failText);
    });
  });
});

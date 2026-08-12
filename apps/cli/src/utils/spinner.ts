import ora, { Ora } from 'ora';
import chalk from 'chalk';

export function handleCliError(error: any, message: string): never {
  console.error(chalk.red(message), error.message);
  process.exit(1);
}

export function createSpinner(text: string): Ora {
  return ora(text).start();
}

export function succeed(spinner: Ora, text: string): void {
  spinner.succeed(text);
}

export function fail(spinner: Ora, text: string): void {
  spinner.fail(text);
}

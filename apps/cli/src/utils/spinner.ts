import ora, { Ora } from 'ora';

export function createSpinner(text: string): Ora {
  return ora(text).start();
}

export function succeed(spinner: Ora, text: string): void {
  spinner.succeed(text);
}

export function fail(spinner: Ora, text: string): void {
  spinner.fail(text);
}

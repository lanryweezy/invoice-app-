import { Command } from 'commander';
import { registerAuthCommands } from './auth';
import { registerClientCommands } from './client';
import { registerConfigCommands } from './config';
import registerCreateCommand from './create';
import registerGetCommand from './get';
import registerListCommand from './list';
import registerSendCommand from './send';
import registerPdfCommand from './pdf';
import registerLogoCommands from './logo';
import registerTaxReportCommand from './tax-report';
import registerExportCommand from './export';
import registerBatchCommand from './batch';
import registerRecurringCommands from './recurring';

export function registerCommands(program: Command): void {
  registerAuthCommands(program);
  registerConfigCommands(program);
  registerClientCommands(program);
  registerCreateCommand(program);
  registerGetCommand(program);
  registerListCommand(program);
  registerSendCommand(program);
  registerPdfCommand(program);
  registerLogoCommands(program);
  registerTaxReportCommand(program);
  registerExportCommand(program);
  registerBatchCommand(program);
  registerRecurringCommands(program);
}

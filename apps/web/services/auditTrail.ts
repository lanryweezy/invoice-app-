import localforage from 'localforage';
import type { Invoice } from '../types';

localforage.config({
  name: 'InvoiceApp',
  storeName: 'audit_trail',
  description: 'Invoice audit trail logs'
});

export type AuditAction = 'create' | 'edit' | 'delete' | 'send' | 'pay' | 'status_change' | 'export' | 'download';

export interface AuditEntry {
  id: string;
  invoiceId: string;
  action: AuditAction;
  userId: string;
  timestamp: string;
  details: Record<string, unknown>;
  previousValues?: Partial<Invoice>;
  newValues?: Partial<Invoice>;
}

export interface AuditFilters {
  invoiceId?: string;
  userId?: string;
  action?: AuditAction;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

function generateId(): string {
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  const randomStr = Array.from(array, b => b.toString(16).padStart(2, '0')).join('').toUpperCase().substring(0, 6);
  return `AUD-${Date.now()}-${randomStr}`;
}

async function getAllEntries(): Promise<AuditEntry[]> {
  const entries = await localforage.getItem<AuditEntry[]>('entries');
  return entries ?? [];
}

async function saveEntries(entries: AuditEntry[]): Promise<void> {
  await localforage.setItem('entries', entries);
}

export async function logAction(
  invoiceId: string,
  action: AuditAction,
  userId: string,
  details: Record<string, unknown>,
  previousValues?: Partial<Invoice>,
  newValues?: Partial<Invoice>
): Promise<AuditEntry> {
  const entry: AuditEntry = {
    id: generateId(),
    invoiceId,
    action,
    userId,
    timestamp: new Date().toISOString(),
    details,
    previousValues,
    newValues,
  };

  const entries = await getAllEntries();
  entries.push(entry);
  await saveEntries(entries);

  return entry;
}

export async function getAuditTrail(invoiceId: string): Promise<AuditEntry[]> {
  const entries = await getAllEntries();
  return entries
    .filter((e) => e.invoiceId === invoiceId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function searchAuditTrail(filters: AuditFilters): Promise<AuditEntry[]> {
  const entries = await getAllEntries();

  return entries
    .filter((e) => {
      if (filters.invoiceId && e.invoiceId !== filters.invoiceId) return false;
      if (filters.userId && e.userId !== filters.userId) return false;
      if (filters.action && e.action !== filters.action) return false;
      if (filters.startDate && new Date(e.timestamp) < new Date(filters.startDate)) return false;
      if (filters.endDate && new Date(e.timestamp) > new Date(filters.endDate)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, filters.limit ?? 500);
}

export async function getAuditSummary(invoiceId: string): Promise<{
  totalActions: number;
  createdBy: string | null;
  createdAt: string | null;
  lastModifiedBy: string | null;
  lastModifiedAt: string | null;
  actionCounts: Record<AuditAction, number>;
}> {
  const trail = await getAuditTrail(invoiceId);

  const actionCounts = {} as Record<AuditAction, number>;
  for (const entry of trail) {
    actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
  }

  const first = trail[trail.length - 1] ?? null;
  const last = trail[0] ?? null;

  return {
    totalActions: trail.length,
    createdBy: first?.userId ?? null,
    createdAt: first?.timestamp ?? null,
    lastModifiedBy: last?.userId ?? null,
    lastModifiedAt: last?.timestamp ?? null,
    actionCounts,
  };
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * 🔩 Hinge Extension Point: AuditExportStrategy
 *
 * Pressure: The `exportAuditTrail` function had hardcoded logic for 'json' and 'csv',
 * which would need modification every time a new export format (like PDF or XML) was added.
 *
 * Contract:
 * - Implementors provide a unique `format` string and an `export` function.
 * - The `export` function receives an array of `AuditEntry` objects and must return a string
 *   (or Promise resolving to a string) containing the formatted payload.
 */
export interface AuditExportStrategy {
  format: string;
  export(entries: AuditEntry[]): string | Promise<string>;
}

const auditExportStrategies = new Map<string, AuditExportStrategy>();

export function registerAuditExportStrategy(strategy: AuditExportStrategy): void {
  auditExportStrategies.set(strategy.format, strategy);
}

registerAuditExportStrategy({
  format: 'json',
  export: (entries) => JSON.stringify(entries, null, 2)
});

registerAuditExportStrategy({
  format: 'csv',
  export: (entries) => {
    const headers = ['ID', 'Invoice ID', 'Action', 'User ID', 'Timestamp', 'Details', 'Previous Values', 'New Values'];
    const rows = entries.map((e) => [
      escapeCSV(e.id),
      escapeCSV(e.invoiceId),
      escapeCSV(e.action),
      escapeCSV(e.userId),
      escapeCSV(e.timestamp),
      escapeCSV(JSON.stringify(e.details)),
      escapeCSV(JSON.stringify(e.previousValues ?? {})),
      escapeCSV(JSON.stringify(e.newValues ?? {})),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }
});

export async function exportAuditTrail(
  invoiceId: string,
  format: 'csv' | 'json' | (string & {})
): Promise<string> {
  const trail = await getAuditTrail(invoiceId);
  const strategy = auditExportStrategies.get(format);

  if (!strategy) {
    throw new Error(`Unsupported export format: ${format}`);
  }

  return strategy.export(trail);
}

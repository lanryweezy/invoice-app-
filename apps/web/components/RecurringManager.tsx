import React, { useMemo } from 'react';
import type { Invoice } from '../types';
import { numberFormatter } from '../utils/formatters';

/**
 * 🔩 Hinge Extension Point: RecurringFrequencyStrategy
 *
 * Pressure: The `RecurringManager` component had hardcoded maps for colors/labels,
 * and switch statements in `getNextDueDate` and `monthlyEstimate` that needed
 * modification every time a new recurring frequency was added.
 *
 * Contract:
 * - Implementors provide a `RecurringFrequencyStrategy` with an ID, visual metadata
 *   (label, color), a function to compute the next due date, and a multiplier
 *   for monthly revenue estimations.
 */
export interface RecurringFrequencyStrategy {
  id: string;
  label: string;
  colorClass: string;
  monthlyMultiplier: number;
  getNextDate: (lastGenerated: Date) => Date;
}

const frequencyStrategies = new Map<string, RecurringFrequencyStrategy>();

export function registerRecurringStrategy(strategy: RecurringFrequencyStrategy): void {
  frequencyStrategies.set(strategy.id, strategy);
}

registerRecurringStrategy({
  id: 'weekly',
  label: 'Every Week',
  colorClass: 'bg-blue-100 text-blue-800',
  monthlyMultiplier: 4.33,
  getNextDate: (d) => { d.setDate(d.getDate() + 7); return d; }
});
registerRecurringStrategy({
  id: 'monthly',
  label: 'Every Month',
  colorClass: 'bg-teal-100 text-teal-800',
  monthlyMultiplier: 1,
  getNextDate: (d) => { d.setMonth(d.getMonth() + 1); return d; }
});
registerRecurringStrategy({
  id: 'quarterly',
  label: 'Every 3 Months',
  colorClass: 'bg-purple-100 text-purple-800',
  monthlyMultiplier: 1 / 3,
  getNextDate: (d) => { d.setMonth(d.getMonth() + 3); return d; }
});
registerRecurringStrategy({
  id: 'yearly',
  label: 'Every Year',
  colorClass: 'bg-amber-100 text-amber-800',
  monthlyMultiplier: 1 / 12,
  getNextDate: (d) => { d.setFullYear(d.getFullYear() + 1); return d; }
});

function getNextDueDate(lastGenerated: string, frequency: string): string {
  const d = new Date(lastGenerated);
  const strategy = frequencyStrategies.get(frequency);
  if (strategy) {
    strategy.getNextDate(d);
  }
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface RecurringManagerProps {
  recurringInvoices: Invoice[];
  onGenerateNext: (invoice: Invoice) => void;
  onRemove: (index: number) => void;
  onToggleActive: (index: number, isActive: boolean) => void;
}

export const RecurringManager: React.FC<RecurringManagerProps> = ({
  recurringInvoices,
  onGenerateNext,
  onRemove,
  onToggleActive,
}) => {
  const stats = useMemo(() => {
    const active = recurringInvoices.filter(i => i.recurringIsActive).length;
    const total = recurringInvoices.length;
    const monthlyEstimate = recurringInvoices.reduce((sum, inv) => {
      if (!inv.recurringIsActive || !inv.total || !inv.recurringFrequency) return sum;
      const strategy = frequencyStrategies.get(inv.recurringFrequency);
      if (strategy) {
        return sum + inv.total * strategy.monthlyMultiplier;
      }
      return sum;
    }, 0);
    return { active, total, monthlyEstimate };
  }, [recurringInvoices]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Recurring Invoices</h2>
        <p className="text-slate-500 mt-1">Automate your billing. Set schedules and let the system generate invoices for you.</p>
      </div>

      {recurringInvoices.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Schedules</p>
            <p className="text-3xl font-black text-teal-600 mt-1">{stats.active}</p>
            <p className="text-xs text-slate-500 mt-1">of {stats.total} total</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Est. Monthly Revenue</p>
            <p className="text-3xl font-black text-slate-900 mt-1">₦{numberFormatter.format(Math.round(stats.monthlyEstimate))}</p>
            <p className="text-xs text-slate-500 mt-1">from recurring</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Next Due</p>
            <p className="text-3xl font-black text-slate-900 mt-1">
              {recurringInvoices.filter(i => i.recurringIsActive && i.nextDueDate).length > 0
                ? formatDate(
                    recurringInvoices
                      .filter(i => i.recurringIsActive && i.nextDueDate)
                      .sort((a, b) => (a.nextDueDate || '').localeCompare(b.nextDueDate || ''))[0].nextDueDate!
                  )
                : '---'}
            </p>
            <p className="text-xs text-slate-500 mt-1">earliest schedule</p>
          </div>
        </div>
      )}

      {recurringInvoices.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Recurring Schedules</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            Open any invoice, select a frequency (weekly/monthly/quarterly/yearly), and click "Save as Recurring" to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringInvoices.map((inv, idx) => {
            const isActive = inv.recurringIsActive ?? true;
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border transition-all ${
                  isActive ? 'border-slate-200 shadow-sm' : 'border-slate-100 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <button
                      onClick={() => onToggleActive(idx, !isActive)}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${
                        isActive ? 'bg-teal-500' : 'bg-slate-300'
                      }`}
                      aria-label={isActive ? 'Pause schedule' : 'Resume schedule'}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isActive ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 truncate">{inv.client.name || 'Unnamed Client'}</h3>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${frequencyStrategies.get(inv.recurringFrequency || 'monthly')?.colorClass || 'bg-slate-100 text-slate-800'}`}>
                          {frequencyStrategies.get(inv.recurringFrequency || 'monthly')?.label || inv.recurringFrequency}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {inv.currency} {inv.total != null ? numberFormatter.format(inv.total) : '---'}
                        <span className="mx-1.5 text-slate-300">·</span>
                        {inv.lineItems.length} item{inv.lineItems.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm flex-shrink-0 w-full sm:w-auto">
                    {isActive && inv.nextDueDate && (
                      <span className="text-xs text-slate-500 hidden lg:block">
                        Next: {formatDate(inv.nextDueDate)}
                      </span>
                    )}
                    <button
                      onClick={() => onGenerateNext(inv)}
                      disabled={!isActive}
                      className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-xl transition-colors text-sm"
                    >
                      Generate Now
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Remove this recurring schedule?')) onRemove(idx);
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                      title="Remove schedule"
                      aria-label="Remove schedule"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

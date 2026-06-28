
import React, { useMemo, useCallback } from 'react';
import type { Invoice, LineItem } from '../types';

interface NRSTaxPanelProps {
  invoice: Invoice;
  updateInvoice: (key: keyof Invoice, value: any) => void;
}

const WHT_TYPES = [
  { label: 'None', rate: 0 },
  { label: 'Contract / Supply', rate: 5 },
  { label: 'Consultancy / Technical', rate: 10 },
  { label: 'Rent / Lease', rate: 10 },
  { label: 'Dividend / Interest', rate: 10 },
  { label: 'Commission / Brokerage', rate: 10 },
  { label: 'Professional Fees', rate: 5 },
] as const;

const STAMP_DUTY_RATE = 0.0075;

const NRSTaxPanel: React.FC<NRSTaxPanelProps> = React.memo(({ invoice, updateInvoice }) => {
  const handleVatToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      updateInvoice('taxRate', invoice.taxRate > 0 ? invoice.taxRate : 7.5);
    } else {
      updateInvoice('taxRate', 0);
    }
  }, [invoice.taxRate, updateInvoice]);

  const handleWhtChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = WHT_TYPES.find(w => w.label === e.target.value);
    if (selected) {
      updateInvoice('whtRate', selected.rate);
    }
  }, [updateInvoice]);

  const handleVatRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateInvoice('taxRate', parseFloat(e.target.value) || 0);
  }, [updateInvoice]);

  const totals = useMemo(() => {
    const taxableItems = invoice.lineItems.filter(i => i.taxCategory !== 'Exempt');
    const subtotal = taxableItems.reduce((sum, i) => sum + i.quantity * Number(i.price), 0);
    const vat = subtotal * (invoice.taxRate / 100);
    const wht = subtotal * (invoice.whtRate / 100);
    const stampDuty = subtotal * STAMP_DUTY_RATE;
    const discountAmount = invoice.discountType === 'percentage'
      ? subtotal * (Number(invoice.discountRate) / 100)
      : Number(invoice.discountRate);
    const afterDiscount = subtotal - discountAmount;
    const totalTax = vat + stampDuty;
    const total = afterDiscount + totalTax + Number(invoice.shippingAmount || 0) - wht;

    return { subtotal, vat, wht, stampDuty, discountAmount, afterDiscount, totalTax, total };
  }, [invoice.lineItems, invoice.taxRate, invoice.whtRate, invoice.discountType, invoice.discountRate, invoice.shippingAmount]);

  const fmt = useMemo(() => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: invoice.currency,
  }), [invoice.currency]);

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">NRS Tax Compliance</h3>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider">Nigerian Revenue Service</p>
        </div>
      </div>

      <div className="p-5 space-y-6">
        {/* VAT Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Value Added Tax (VAT)</span>
              <span className="text-[9px] font-bold text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full uppercase">7.5% Standard</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoice.taxRate > 0}
                onChange={handleVatToggle}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          {invoice.taxRate > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">VAT Rate (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={invoice.taxRate}
                  onChange={handleVatRateChange}
                  className="w-20 bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-right text-sm text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Taxable Amount</span>
                <span className="text-sm text-slate-300 font-mono">{fmt.format(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-xs font-bold text-white">VAT Amount</span>
                <span className="text-sm font-bold text-teal-400 font-mono">{fmt.format(totals.vat)}</span>
              </div>
            </div>
          )}
        </div>

        {/* WHT Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Withholding Tax (WHT)</span>
            <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase">Deductible</span>
          </div>

          <div className="bg-slate-800 rounded-lg p-4 space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-1.5">WHT Category</label>
              <select
                value={WHT_TYPES.find(w => w.rate === invoice.whtRate)?.label || 'None'}
                onChange={handleWhtChange}
                className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500 appearance-none cursor-pointer"
              >
                {WHT_TYPES.map(w => (
                  <option key={w.label} value={w.label}>{w.label} {w.rate > 0 ? `(${w.rate}%)` : ''}</option>
                ))}
              </select>
            </div>

            {invoice.whtRate > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">WHT Rate</span>
                  <span className="text-sm text-slate-300 font-mono">{invoice.whtRate}%</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                  <span className="text-xs font-bold text-white">WHT Deduction</span>
                  <span className="text-sm font-bold text-amber-400 font-mono">-{fmt.format(totals.wht)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Stamp Duty */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">Stamp Duty</span>
            <span className="text-[9px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full uppercase">0.75%</span>
          </div>
          <div className="bg-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Stamp Duty (0.75% of taxable)</span>
              <span className="text-sm font-bold text-purple-400 font-mono">{fmt.format(totals.stampDuty)}</span>
            </div>
          </div>
        </div>

        {/* Tax Breakdown Summary */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 rounded-xl p-5 border border-slate-700 space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Tax Breakdown</h4>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Subtotal</span>
              <span className="text-sm text-white font-mono">{fmt.format(totals.subtotal)}</span>
            </div>
            {totals.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Discount</span>
                <span className="text-sm text-red-400 font-mono">-{fmt.format(totals.discountAmount)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">VAT ({invoice.taxRate}%)</span>
                <span className="text-sm text-teal-400 font-mono">+{fmt.format(totals.vat)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Stamp Duty (0.75%)</span>
              <span className="text-sm text-purple-400 font-mono">+{fmt.format(totals.stampDuty)}</span>
            </div>
            {Number(invoice.shippingAmount || 0) > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Shipping</span>
                <span className="text-sm text-white font-mono">+{fmt.format(Number(invoice.shippingAmount))}</span>
              </div>
            )}
            {invoice.whtRate > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">WHT ({invoice.whtRate}%)</span>
                <span className="text-sm text-amber-400 font-mono">-{fmt.format(totals.wht)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total Tax Amount</span>
              <span className="text-sm font-bold text-teal-400 font-mono">{fmt.format(totals.totalTax)}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-base font-bold text-white">Grand Total</span>
              <span className="text-lg font-bold text-white font-mono">{fmt.format(totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Exemption Toggle */}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-white block">Tax Exemption</span>
              <span className="text-[10px] text-slate-400">Mark all items as exempt from VAT</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={invoice.lineItems.every(i => i.taxCategory === 'Exempt')}
                onChange={(e) => {
                  const newCat = e.target.checked ? 'Exempt' as const : 'Standard' as const;
                  invoice.lineItems.forEach(item => {
                    updateInvoice('lineItems', invoice.lineItems.map(i =>
                      i.id === item.id ? { ...i, taxCategory: newCat } : i
                    ));
                  });
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-700 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="flex items-center gap-2 px-4 py-3 bg-teal-500/10 rounded-lg border border-teal-500/20">
          <svg className="w-4 h-4 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="text-xs font-bold text-teal-300">NRS Compliant Invoice</span>
        </div>
      </div>
    </div>
  );
});

export default NRSTaxPanel;

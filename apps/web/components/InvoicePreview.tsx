import React, { useMemo } from 'react';
import type { Invoice, TemplateId, InvoiceStatus, DocumentType } from '../types';
import { getCurrencyFormatter } from '../utils/formatters';
import { getTemplateStrategy } from './invoiceTemplateRegistry';

interface InvoicePreviewProps {
  invoice: Invoice;
  totals: {
    subtotal: number;
    discountAmount: number;
    tax: number;
    whtAmount?: number;
    shipping: number;
    total: number;
  };
  template: TemplateId;
  isPro?: boolean;
}

const StatusBadge: React.FC<{ status: InvoiceStatus; template: TemplateId }> = ({ status, template }) => {
    const strategy = getTemplateStrategy(template);
    const baseClasses = "inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full border";

    return (
        <span className={`${baseClasses} ${strategy.statusStyles[status]}`}>
            {status}
        </span>
    );
};

// ⚡ Bolt: Wrap InvoicePreview in React.memo to prevent unnecessary re-renders when parent state (like modals) changes
export const InvoicePreview: React.FC<InvoicePreviewProps> = React.memo(({ invoice, totals, template, isPro = false }) => {
  const { user, client, issueDate, dueDate, lineItems, notes, terms, taxRate, whtRate, discountRate, shippingAmount, currency, status, documentType, digitalSignature } = invoice;
  const { subtotal, discountAmount, tax, whtAmount, shipping, total } = totals;
  const strategy = getTemplateStrategy(template);
  const styles = strategy.getTemplateStyles();

  const currencyFormatter = useMemo(() => getCurrencyFormatter(currency, 'en-US'), [currency]);

  const isMinimalist = template === 'minimalist';
  const isCenterAligned = template === 'minimalist' || template === 'elegant';

  return (
    <article className={`text-slate-900 h-full flex flex-col relative overflow-hidden ${template === 'elegant' ? 'font-serif' : template === 'tech' ? 'font-mono' : 'font-sans'}`}>
      
      {/* Paid Stamp/Watermark */}
      {status === 'Paid' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 opacity-[0.15] select-none">
            <div className="border-[12px] border-red-600 rounded-2xl p-6 rotate-[35deg]">
                <span className="text-8xl font-black text-red-600 tracking-tighter uppercase leading-none">PAID</span>
            </div>
        </div>
      )}

      {/* Dynamic Header */}
      <header className="relative z-10" aria-label="Invoice Header">
        <strategy.HeaderComponent
            user={user}
            invoiceNumber={invoice.invoiceNumber}
            status={invoice.status}
            documentType={documentType}
            badge={<StatusBadge status={invoice.status} template={template} />}
        />
      </header>

      {/* Bill To / Dates Grid */}
      <section className={`grid grid-cols-2 gap-12 mb-12 relative z-10 ${isCenterAligned ? 'text-center' : ''}`} aria-label="Client and Date Information">
        <div className={isCenterAligned ? 'order-2' : ''}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Bill To</p>
          <h3 className="font-bold text-slate-900 text-xl mb-1">{client.name}</h3>
          {client.tin && <p className="text-[10px] font-bold text-teal-600 uppercase tracking-tighter mb-2">TIN: {client.tin}</p>}
          {client.cacNumber && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">CAC: {client.cacNumber}</p>}
          <div className="text-slate-700 text-sm space-y-1 font-medium">
             <p className="whitespace-pre-line">{client.address}</p>
             <a href={`mailto:${encodeURIComponent(client.email || '')}`} className="text-teal-700 font-semibold hover:underline">{client.email}</a>
          </div>
        </div>
        <div className={isCenterAligned ? 'order-1 flex justify-center gap-12' : 'grid grid-cols-2 gap-6'}>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Issued</p>
            <p className="font-bold text-slate-900 text-lg">{issueDate}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Due</p>
            <p className="font-bold text-slate-900 text-lg">{dueDate}</p>
          </div>
        </div>
      </section>

      {/* Line Items Table */}
      <div className="flex-1 mb-8 relative z-10">
        <table className={`min-w-full ${template === 'tech' ? 'border-collapse' : ''}`}>
            <thead className={styles.tableHead}>
            <tr>
                <th scope="col" className={`pl-4 text-left ${styles.th}`}>Description</th>
                <th scope="col" className={`text-center ${styles.th}`}>Qty</th>
                <th scope="col" className={`text-right ${styles.th}`}>Price</th>
                <th scope="col" className={`pr-4 text-right ${styles.th}`}>Total</th>
            </tr>
            </thead>
            <tbody className={template === 'modern' ? '' : (template === 'tech' ? '' : 'divide-y divide-slate-100')}>
            {lineItems.map(item => (
                <tr key={item.id} className={styles.row}>
                <td className={`pl-4 ${styles.td} text-slate-900 font-bold w-[50%]`}>
                    {item.description}
                </td>
                <td className={`text-center ${styles.td} text-slate-700`}>{item.quantity}</td>
                <td className={`text-right ${styles.td} text-slate-700`}>{currencyFormatter.format(Number(item.price))}</td>
                <td className={`pr-4 text-right ${styles.td} text-slate-900 font-bold`}>{currencyFormatter.format(item.quantity * Number(item.price))}</td>
                </tr>
            ))}
            </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <section className={`flex ${isCenterAligned ? 'justify-center' : 'justify-end'} mb-16 relative z-10`} aria-label="Invoice Totals">
         <div className={`${isCenterAligned ? 'w-full max-w-md' : 'w-1/2 min-w-[250px]'}`}>
            <div className={`space-y-3 px-4 ${isCenterAligned ? 'text-center' : ''}`}>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-bold">Subtotal</span>
                    <span className="text-slate-900 font-bold">{currencyFormatter.format(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-slate-700">
                        <span className="font-medium">Discount {invoice.discountType === 'percentage' ? `(${invoice.discountRate}%)` : ''}</span>
                        <span className="font-bold">-{currencyFormatter.format(discountAmount)}</span>
                    </div>
                )}
                {taxRate > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">VAT ({taxRate}%)</span>
                        <span className="text-slate-900 font-bold">{currencyFormatter.format(tax)}</span>
                    </div>
                )}
                {whtRate > 0 && whtAmount && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">WHT ({whtRate}%)</span>
                        <span className="text-slate-900 font-bold">-{currencyFormatter.format(whtAmount)}</span>
                    </div>
                )}
                 {shipping > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600 font-bold">Shipping</span>
                        <span className="text-slate-900 font-bold">{currencyFormatter.format(shipping)}</span>
                    </div>
                )}
            </div>
            <div className={styles.totalBox}>
                <div className={`flex justify-between items-end px-4 pb-2 ${isCenterAligned ? 'flex-col items-center gap-2' : ''}`}>
                    <span className={styles.totalLabel}>Total Due</span>
                    <span className={styles.totalValue}>{currencyFormatter.format(total)}</span>
                </div>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto relative z-10">
          <div className="pt-6 border-t border-slate-200">
            <div className={`grid ${isCenterAligned ? 'grid-cols-1 text-center gap-6' : 'grid-cols-2 gap-8'} text-sm`}>
                <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Bank Details</p>
                    <div className="space-y-1 text-slate-800 font-medium">
                        <p><span className="font-bold text-slate-900">{user.bankName}</span></p>
                        <p className="font-mono text-slate-800">{user.accountNumber}</p>
                        <p>{user.name}</p>
                    </div>
                    {user.paymentLink && (
                        <div className="mt-4">
                            <a
                                href={user.paymentLink.startsWith('http') ? user.paymentLink : `https://${user.paymentLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white text-xs font-bold rounded-lg shadow-md shadow-teal-600/20 hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 active:scale-[0.98] transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                                Pay {invoice.currency} {(invoice.total || 0).toLocaleString()}
                            </a>
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    {(notes || terms) && (
                        <div>
                            {terms && (
                                <div className="mb-4">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Terms</p>
                                    <p className="text-slate-700 text-xs leading-relaxed font-medium whitespace-pre-wrap">{terms}</p>
                                </div>
                            )}
                            {notes && (
                                <div>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Notes</p>
                                    <p className="text-slate-700 italic leading-relaxed whitespace-pre-wrap">{notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {digitalSignature && (
                        <div className={`pt-6 border-t border-slate-100 ${isCenterAligned ? 'text-center' : 'text-right'}`}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Authorized Signature</p>
                            <p className="font-serif text-2xl text-slate-800 italic">{digitalSignature}</p>
                            <div className={`h-px w-32 bg-slate-200 mt-2 ${isCenterAligned ? 'mx-auto' : 'ml-auto'}`}></div>
                        </div>
                    )}
                </div>
            </div>
          </div>
      </footer>

      {!isPro && (
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none opacity-50">
           <p className="text-[10px] text-slate-400 font-medium">Generated with <span className="font-bold">InvoiceApp.ng</span></p>
        </div>
      )}
    </article>
  );
});
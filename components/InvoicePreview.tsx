
import React from 'react';
import type { Invoice, TemplateId, InvoiceStatus } from '../types';

interface InvoicePreviewProps {
  invoice: Invoice;
  totals: {
    subtotal: number;
    discountAmount: number;
    tax: number;
    shipping: number;
    total: number;
  };
  template: TemplateId;
  isPro?: boolean;
}

const StatusBadge: React.FC<{ status: InvoiceStatus; template: TemplateId }> = ({ status, template }) => {
    const baseClasses = "inline-block px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full border";

    const statusStyles: { [key in TemplateId]: { [key in InvoiceStatus]: string } } = {
        classic: {
            Draft: 'bg-slate-100 text-slate-700 border-slate-300',
            Sent: 'bg-blue-50 text-blue-800 border-blue-200',
            Paid: 'bg-teal-50 text-teal-800 border-teal-200',
            Overdue: 'bg-red-50 text-red-800 border-red-200',
        },
        modern: {
             Draft: 'bg-slate-200/20 text-slate-100 border-white/10',
             Sent: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
             Paid: 'bg-teal-500/20 text-teal-100 border-teal-400/30',
             Overdue: 'bg-red-500/20 text-red-100 border-red-400/30',
        },
        bold: {
            Draft: 'bg-slate-200 text-slate-900 border-slate-900',
            Sent: 'bg-blue-600 text-white border-blue-900',
            Paid: 'bg-teal-600 text-white border-teal-900',
            Overdue: 'bg-red-600 text-white border-red-900',
        },
        minimalist: {
            Draft: 'bg-slate-100 text-slate-700 border-slate-300',
            Sent: 'bg-blue-50 text-blue-700 border-blue-200',
            Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
        },
        professional: {
            Draft: 'bg-white/10 text-white border-white/20',
            Sent: 'bg-blue-500 text-white border-blue-600',
            Paid: 'bg-teal-500 text-white border-teal-600',
            Overdue: 'bg-red-500 text-white border-red-600',
        },
        elegant: {
            Draft: 'bg-stone-100 text-stone-700 border-stone-300',
            Sent: 'bg-blue-50 text-blue-800 border-blue-200',
            Paid: 'bg-amber-50 text-amber-800 border-amber-200',
            Overdue: 'bg-red-50 text-red-800 border-red-200',
        },
        tech: {
            Draft: 'bg-slate-100 text-slate-700 border-slate-400 border-dashed',
            Sent: 'bg-cyan-50 text-cyan-800 border-cyan-400 border-dashed',
            Paid: 'bg-green-50 text-green-800 border-green-400 border-dashed',
            Overdue: 'bg-red-50 text-red-800 border-red-400 border-dashed',
        }
    };
    
    return (
        <span className={`${baseClasses} ${statusStyles[template][status]}`}>
            {status}
        </span>
    );
};

// --- HEADER COMPONENTS ---

const ClassicHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-200">
      <div className="flex items-start gap-6">
          {user.logo && (
              <img src={user.logo} alt="Company Logo" className="h-20 w-auto object-contain" />
          )}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
            <div className="text-slate-600 text-sm leading-relaxed font-medium">
                <p>{user.address}</p>
                <div className="flex gap-3">
                    <p>{user.email}</p>
                    {user.phoneNumber && <p>• {user.phoneNumber}</p>}
                </div>
            </div>
          </div>
      </div>
      <div className="text-right space-y-2">
        <h1 className="text-4xl font-light text-slate-400 uppercase tracking-[0.2em]">Invoice</h1>
        <p className="text-slate-800 font-mono font-bold">#{invoiceNumber}</p>
        <div><StatusBadge status={status} template="classic" /></div>
      </div>
    </div>
);

const ModernHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="bg-slate-900 text-white p-10 -mx-8 -mt-8 mb-10 md:p-12 md:-mx-12 md:-mt-12 relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-80 h-80 bg-slate-800 rounded-full -mr-24 -mt-40 opacity-50 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full -ml-32 -mb-32 opacity-30 blur-2xl"></div>
        
        <div className="relative z-10 flex justify-between items-start">
            <div className="flex flex-col justify-between h-full">
                <h1 className="text-5xl font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white">INVOICE</h1>
                <div className="flex items-center gap-4 mt-2">
                    <p className="text-slate-300 font-mono text-lg">#{invoiceNumber}</p>
                    <StatusBadge status={status} template="modern" />
                </div>
            </div>
            <div className="flex items-center gap-5 text-right">
                <div>
                    <h2 className="text-xl font-semibold mb-2 text-teal-50">{user.name}</h2>
                    <div className="text-slate-300 text-sm space-y-0.5">
                        <p>{user.address}</p>
                        <p>{user.email}</p>
                        {user.phoneNumber && <p>{user.phoneNumber}</p>}
                    </div>
                </div>
                {user.logo && (
                  <img src={user.logo} alt="Company Logo" className="h-20 w-20 rounded-lg bg-white p-1 object-contain" />
                )}
            </div>
        </div>
    </div>
);

const BoldHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="mb-12">
        <div className="flex justify-between items-start border-b-[6px] border-black pb-6">
            <div className="flex items-center gap-6">
                {user.logo && (
                   <img src={user.logo} alt="Logo" className="h-24 w-auto object-contain mix-blend-multiply" />
                )}
                <div>
                    <h2 className="text-5xl font-black text-black uppercase tracking-tighter leading-none">{user.name}</h2>
                    <div className="text-slate-600 font-bold mt-2 flex flex-col sm:flex-row sm:gap-4">
                        <p>{user.email}</p>
                        {user.phoneNumber && <p>{user.phoneNumber}</p>}
                    </div>
                </div>
            </div>
             <div className="pt-2">
                 <StatusBadge status={status} template="bold" />
             </div>
        </div>
        <div className="mt-6 flex items-baseline gap-4">
            <h1 className="text-7xl font-black text-slate-300 tracking-tighter">INVOICE</h1>
            <span className="text-3xl text-black font-mono font-bold">#{invoiceNumber}</span>
        </div>
    </div>
);

const MinimalistHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="mb-16 text-center">
        {user.logo ? (
             <img src={user.logo} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-6" />
        ) : (
             <div className="h-12 w-12 bg-slate-900 rounded-full mx-auto mb-6"></div>
        )}
        
        <h2 className="text-2xl font-bold tracking-wide text-slate-900 mb-2">{user.name}</h2>
        <p className="text-slate-600 text-sm mb-8">
            {user.email} • {user.address}
            {user.phoneNumber && <> • {user.phoneNumber}</>}
        </p>
        
        <div className="inline-flex flex-col items-center gap-2 border-y border-slate-200 py-4 w-full max-w-md mx-auto">
             <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">Invoice No.</h1>
             <p className="text-3xl font-light text-slate-900">{invoiceNumber}</p>
             <div className="mt-1"><StatusBadge status={status} template="minimalist" /></div>
        </div>
    </div>
);

const ProfessionalHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="mb-10">
        <div className="bg-teal-800 text-white p-8 -mx-8 -mt-8 mb-8 flex justify-between items-center">
             <div className="flex items-center gap-4">
                 {user.logo && <img src={user.logo} className="h-16 w-auto bg-white p-1 rounded" alt="Logo"/>}
                 <div>
                     <h2 className="text-2xl font-bold">{user.name}</h2>
                     <p className="text-teal-100 text-sm font-medium opacity-90">Business Invoice</p>
                 </div>
             </div>
             <div className="text-right">
                 <h1 className="text-3xl font-bold opacity-100">INVOICE</h1>
                 <p className="font-mono opacity-90">#{invoiceNumber}</p>
             </div>
        </div>
        <div className="flex justify-between items-center border-b border-slate-200 pb-4">
             <div className="text-sm text-slate-600 font-medium flex gap-3">
                 <span>{user.address}</span>
                 <span>|</span>
                 <span>{user.email}</span>
                 {user.phoneNumber && (
                     <>
                        <span>|</span>
                        <span>{user.phoneNumber}</span>
                     </>
                 )}
             </div>
             <StatusBadge status={status} template="professional" />
        </div>
    </div>
);

const ElegantHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="mb-16 font-serif">
        <div className="text-center mb-8">
             {user.logo && <img src={user.logo} className="h-24 w-auto mx-auto mb-6" alt="Logo"/>}
             <h2 className="text-4xl text-slate-900 tracking-wide italic mb-2">{user.name}</h2>
             <div className="h-1 w-16 bg-amber-400 mx-auto mb-4"></div>
             <p className="text-slate-600 text-sm italic">
                {user.address} • {user.email}
                {user.phoneNumber && <> • {user.phoneNumber}</>}
             </p>
        </div>
        <div className="flex justify-between items-end border-b border-slate-200 pb-2">
            <div className="text-left">
                 <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">Invoice For</p>
            </div>
            <div className="text-right flex flex-col items-end">
                <p className="text-2xl text-slate-900">{invoiceNumber}</p>
                <StatusBadge status={status} template="elegant" />
            </div>
        </div>
    </div>
);

const TechHeader: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus }> = ({ user, invoiceNumber, status }) => (
    <div className="mb-10 font-mono">
        <div className="border-2 border-slate-800 p-6 flex justify-between items-start mb-6 relative">
             {/* Decorative corner squares */}
             <div className="absolute top-0 left-0 w-2 h-2 bg-slate-800"></div>
             <div className="absolute top-0 right-0 w-2 h-2 bg-slate-800"></div>
             <div className="absolute bottom-0 left-0 w-2 h-2 bg-slate-800"></div>
             <div className="absolute bottom-0 right-0 w-2 h-2 bg-slate-800"></div>

             <div className="flex gap-4">
                {user.logo && <img src={user.logo} className="h-16 w-16 object-contain border border-slate-200 p-1" alt="Logo"/>}
                <div>
                    <h2 className="text-xl font-bold uppercase mb-1">{user.name}</h2>
                    <p className="text-xs text-slate-600 font-bold">{`// ${user.email}`}</p>
                    <p className="text-xs text-slate-600 font-bold">{`// ${user.address}`}</p>
                    {user.phoneNumber && <p className="text-xs text-slate-600 font-bold">{`// ${user.phoneNumber}`}</p>}
                </div>
             </div>
             <div className="text-right">
                 <h1 className="text-2xl font-bold tracking-tighter mb-1">INV_OICE</h1>
                 <p className="text-sm bg-slate-800 text-white px-2 py-0.5 inline-block font-bold">ID: {invoiceNumber}</p>
             </div>
        </div>
        <div className="flex justify-end">
            <StatusBadge status={status} template="tech" />
        </div>
    </div>
);

const getTemplateStyles = (template: TemplateId) => {
    switch (template) {
        case 'modern':
            return {
                tableHead: 'bg-slate-50 border-y border-slate-200',
                th: 'text-slate-600 uppercase tracking-wider text-[10px] font-bold py-3',
                row: 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors',
                td: 'py-4 text-sm text-slate-700 font-medium',
                totalLabel: 'text-slate-400 font-medium text-sm',
                totalValue: 'text-white font-bold text-3xl',
                totalBox: 'bg-slate-900 p-8 rounded-xl shadow-xl -mx-4 mt-4',
            };
        case 'bold':
            return {
                tableHead: 'bg-black text-white',
                th: 'text-white uppercase tracking-widest text-xs font-black py-4',
                row: 'border-b-2 border-slate-100',
                td: 'py-5 text-base font-bold text-slate-900',
                totalLabel: 'text-black font-black text-xl uppercase',
                totalValue: 'text-black font-black text-4xl',
                totalBox: 'border-t-[6px] border-black pt-4 mt-4',
            };
        case 'minimalist':
            return {
                tableHead: 'border-b border-slate-200',
                th: 'text-slate-600 font-bold text-xs uppercase tracking-widest py-4',
                row: 'border-b border-slate-50',
                td: 'py-6 text-sm text-slate-700 font-medium',
                totalLabel: 'text-slate-500 font-bold text-sm uppercase tracking-widest',
                totalValue: 'text-slate-900 font-light text-4xl',
                totalBox: 'pt-8 mt-4 text-center border-t border-slate-200',
            };
        case 'professional':
            return {
                tableHead: 'bg-teal-50 border-b-2 border-teal-800',
                th: 'text-teal-900 font-bold text-xs uppercase py-3',
                row: 'border-b border-slate-200',
                td: 'py-3 text-sm text-slate-700 font-medium',
                totalLabel: 'text-teal-900 font-bold text-lg',
                totalValue: 'text-teal-900 font-bold text-2xl',
                totalBox: 'bg-teal-50 p-6 rounded-lg border border-teal-100 mt-2',
            };
        case 'elegant':
            return {
                tableHead: 'border-b border-amber-200 font-serif',
                th: 'text-amber-800 font-bold text-xs uppercase tracking-widest py-3 italic',
                row: 'border-b border-slate-50 font-serif',
                td: 'py-4 text-sm text-slate-700',
                totalLabel: 'text-amber-900 font-serif italic text-lg',
                totalValue: 'text-slate-900 font-serif text-2xl',
                totalBox: 'border-t-4 border-double border-amber-200 pt-4 mt-4',
            };
        case 'tech':
            return {
                tableHead: 'bg-slate-100 border border-slate-300 font-mono',
                th: 'text-slate-800 font-bold text-xs uppercase py-2 px-2 border-r border-slate-300 last:border-r-0',
                row: 'border border-slate-200 font-mono hover:bg-slate-50',
                td: 'py-2 px-2 text-xs text-slate-800 font-medium border-r border-slate-200 last:border-r-0',
                totalLabel: 'text-slate-600 font-mono text-xs uppercase font-bold',
                totalValue: 'text-slate-900 font-mono font-bold text-xl',
                totalBox: 'border border-slate-800 p-4 mt-4 bg-slate-50 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]',
            };
        case 'classic':
        default:
            return {
                tableHead: 'border-b-2 border-teal-600',
                th: 'text-teal-900 font-bold text-xs uppercase tracking-wide py-3',
                row: 'border-b border-slate-100',
                td: 'py-4 text-sm text-slate-700 font-medium',
                totalLabel: 'text-slate-700 font-bold text-lg',
                totalValue: 'text-teal-800 font-bold text-2xl',
                totalBox: 'pt-4 border-t border-slate-200 mt-2',
            };
    }
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ invoice, totals, template, isPro = false }) => {
  const { user, client, issueDate, dueDate, lineItems, notes, terms, taxRate, whtRate, discountRate, shippingAmount, currency, status } = invoice;
  const { subtotal, discountAmount, tax, whtAmount, shipping, total } = totals;
  const styles = getTemplateStyles(template);

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  });

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
        {template === 'classic' && <ClassicHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'modern' && <ModernHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'bold' && <BoldHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'minimalist' && <MinimalistHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'professional' && <ProfessionalHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'elegant' && <ElegantHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
        {template === 'tech' && <TechHeader user={user} invoiceNumber={invoice.invoiceNumber} status={invoice.status} />}
      </header>

      {/* Bill To / Dates Grid */}
      <section className={`grid grid-cols-2 gap-12 mb-12 relative z-10 ${isCenterAligned ? 'text-center' : ''}`} aria-label="Client and Date Information">
        <div className={isCenterAligned ? 'order-2' : ''}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Bill To</p>
          <h3 className="font-bold text-slate-900 text-xl mb-2">{client.name}</h3>
          <div className="text-slate-700 text-sm space-y-1 font-medium">
             <p className="whitespace-pre-line">{client.address}</p>
             <p className="text-teal-700 font-semibold">{client.email}</p>
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
                            <a href={user.paymentLink.startsWith('http') ? user.paymentLink : `https://${user.paymentLink}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-teal-700 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Pay Now
                            </a>
                        </div>
                    )}
                </div>
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
};

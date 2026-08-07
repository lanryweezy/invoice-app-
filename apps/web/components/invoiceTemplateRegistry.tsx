import React from 'react';
import type { Invoice, TemplateId, InvoiceStatus, DocumentType } from '../types';

/**
 * 🔩 Hinge Extension Point: InvoiceTemplateStrategy
 *
 * Pressure: The `InvoicePreview` component had growing `switch (template)` blocks for getting template styles and hardcoded mapping `STATUS_STYLES` for badge styling.
 * Also, a conditional block was used for header components. These needed modification every time a new template was added.
 *
 * Contract:
 * - Implementors provide a `InvoiceTemplateStrategy` with an ID, styles for the badge and invoice elements, and a custom header component.
 * - The registry centralizes the configuration so new templates can be added cleanly.
 */

export interface InvoiceTemplateStrategy {
    id: TemplateId;
    statusStyles: { [key in InvoiceStatus]: string };
    getTemplateStyles: () => {
        tableHead: string;
        th: string;
        row: string;
        td: string;
        totalLabel: string;
        totalValue: string;
        totalBox: string;
    };
    HeaderComponent: React.FC<{ user: Invoice['user'], invoiceNumber: string, status: InvoiceStatus, documentType?: DocumentType, badge: React.ReactNode }>;
}

const templateStrategies = new Map<TemplateId, InvoiceTemplateStrategy>();

export function registerTemplateStrategy(strategy: InvoiceTemplateStrategy): void {
    templateStrategies.set(strategy.id, strategy);
}

export function getTemplateStrategy(id: TemplateId): InvoiceTemplateStrategy {
    return templateStrategies.get(id) || templateStrategies.get('classic')!;
}

// --- REGISTER EXISTING TEMPLATES ---

registerTemplateStrategy({
    id: 'classic',
    statusStyles: {
        Draft: 'bg-slate-100 text-slate-700 border-slate-300',
        Sent: 'bg-blue-50 text-blue-800 border-blue-200',
        Paid: 'bg-teal-50 text-teal-800 border-teal-200',
        Overdue: 'bg-red-50 text-red-800 border-red-200',
    },
    getTemplateStyles: () => ({
        tableHead: 'border-b-2 border-teal-600',
        th: 'text-teal-900 font-bold text-xs uppercase tracking-wide py-3',
        row: 'border-b border-slate-100',
        td: 'py-4 text-sm text-slate-700 font-medium',
        totalLabel: 'text-slate-700 font-bold text-lg',
        totalValue: 'text-teal-800 font-bold text-2xl',
        totalBox: 'pt-4 border-t border-slate-200 mt-2',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="flex justify-between items-start mb-12 pb-8 border-b-2 border-slate-200">
            <div className="flex items-start gap-6">
                {user.logo && (
                    <img src={user.logo} alt="Company Logo" className="h-20 w-auto object-contain" />
                )}
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
                    {user.cacNumber && <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">CAC: {user.cacNumber}</p>}
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
                <h1 className="text-4xl font-light text-slate-400 uppercase tracking-[0.2em]">{documentType || 'Invoice'}</h1>
                <p className="text-slate-800 font-mono font-bold">#{invoiceNumber}</p>
                <div>{badge}</div>
            </div>
        </div>
    )
});

registerTemplateStrategy({
    id: 'modern',
    statusStyles: {
        Draft: 'bg-slate-200/20 text-slate-100 border-white/10',
        Sent: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
        Paid: 'bg-teal-500/20 text-teal-100 border-teal-400/30',
        Overdue: 'bg-red-500/20 text-red-100 border-red-400/30',
    },
    getTemplateStyles: () => ({
        tableHead: 'bg-slate-50 border-y border-slate-200',
        th: 'text-slate-600 uppercase tracking-wider text-[10px] font-bold py-3',
        row: 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors',
        td: 'py-4 text-sm text-slate-700 font-medium',
        totalLabel: 'text-slate-400 font-medium text-sm',
        totalValue: 'text-white font-bold text-3xl',
        totalBox: 'bg-slate-900 p-8 rounded-xl shadow-xl -mx-4 mt-4',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="bg-slate-900 text-white p-10 -mx-8 -mt-8 mb-10 md:p-12 md:-mx-12 md:-mt-12 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-80 h-80 bg-slate-800 rounded-full -mr-24 -mt-40 opacity-50 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600 rounded-full -ml-32 -mb-32 opacity-30 blur-2xl"></div>

            <div className="relative z-10 flex justify-between items-start">
                <div className="flex flex-col justify-between h-full">
                    <h1 className="text-5xl font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-teal-200 to-white uppercase">{(documentType || 'Invoice').toUpperCase()}</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-300 font-mono text-lg">#{invoiceNumber}</p>
                        {badge}
                    </div>
                </div>
                <div className="flex items-center gap-5 text-right">
                    <div>
                        <h2 className="text-xl font-semibold mb-2 text-teal-50">{user.name}</h2>
                        {user.cacNumber && <p className="text-[10px] font-bold text-teal-400 uppercase tracking-tighter mb-1">CAC: {user.cacNumber}</p>}
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
    )
});

registerTemplateStrategy({
    id: 'bold',
    statusStyles: {
        Draft: 'bg-slate-200 text-slate-900 border-slate-900',
        Sent: 'bg-blue-600 text-white border-blue-900',
        Paid: 'bg-teal-600 text-white border-teal-900',
        Overdue: 'bg-red-600 text-white border-red-900',
    },
    getTemplateStyles: () => ({
        tableHead: 'bg-black text-white',
        th: 'text-white uppercase tracking-widest text-xs font-black py-4',
        row: 'border-b-2 border-slate-100',
        td: 'py-5 text-base font-bold text-slate-900',
        totalLabel: 'text-black font-black text-xl uppercase',
        totalValue: 'text-black font-black text-4xl',
        totalBox: 'border-t-[6px] border-black pt-4 mt-4',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="mb-12">
            <div className="flex justify-between items-start border-b-[6px] border-black pb-6">
                <div className="flex items-center gap-6">
                    {user.logo && (
                       <img src={user.logo} alt="Logo" className="h-24 w-auto object-contain mix-blend-multiply" />
                    )}
                    <div>
                        <h2 className="text-5xl font-black text-black uppercase tracking-tighter leading-none">{user.name}</h2>
                        {user.cacNumber && <p className="text-xs font-black text-black uppercase mt-1">CAC: {user.cacNumber}</p>}
                        <div className="text-slate-600 font-bold mt-2 flex flex-col sm:flex-row sm:gap-4">
                            <p>{user.email}</p>
                            {user.phoneNumber && <p>{user.phoneNumber}</p>}
                        </div>
                    </div>
                </div>
                 <div className="pt-2">
                     {badge}
                 </div>
            </div>
            <div className="mt-6 flex items-baseline gap-4">
                <h1 className="text-7xl font-black text-slate-300 tracking-tighter uppercase">{(documentType || 'Invoice').toUpperCase()}</h1>
                <span className="text-3xl text-black font-mono font-bold">#{invoiceNumber}</span>
            </div>
        </div>
    )
});


registerTemplateStrategy({
    id: 'minimalist',
    statusStyles: {
        Draft: 'bg-slate-100 text-slate-700 border-slate-300',
        Sent: 'bg-blue-50 text-blue-700 border-blue-200',
        Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Overdue: 'bg-rose-50 text-rose-700 border-rose-200',
    },
    getTemplateStyles: () => ({
        tableHead: 'border-b border-slate-200',
        th: 'text-slate-600 font-bold text-xs uppercase tracking-widest py-4',
        row: 'border-b border-slate-50',
        td: 'py-6 text-sm text-slate-700 font-medium',
        totalLabel: 'text-slate-500 font-bold text-sm uppercase tracking-widest',
        totalValue: 'text-slate-900 font-light text-4xl',
        totalBox: 'pt-8 mt-4 text-center border-t border-slate-200',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="mb-16 text-center">
            {user.logo ? (
                 <img src={user.logo} alt="Logo" className="h-20 w-auto object-contain mx-auto mb-6" />
            ) : (
                 <div className="h-12 w-12 bg-slate-900 rounded-full mx-auto mb-6"></div>
            )}

            <h2 className="text-2xl font-bold tracking-wide text-slate-900 mb-2">{user.name}</h2>
            {user.cacNumber && <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">CAC: {user.cacNumber}</p>}
            <p className="text-slate-600 text-sm mb-8">
                {user.email} • {user.address}
                {user.phoneNumber && <> • {user.phoneNumber}</>}
            </p>

            <div className="inline-flex flex-col items-center gap-2 border-y border-slate-200 py-4 w-full max-w-md mx-auto">
                 <h1 className="text-sm font-bold uppercase tracking-[0.3em] text-slate-500">{documentType || 'Invoice'} No.</h1>
                 <p className="text-3xl font-light text-slate-900">{invoiceNumber}</p>
                 <div className="mt-1">{badge}</div>
            </div>
        </div>
    )
});

registerTemplateStrategy({
    id: 'professional',
    statusStyles: {
        Draft: 'bg-white/10 text-white border-white/20',
        Sent: 'bg-blue-500 text-white border-blue-600',
        Paid: 'bg-teal-500 text-white border-teal-600',
        Overdue: 'bg-red-500 text-white border-red-600',
    },
    getTemplateStyles: () => ({
        tableHead: 'bg-teal-50 border-b-2 border-teal-800',
        th: 'text-teal-900 font-bold text-xs uppercase py-3',
        row: 'border-b border-slate-200',
        td: 'py-3 text-sm text-slate-700 font-medium',
        totalLabel: 'text-teal-900 font-bold text-lg',
        totalValue: 'text-teal-900 font-bold text-2xl',
        totalBox: 'bg-teal-50 p-6 rounded-lg border border-teal-100 mt-2',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="mb-10">
            <div className="bg-teal-800 text-white p-8 -mx-8 -mt-8 mb-8 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                     {user.logo && <img src={user.logo} className="h-16 w-auto bg-white p-1 rounded" alt="Logo"/>}
                     <div>
                         <h2 className="text-2xl font-bold">{user.name}</h2>
                         <p className="text-teal-100 text-sm font-medium opacity-90">Official Business {documentType || 'Invoice'}</p>
                         {user.cacNumber && <p className="text-[9px] font-bold text-teal-200 uppercase tracking-widest mt-1">CAC: {user.cacNumber}</p>}
                     </div>
                 </div>
                 <div className="text-right">
                     <h1 className="text-3xl font-bold opacity-100 uppercase">{(documentType || 'Invoice').toUpperCase()}</h1>
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
                 {badge}
            </div>
        </div>
    )
});

registerTemplateStrategy({
    id: 'elegant',
    statusStyles: {
        Draft: 'bg-stone-100 text-stone-700 border-stone-300',
        Sent: 'bg-blue-50 text-blue-800 border-blue-200',
        Paid: 'bg-amber-50 text-amber-800 border-amber-200',
        Overdue: 'bg-red-50 text-red-800 border-red-200',
    },
    getTemplateStyles: () => ({
        tableHead: 'border-b border-amber-200 font-serif',
        th: 'text-amber-800 font-bold text-xs uppercase tracking-widest py-3 italic',
        row: 'border-b border-slate-50 font-serif',
        td: 'py-4 text-sm text-slate-700',
        totalLabel: 'text-amber-900 font-serif italic text-lg',
        totalValue: 'text-slate-900 font-serif text-2xl',
        totalBox: 'border-t-4 border-double border-amber-200 pt-4 mt-4',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
        <div className="mb-16 font-serif">
            <div className="text-center mb-8">
                 {user.logo && <img src={user.logo} className="h-24 w-auto mx-auto mb-6" alt="Logo"/>}
                 <h2 className="text-4xl text-slate-900 tracking-wide italic mb-2">{user.name}</h2>
                 {user.cacNumber && <p className="text-[10px] font-bold text-amber-700 uppercase tracking-[0.2em] mb-4">CAC: {user.cacNumber}</p>}
                 <div className="h-1 w-16 bg-amber-400 mx-auto mb-4"></div>
                 <p className="text-slate-600 text-sm italic">
                    {user.address} • {user.email}
                    {user.phoneNumber && <> • {user.phoneNumber}</>}
                 </p>
            </div>
            <div className="flex justify-between items-end border-b border-slate-200 pb-2">
                <div className="text-left">
                     <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">{documentType || 'Invoice'} For</p>
                </div>
                <div className="text-right flex flex-col items-end">
                    <p className="text-2xl text-slate-900">{invoiceNumber}</p>
                    {badge}
                </div>
            </div>
        </div>
    )
});

registerTemplateStrategy({
    id: 'tech',
    statusStyles: {
        Draft: 'bg-slate-100 text-slate-700 border-slate-400 border-dashed',
        Sent: 'bg-cyan-50 text-cyan-800 border-cyan-400 border-dashed',
        Paid: 'bg-green-50 text-green-800 border-green-400 border-dashed',
        Overdue: 'bg-red-50 text-red-800 border-red-400 border-dashed',
    },
    getTemplateStyles: () => ({
        tableHead: 'bg-slate-100 border border-slate-300 font-mono',
        th: 'text-slate-800 font-bold text-xs uppercase py-2 px-2 border-r border-slate-300 last:border-r-0',
        row: 'border border-slate-200 font-mono hover:bg-slate-50',
        td: 'py-2 px-2 text-xs text-slate-800 font-medium border-r border-slate-200 last:border-r-0',
        totalLabel: 'text-slate-600 font-mono text-xs uppercase font-bold',
        totalValue: 'text-slate-900 font-mono font-bold text-xl',
        totalBox: 'border border-slate-800 p-4 mt-4 bg-slate-50 shadow-[4px_4px_0px_0px_rgba(30,41,59,1)]',
    }),
    HeaderComponent: ({ user, invoiceNumber, status, documentType, badge }) => (
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
                        {user.cacNumber && <p className="text-[10px] font-bold text-slate-500 mb-2">{`// CAC: ${user.cacNumber}`}</p>}
                        <p className="text-xs text-slate-600 font-bold">{`// ${user.email}`}</p>
                        <p className="text-xs text-slate-600 font-bold">{`// ${user.address}`}</p>
                        {user.phoneNumber && <p className="text-xs text-slate-600 font-bold">{`// ${user.phoneNumber}`}</p>}
                    </div>
                 </div>
                 <div className="text-right">
                    <h1 className="text-2xl font-black bg-slate-800 text-white px-2 py-1 mb-1 uppercase tracking-tighter">{(documentType || 'Invoice').toUpperCase()}</h1>
                    <p className="text-sm font-bold">#{invoiceNumber}</p>
                    <div className="mt-2 flex justify-end">{badge}</div>
                 </div>
            </div>
        </div>
    )
});

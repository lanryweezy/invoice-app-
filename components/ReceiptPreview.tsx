import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { Receipt, TemplateId } from '../types';
import { DownloadIcon, MailIcon, XIcon } from './Icons';

// ⚡ Bolt: Cache Intl.NumberFormat instance globally to avoid ~0.6ms overhead per instantiation inside render loop.
const numberFormatter = new Intl.NumberFormat();

interface ReceiptPreviewProps {
    receipt: Receipt;
    template: TemplateId;
    onClose: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipt, template, onClose }) => {
    const receiptRef = useRef<HTMLDivElement>(null);
    const invoice = receipt.invoice;

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            const canvas = await html2canvas(receiptRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Receipt_${receipt.id}.pdf`);
        } catch (error) {
            console.error("Failed to generate PDF", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900">Receipt {receipt.id}</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownload} className="flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg transition-colors text-sm font-semibold">
                            <DownloadIcon className="w-4 h-4" /> Download PDF
                        </button>
                        <button onClick={() => window.location.href = `mailto:${invoice.client.email}?subject=Receipt ${receipt.id} from ${invoice.user.name}&body=Please find attached the receipt ${receipt.id} for invoice ${invoice.invoiceNumber}.`} className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors text-sm font-semibold">
                            <MailIcon className="w-4 h-4" /> Email
                        </button>
                        <button onClick={onClose} aria-label="Close receipt preview" className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="overflow-y-auto p-8 bg-slate-100 flex-1">
                    <div ref={receiptRef} className="bg-white p-10 max-w-2xl mx-auto shadow-sm border border-slate-200 min-h-[800px] relative">
                        {/* Status Stamp */}
                        <div className="absolute top-10 right-10 opacity-10 transform rotate-12 pointer-events-none">
                            <span className="text-6xl font-bold text-teal-600 border-8 border-teal-600 rounded-lg p-4 tracking-widest uppercase">PAID</span>
                        </div>

                        {/* Header */}
                        <div className="flex justify-between items-start mb-12 border-b-2 border-slate-100 pb-8">
                            <div className="flex items-start gap-4">
                                {invoice.user.logo && (
                                    <img src={invoice.user.logo} alt="Logo" className="h-16 w-auto object-contain" />
                                )}
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">{invoice.user.name}</h2>
                                    <p className="text-slate-500 text-sm mt-1">{invoice.user.address}</p>
                                    <p className="text-slate-500 text-sm">{invoice.user.email} {invoice.user.phoneNumber ? `• ${invoice.user.phoneNumber}` : ''}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <h1 className="text-3xl font-bold text-teal-600 tracking-tight uppercase">Receipt</h1>
                                <p className="text-slate-500 font-medium mt-2">{receipt.id}</p>
                                <p className="text-slate-500 text-sm mt-1">Date: {receipt.paymentDate}</p>
                            </div>
                        </div>

                        {/* Client Info & Payment Summary */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Received From</h3>
                                <p className="font-bold text-slate-800 text-lg">{invoice.client.name}</p>
                                <p className="text-slate-600 text-sm mt-1 whitespace-pre-wrap">{invoice.client.address}</p>
                                <p className="text-slate-600 text-sm">{invoice.client.email}</p>
                            </div>
                            <div className="bg-teal-50 p-5 rounded-xl border border-teal-100">
                                <h3 className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-2">Payment Details</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Invoice Ref:</span>
                                        <span className="font-medium text-slate-800">{receipt.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Method:</span>
                                        <span className="font-medium text-slate-800">{receipt.paymentMethod}</span>
                                    </div>
                                    {receipt.transactionReference && (
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Transaction ID:</span>
                                            <span className="font-medium text-slate-800">{receipt.transactionReference}</span>
                                        </div>
                                    )}
                                    <div className="pt-2 mt-2 border-t border-teal-200/50 flex justify-between items-center">
                                        <span className="font-bold text-teal-800">Amount Paid:</span>
                                        <span className="text-xl font-bold text-teal-600">{invoice.currency} {numberFormatter.format(receipt.amountPaid)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Items Summary */}
                        <div className="mb-10">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">Items Covered</h3>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 border-b border-slate-100">
                                        <th className="py-2 font-medium">Description</th>
                                        <th className="py-2 font-medium text-right w-24">Qty</th>
                                        <th className="py-2 font-medium text-right w-32">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.lineItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-50 text-slate-700">
                                            <td className="py-3">{item.description || 'Item'}</td>
                                            <td className="py-3 text-right">{item.quantity}</td>
                                            <td className="py-3 text-right">{invoice.currency} {numberFormatter.format(item.quantity * Number(item.price || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer message */}
                        <div className="mt-16 text-center text-slate-500 text-sm">
                            <p className="font-medium text-slate-700 mb-1">Thank you for your business!</p>
                            <p>This is a valid receipt for the payment received.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

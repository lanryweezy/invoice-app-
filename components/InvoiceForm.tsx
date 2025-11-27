
import React, { useState, useRef } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus } from '../types';
import { TrashIcon, PlusIcon, UserIcon, ListIcon, UploadIcon, ChevronDownIcon, ChevronUpIcon, EmptyBoxIcon } from './Icons';

interface InvoiceFormProps {
  invoice: Invoice;
  updateInvoice: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => void;
}

type FormTab = 'details' | 'items';

const InputField: React.FC<{ 
  id?: string, 
  label: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  type?: string; 
  placeholder?: string; 
  className?: string, 
  name?: string
}> = ({ id, label, value, onChange, type = 'text', placeholder, className, name }) => (
  <div className={className}>
    <label htmlFor={id || name} className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">{label}</label>
    <input
      id={id || name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-medium shadow-sm placeholder:text-slate-400
      focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 hover:border-slate-400 transition-all duration-200"
    />
  </div>
);

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4 transition-all hover:shadow-md">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors text-left"
            >
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-400" />}
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 sm:p-6 border-t border-slate-100">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, updateInvoice, addLineItem, removeLineItem, updateLineItem }) => {
  const [activeTab, setActiveTab] = useState<FormTab>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice('user', { ...invoice.user, [name]: value });
  };
  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice('client', { ...invoice.client, [name]: value });
  };
  const handleInvoiceMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice(name as keyof Invoice, value);
  };
  const handleLineItemChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const isNumeric = name === 'quantity' || name === 'price';
    updateLineItem(id, name as keyof Omit<LineItem, 'id'>, isNumeric ? parseFloat(value) || 0 : value);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) {
            alert("File size too large. Please upload a logo under 2MB.");
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            updateInvoice('user', { ...invoice.user, logo: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mobile-Friendly Steps/Tabs */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6">
        <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'details' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
            <UserIcon className="w-5 h-5" /> 
            <span>Details</span>
        </button>
        <button 
            onClick={() => setActiveTab('items')}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'items' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
            <div className="flex items-center gap-2">
                <ListIcon className="w-5 h-5" /> 
                <span>Items</span>
            </div>
            <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs hidden sm:inline-block">{invoice.lineItems.length}</span>
        </button>
      </div>

      {/* Details Tab Content */}
      <div className={activeTab === 'details' ? 'space-y-6 animate-fadeIn' : 'hidden'}>
        
        {/* Business Info */}
        <CollapsibleSection title="From (Your Business)">
            {/* Logo Upload */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Company Logo</label>
                <div className="flex items-center gap-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`h-24 w-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all overflow-hidden relative group bg-white ${invoice.user.logo ? 'border-solid border-slate-200' : ''}`}
                    >
                        {invoice.user.logo ? (
                            <>
                                <img src={invoice.user.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-medium">Change</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <UploadIcon className="w-8 h-8 text-slate-300 mx-auto mb-1 group-hover:text-teal-500 transition-colors" />
                            </div>
                        )}
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleLogoUpload}
                        />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700 mb-1">Upload Logo</p>
                        <p className="text-xs text-slate-500 mb-3 leading-relaxed">Recommended: Square PNG or JPG, max 2MB.</p>
                        {invoice.user.logo && (
                             <button 
                                onClick={() => updateInvoice('user', { ...invoice.user, logo: undefined })}
                                className="text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 px-2 py-1 rounded-md"
                             >
                                Remove Logo
                             </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
                <InputField label="Business Name" name="name" value={invoice.user.name} onChange={handleUserChange} placeholder="e.g. Emeka Ventures" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Email" name="email" value={invoice.user.email} onChange={handleUserChange} type="email" />
                    <InputField label="Address" name="address" value={invoice.user.address} onChange={handleUserChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <InputField label="Bank Name" name="bankName" value={invoice.user.bankName} onChange={handleUserChange} placeholder="GTBank" />
                    <InputField label="Account Number" name="accountNumber" value={invoice.user.accountNumber} onChange={handleUserChange} placeholder="0123456789" />
                </div>
            </div>
        </CollapsibleSection>

        {/* Client Info */}
        <CollapsibleSection title="Bill To (Client)">
            <div className="grid grid-cols-1 gap-5">
                <InputField label="Client Name" name="name" value={invoice.client.name} onChange={handleClientChange} placeholder="Client Business Name" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Email" name="email" value={invoice.client.email} onChange={handleClientChange} type="email" />
                    <InputField label="Address" name="address" value={invoice.client.address} onChange={handleClientChange} />
                </div>
            </div>
        </CollapsibleSection>

        {/* Invoice Metadata */}
        <CollapsibleSection title="Settings & Dates">
            <div className="grid grid-cols-2 gap-5">
                <InputField label="Invoice #" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleInvoiceMetaChange} />
                <div>
                    <label htmlFor="status" className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Status</label>
                    <div className="relative">
                        <select
                            id="status"
                            name="status"
                            value={invoice.status}
                            onChange={(e) => updateInvoice('status', e.target.value as InvoiceStatus)}
                            className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer appearance-none"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <InputField label="Issue Date" name="issueDate" value={invoice.issueDate} onChange={handleInvoiceMetaChange} type="date" />
                <InputField label="Due Date" name="dueDate" value={invoice.dueDate} onChange={handleInvoiceMetaChange} type="date" />
                <div>
                    <label htmlFor="currency" className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Currency</label>
                    <div className="relative">
                        <select
                            id="currency"
                            name="currency"
                            value={invoice.currency}
                            onChange={(e) => updateInvoice('currency', e.target.value as Currency)}
                            className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all cursor-pointer appearance-none"
                        >
                            <option value="NGN">NGN (₦)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                        </select>
                        <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                <InputField label="VAT (%)" name="taxRate" value={invoice.taxRate} onChange={(e) => updateInvoice('taxRate', parseFloat(e.target.value) || 0)} type="number" />
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Terms & Notes" defaultOpen={false}>
            <div className="space-y-6">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Terms & Conditions</label>
                    <textarea
                        name="terms"
                        value={invoice.terms}
                        onChange={(e) => updateInvoice('terms', e.target.value)}
                        rows={3}
                        placeholder="e.g. Payment due within 14 days"
                        className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 hover:border-slate-400 transition-all resize-none"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Additional Notes</label>
                    <textarea
                        name="notes"
                        value={invoice.notes}
                        onChange={(e) => updateInvoice('notes', e.target.value)}
                        rows={3}
                        placeholder="e.g. Thank you for your business!"
                        className="block w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-900 text-base font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 hover:border-slate-400 transition-all resize-none"
                    />
                </div>
            </div>
        </CollapsibleSection>
      </div>

      {/* Items Tab Content */}
      <div className={activeTab === 'items' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
        <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Line Items</h3>
            <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">Auto-saved</span>
        </div>
        
        {invoice.lineItems.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <EmptyBoxIcon className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Items Yet</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">Start adding services or products to build your invoice.</p>
                <button
                    onClick={addLineItem}
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-200"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add First Item
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {invoice.lineItems.map((item, index) => (
                    <div key={item.id} className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all relative">
                    
                    <div className="space-y-4">
                        {/* Description */}
                        <div className="w-full">
                            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
                                Description
                            </label>
                            <input
                                value={item.description}
                                onChange={(e) => handleLineItemChange(item.id, e)}
                                name="description"
                                placeholder="Service or product name"
                                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                            />
                        </div>

                        {/* Qty & Price */}
                        <div className="flex gap-4">
                            <div className="w-1/3">
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Qty</label>
                                <input
                                    name="quantity"
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleLineItemChange(item.id, e)}
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all text-center"
                                />
                            </div>
                            <div className="w-2/3">
                                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Price</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={item.price}
                                    onChange={(e) => handleLineItemChange(item.id, e)}
                                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-base font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Delete Action */}
                    <button 
                        onClick={() => removeLineItem(item.id)}
                        className="absolute -top-3 -right-3 bg-white text-slate-400 hover:text-red-600 p-2 rounded-full shadow-md border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                        title="Remove Item"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    </div>
                ))}

                <button
                    onClick={addLineItem}
                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-bold hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2 group mt-6"
                >
                    <div className="bg-slate-200 rounded-full p-1 group-hover:bg-teal-200 transition-colors">
                        <PlusIcon className="w-5 h-5" />
                    </div>
                    Add Another Item
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

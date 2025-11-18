
import React, { useState, useRef } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus } from '../types';
import { TrashIcon, PlusIcon, UserIcon, ListIcon, UploadIcon } from './Icons';

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
    <label htmlFor={id || name} className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
    <input
      id={id || name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-medium shadow-sm placeholder:text-slate-400
      focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 hover:border-slate-400 transition-all duration-200"
    />
  </div>
);

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
      {/* Tab Navigation */}
      <div className="bg-slate-100 p-1 rounded-xl flex gap-1 mb-6">
        <button 
            onClick={() => setActiveTab('details')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'details' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
            <UserIcon className="w-4 h-4" /> Invoice Details
        </button>
        <button 
            onClick={() => setActiveTab('items')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'items' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
        >
            <ListIcon className="w-4 h-4" /> Line Items ({invoice.lineItems.length})
        </button>
      </div>

      {/* Details Tab Content */}
      <div className={activeTab === 'details' ? 'space-y-8 animate-fadeIn' : 'hidden'}>
        
        {/* Business Info */}
        <Section title="From (Your Business)">
            {/* Logo Upload */}
            <div className="mb-6">
                <label className="block text-xs font-bold text-slate-700 mb-2">Company Logo</label>
                <div className="flex items-center gap-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all overflow-hidden relative group ${invoice.user.logo ? 'border-solid border-slate-200' : ''}`}
                    >
                        {invoice.user.logo ? (
                            <>
                                <img src={invoice.user.logo} alt="Logo" className="h-full w-full object-contain p-1" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-white font-medium">Change</span>
                                </div>
                            </>
                        ) : (
                            <div className="text-center">
                                <UploadIcon className="w-6 h-6 text-slate-400 mx-auto mb-1" />
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
                        <p className="text-xs text-slate-500 mb-2">Upload your business logo to appear on the invoice. Max 2MB.</p>
                        {invoice.user.logo && (
                             <button 
                                onClick={() => updateInvoice('user', { ...invoice.user, logo: undefined })}
                                className="text-xs text-red-500 hover:text-red-700 font-medium"
                             >
                                Remove Logo
                             </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <InputField label="Business Name" name="name" value={invoice.user.name} onChange={handleUserChange} placeholder="e.g. Emeka Ventures" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Email" name="email" value={invoice.user.email} onChange={handleUserChange} type="email" />
                    <InputField label="Address" name="address" value={invoice.user.address} onChange={handleUserChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <InputField label="Bank Name" name="bankName" value={invoice.user.bankName} onChange={handleUserChange} placeholder="GTBank" />
                    <InputField label="Account Number" name="accountNumber" value={invoice.user.accountNumber} onChange={handleUserChange} placeholder="0123456789" />
                </div>
            </div>
        </Section>

        {/* Client Info */}
        <Section title="Bill To (Client)">
            <div className="grid grid-cols-1 gap-4">
                <InputField label="Client Name" name="name" value={invoice.client.name} onChange={handleClientChange} placeholder="Client Business Name" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Email" name="email" value={invoice.client.email} onChange={handleClientChange} type="email" />
                    <InputField label="Address" name="address" value={invoice.client.address} onChange={handleClientChange} />
                </div>
            </div>
        </Section>

        {/* Invoice Metadata */}
        <Section title="Settings">
            <div className="grid grid-cols-2 gap-5">
                <InputField label="Invoice #" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleInvoiceMetaChange} />
                <div>
                    <label htmlFor="status" className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
                    <select
                        id="status"
                        name="status"
                        value={invoice.status}
                        onChange={(e) => updateInvoice('status', e.target.value as InvoiceStatus)}
                        className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                    >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Paid">Paid</option>
                        <option value="Overdue">Overdue</option>
                    </select>
                </div>
                <InputField label="Issue Date" name="issueDate" value={invoice.issueDate} onChange={handleInvoiceMetaChange} type="date" />
                <InputField label="Due Date" name="dueDate" value={invoice.dueDate} onChange={handleInvoiceMetaChange} type="date" />
                <div>
                    <label htmlFor="currency" className="block text-xs font-bold text-slate-700 mb-1.5">Currency</label>
                    <select
                        id="currency"
                        name="currency"
                        value={invoice.currency}
                        onChange={(e) => updateInvoice('currency', e.target.value as Currency)}
                        className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all cursor-pointer"
                    >
                        <option value="NGN">NGN (₦)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                    </select>
                </div>
                <InputField label="VAT (%)" name="taxRate" value={invoice.taxRate} onChange={(e) => updateInvoice('taxRate', parseFloat(e.target.value) || 0)} type="number" />
            </div>
        </Section>

        <Section title="Terms & Notes">
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Terms & Conditions</label>
                    <textarea
                        name="terms"
                        value={invoice.terms}
                        onChange={(e) => updateInvoice('terms', e.target.value)}
                        rows={2}
                        placeholder="e.g. Payment due within 14 days"
                        className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 hover:border-slate-400 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Additional Notes</label>
                    <textarea
                        name="notes"
                        value={invoice.notes}
                        onChange={(e) => updateInvoice('notes', e.target.value)}
                        rows={2}
                        placeholder="e.g. Thank you for your business!"
                        className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 hover:border-slate-400 transition-all"
                    />
                </div>
            </div>
        </Section>
      </div>

      {/* Items Tab Content */}
      <div className={activeTab === 'items' ? 'space-y-4 animate-fadeIn' : 'hidden'}>
        <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Items List</h3>
            <span className="text-xs font-medium text-slate-500">Auto-save enabled</span>
        </div>
        
        {invoice.lineItems.map((item, index) => (
            <div key={item.id} className="group bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-200 transition-all relative">
              
              <div className="space-y-4">
                  {/* Description */}
                  <div className="w-full">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Description
                    </label>
                    <input
                        value={item.description}
                        onChange={(e) => handleLineItemChange(item.id, e)}
                        name="description"
                        placeholder="What service or product?"
                        className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
                    />
                  </div>

                  {/* Qty & Price */}
                  <div className="flex gap-4">
                      <div className="w-1/3">
                         <label className="block text-xs font-bold text-slate-700 mb-1.5">Qty</label>
                         <input
                            name="quantity"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(item.id, e)}
                            className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                         />
                      </div>
                      <div className="w-2/3">
                         <label className="block text-xs font-bold text-slate-700 mb-1.5">Price</label>
                         <input
                            name="price"
                            type="number"
                            value={item.price}
                            onChange={(e) => handleLineItemChange(item.id, e)}
                            className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-medium focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                         />
                      </div>
                  </div>
              </div>

              {/* Delete Action */}
              {invoice.lineItems.length > 1 && (
                  <button 
                    onClick={() => removeLineItem(item.id)}
                    className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-600 p-1.5 rounded-full shadow-sm border border-slate-200 hover:bg-red-50 hover:border-red-100 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    title="Remove Item"
                  >
                      <TrashIcon className="w-4 h-4" />
                  </button>
              )}
            </div>
        ))}

        <button
            onClick={addLineItem}
            className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-xl text-slate-600 font-bold hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2 group mt-4"
        >
            <div className="bg-slate-200 rounded-full p-0.5 group-hover:bg-teal-200 transition-colors">
                <PlusIcon className="w-4 h-4" />
            </div>
            Add New Item
        </button>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-slate-200 pb-8 last:border-0">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">{title}</h3>
        {children}
    </div>
);

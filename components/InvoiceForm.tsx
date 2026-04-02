
import React, { useState, useRef, useEffect } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, Client } from '../types';
import { TrashIcon, PlusIcon, UploadIcon, ChevronDownIcon, ChevronUpIcon, EmptyBoxIcon, SaveIcon, UserIcon, MailIcon, MapPinIcon, BriefcaseIcon, BankIcon, HashIcon, WalletIcon, CalendarIcon, InfoIcon, SparklesIcon, ListIcon, PhoneIcon } from './Icons';

interface InvoiceFormProps {
  invoice: Invoice;
  updateInvoice: <K extends keyof Invoice>(key: K, value: Invoice[K]) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => void;
  savedClients: Client[];
  onSaveClient: (client: Client) => void;
}

interface InputFieldProps {
  id?: string;
  label?: React.ReactNode;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  name?: string;
  icon?: React.ReactNode;
  prefix?: string;
  noLabel?: boolean;
  autoComplete?: string;
  step?: string;
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, value, onChange, type = 'text', placeholder, className, name, icon, prefix, noLabel, autoComplete, step, error }) => {
  const isDate = type === 'date';
  
  const handlePickerTrigger = (e: React.SyntheticEvent) => {
    if (isDate && 'showPicker' in HTMLInputElement.prototype) {
        try {
            (e.target as HTMLInputElement).showPicker();
        } catch (error) {
            // Browser might block if not trusted event
        }
    }
  };

  return (
    <div className={className}>
      {!noLabel && <label htmlFor={id || name} className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">{label}</label>}
      <div className="relative group">
          {icon && (
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-600 pointer-events-none">
                  {icon}
              </div>
          )}
          {prefix && (
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                  {prefix}
              </div>
          )}
          <input
          id={id || name}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          step={step}
          onClick={handlePickerTrigger}
          onKeyDown={(e) => {
              if (isDate && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handlePickerTrigger(e);
              }
          }}
          className={`block w-full ${icon ? 'pl-10 pr-3' : (prefix ? 'pl-10 pr-3' : 'px-3')} py-2.5 bg-white border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-200'} rounded-lg text-slate-800 text-sm font-medium placeholder:text-slate-300 placeholder:font-normal
          focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300 transition-all duration-200 shadow-sm ${isDate ? 'cursor-pointer' : ''}`}
          />
      </div>
      {error && <p className="mt-1 text-[10px] text-red-500 font-bold uppercase tracking-wide">{error}</p>}
    </div>
  );
};

const RichTextarea: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}> = ({ label, name, value, onChange, placeholder, rows = 3 }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertAtCursor = (text: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textValue = textarea.value;
        
        const newValue = textValue.substring(0, start) + text + textValue.substring(end);
        
        // Create synthetic event
        const event = {
            target: { value: newValue, name }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        
        onChange(event);
        
        // Reset focus and cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + text.length, start + text.length);
        }, 0);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</label>
                <button
                    type="button"
                    onClick={() => insertAtCursor('• ')}
                    className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-100 transition-colors"
                >
                    <ListIcon className="w-3 h-3" />
                    Add Bullet
                </button>
            </div>
            <textarea
                ref={textareaRef}
                name={name}
                value={value}
                onChange={onChange}
                rows={rows}
                placeholder={placeholder}
                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-medium shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 hover:border-slate-300 transition-all resize-none leading-relaxed"
            />
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; highlight?: boolean; icon?: React.ReactNode }> = ({ title, children, defaultOpen = true, highlight = false, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`border rounded-xl overflow-hidden shadow-sm mb-5 transition-all duration-300 hover:shadow-md ${highlight ? 'border-teal-100 bg-white ring-1 ring-teal-50' : 'border-slate-200 bg-white'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between p-4 transition-colors text-left group ${highlight ? 'bg-gradient-to-r from-teal-50 to-white' : 'bg-white hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-3">
                    {icon && <div className={`p-1.5 rounded-lg ${highlight ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700'}`}>{icon}</div>}
                    <h3 className={`text-sm font-bold ${highlight ? 'text-teal-900' : 'text-slate-700'}`}>{title}</h3>
                </div>
                <div className={`p-1 rounded-md transition-all ${isOpen ? 'bg-slate-100 text-slate-600 rotate-180' : 'text-slate-400'}`}>
                    <ChevronDownIcon className="w-4 h-4" />
                </div>
            </button>
            <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-4 sm:p-5 border-t border-slate-50">
                    {children}
                </div>
            </div>
        </div>
    );
};

export const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoice, updateInvoice, addLineItem, removeLineItem, updateLineItem, savedClients, onSaveClient }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const validateEmail = (email: string) => {
    if (!email) return undefined;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) ? undefined : "Invalid Email Address";
  };

  // Track previous length to detect new items
  const prevLineItemsLength = useRef(invoice.lineItems.length);

  // Auto-focus logic
  useEffect(() => {
    if (invoice.lineItems.length > prevLineItemsLength.current) {
        // A new item was added
        const lastItem = invoice.lineItems[invoice.lineItems.length - 1];
        if (lastItem) {
            setTimeout(() => {
                const element = document.getElementById(`desc-${lastItem.id}`);
                if (element) {
                    element.focus();
                }
            }, 50);
        }
    }
    prevLineItemsLength.current = invoice.lineItems.length;
  }, [invoice.lineItems.length]);


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
    
    if (name === 'price') {
        // If value is empty, pass empty string, otherwise parse as number
        updateLineItem(id, 'price', value === '' ? '' : value);
    } else if (name === 'quantity') {
        updateLineItem(id, 'quantity', parseFloat(value) || 0);
    } else {
        updateLineItem(id, name as keyof Omit<LineItem, 'id'>, value);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Only PNG and JPG are allowed.");
            return;
        }
        if (file.size > 4 * 1024 * 1024) {
            alert("File size too large. Please upload a logo under 4MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            updateInvoice('user', { ...invoice.user, logo: reader.result as string });
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSelectClient = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedName = e.target.value;
      if (!selectedName) return;
      const client = savedClients.find(c => c.name === selectedName);
      if (client) {
          updateInvoice('client', client);
      }
  };

  const handleVatToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          updateInvoice('taxRate', invoice.taxRate > 0 ? invoice.taxRate : 7.5);
      } else {
          updateInvoice('taxRate', 0);
      }
  };

  const currencyFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency,
  });
  
  const getCurrencySymbol = (currency: Currency) => {
      return (0).toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
  }
  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <div className="space-y-6 pb-20">
        
        {/* Business Info */}
        <CollapsibleSection title="Your Business Info" icon={<BriefcaseIcon className="w-4 h-4"/>}>
            {/* Logo Upload - Brand Card Style */}
            <div className="mb-8">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all cursor-pointer group flex flex-col items-center justify-center p-6
                    ${invoice.user.logo 
                        ? 'border-teal-200 bg-teal-50/10' 
                        : 'border-slate-200 bg-slate-50/50 hover:border-teal-400 hover:bg-teal-50/20'}`}
                >
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/png, image/jpeg" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                    />
                    
                    {invoice.user.logo ? (
                        <div className="flex flex-col items-center w-full">
                            <div className="w-24 h-24 relative mb-3">
                                <img src={invoice.user.logo} alt="Logo" className="w-full h-full object-contain drop-shadow-sm" />
                                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    <span className="text-white text-xs font-bold flex items-center gap-1"><UploadIcon className="w-3 h-3"/> Change</span>
                                </div>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateInvoice('user', { ...invoice.user, logo: undefined });
                                }}
                                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 py-1 px-3 rounded-full hover:bg-red-50 transition-colors"
                             >
                                <TrashIcon className="w-3 h-3"/> Remove Logo
                             </button>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white p-3 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform duration-300 ring-1 ring-slate-100">
                                <UploadIcon className="w-6 h-6 text-slate-400 group-hover:text-teal-500" />
                            </div>
                            <p className="text-sm font-bold text-slate-700 mb-1">Upload Brand Logo</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wide">Max 4MB • PNG/JPG</p>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                    <InputField 
                        label="Business Name" 
                        name="name" 
                        value={invoice.user.name} 
                        onChange={handleUserChange} 
                        autoComplete="organization"
                        icon={<BriefcaseIcon className="w-4 h-4"/>}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                            label="Email Address" 
                            name="email" 
                            value={invoice.user.email} 
                            onChange={handleUserChange} 
                            type="email" 
                            autoComplete="email"
                            icon={<MailIcon className="w-4 h-4"/>}
                            error={validateEmail(invoice.user.email)}
                        />
                        <InputField 
                            label="Phone Number" 
                            name="phoneNumber" 
                            value={invoice.user.phoneNumber || ''} 
                            onChange={handleUserChange} 
                            type="tel"
                            autoComplete="tel"
                            icon={<PhoneIcon className="w-4 h-4"/>}
                        />
                    </div>
                    <InputField 
                        label="Business Address" 
                        name="address" 
                        value={invoice.user.address} 
                        onChange={handleUserChange} 
                        autoComplete="street-address"
                        icon={<MapPinIcon className="w-4 h-4"/>}
                    />
                </div>

                {/* Bank Details - Credit Card Style UI */}
                <div className="pt-4">
                     <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                        <BankIcon className="w-3.5 h-3.5" /> Receiving Bank Account
                     </label>
                     <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
                        {/* Decorative Patterns */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl -ml-5 -mb-5"></div>
                        
                        <div className="relative z-10 space-y-4">
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Bank Name</label>
                                <input 
                                    name="bankName"
                                    value={invoice.user.bankName}
                                    onChange={handleUserChange}
                                    placeholder="e.g. GTBank"
                                    className="bg-transparent border-b border-white/20 w-full text-white font-semibold placeholder:text-white/20 focus:outline-none focus:border-teal-400 transition-colors py-1 text-sm"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Account Number</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        name="accountNumber"
                                        value={invoice.user.accountNumber}
                                        onChange={handleUserChange}
                                        placeholder="0123456789"
                                        className="bg-transparent border-b border-white/20 w-full text-white font-mono text-xl tracking-widest placeholder:text-white/20 focus:outline-none focus:border-teal-400 transition-colors py-1"
                                    />
                                    <HashIcon className="w-5 h-5 text-teal-400 opacity-50" />
                                </div>
                            </div>
                        </div>
                     </div>
                </div>
            </div>
        </CollapsibleSection>

        {/* Invoice Settings & Dates - Moved Up */}
        <CollapsibleSection title="Settings & Dates" icon={<CalendarIcon className="w-4 h-4"/>}>
            <div className="space-y-6">
                {/* Meta Row */}
                <div className="grid grid-cols-2 gap-5">
                    <InputField 
                        label="Invoice No." 
                        name="invoiceNumber" 
                        value={invoice.invoiceNumber} 
                        onChange={handleInvoiceMetaChange} 
                        icon={<HashIcon className="w-4 h-4" />}
                    />
                    <div>
                        <label htmlFor="status" className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                id="status"
                                name="status"
                                value={invoice.status}
                                onChange={(e) => updateInvoice('status', e.target.value as InvoiceStatus)}
                                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer appearance-none"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Paid">Paid</option>
                                <option value="Overdue">Overdue</option>
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>
                
                {/* Dates Row */}
                <div className="grid grid-cols-2 gap-5 p-4 bg-slate-50/50 rounded-xl border border-slate-100">
                    <InputField 
                        label="Issue Date" 
                        name="issueDate" 
                        value={invoice.issueDate} 
                        onChange={handleInvoiceMetaChange} 
                        type="date"
                        className="bg-white"
                    />
                    <InputField 
                        label="Due Date" 
                        name="dueDate" 
                        value={invoice.dueDate} 
                        onChange={handleInvoiceMetaChange} 
                        type="date"
                        className="bg-white"
                    />
                </div>

                {/* Financials Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1">
                        <label htmlFor="currency" className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Currency</label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <WalletIcon className="w-4 h-4" />
                            </div>
                            <select
                                id="currency"
                                name="currency"
                                value={invoice.currency}
                                onChange={(e) => updateInvoice('currency', e.target.value as Currency)}
                                className="block w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer appearance-none"
                            >
                                <option value="NGN">NGN (₦)</option>
                                <option value="USD">USD ($)</option>
                                <option value="EUR">EUR (€)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    
                    {/* Tax & Discount & Shipping */}
                    <div className="col-span-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                             <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        VAT %
                                    </label>
                                    <label className="flex items-center gap-1.5 cursor-pointer hover:opacity-80">
                                        <input 
                                            type="checkbox" 
                                            checked={invoice.taxRate > 0} 
                                            onChange={handleVatToggle}
                                            className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer accent-teal-600"
                                        />
                                        <span className="text-[9px] uppercase font-bold text-teal-600">Enable</span>
                                    </label>
                                </div>
                                {invoice.taxRate > 0 ? (
                                    <InputField 
                                        noLabel
                                        name="taxRate" 
                                        value={invoice.taxRate} 
                                        onChange={(e) => updateInvoice('taxRate', parseFloat(e.target.value) || 0)} 
                                        type="number" 
                                    />
                                ) : (
                                    <div className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 text-sm font-normal italic text-center">
                                        Off
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex flex-col">
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Discount
                                    </label>
                                    <select
                                        value={invoice.discountType}
                                        onChange={(e) => updateInvoice('discountType', e.target.value as 'percentage' | 'fixed')}
                                        className="text-[9px] uppercase font-bold text-teal-600 bg-transparent border-none focus:ring-0 cursor-pointer"
                                    >
                                        <option value="percentage">%</option>
                                        <option value="fixed">{currencySymbol}</option>
                                    </select>
                                </div>
                                <InputField
                                    noLabel
                                    name="discountRate"
                                    value={invoice.discountRate}
                                    onChange={(e) => updateInvoice('discountRate', e.target.value)}
                                    type="number"
                                    placeholder="0"
                                    step={invoice.discountType === 'percentage' ? "0.1" : "1"}
                                    prefix={invoice.discountType === 'fixed' ? currencySymbol : undefined}
                                />
                            </div>
                        </div>

                         <InputField 
                            label="Shipping"
                            name="shippingAmount" 
                            value={invoice.shippingAmount} 
                            onChange={(e) => updateInvoice('shippingAmount', e.target.value)} 
                            type="number" 
                            placeholder="0.00"
                            step="0.01"
                            prefix={currencySymbol}
                        />
                    </div>
                </div>
            </div>
        </CollapsibleSection>

        {/* Line Items */}
        <CollapsibleSection title={`Invoice Items (${invoice.lineItems.length})`} highlight={true} icon={<ListIcon className="w-4 h-4"/>}>
            {invoice.lineItems.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-xl border-2 border-dashed border-slate-100 hover:border-teal-200 transition-colors group">
                    <div className="bg-slate-50 group-hover:bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <EmptyBoxIcon className="w-8 h-8 text-slate-300 group-hover:text-teal-400 transition-colors" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No items yet</h3>
                    <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">Add services or products to calculate your invoice total.</p>
                    <button
                        onClick={addLineItem}
                        className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-teal-700 transition-all text-sm shadow-lg shadow-teal-200/50 hover:shadow-teal-300/50"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add First Item
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoice.lineItems.map((item, index) => (
                        <div key={item.id} className="group bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all relative">
                        
                            <div className="space-y-4">
                                {/* Description */}
                                <div className="w-full">
                                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                                        Description
                                    </label>
                                    <input
                                        id={`desc-${item.id}`}
                                        value={item.description}
                                        onChange={(e) => handleLineItemChange(item.id, e)}
                                        name="description"
                                        className="block w-full px-0 py-1 bg-transparent border-b border-slate-200 text-slate-800 text-base font-semibold focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-300"
                                        placeholder="Item name..."
                                    />
                                </div>

                                {/* Qty & Price & Total Row */}
                                <div className="flex items-end gap-3 sm:gap-4">
                                    <div className="w-20 sm:w-24">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Qty</label>
                                        <input
                                            name="quantity"
                                            type="number"
                                            min="0"
                                            value={item.quantity}
                                            onChange={(e) => handleLineItemChange(item.id, e)}
                                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all text-center"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Price</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">
                                                {currencySymbol}
                                            </div>
                                            <input
                                                name="price"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.price}
                                                onChange={(e) => handleLineItemChange(item.id, e)}
                                                className="block w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                                                placeholder=""
                                            />
                                        </div>
                                    </div>
                                    <div className="text-right pb-1.5 min-w-[80px]">
                                        <label className="block text-[9px] font-bold text-slate-300 mb-0.5 uppercase tracking-wide">Total</label>
                                        <span className="text-teal-700 font-mono font-bold text-lg">{currencyFormatter.format(item.quantity * Number(item.price))}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delete Action */}
                            <button 
                                onClick={() => removeLineItem(item.id)}
                                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Remove Item"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        onClick={addLineItem}
                        className="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50/50 transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                        <PlusIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        Add Item
                    </button>
                </div>
            )}
        </CollapsibleSection>

        {/* Client Info */}
        <CollapsibleSection title="Client Information" icon={<UserIcon className="w-4 h-4"/>}>
            <div className="space-y-5">
                {savedClients.length > 0 && (
                    <div className="bg-slate-50 p-1 rounded-lg border border-slate-200">
                        <div className="relative group">
                            <select 
                                id="savedClient"
                                onChange={handleSelectClient}
                                className="block w-full pl-3 pr-10 py-2 bg-transparent text-slate-700 text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>Load Saved Client...</option>
                                {savedClients.map(c => (
                                    <option key={c.name} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-500 transition-colors">
                                <ChevronDownIcon className="w-4 h-4" />
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 gap-5">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <InputField 
                                label="Client Name" 
                                name="name" 
                                value={invoice.client.name} 
                                onChange={handleClientChange} 
                                autoComplete="off"
                                icon={<UserIcon className="w-4 h-4"/>}
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField 
                            label="Client Email" 
                            name="email" 
                            value={invoice.client.email} 
                            onChange={handleClientChange} 
                            type="email" 
                            autoComplete="email"
                            icon={<MailIcon className="w-4 h-4"/>}
                            error={validateEmail(invoice.client.email)}
                        />
                        <InputField 
                            label="Client Address" 
                            name="address" 
                            value={invoice.client.address} 
                            onChange={handleClientChange} 
                            autoComplete="street-address"
                            icon={<MapPinIcon className="w-4 h-4"/>}
                        />
                    </div>
                </div>
                
                {invoice.client.name && (
                    <div className="flex justify-end pt-2">
                        <button 
                            onClick={() => onSaveClient(invoice.client)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors border border-teal-100"
                        >
                            <SaveIcon className="w-3.5 h-3.5" />
                            Save Client
                        </button>
                    </div>
                )}
            </div>
        </CollapsibleSection>

        <CollapsibleSection title="Terms, Notes & Signature" defaultOpen={false} icon={<InfoIcon className="w-4 h-4"/>}>
            <div className="space-y-5">
                <RichTextarea
                    label="Terms & Conditions"
                    name="terms"
                    value={invoice.terms}
                    onChange={(e) => updateInvoice('terms', e.target.value)}
                    rows={3}
                    placeholder="e.g. Payment due within 7 days..."
                />
                <RichTextarea
                    label="Additional Notes"
                    name="notes"
                    value={invoice.notes}
                    onChange={(e) => updateInvoice('notes', e.target.value)}
                    rows={2}
                    placeholder="e.g. Thank you for your business!"
                />
            </div>
        </CollapsibleSection>
    </div>
  );
};

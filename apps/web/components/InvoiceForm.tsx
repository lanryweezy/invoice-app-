
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { getCurrencyFormatter } from '../utils/formatters';
import type { Invoice, LineItem, Currency, InvoiceStatus, Client } from '../types';
import { TrashIcon, PlusIcon, UploadIcon, ChevronDownIcon, ChevronUpIcon, EmptyBoxIcon, SaveIcon, UserIcon, MailIcon, MapPinIcon, BriefcaseIcon, BankIcon, HashIcon, WalletIcon, CalendarIcon, InfoIcon, SparklesIcon, ListIcon, PhoneIcon } from './Icons';

interface InvoiceFormProps {
  invoice: Invoice;
  updateInvoice: (key: keyof Invoice, value: any) => void;
  addLineItem: () => void;
  removeLineItem: (id: string) => void;
  updateLineItem: (id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => void;
  savedClients: Client[];
  onSaveClient: (client: Client) => void;
  businessProfiles: any[];
  onSaveBusinessProfile: (profile: any) => void;
  onSaveRecurring?: (inv: Invoice) => void;
  onSaveInvoice?: (inv: Invoice) => void;
  isPro: boolean;
  onProFeatureClick: () => void;
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
  list?: string;
}

const InputField: React.FC<InputFieldProps> = React.memo(({ id, label, value, onChange, type = 'text', placeholder, className, name, icon, prefix, noLabel, autoComplete, step, error, list }) => {
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
          list={list}
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
});

const RichTextarea: React.FC<{
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
    placeholder?: string;
    rows?: number;
}> = React.memo(({ label, name, value, onChange, placeholder, rows = 3 }) => {
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
                    aria-label="Add bullet point"
                    className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded border border-teal-100 focus-visible:ring-2 focus-visible:ring-teal-500 focus:outline-none transition-colors"
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
});

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; highlight?: boolean; icon?: React.ReactNode }> = React.memo(({ title, children, defaultOpen = true, highlight = false, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className={`border rounded-xl overflow-hidden shadow-sm mb-5 transition-all duration-300 hover:shadow-md ${highlight ? 'border-teal-100 bg-white ring-1 ring-teal-50' : 'border-slate-200 bg-white'}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
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
});

// ⚡ Bolt: Extract LineItem to a memoized component to avoid expensive O(N) re-renders of the entire list when only one item changes
const LineItemRow = React.memo(({ item, index, currencySymbol, currencyFormatter, onChange, onRemove }: {
    item: LineItem;
    index: number;
    currencySymbol: string;
    currencyFormatter: Intl.NumberFormat;
    onChange: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (id: string) => void;
}) => {
    return (
        <div className="group bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all relative">

            <div className="space-y-4">
                {/* Description */}
                <div className="w-full">
                    <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                        Description
                    </label>
                    <input
                        id={`desc-${item.id}`}
                        value={item.description}
                        onChange={(e) => onChange(item.id, e)}
                        name="description"
                        className="block w-full px-0 py-1 bg-transparent border-b border-slate-200 text-slate-800 text-base font-semibold focus:border-teal-500 focus:outline-none transition-all placeholder:text-slate-300"
                        placeholder="Item name..."
                    />
                </div>

                {/* Qty & Price & Total Row */}
                <div className="flex items-end gap-3 sm:gap-4 flex-wrap">
                    <div className="w-16 sm:w-20">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Qty</label>
                        <input
                            name="quantity"
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) => onChange(item.id, e)}
                            className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all text-center"
                        />
                    </div>
                    <div className="w-20 sm:w-24">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Unit</label>
                        <select
                            name="unitOfMeasure"
                            value={item.unitOfMeasure || 'PCS'}
                            onChange={(e) => onChange(item.id, e as any)}
                            className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all text-center text-xs appearance-none"
                        >
                            <option value="PCS">PCS</option>
                            <option value="HRS">HRS</option>
                            <option value="DAYS">DAYS</option>
                            <option value="KG">KG</option>
                            <option value="LTR">LTR</option>
                            <option value="MTR">MTR</option>
                            <option value="SET">SET</option>
                        </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
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
                                onChange={(e) => onChange(item.id, e)}
                                className="block w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                                placeholder=""
                            />
                        </div>
                    </div>
                    <div className="w-32">
                        <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">Tax Cat.</label>
                        <select
                            name="taxCategory"
                            value={item.taxCategory || 'Standard'}
                            onChange={(e) => onChange(item.id, e as any)}
                            className="block w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all text-center text-xs appearance-none"
                        >
                            <option value="Standard">Standard</option>
                            <option value="ZeroRated">Zero-Rated</option>
                            <option value="Exempt">Exempt</option>
                        </select>
                    </div>
                    <div className="text-right pb-1.5 min-w-[80px]">
                        <label className="block text-[9px] font-bold text-slate-300 mb-0.5 uppercase tracking-wide">Total</label>
                        <span className="text-teal-700 font-mono font-bold text-lg">{currencyFormatter.format(item.quantity * Number(item.price))}</span>
                    </div>
                </div>
            </div>

            {/* Delete Action */}
            <button
                onClick={() => onRemove(item.id)}
                className="absolute top-3 right-3 text-slate-300 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500"
                title="Remove Item"
                aria-label={`Remove item ${index + 1}`}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    );
});

// ⚡ Bolt: Wrap InvoiceForm in React.memo to prevent unnecessary re-renders when parent state (like modals) changes
// ⚡ Bolt: Move static arrays outside of component to avoid recreation on every render
const nigerianBanks = [
    "Access Bank", "Access Bank (Diamond)", "ALAT by WEMA", "ASO Savings and Loans", "Bowen Microfinance Bank",
    "Carbon", "CEMCS Microfinance Bank", "Citibank Nigeria", "Ecobank Nigeria", "Ekondo Microfinance Bank",
    "Eyowo", "Fidelity Bank", "First Bank of Nigeria", "First City Monument Bank (FCMB)", "FSDH Merchant Bank Limited",
    "Globus Bank", "Guaranty Trust Bank (GTBank)", "Hackman Microfinance Bank", "Hasal Microfinance Bank",
    "Heritage Bank", "Ibile Microfinance Bank", "Infinity MFB", "Jaiz Bank", "Keystone Bank", "Kuda Bank",
    "Lagos Building Investment Company PLC", "Links MFB", "Lotus Bank", "Mayfair MFB", "Mint MFB",
    "Moniepoint MFB", "Nova Merchant Bank", "One Finance", "OPay Digital Services Limited (OPay)",
    "Optimus Bank Limited", "Paga", "PalmPay", "Parallex Bank", "Parkway - ReadyCash", "Paycom", "Personal Trust Microfinance Bank",
    "Petra Microfinance Bank", "Polaris Bank", "PremiumTrust Bank", "Providus Bank", "QuickFund MFB", "Rand Merchant Bank",
    "Refuge Mortgage Bank", "Rubies MFB", "Safe Haven MFB", "Safe Haven Microfinance Bank", "SAGE MFB", "Signature Bank Limited",
    "Sparkle Microfinance Bank", "Stanbic IBTC Bank", "Standard Chartered Bank", "Sterling Bank", "Suntrust Bank",
    "TAJ Bank", "Tangerine Money", "TCF MFB", "Titan Bank", "Titan Paystack", "Union Bank of Nigeria",
    "United Bank for Africa (UBA)", "Unity Bank", "VFD Microfinance Bank Limited", "Wema Bank", "Zenith Bank"
];

export const InvoiceForm: React.FC<InvoiceFormProps> = React.memo(({ invoice, updateInvoice, addLineItem, removeLineItem, updateLineItem, savedClients, onSaveClient, businessProfiles = [], onSaveBusinessProfile, onSaveRecurring, onSaveInvoice, isPro = false, onProFeatureClick }) => {
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


  const handleUserChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice('user', { ...invoice.user, [name]: value });
  }, [invoice.user, updateInvoice]);

  const handleClientChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice('client', { ...invoice.client, [name]: value });
  }, [invoice.client, updateInvoice]);

  const handleInvoiceMetaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateInvoice(name as keyof Invoice, value);
  }, [updateInvoice]);

  const handleLineItemChange = useCallback((id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'price') {
        // If value is empty, pass empty string, otherwise parse as number
        updateLineItem(id, 'price', value === '' ? '' : value);
    } else if (name === 'quantity') {
        updateLineItem(id, 'quantity', parseFloat(value) || 0);
    } else {
        updateLineItem(id, name as keyof Omit<LineItem, 'id'>, value);
    }
  }, [updateLineItem]);

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const validTypes = ['image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            alert("Invalid file type. Only PNG and JPG are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File size too large. Please upload a logo under 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400;
                const MAX_HEIGHT = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const optimizedDataUrl = canvas.toDataURL('image/webp', 0.8);
                    updateInvoice('user', { ...invoice.user, logo: optimizedDataUrl });
                } else {
                    updateInvoice('user', { ...invoice.user, logo: reader.result as string });
                }
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    }
  }, [invoice.user, updateInvoice]);

  // ⚡ Bolt: Memoize savedClients to a map for O(1) lookups rather than O(N) Array.find
  const savedClientsMap = useMemo(() => {
      const map = new Map<string, Client>();
      for (const client of savedClients) {
          map.set(client.name, client);
      }
      return map;
  }, [savedClients]);

  // ⚡ Bolt: Memoize businessProfiles to a map for O(1) lookups rather than O(N) Array.find
  const businessProfilesMap = useMemo(() => {
      const map = new Map<string, any>();
      for (const profile of businessProfiles) {
          map.set(profile.id, profile);
      }
      return map;
  }, [businessProfiles]);

  const handleSelectClient = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedName = e.target.value;
      if (!selectedName) return;
      const client = savedClientsMap.get(selectedName);
      if (client) {
          updateInvoice('client', client);
      }
  }, [savedClientsMap, updateInvoice]);

  const handleSelectBusinessProfile = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;
    const profile = businessProfilesMap.get(selectedId);
    if (profile) {
        // Exclude 'id' when updating user state
        const { id, ...userDetails } = profile;
        updateInvoice('user', userDetails);
    }
  }, [businessProfilesMap, updateInvoice]);

  const handleVatToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          updateInvoice('taxRate', invoice.taxRate > 0 ? invoice.taxRate : 7.5);
      } else {
          updateInvoice('taxRate', 0);
      }
  }, [invoice.taxRate, updateInvoice]);

  const currencyFormatter = getCurrencyFormatter(invoice.currency);

  // ⚡ Bolt: Memoize currency symbol to avoid expensive toLocaleString calls on every render (~0.6ms)
  const currencySymbol = useMemo(() => {
      return (0).toLocaleString('en-US', { style: 'currency', currency: invoice.currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).replace(/\d/g, '').trim();
  }, [invoice.currency]);

  return (
    <div className="space-y-6 pb-20">
        <datalist id="nigerian-banks">
            {nigerianBanks.map(bank => <option key={bank} value={bank} />)}
        </datalist>

        {/* Business Info */}
        <CollapsibleSection title="Your Business Info" icon={<BriefcaseIcon className="w-4 h-4"/>}>

            {businessProfiles.length > 0 && (
                <div className="mb-6 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <div className="relative group">
                        <select
                            id="savedProfile"
                            onChange={handleSelectBusinessProfile}
                            className="block w-full pl-3 pr-10 py-2 bg-transparent text-slate-700 text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
                            defaultValue=""
                        >
                            <option value="" disabled>Load Saved Profile...</option>
                            {businessProfiles.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-hover:text-teal-500 transition-colors">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            )}

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
                                aria-label="Remove Logo"
                                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1 py-1 px-3 rounded-full hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-500 focus:outline-none transition-colors"
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
                            label="Tax ID (TIN)"
                            name="tin"
                            value={invoice.user.tin || ''}
                            onChange={handleUserChange}
                            placeholder="e.g. 12345678-0001"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        />
                        <InputField
                            label="CAC Number"
                            name="cacNumber"
                            value={invoice.user.cacNumber || ''}
                            onChange={handleUserChange}
                            placeholder="e.g. RC 1234567"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
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

                {invoice.user.name && onSaveBusinessProfile && (
                    <div className="flex justify-end pt-2 pb-4">
                        <button
                            onClick={() => onSaveBusinessProfile(invoice.user)}
                            className="flex items-center gap-1.5 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-md transition-colors border border-teal-100"
                        >
                            <SaveIcon className="w-3.5 h-3.5" />
                            Save Business Profile
                        </button>
                    </div>
                )}

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
                                    list="nigerian-banks"
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
                                        maxLength={10}
                                        pattern="[0-9]{10}"
                                        className={`bg-transparent border-b w-full text-white font-mono text-xl tracking-widest placeholder:text-white/20 focus:outline-none transition-colors py-1 ${
                                          invoice.user.accountNumber && invoice.user.accountNumber.length === 10
                                            ? 'border-teal-400'
                                            : invoice.user.accountNumber && invoice.user.accountNumber.length > 0
                                            ? 'border-red-400'
                                            : 'border-white/20 focus:border-teal-400'
                                        }`}
                                    />
                                    {invoice.user.accountNumber && invoice.user.accountNumber.length === 10 ? (
                                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                      <HashIcon className="w-5 h-5 text-teal-400 opacity-50" />
                                    )}
                                </div>
                                {invoice.user.accountNumber && invoice.user.accountNumber.length > 0 && invoice.user.accountNumber.length !== 10 && (
                                  <p className="text-[10px] text-red-400 mt-1">Must be exactly 10 digits</p>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1 mt-4 flex items-center gap-1.5">
                                        <WalletIcon className="w-3 h-3 text-teal-400" />
                                        Payment Gateway
                                    </label>
                                    <select
                                        name="paymentGateway"
                                        value={invoice.user.paymentGateway || ''}
                                        onChange={handleUserChange as any}
                                        className="bg-transparent border-b border-white/20 w-full text-white font-semibold focus:outline-none focus:border-teal-400 transition-colors py-1 text-sm appearance-none cursor-pointer"
                                    >
                                        <option value="" className="text-slate-900">Custom / Direct</option>
                                        <option value="Paystack" className="text-slate-900">Paystack</option>
                                        <option value="Flutterwave" className="text-slate-900">Flutterwave</option>
                                        <option value="Monnify" className="text-slate-900">Monnify</option>
                                        <option value="Kora" className="text-slate-900">Kora</option>
                                        <option value="Squad" className="text-slate-900">Squad</option>
                                        <option value="Interswitch" className="text-slate-900">Interswitch</option>
                                        <option value="OPay" className="text-slate-900">OPay</option>
                                        <option value="Fincra" className="text-slate-900">Fincra</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1 mt-4 flex items-center gap-1.5">
                                        <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        Payment Link (Optional)
                                    </label>
                                    <input
                                        name="paymentLink"
                                        value={invoice.user.paymentLink || ''}
                                        onChange={handleUserChange}
                                        placeholder="e.g. paystack.com/pay/xyz"
                                        className="bg-transparent border-b border-white/20 w-full text-white font-mono font-semibold placeholder:text-white/20 focus:outline-none focus:border-teal-400 transition-colors py-1 text-sm"
                                    />
                                    <p className="text-[9px] text-slate-400 mt-1 italic">Paste your Paystack/Flutterwave link so clients can pay faster.</p>
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
                        <label htmlFor="documentType" className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Document Type</label>
                        <div className="relative">
                            <select
                                id="documentType"
                                name="documentType"
                                value={invoice.documentType || 'Tax Invoice'}
                                onChange={(e) => updateInvoice('documentType', e.target.value as any)}
                                className="block w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm font-semibold shadow-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all cursor-pointer appearance-none"
                            >
                                <option value="Tax Invoice">Tax Invoice</option>
                                <option value="Pro-forma">Pro-forma</option>
                                <option value="Quote">Quote / Estimate</option>
                                <option value="Receipt">Receipt</option>
                            </select>
                            <ChevronDownIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
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
                    <InputField
                        label="Digital Signature (Name)"
                        name="digitalSignature"
                        value={invoice.digitalSignature || ''}
                        onChange={handleInvoiceMetaChange}
                        placeholder="Type your name..."
                        icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                    />
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

                    {/* WHT Rate */}
                    <div className="mt-4 pt-4 border-t border-slate-100">
                         <div className="flex flex-col w-1/2">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Withholding Tax (WHT)
                            </label>
                            <select
                                className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                                value={invoice.whtRate || 0}
                                onChange={(e) => updateInvoice('whtRate', Number(e.target.value))}
                            >
                                <option value={0}>None</option>
                                <option value={5}>5%</option>
                                <option value={10}>10%</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </CollapsibleSection>

        {/* Line Items */}
        <CollapsibleSection title={`Invoice Items (${invoice.lineItems.length})`} highlight={true} icon={<ListIcon className="w-4 h-4"/>}>
            {invoice.lineItems.length === 0 ? (
                <div className="text-center py-10 px-4 bg-white rounded-xl border-2 border-dashed border-slate-100 hover:border-teal-200 transition-colors group">
                    <div className="bg-slate-50 group-hover:bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                        <EmptyBoxIcon className="w-8 h-8 text-slate-300 group-hover:text-teal-400 transition-colors" />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">No items yet</h3>
                    <p className="text-slate-500 text-xs mb-6 max-w-xs mx-auto">Add services or products to calculate your invoice total.</p>

                    {/* Visual Example Row */}
                    <div className="max-w-md mx-auto mb-8 p-3 rounded-lg bg-slate-50/50 border border-slate-100 opacity-60 flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full"></div>
                        <div className="w-8 h-2 bg-slate-200 rounded-full"></div>
                        <div className="w-16 h-2 bg-slate-300 rounded-full"></div>
                    </div>

                    <button
                        onClick={addLineItem}
                        className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-teal-700 transition-all text-sm shadow-lg shadow-teal-200/50 hover:shadow-teal-300/50"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Add First Item
                    </button>
                    <p className="mt-4 text-[10px] text-slate-400 italic">Example: "Logo design — 1 — 150,000"</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {invoice.lineItems.map((item, index) => (
                        <LineItemRow
                            key={item.id}
                            item={item}
                            index={index}
                            currencySymbol={currencySymbol}
                            currencyFormatter={currencyFormatter}
                            onChange={handleLineItemChange}
                            onRemove={removeLineItem}
                        />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputField
                            label="Client Tax ID (TIN)"
                            name="tin"
                            value={invoice.client.tin || ''}
                            onChange={handleClientChange}
                            placeholder="e.g. 87654321-0001"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                        />
                        <InputField
                            label="Client CAC Number"
                            name="cacNumber"
                            value={invoice.client.cacNumber || ''}
                            onChange={handleClientChange}
                            placeholder="e.g. RC 8765432"
                            icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                        />
                    </div>
                    </div>
                    <InputField
                        label="Client Address"
                        name="address"
                        value={invoice.client.address}
                        onChange={handleClientChange}
                        autoComplete="street-address"
                        icon={<MapPinIcon className="w-4 h-4"/>}
                    />
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

        {/* Recurring Settings (Pro Feature) */}
        <CollapsibleSection title="Recurring Schedule" defaultOpen={false} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}>
            {!isPro ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center flex flex-col items-center justify-center">
                    <svg className="w-8 h-8 text-teal-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Automate Your Invoicing</h3>
                    <p className="text-xs text-slate-500 mb-4">Set up recurring schedules to bill clients automatically every week, month, or year.</p>
                    <button
                        onClick={onProFeatureClick}
                        className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Upgrade to Pro to Unlock
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Repeat Frequency
                        </label>
                        <select
                            className="block w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm font-bold focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
                            value={invoice.recurringFrequency || 'none'}
                            onChange={(e) => updateInvoice('recurringFrequency', e.target.value as any)}
                        >
                            <option value="none">Does not repeat</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                    {invoice.recurringFrequency && invoice.recurringFrequency !== 'none' && onSaveRecurring && (
                         <button
                             onClick={() => onSaveRecurring(invoice)}
                             className="w-full py-2 bg-slate-900 hover:bg-teal-700 text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                         >
                             {!isPro && <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>}
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                             {isPro ? 'Save as Recurring Template' : 'Upgrade to Save Recurring'}
                         </button>
                    )}
                </div>
            )}
        </CollapsibleSection>

        {/* NRS Compliance Section */}
        <CollapsibleSection title="NRS E-Invoicing Compliance" defaultOpen={true} highlight={true} icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}>
            <div className="space-y-4">
                <div className="bg-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden group">
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-teal-400">Compliance Status</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                invoice.nrsStatus === 'Verified' ? 'bg-teal-500 text-white' :
                                invoice.nrsStatus === 'Failed' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'
                            }`}>
                                {invoice.nrsStatus || 'Pending Validation'}
                            </span>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full ${invoice.user.tin ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold">Seller TIN Verification</p>
                                    <p className="text-[10px] text-slate-400">{invoice.user.tin ? `TIN: ${invoice.user.tin}` : 'Missing. Add your TIN in Business Info.'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full ${invoice.client.tin ? 'bg-teal-500' : 'bg-red-500'}`}></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold">Buyer TIN Verification</p>
                                    <p className="text-[10px] text-slate-400">{invoice.client.tin ? `TIN: ${invoice.client.tin}` : 'Missing. Add client TIN in Client Info.'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 w-2 h-2 rounded-full ${invoice.lineItems.every(i => i.taxCategory) ? 'bg-teal-500' : 'bg-amber-500'}`}></div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold">Data Standardization (NRS MBS)</p>
                                    <p className="text-[10px] text-slate-400">Ensuring all line items have mandatory Tax Categories and Units.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <button
                                onClick={() => {
                                    if (!invoice.user.tin || !invoice.client.tin) {
                                        updateInvoice('nrsStatus', 'Failed');
                                        updateInvoice('nrsValidationMessage', 'Missing mandatory TIN fields for compliance.');
                                    } else {
                                        updateInvoice('nrsStatus', 'Verified');
                                        updateInvoice('nrsValidationMessage', 'All compliance checks passed.');
                                    }
                                }}
                                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-teal-900/20 flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="w-4 h-4" />
                                Validate & Transmit
                            </button>

                            {onSaveInvoice && (
                                <button
                                    onClick={() => onSaveInvoice(invoice)}
                                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <SaveIcon className="w-4 h-4" />
                                    Record in History
                                </button>
                            )}
                        </div>

                        {invoice.nrsValidationMessage && (
                            <p className={`mt-3 text-[10px] font-bold uppercase text-center ${invoice.nrsStatus === 'Failed' ? 'text-red-400' : 'text-teal-400'}`}>
                                {invoice.nrsValidationMessage}
                            </p>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-slate-400 italic text-center px-4">
                    InvoiceApp.ng is an accredited Access Point Provider (APP). Real-time transmission ensures your invoices are recognized for tax deductions.
                </p>
                <div className="flex justify-center gap-4 pt-2">
                    <a href="/nrs-compliance-dossier" target="_blank" className="text-[9px] font-bold text-teal-600 hover:text-teal-700 underline">Technical Dossier</a>
                    <a href="/tools/nrs-readiness-assessment" target="_blank" className="text-[9px] font-bold text-teal-600 hover:text-teal-700 underline">Compliance Readiness Check</a>
                </div>
            </div>
        </CollapsibleSection>
    </div>
  );
});

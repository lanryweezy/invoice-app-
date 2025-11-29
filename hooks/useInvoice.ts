
import { useState, useCallback, useEffect } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, User, Client } from '../types';

const DEFAULT_USER: User = {
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  bankName: '',
  accountNumber: '',
  logo: undefined,
};

const getInitialInvoiceState = (): Invoice => {
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 7); // Default 7 days due date is common for freelancers

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Try to load saved user details from local storage
  let savedUser = DEFAULT_USER;
  try {
    const stored = localStorage.getItem('invoiceUser');
    if (stored) {
        savedUser = JSON.parse(stored);
        // Ensure phoneNumber exists if loading from old local storage data
        if (!savedUser.phoneNumber) savedUser.phoneNumber = '';
    }
  } catch (e) {
    console.error("Failed to load saved user", e);
  }

  return {
    user: savedUser,
    client: {
      name: '',
      email: '',
      address: '',
    },
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    issueDate: formatDate(today),
    dueDate: formatDate(dueDate),
    lineItems: [
      { id: crypto.randomUUID(), description: '', quantity: 1, price: '' },
    ],
    notes: '',
    terms: '',
    taxRate: 7.5, // Standard VAT in Nigeria
    discountRate: 0,
    currency: (localStorage.getItem('invoiceCurrency') as Currency) || 'NGN',
    status: (localStorage.getItem('invoiceStatus') as InvoiceStatus) || 'Draft',
  };
};


export const useInvoice = () => {
  const [invoice, setInvoice] = useState<Invoice>(getInitialInvoiceState());
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  
  // Persist Currency
  useEffect(() => {
    localStorage.setItem('invoiceCurrency', invoice.currency);
  }, [invoice.currency]);

  // Persist Status
  useEffect(() => {
    localStorage.setItem('invoiceStatus', invoice.status);
  }, [invoice.status]);

  // Persist User Details (Logo, Name, etc.)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        localStorage.setItem('invoiceUser', JSON.stringify(invoice.user));
    }, 500); // Debounce save to avoid performance hits with large logo strings
    return () => clearTimeout(timeoutId);
  }, [invoice.user]);

  // Load saved clients
  useEffect(() => {
    try {
        const stored = localStorage.getItem('invoiceSavedClients');
        if (stored) {
            setSavedClients(JSON.parse(stored));
        }
    } catch(e) { console.error('Failed to load saved clients', e); }
  }, []);

  const updateInvoice = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    setInvoice(prev => ({ ...prev, [key]: value }));
  }, []);

  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      price: '',
    };
    setInvoice(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  }, []);

  const updateLineItem = useCallback((id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, []);

  const calculateTotals = useCallback(() => {
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * Number(item.price)), 0);
    const discountAmount = subtotal * ((invoice.discountRate || 0) / 100);
    const taxableAmount = subtotal - discountAmount;
    const tax = taxableAmount + (invoice.taxRate / 100);
    const total = taxableAmount + tax; 
    
    // Calculate final tax amount based on discounted subtotal
    const taxAmount = (subtotal - discountAmount) * (invoice.taxRate / 100);
    const finalTotal = (subtotal - discountAmount) + taxAmount;
    
    return { subtotal, discountAmount, tax: taxAmount, total: finalTotal };
  }, [invoice.lineItems, invoice.taxRate, invoice.discountRate]);

  const saveClient = useCallback((client: Client) => {
    if (!client.name.trim()) return false;

    setSavedClients(prev => {
        // Check if exists, update if so, otherwise add
        const normalizedName = client.name.trim().toLowerCase();
        const existingIndex = prev.findIndex(c => c.name.toLowerCase() === normalizedName);
        
        let newClients;
        if (existingIndex >= 0) {
            newClients = [...prev];
            newClients[existingIndex] = client;
        } else {
            newClients = [...prev, client];
        }
        
        // Sort alphabetically
        newClients.sort((a, b) => a.name.localeCompare(b.name));
        
        localStorage.setItem('invoiceSavedClients', JSON.stringify(newClients));
        return newClients;
    });
    return true;
  }, []);

  return {
    invoice,
    setInvoice,
    updateInvoice,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotals,
    savedClients,
    saveClient
  };
};

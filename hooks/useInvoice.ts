import { useState, useCallback, useEffect } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, User } from '../types';

const DEFAULT_USER: User = {
  name: 'Your Business Name',
  email: 'your.email@business.com',
  address: 'Your Business Address, Lagos',
  bankName: 'Your Bank',
  accountNumber: '0123456789',
  logo: undefined,
};

const getInitialInvoiceState = (): Invoice => {
  const today = new Date();
  const dueDate = new Date();
  dueDate.setDate(today.getDate() + 14);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  // Try to load saved user details from local storage
  let savedUser = DEFAULT_USER;
  try {
    const stored = localStorage.getItem('invoiceUser');
    if (stored) {
        savedUser = JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load saved user", e);
  }

  return {
    user: savedUser,
    client: {
      name: 'Client Business Name',
      email: 'client.email@example.com',
      address: 'Client Business Address, Abuja',
    },
    invoiceNumber: `INV-${new Date().getFullYear()}-001`,
    issueDate: formatDate(today),
    dueDate: formatDate(dueDate),
    lineItems: [
      { id: crypto.randomUUID(), description: 'e.g. Website design services', quantity: 1, price: 50000 },
    ],
    notes: 'Thank you for your business!',
    terms: 'Payment is due within 14 days. Late payments may be subject to a 5% fee.',
    taxRate: 7.5, // Standard VAT in Nigeria
    currency: (localStorage.getItem('invoiceCurrency') as Currency) || 'NGN',
    status: (localStorage.getItem('invoiceStatus') as InvoiceStatus) || 'Draft',
  };
};


export const useInvoice = () => {
  const [invoice, setInvoice] = useState<Invoice>(getInitialInvoiceState());
  
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

  const updateInvoice = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    setInvoice(prev => ({ ...prev, [key]: value }));
  }, []);

  const addLineItem = useCallback(() => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      description: '',
      quantity: 1,
      price: 0,
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
    const subtotal = invoice.lineItems.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * (invoice.taxRate / 100);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [invoice.lineItems, invoice.taxRate]);


  return {
    invoice,
    setInvoice,
    updateInvoice,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotals,
  };
};
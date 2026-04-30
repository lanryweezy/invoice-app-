
import { useState, useCallback, useEffect } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, User as AppUser, Client } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc } from '../services/firebase';

const DEFAULT_USER: AppUser = {
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
    whtRate: 0, // Withholding Tax
    discountRate: 0,
    discountType: 'percentage',
    shippingAmount: 0,
    currency: (localStorage.getItem('invoiceCurrency') as Currency) || 'NGN',
    status: (localStorage.getItem('invoiceStatus') as InvoiceStatus) || 'Draft',
  };
};


export const useInvoice = () => {
  const [invoice, setInvoice] = useState<Invoice>(getInitialInvoiceState());
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<Invoice[]>([]);
  const { user: firebaseUser, isPro } = useSubscription();

  // Cloud Sync: Load data from Firestore if Pro
  useEffect(() => {
    if (isPro && firebaseUser) {
        const loadCloudData = async () => {
            try {
                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.invoiceUser) {
                        setInvoice(prev => ({ ...prev, user: data.invoiceUser }));
                    }
                    if (data.savedClients) {
                        setSavedClients(data.savedClients);
                    }
                    if (data.recurringInvoices) {
                        setRecurringInvoices(data.recurringInvoices);
                    }
                }
            } catch (error) {
                console.error("Failed to load cloud data", error);
            }
        };
        loadCloudData();
    }
  }, [isPro, firebaseUser]);

  // Sync to Cloud helper
  const syncToCloud = useCallback(async (data: Partial<{ invoiceUser: AppUser, savedClients: Client[], recurringInvoices: Invoice[] }>) => {
      if (isPro && firebaseUser) {
          try {
              const userRef = doc(db, 'users', firebaseUser.uid);
              await setDoc(userRef, data, { merge: true });
          } catch (error) {
              console.error("Failed to sync to cloud", error);
          }
      }
  }, [isPro, firebaseUser]);
  
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
        syncToCloud({ invoiceUser: invoice.user });
    }, 500); // Debounce save
    return () => clearTimeout(timeoutId);
  }, [invoice.user, syncToCloud]);

  // Load saved clients and recurring invoices
  useEffect(() => {
    try {
        const storedClients = localStorage.getItem('invoiceSavedClients');
        if (storedClients) {
            setSavedClients(JSON.parse(storedClients));
        }
        const storedRecurring = localStorage.getItem('invoiceRecurring');
        if (storedRecurring) {
            setRecurringInvoices(JSON.parse(storedRecurring));
        }
    } catch(e) { console.error('Failed to load local data', e); }
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
    // Safe cast discountRate to number
    const safeDiscountRate = Number(invoice.discountRate) || 0;
    const safeShipping = Number(invoice.shippingAmount) || 0;
    
    const discountAmount = invoice.discountType === 'percentage'
        ? subtotal * (safeDiscountRate / 100)
        : safeDiscountRate;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    
    // Calculate final tax amount based on discounted subtotal
    const taxAmount = taxableAmount * (invoice.taxRate / 100);
    
    // Calculate WHT based on subtotal before VAT but after discount
    const whtAmount = taxableAmount * (invoice.whtRate / 100);

    // Total = (Subtotal - Discount) + Tax - WHT + Shipping
    const finalTotal = taxableAmount + taxAmount - whtAmount + safeShipping;

    return { subtotal, discountAmount, tax: taxAmount, whtAmount, shipping: safeShipping, total: finalTotal };
  }, [invoice.lineItems, invoice.taxRate, invoice.whtRate, invoice.discountRate, invoice.shippingAmount]);

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
        syncToCloud({ savedClients: newClients });
        return newClients;
    });
    return true;
  }, [syncToCloud]);

  const saveRecurringInvoice = useCallback((invoiceToSave: Invoice) => {
    setRecurringInvoices(prev => {
        // Prevent duplicates based on some identifier, maybe client + invoice structure, or just add.
        // For simplicity, we just add it to the list.
        const updated = [...prev, invoiceToSave];
        localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
        syncToCloud({ recurringInvoices: updated });
        return updated;
    });
  }, [syncToCloud]);

  const removeRecurringInvoice = useCallback((index: number) => {
      setRecurringInvoices(prev => {
          const updated = prev.filter((_, i) => i !== index);
          localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
          syncToCloud({ recurringInvoices: updated });
          return updated;
      });
  }, [syncToCloud]);

  return {
    invoice,
    setInvoice,
    updateInvoice,
    addLineItem,
    removeLineItem,
    updateLineItem,
    calculateTotals,
    savedClients,
    saveClient,
    recurringInvoices,
    saveRecurringInvoice,
    removeRecurringInvoice
  };
};
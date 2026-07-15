import { useState, useCallback, useEffect } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, User as AppUser, Client, BusinessProfile } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc } from '../services/firebase';
import { queueMutation } from '../utils/offlineSync';
import { trackEvent } from '../utils/analytics';

const DEFAULT_USER: AppUser = {
  name: '',
  email: '',
  phoneNumber: '',
  address: '',
  tin: '',
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

  const generateRandomInvoiceNumber = () => {
    // Generates a string like "INV-2026-X8B9Q"
    const year = new Date().getFullYear();
    const randomChars = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `INV-${year}-${randomChars}`;
  };

  return {
    user: savedUser,
    client: {
      name: '',
      email: '',
      address: '',
    },
    invoiceNumber: generateRandomInvoiceNumber(),
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
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<Invoice[]>([]);
  const { user: firebaseUser, isPro } = useSubscription();

  // Cloud Sync: Load data from Firestore if Pro
  useEffect(() => {
    if (isPro && firebaseUser) {
        const loadCloudData = async () => {
            try {
                // To prevent clobbering un-synced offline local data with stale cloud data,
                // we first check if there is an active offline queue.
                const { getQueueCount } = await import('../utils/offlineSync');
                const queueCount = await getQueueCount();

                if (queueCount > 0) {
                    console.log("[useInvoice] Offline queue is active. Skipping initial cloud fetch to preserve local state.");
                    return;
                }

                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.invoiceUser) {
                        setInvoice(prev => ({ ...prev, user: data.invoiceUser }));
                    }
                    if (data.savedInvoices) {
                        setSavedInvoices(data.savedInvoices);
                    }
                    if (data.savedClients) {
                        setSavedClients(data.savedClients);
                    }
                    if (data.businessProfiles) {
                        setBusinessProfiles(data.businessProfiles);
                    }
                    if (data.recurringInvoices) {
                        setRecurringInvoices(data.recurringInvoices);
                    }
                    if (data.currentInvoice) {
                        setInvoice(data.currentInvoice);
                    }
                }
            } catch (error) {
                console.error("Failed to load cloud data", error);
                try { trackEvent('cloud_data_load_failed', { collection: 'users', doc_id: firebaseUser.uid, error: String(error) }); } catch {}
            }
        };
        loadCloudData();
    }
  }, [isPro, firebaseUser]);

  // Sync to Cloud helper with Offline Support
  const syncToCloud = useCallback(async (data: Partial<{ 
      invoiceUser: AppUser, 
      savedInvoices: Invoice[],
      savedClients: Client[], 
      businessProfiles: BusinessProfile[], 
      recurringInvoices: Invoice[], 
      currentInvoice: Invoice 
  }>) => {
      if (isPro && firebaseUser) {
          if (!navigator.onLine) {
              await queueMutation('users', firebaseUser.uid, data);
              return;
          }

          try {
              const userRef = doc(db, 'users', firebaseUser.uid);
              await setDoc(userRef, data, { merge: true });
          } catch (error) {
              console.error("Failed to sync to cloud, queueing locally instead", error);
              await queueMutation('users', firebaseUser.uid, data);
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

  // Persist full draft/current invoice to cloud to allow cross-device drafting and offline sync
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        syncToCloud({ currentInvoice: invoice });
    }, 1500); // 1.5s debounce to avoid thrashing on every keystroke
    return () => clearTimeout(timeoutId);
  }, [invoice, syncToCloud]);

  // Load saved clients, business profiles and recurring invoices
  useEffect(() => {
    try {
        const storedClients = localStorage.getItem('invoiceSavedClients');
        if (storedClients) {
            setSavedClients(JSON.parse(storedClients));
        }
        const storedProfiles = localStorage.getItem('invoiceBusinessProfiles');
        if (storedProfiles) {
            setBusinessProfiles(JSON.parse(storedProfiles));
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
    const whtAmount = taxableAmount * ((invoice.whtRate || 0) / 100);

    // Total = (Subtotal - Discount) + Tax - WHT + Shipping
    const finalTotal = taxableAmount + taxAmount - whtAmount + safeShipping;

    return { subtotal, discountAmount, tax: taxAmount, whtAmount, shipping: safeShipping, total: finalTotal };
  }, [invoice.lineItems, invoice.taxRate, invoice.whtRate, invoice.discountRate, invoice.shippingAmount, invoice.discountType]);

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

  const toggleRecurringActive = useCallback((index: number, isActive: boolean) => {
      setRecurringInvoices(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], recurringIsActive: isActive };
          localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
          syncToCloud({ recurringInvoices: updated });
          return updated;
      });
  }, [syncToCloud]);

  const saveBusinessProfile = useCallback((profile: AppUser) => {
      if (!profile.name.trim()) return false;

      setBusinessProfiles(prev => {
          const normalizedName = profile.name.trim().toLowerCase();
          const existingIndex = prev.findIndex(p => p.name.toLowerCase() === normalizedName);

          let newProfiles;
          if (existingIndex >= 0) {
              newProfiles = [...prev];
              newProfiles[existingIndex] = { ...profile, id: prev[existingIndex].id };
          } else {
              newProfiles = [...prev, { ...profile, id: crypto.randomUUID() }];
          }

          newProfiles.sort((a, b) => a.name.localeCompare(b.name));

          localStorage.setItem('invoiceBusinessProfiles', JSON.stringify(newProfiles));
          syncToCloud({ businessProfiles: newProfiles });
          return newProfiles;
      });
      return true;
  }, [syncToCloud]);

  const removeBusinessProfile = useCallback((id: string) => {
      setBusinessProfiles(prev => {
          const newProfiles = prev.filter(p => p.id !== id);
          localStorage.setItem('invoiceBusinessProfiles', JSON.stringify(newProfiles));
          syncToCloud({ businessProfiles: newProfiles });
          return newProfiles;
      });
  }, [syncToCloud]);

  const saveInvoice = useCallback((inv: Invoice) => {
    setSavedInvoices(prev => {
        // Find if an invoice with this number already exists
        const existingIndex = prev.findIndex(i => i.invoiceNumber === inv.invoiceNumber);
        let newInvoices;
        if (existingIndex >= 0) {
            newInvoices = [...prev];
            newInvoices[existingIndex] = inv;
        } else {
            newInvoices = [inv, ...prev]; // Newest first
        }
        
        localStorage.setItem('invoiceHistory', JSON.stringify(newInvoices));
        syncToCloud({ savedInvoices: newInvoices });
        return newInvoices;
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
    savedInvoices,
    saveInvoice,
    savedClients,
    saveClient,
    businessProfiles,
    saveBusinessProfile,
    removeBusinessProfile,
    recurringInvoices,
    saveRecurringInvoice,
    removeRecurringInvoice,
    toggleRecurringActive
  };
};

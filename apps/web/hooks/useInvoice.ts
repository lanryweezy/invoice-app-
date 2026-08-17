import { useState, useCallback, useEffect, Dispatch, SetStateAction } from 'react';
import type { Invoice, LineItem, Currency, InvoiceStatus, User as AppUser, Client, BusinessProfile } from '../types';
import { useSubscription } from './useSubscription';
import { db, doc, setDoc, getDoc, collection, getDocs } from '../services/firebase';
import { queueMutation, queuePathMutation } from '../utils/offlineSync';
import { generateSecureId } from '../utils/crypto';
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
  if (typeof window !== 'undefined') {
    try {
      const draft = localStorage.getItem('invoiceDraft');
      if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed && typeof parsed === 'object' && parsed.invoiceNumber) {
              return parsed;
          }
      }
    } catch (e) {
      console.error("Failed to load invoice draft", e);
    }
  }

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
    // Security Fix: Use cryptographically secure random numbers for invoice references
    const randomChars = generateSecureId(5);
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

type SyncToCloudFn = (data: Partial<{
    invoiceUser: AppUser,
    savedInvoices: Invoice[],
    savedClients: Client[],
    businessProfiles: BusinessProfile[],
    recurringInvoices: Invoice[],
    currentInvoice: Invoice
}>) => Promise<void>;

// Firestore document IDs can't contain '/'; derive a safe, stable id from the invoice number.
const invoiceDocId = (inv: Invoice): string =>
  String(inv.invoiceNumber || '').trim().replace(/[/\\]/g, '_') || crypto.randomUUID();

// Firestore rejects `undefined` values; strip them (and non-serializable fields) before writing.
const stripUndefined = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const useCloudSync = (
  isPro: boolean,
  firebaseUser: any,
  setInvoice: Dispatch<SetStateAction<Invoice>>,
  setRecurringInvoices: Dispatch<SetStateAction<Invoice[]>>,
  setSavedInvoices: Dispatch<SetStateAction<Invoice[]>>,
  setSavedClients: Dispatch<SetStateAction<Client[]>>,
  setBusinessProfiles: Dispatch<SetStateAction<BusinessProfile[]>>
): { syncToCloud: SyncToCloudFn; syncInvoiceDoc: (inv: Invoice) => Promise<void> } => {
  useEffect(() => {
    if (isPro && firebaseUser) {
        const loadCloudData = async () => {
            try {
                const { getQueueCount } = await import('../utils/offlineSync');
                const queueCount = await getQueueCount();

                if (queueCount > 0) {
                    return;
                }

                const userRef = doc(db, 'users', firebaseUser.uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    const data = userSnap.data();
                    if (data.recurringInvoices) setRecurringInvoices(data.recurringInvoices);
                    if (data.currentInvoice) setInvoice(data.currentInvoice);
                    if (data.savedClients) setSavedClients(data.savedClients);
                    if (data.businessProfiles) setBusinessProfiles(data.businessProfiles);
                }

                // Invoices now live in a per-user subcollection (one doc each) to avoid
                // whole-array clobbering, stay under the 1MB doc limit, and trigger Cloud Functions.
                const invoicesSnap = await getDocs(collection(db, 'users', firebaseUser.uid, 'invoices'));
                if (!invoicesSnap.empty) {
                    const invoices = invoicesSnap.docs.map(d => d.data() as Invoice);
                    invoices.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
                    setSavedInvoices(invoices);
                } else if (userSnap.exists() && Array.isArray(userSnap.data().savedInvoices)) {
                    // Backward compatibility: migrate legacy array into the subcollection.
                    const legacy = userSnap.data().savedInvoices as Invoice[];
                    setSavedInvoices(legacy);
                    await Promise.all(
                        legacy.map(inv =>
                            setDoc(doc(db, `users/${firebaseUser.uid}/invoices/${invoiceDocId(inv)}`), stripUndefined(inv), { merge: true })
                        )
                    );
                }
            } catch (error) {
                console.error("Failed to load cloud data", error);
                try { trackEvent('cloud_data_load_failed', { collection: 'users', doc_id: firebaseUser.uid, error: String(error) }); } catch {}
            }
        };
        loadCloudData();
    }
  }, [isPro, firebaseUser, setInvoice, setRecurringInvoices, setSavedInvoices, setSavedClients, setBusinessProfiles]);

  const syncToCloud = useCallback(async (data: Parameters<SyncToCloudFn>[0]) => {
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

  // Writes a single invoice to its own subcollection document instead of a shared array,
  // so concurrent devices/offline flushes can no longer overwrite each other's history.
  const syncInvoiceDoc = useCallback(async (inv: Invoice) => {
      if (!(isPro && firebaseUser)) return;
      const path = `users/${firebaseUser.uid}/invoices/${invoiceDocId(inv)}`;
      const payload = stripUndefined(inv);

      if (!navigator.onLine) {
          await queuePathMutation(path, payload);
          return;
      }

      try {
          await setDoc(doc(db, path), payload, { merge: true });
      } catch (error) {
          console.error("Failed to sync invoice, queueing locally instead", error);
          await queuePathMutation(path, payload);
      }
  }, [isPro, firebaseUser]);

  return { syncToCloud, syncInvoiceDoc };
};

const useLocalPersistence = (
  invoice: Invoice,
  syncToCloud: SyncToCloudFn,
  setSavedClients: Dispatch<SetStateAction<Client[]>>,
  setBusinessProfiles: Dispatch<SetStateAction<BusinessProfile[]>>,
  setRecurringInvoices: Dispatch<SetStateAction<Invoice[]>>
) => {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
        localStorage.setItem('invoiceDraft', JSON.stringify(invoice));
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [invoice]);

  useEffect(() => {
    localStorage.setItem('invoiceCurrency', invoice.currency);
  }, [invoice.currency]);

  useEffect(() => {
    localStorage.setItem('invoiceStatus', invoice.status);
  }, [invoice.status]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        localStorage.setItem('invoiceUser', JSON.stringify(invoice.user));
        // 🌱 Flora: Catch floating promise rejections inside setTimeout to prevent silent failures
        // bypassing standard React error boundaries.
        syncToCloud({ invoiceUser: invoice.user }).catch(console.error);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [invoice.user, syncToCloud]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
        // 🌱 Flora: Catch floating promise rejections inside setTimeout to prevent silent failures
        // bypassing standard React error boundaries.
        syncToCloud({ currentInvoice: invoice }).catch(console.error);
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [invoice, syncToCloud]);

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
    } catch(e) {
        console.error('Failed to load local data', e);
        try { trackEvent('local_data_load_failed', { error: String(e) }); } catch {}
    }
  }, [setSavedClients, setBusinessProfiles, setRecurringInvoices]);
};

const useInvoiceMutations = (invoice: Invoice, setInvoice: Dispatch<SetStateAction<Invoice>>) => {
  const resetInvoice = useCallback(() => {
    localStorage.removeItem('invoiceDraft');
    setInvoice(getInitialInvoiceState());
  }, [setInvoice]);
  const updateInvoice = useCallback(<K extends keyof Invoice>(key: K, value: Invoice[K]) => {
    setInvoice(prev => ({ ...prev, [key]: value }));
  }, [setInvoice]);

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
  }, [setInvoice]);

  const removeLineItem = useCallback((id: string) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  }, [setInvoice]);

  const updateLineItem = useCallback((id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
    setInvoice(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  }, [setInvoice]);

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

  return { updateInvoice, addLineItem, removeLineItem, updateLineItem, calculateTotals, resetInvoice };
};

const useEntityManagement = (
  syncToCloud: SyncToCloudFn,
  syncInvoiceDoc: (inv: Invoice) => Promise<void>,
  setSavedClients: Dispatch<SetStateAction<Client[]>>,
  setBusinessProfiles: Dispatch<SetStateAction<BusinessProfile[]>>,
  setRecurringInvoices: Dispatch<SetStateAction<Invoice[]>>,
  setSavedInvoices: Dispatch<SetStateAction<Invoice[]>>
) => {
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
        // 🌱 Flora: Catch floating promise rejections in state setters to prevent silent failures
        syncToCloud({ savedClients: newClients }).catch(console.error);
        return newClients;
    });
    return true;
  }, [syncToCloud, setSavedClients]);

  const saveRecurringInvoice = useCallback((invoiceToSave: Invoice) => {
    setRecurringInvoices(prev => {
        // Prevent duplicates based on some identifier, maybe client + invoice structure, or just add.
        // For simplicity, we just add it to the list.
        const updated = [...prev, invoiceToSave];
        localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
        syncToCloud({ recurringInvoices: updated }).catch(console.error);
        return updated;
    });
  }, [syncToCloud, setRecurringInvoices]);

  const removeRecurringInvoice = useCallback((index: number) => {
      setRecurringInvoices(prev => {
          const updated = prev.filter((_, i) => i !== index);
          localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
          syncToCloud({ recurringInvoices: updated }).catch(console.error);
          return updated;
      });
  }, [syncToCloud, setRecurringInvoices]);

  const toggleRecurringActive = useCallback((index: number, isActive: boolean) => {
      setRecurringInvoices(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], recurringIsActive: isActive };
          localStorage.setItem('invoiceRecurring', JSON.stringify(updated));
          syncToCloud({ recurringInvoices: updated }).catch(console.error);
          return updated;
      });
  }, [syncToCloud, setRecurringInvoices]);

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
          syncToCloud({ businessProfiles: newProfiles }).catch(console.error);
          return newProfiles;
      });
      return true;
  }, [syncToCloud, setBusinessProfiles]);

  const removeBusinessProfile = useCallback((id: string) => {
      setBusinessProfiles(prev => {
          const newProfiles = prev.filter(p => p.id !== id);
          localStorage.setItem('invoiceBusinessProfiles', JSON.stringify(newProfiles));
          syncToCloud({ businessProfiles: newProfiles }).catch(console.error);
          return newProfiles;
      });
  }, [syncToCloud, setBusinessProfiles]);

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
        return newInvoices;
    });
    // Sync only the changed invoice to its own subcollection doc — never the whole array —
    // so a second device or a delayed offline flush can't clobber other invoices.
    syncInvoiceDoc(inv).catch(console.error);
  }, [syncInvoiceDoc, setSavedInvoices]);

  return {
    saveClient,
    saveRecurringInvoice,
    removeRecurringInvoice,
    toggleRecurringActive,
    saveBusinessProfile,
    removeBusinessProfile,
    saveInvoice
  };
};

export const useInvoice = () => {
  const [invoice, setInvoice] = useState<Invoice>(getInitialInvoiceState());
  const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
  const [savedClients, setSavedClients] = useState<Client[]>([]);
  const [businessProfiles, setBusinessProfiles] = useState<BusinessProfile[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<Invoice[]>([]);
  const { user: firebaseUser, isPro } = useSubscription();

  const { syncToCloud, syncInvoiceDoc } = useCloudSync(isPro, firebaseUser, setInvoice, setRecurringInvoices, setSavedInvoices, setSavedClients, setBusinessProfiles);
  useLocalPersistence(invoice, syncToCloud, setSavedClients, setBusinessProfiles, setRecurringInvoices);
  const mutations = useInvoiceMutations(invoice, setInvoice);
  const entities = useEntityManagement(syncToCloud, syncInvoiceDoc, setSavedClients, setBusinessProfiles, setRecurringInvoices, setSavedInvoices);

  return {
    invoice,
    setInvoice,
    ...mutations,
    savedInvoices,
    savedClients,
    businessProfiles,
    recurringInvoices,
    ...entities
  };
};

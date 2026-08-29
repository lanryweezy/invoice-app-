import { create } from 'zustand';

interface AppState {
  isEmailModalOpen: boolean;
  setIsEmailModalOpen: (isOpen: boolean) => void;
  
  isSmtpModalOpen: boolean;
  setIsSmtpModalOpen: (isOpen: boolean) => void;
  
  isPricingModalOpen: boolean;
  setIsPricingModalOpen: (isOpen: boolean) => void;
  
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (isOpen: boolean) => void;

  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (isOpen: boolean) => void;
  
  pricingModalContent: { title: string; message: string };
  setPricingModalContent: (content: { title: string; message: string }) => void;
  
  toast: { message: string; isVisible: boolean; type?: 'success' | 'error' };
  showToast: (message: string, type?: 'success' | 'error') => void;
  hideToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isEmailModalOpen: false,
  setIsEmailModalOpen: (isOpen) => set({ isEmailModalOpen: isOpen }),
  
  isSmtpModalOpen: false,
  setIsSmtpModalOpen: (isOpen) => set({ isSmtpModalOpen: isOpen }),
  
  isPricingModalOpen: false,
  setIsPricingModalOpen: (isOpen) => set({ isPricingModalOpen: isOpen }),
  
  isAuthModalOpen: false,
  setIsAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),

  isSettingsModalOpen: false,
  setIsSettingsModalOpen: (isOpen) => set({ isSettingsModalOpen: isOpen }),
  
  pricingModalContent: { title: 'Upgrade to Pro', message: 'Unlock advanced features to supercharge your business.' },
  setPricingModalContent: (content) => set({ pricingModalContent: content }),
  
  toast: { message: '', isVisible: false, type: 'success' },
  showToast: (message, type = 'success') => set({ toast: { message, isVisible: true, type } }),
  hideToast: () => set((state) => ({ toast: { ...state.toast, isVisible: false } })),
}));

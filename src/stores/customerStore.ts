import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Customer } from '../types';

interface CustomerState {
    selectedCustomer: Customer | null;
    setSelectedCustomer: (customer: Customer | null) => void;
    clearCustomer: () => void;
}

export const useCustomerStore = create<CustomerState>()(
    persist(
        (set) => ({
            selectedCustomer: null,
            setSelectedCustomer: (customer) => set({ selectedCustomer: customer }),
            clearCustomer: () => set({ selectedCustomer: null }),
        }),
        {
            name: 'customer-store',
            storage: createJSONStorage(() => localStorage),
            // Ensure the store is hydrated immediately on page load
            skipHydration: false,
        }
    )
);

// Hydrate the store immediately on module load
if (typeof window !== 'undefined') {
    useCustomerStore.persist.rehydrate();
}

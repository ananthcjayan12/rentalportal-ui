import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
        }
    )
);

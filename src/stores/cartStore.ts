import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
    items: CartItem[];
    itemCount: number;
    total: number;
    setItems: (items: CartItem[]) => void;
    setCartData: (data: { items: CartItem[]; total: number; item_count: number }) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()((set) => ({
    items: [],
    itemCount: 0,
    total: 0,
    setItems: (items) => set({ items, itemCount: items.length }),
    setCartData: (data) =>
        set({
            items: data.items,
            itemCount: data.item_count,
            total: data.total,
        }),
    clearCart: () => set({ items: [], itemCount: 0, total: 0 }),
}));

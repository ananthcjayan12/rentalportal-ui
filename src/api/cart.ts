import { apiClient, API_ENDPOINTS } from './client';
import type { CartData } from '../types';

export async function getCustomerCartItems(customer_id: string): Promise<CartData> {
    const response = await apiClient.post<CartData>(
        API_ENDPOINTS.CART.GET_ITEMS,
        { customer_id }
    );
    return response.data || { items: [], total: 0, item_count: 0 };
}

export async function addToCustomerCart(
    item_code: string,
    customer_id: string,
    rental_start_date: string,
    rental_end_date: string,
    function_date?: string,
    quantity: number = 1
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.CART.ADD_ITEM,
        {
            item_code,
            customer_id,
            rental_start_date,
            rental_end_date,
            function_date,
            quantity,
        }
    );
    return response.data || { success: false, message: 'Failed to add item' };
}

export async function removeFromCustomerCart(
    cart_item_id: string,
    customer_id: string
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.CART.REMOVE_ITEM,
        { cart_item_id, customer_id }
    );
    return response.data || { success: false };
}

export async function clearCustomerCart(
    customer_id: string
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.CART.CLEAR,
        { customer_id }
    );
    return response.data || { success: false };
}

import { frappeCall } from './client';
import type { CartData } from '../types';

export async function getCustomerCartItems(customer_id: string): Promise<CartData> {
    return frappeCall<CartData>('get_customer_cart_items', { customer_id });
}

export async function addToCustomerCart(
    item_code: string,
    customer_id: string,
    rental_start_date: string,
    rental_end_date: string,
    function_date?: string,
    quantity: number = 1
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('add_to_customer_cart', {
        item_code,
        customer_id,
        rental_start_date,
        rental_end_date,
        function_date,
        quantity,
    });
}

export async function removeFromCustomerCart(
    cart_item_id: string,
    customer_id: string
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('remove_from_customer_cart', { cart_item_id, customer_id });
}

export async function clearCustomerCart(
    customer_id: string
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('clear_customer_cart', { customer_id });
}

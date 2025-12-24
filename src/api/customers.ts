import { frappeCall } from './client';
import type { Customer } from '../types';

export async function searchCustomers(
    query: string = '',
    limit: number = 20
): Promise<Customer[]> {
    return frappeCall<Customer[]>('search_customers', { query, limit });
}

export async function createCustomer(
    customer_name: string,
    mobile_number?: string,
    email_id?: string,
    customer_group: string = 'Individual'
): Promise<{ success: boolean; customer_id?: string; message?: string }> {
    return frappeCall('create_customer', {
        customer_name,
        mobile_number,
        email_id,
        customer_group,
    });
}

export async function updateCustomer(
    customer_id: string,
    customer_name: string,
    mobile_number: string,
    email_id?: string
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('update_customer', {
        customer_id,
        customer_name,
        mobile_number,
        email_id,
    });
}

export async function getCustomerDetails(
    customer_id: string
): Promise<Customer> {
    return frappeCall<Customer>('get_customer_details', { customer_id });
}

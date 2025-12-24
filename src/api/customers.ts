import { apiClient, API_ENDPOINTS } from './client';
import type { Customer } from '../types';

export async function searchCustomers(
    query: string = '',
    limit: number = 20
): Promise<Customer[]> {
    const response = await apiClient.post<Customer[]>(
        API_ENDPOINTS.CUSTOMERS.SEARCH,
        { query, limit }
    );
    return response.data || [];
}

export async function createCustomer(
    customer_name: string,
    mobile_number?: string,
    email_id?: string,
    customer_group: string = 'Individual'
): Promise<{ success: boolean; customer_id?: string; message?: string }> {
    const response = await apiClient.post<{ success: boolean; customer_id?: string; message?: string }>(
        API_ENDPOINTS.CUSTOMERS.CREATE,
        {
            customer_name,
            mobile_number,
            email_id,
            customer_group,
        }
    );
    return response.data || { success: false };
}

export async function updateCustomer(
    customer_id: string,
    customer_name: string,
    mobile_number: string,
    email_id?: string
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.CUSTOMERS.UPDATE,
        {
            customer_id,
            customer_name,
            mobile_number,
            email_id,
        }
    );
    return response.data || { success: false };
}

export async function getCustomerDetails(
    customer_id: string
): Promise<Customer | null> {
    const response = await apiClient.post<{ success: boolean; customer?: Customer; message?: string }>(
        API_ENDPOINTS.CUSTOMERS.GET_DETAILS,
        { customer_id }
    );

    // Handle the nested response structure: { success: true, customer: {...} }
    if (response.data?.success && response.data?.customer) {
        return response.data.customer as Customer;
    }

    // If the API returns just the customer directly (fallback)
    if (response.data && 'name' in response.data) {
        return response.data as unknown as Customer;
    }

    return null;
}

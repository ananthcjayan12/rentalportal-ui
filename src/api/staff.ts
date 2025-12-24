import { apiClient, API_ENDPOINTS } from './client';

export interface DashboardStats {
    pending_advance: number;
    pending_delivery: number;
    pending_return: number;
    total_active: number;
}

export interface StaffBooking {
    name: string;
    posting_date: string;
    total: number;
    booking_status: string;
    customer_name: string;
    customer: string;
    advance_amount?: number;
    balance_amount_collected?: number;
    caution_deposit_amount?: number;
    caution_deposit_collected?: number;
    function_date?: string;
    rental_start_date?: string;
    rental_end_date?: string;
    balance_due?: number;
    mobile_number?: string;
    item_count?: number;
    third_party_owner?: string;
}

export interface ExchangeItem {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
}

export interface SearchResultItem {
    item_code: string;
    item_name: string;
    image?: string;
    rental_rate_per_day: number;
}

export async function getStaffDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>(
        API_ENDPOINTS.STAFF.GET_DASHBOARD_STATS
    );
    return response.data || { pending_advance: 0, pending_delivery: 0, pending_return: 0, total_active: 0 };
}

export async function getStaffAllBookings(filters?: {
    status?: string;
    owner?: string;
}): Promise<StaffBooking[]> {
    const response = await apiClient.post<StaffBooking[]>(
        API_ENDPOINTS.STAFF.GET_ALL_BOOKINGS,
        filters || {}
    );
    return response.data || [];
}

export async function processDelivery(
    booking_id: string,
    balance_collected: number,
    caution_collected: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.STAFF.DELIVER_BOOKING,
        {
            booking_id,
            balance_collected,
            caution_collected,
            payment_mode
        }
    );
    return response.data || { success: false };
}

// Exchange APIs
export async function getBookingItemsForExchange(
    booking_id: string
): Promise<{ success: boolean; items: ExchangeItem[]; booking_status: string; message?: string }> {
    const response = await apiClient.post<{ success: boolean; items: ExchangeItem[]; booking_status: string; message?: string }>(
        API_ENDPOINTS.EXCHANGE.GET_BOOKING_ITEMS,
        { booking_id }
    );
    return response.data || { success: false, items: [], booking_status: '' };
}

export async function getAvailableItemsForExchange(
    search_query: string
): Promise<{ success: boolean; items: SearchResultItem[] }> {
    const response = await apiClient.post<{ success: boolean; items: SearchResultItem[] }>(
        API_ENDPOINTS.EXCHANGE.GET_AVAILABLE_ITEMS,
        { search_query }
    );
    return response.data || { success: false, items: [] };
}

export async function calculateExchangeDifference(
    booking_id: string,
    items_to_remove: ExchangeItem[],
    new_items: { item_code: string; item_name: string; rate: number; qty: number }[]
): Promise<{ success: boolean; removed_value: number; new_value: number; difference: number }> {
    const response = await apiClient.post<{ success: boolean; removed_value: number; new_value: number; difference: number }>(
        API_ENDPOINTS.EXCHANGE.CALCULATE_DIFFERENCE,
        {
            booking_id,
            items_to_remove: JSON.stringify(items_to_remove),
            new_items: JSON.stringify(new_items)
        }
    );
    return response.data || { success: false, removed_value: 0, new_value: 0, difference: 0 };
}

export async function processExchange(
    booking_id: string,
    items_to_remove: ExchangeItem[],
    new_items: { item_code: string; item_name: string; rate: number; qty: number }[],
    adjustment_amount: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; new_booking?: string; message?: string }> {
    const response = await apiClient.post<{ success: boolean; new_booking?: string; message?: string }>(
        API_ENDPOINTS.EXCHANGE.PROCESS,
        {
            booking_id,
            items_to_remove: JSON.stringify(items_to_remove),
            new_items: JSON.stringify(new_items),
            adjustment_amount,
            payment_mode
        }
    );
    return response.data || { success: false };
}


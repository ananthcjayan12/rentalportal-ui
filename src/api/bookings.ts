import { apiClient, API_ENDPOINTS } from './client';
import type { Booking, BookingSummary } from '../types';

export async function createCustomerBookingFromCart(
    customer_id: string,
    advance_amount: number = 0,
    special_instructions: string = ''
): Promise<{ success: boolean; booking_id?: string; message?: string }> {
    const response = await apiClient.post<{ success: boolean; booking_id?: string; message?: string }>(
        API_ENDPOINTS.BOOKINGS.CREATE_FROM_CART,
        {
            customer_id,
            advance_amount,
            special_instructions,
        }
    );
    return response.data || { success: false };
}

export async function getCustomerActiveBookings(
    customer_id: string
): Promise<{ success: boolean; bookings: Booking[] }> {
    const response = await apiClient.post<{ success: boolean; bookings: Booking[] }>(
        API_ENDPOINTS.BOOKINGS.GET_ACTIVE,
        { customer_id }
    );
    return response.data || { success: false, bookings: [] };
}

export async function getBookingPaymentSummary(
    booking_id: string
): Promise<{ success: boolean; summary: BookingSummary | null }> {
    const response = await apiClient.post<{ success: boolean; summary: BookingSummary }>(
        API_ENDPOINTS.BOOKINGS.GET_SUMMARY,
        { booking_id }
    );
    return response.data || { success: false, summary: null };
}

export async function confirmBookingWithAdvance(
    booking_id: string,
    advance_amount: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.BOOKINGS.CONFIRM_WITH_ADVANCE,
        {
            booking_id,
            advance_amount,
            payment_mode,
        }
    );
    return response.data || { success: false };
}

export async function collectBalanceAndCautionDeposit(
    booking_id: string,
    balance_amount: number,
    caution_deposit_amount: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.BOOKINGS.COLLECT_BALANCE,
        {
            booking_id,
            balance_amount,
            caution_deposit_amount,
            payment_mode,
        }
    );
    return response.data || { success: false };
}

export async function processItemReturnAndRefund(
    booking_id: string,
    caution_deposit_refund: number,
    deduction_amount: number = 0,
    deduction_reason: string = '',
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(
        API_ENDPOINTS.BOOKINGS.PROCESS_RETURN,
        {
            booking_id,
            caution_deposit_refund,
            deduction_amount,
            deduction_reason,
            payment_mode,
        }
    );
    return response.data || { success: false };
}

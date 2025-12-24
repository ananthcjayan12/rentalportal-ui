import { frappeCall } from './client';
import type { Booking, BookingSummary } from '../types';

export async function createCustomerBookingFromCart(
    customer_id: string,
    advance_amount: number = 0,
    special_instructions: string = ''
): Promise<{ success: boolean; booking_id?: string; message?: string }> {
    return frappeCall('create_customer_booking_from_cart', {
        customer_id,
        advance_amount,
        special_instructions,
    });
}

export async function getCustomerActiveBookings(
    customer_id: string
): Promise<{ success: boolean; bookings: Booking[] }> {
    return frappeCall('get_customer_active_bookings', { customer_id });
}

export async function getBookingPaymentSummary(
    booking_id: string
): Promise<{ success: boolean; summary: BookingSummary }> {
    return frappeCall('get_booking_payment_summary', { booking_id });
}

export async function confirmBookingWithAdvance(
    booking_id: string,
    advance_amount: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('confirm_booking_with_advance', {
        booking_id,
        advance_amount,
        payment_mode,
    });
}

export async function collectBalanceAndCautionDeposit(
    booking_id: string,
    balance_amount: number,
    caution_deposit_amount: number,
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('collect_balance_and_caution_deposit', {
        booking_id,
        balance_amount,
        caution_deposit_amount,
        payment_mode,
    });
}

export async function processItemReturnAndRefund(
    booking_id: string,
    caution_deposit_refund: number,
    deduction_amount: number = 0,
    deduction_reason: string = '',
    payment_mode: string = 'Cash'
): Promise<{ success: boolean; message?: string }> {
    return frappeCall('process_item_return_and_refund', {
        booking_id,
        caution_deposit_refund,
        deduction_amount,
        deduction_reason,
        payment_mode,
    });
}

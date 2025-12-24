export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const PLACEHOLDER_IMAGE = '/assets/rental_management/images/placeholder.jpg';

export const BOOKING_STATUS = {
    DRAFT: '',
    CONFIRMED: 'Confirmed',
    OUT_FOR_RENTAL: 'Out for Rental',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
} as const;

export const SORT_OPTIONS = [
    { value: 'name', label: 'Name' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest First' },
] as const;

export const PAYMENT_MODES = [
    { value: 'Cash', label: 'Cash' },
    { value: 'UPI', label: 'UPI' },
    { value: 'Card', label: 'Card' },
    { value: 'Bank Transfer', label: 'Bank Transfer' },
] as const;

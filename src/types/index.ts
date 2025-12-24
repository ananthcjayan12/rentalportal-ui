// Item Types
export interface Item {
    name: string;
    item_code: string;
    item_name: string;
    description?: string;
    image?: string;
    images?: ItemImage[];
    rental_rate_per_day: number;
    rental_mrp_per_day?: number;
    discount_percentage?: number;
    is_available?: boolean;
    category?: string;
    item_group?: string;
    caution_deposit?: number;
}

export interface ItemImage {
    image: string;
    is_primary?: boolean;
}

// Category Types
export interface Category {
    name: string;
    label: string;
    image?: string;
    icon?: string;
    item_count?: number;
}

// Banner Types
export interface Banner {
    name: string;
    title?: string;
    image: string;
    link?: string;
    priority?: number;
}

// Cart Types
export interface CartItem {
    cart_item_id: string;
    item_code: string;
    item_name: string;
    item_image?: string;
    rental_rate: number;
    rental_days: number;
    total_amount: number;
    function_date?: string;
    rental_start_date?: string;
    rental_end_date?: string;
    quantity: number;
}

export interface CartData {
    items: CartItem[];
    total: number;
    item_count: number;
}

// Customer Types
export interface Customer {
    name: string;
    customer_name: string;
    mobile_number?: string;
    email_id?: string;
    customer_group?: string;
    booking_count?: number;
    last_booking_date?: string;
}

// Booking Types
export interface Booking {
    name: string;
    posting_date: string;
    total: number;
    booking_status?: string;
    customer_name: string;
    customer?: string;
    advance_amount?: number;
    balance_amount_collected?: number;
    caution_deposit_amount?: number;
    caution_deposit_collected?: number;
    function_date?: string;
    rental_start_date?: string;
    rental_end_date?: string;
    item_count?: number;
}

export interface BookingSummary {
    booking_id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    advance_amount: number;
    balance_amount: number;
    caution_deposit: number;
    booking_status: string;
    items: BookingItem[];
}

export interface BookingItem {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface ItemsResponse {
    items: Item[];
    total_count: number;
    has_more: boolean;
}

export interface AvailabilityResponse {
    is_available: boolean;
    message?: string;
}

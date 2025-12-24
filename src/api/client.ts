import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API Response wrapper interface
export interface ApiResponse<T = unknown> {
    message: string;
    data?: T;
    error?: string;
    status_code?: number;
}

// API Error interface
export interface ApiError {
    message: string;
    status_code: number;
    error_details?: unknown;
}

// Base API configuration
const API_CONFIG = {
    // In development, Vite proxy handles forwarding to localhost:8000
    // In production, set VITE_API_URL to the actual backend URL
    baseURL: import.meta.env.VITE_API_URL || '',
    timeout: 30000, // 30 seconds
    withCredentials: true, // Send cookies with every request for Frappe session management
    headers: {
        'Content-Type': 'application/json',
    },
};

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create(API_CONFIG);
        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor - Ensure credentials
        this.client.interceptors.request.use(
            (config) => {
                // CRITICAL: Ensure withCredentials is set for every request
                config.withCredentials = true;

                // Log request in development
                if (import.meta.env.DEV) {
                    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
                }

                return config;
            },
            (error) => {
                console.error('Request interceptor error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor - Handle common errors
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                // Log response in development
                if (import.meta.env.DEV) {
                    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
                }

                return response;
            },
            (error) => {
                console.error('API Error:', error);

                // Handle network errors
                if (!error.response) {
                    return Promise.reject({
                        message: 'Network error. Please check your internet connection.',
                        status_code: 0,
                    } as ApiError);
                }

                const { status, data } = error.response;

                // Handle authentication errors
                if (status === 401 || status === 403) {
                    // Could redirect to login if needed
                    console.warn('Authentication required');
                }

                // Handle other common errors
                const apiError: ApiError = {
                    message: data?.message || data?.exc || 'An unexpected error occurred',
                    status_code: status,
                    error_details: data,
                };

                return Promise.reject(apiError);
            }
        );
    }

    // GET request with Frappe response handling
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        const response = await this.client.get(url, config);
        return this.handleFrappeResponse<T>(response.data);
    }

    // POST request with Frappe response handling
    async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
        const response = await this.client.post(endpoint, data);
        return this.handleFrappeResponse<T>(response.data);
    }

    // Handle Frappe's nested response structure
    private handleFrappeResponse<T>(responseData: any): ApiResponse<T> {
        // Frappe returns: { message: { message: "...", data: {...} } } or { message: data }
        if (responseData.message && typeof responseData.message === 'object') {
            const messageObj = responseData.message;

            // Check if this is a paginated response (has data array + pagination fields)
            if (messageObj.data && Array.isArray(messageObj.data) &&
                (messageObj.total_count !== undefined || messageObj.page_length !== undefined)) {
                return {
                    message: messageObj.message || 'Success',
                    data: messageObj as T,
                };
            }

            // Regular nested response with data field
            if (messageObj.data !== undefined) {
                return {
                    message: messageObj.message || 'Success',
                    data: messageObj.data,
                };
            }

            // Message object is the data itself
            return {
                message: messageObj.message || 'Success',
                data: messageObj as T,
            };
        }

        // Direct structure - message is the data
        if (responseData.message !== undefined) {
            return {
                message: 'Success',
                data: responseData.message as T,
            };
        }

        // Fallback
        return {
            message: 'Success',
            data: responseData,
        };
    }

    // Get raw axios instance for advanced usage
    getClient(): AxiosInstance {
        return this.client;
    }
}

// Create singleton instance
export const apiClient = new ApiClient();

// API endpoints for Rental Management Portal
export const API_ENDPOINTS = {
    // Portal
    PORTAL: {
        GET_BANNERS: '/api/method/rental_management.api.customer_portal.get_portal_banners',
        GET_CATEGORIES: '/api/method/rental_management.api.customer_portal.get_portal_categories',
        GET_RENTAL_CATEGORIES: '/api/method/rental_management.api.customer_portal.get_rental_categories',
    },

    // Items
    ITEMS: {
        LIST: '/api/method/rental_management.api.customer_portal.get_rental_items',
        GET_DETAILS: '/api/method/rental_management.api.customer_portal.get_item_details',
        GET_IMAGES: '/api/method/rental_management.api.customer_portal.get_item_images',
        CHECK_AVAILABILITY: '/api/method/rental_management.api.customer_portal.check_item_availability',
    },

    // Cart
    CART: {
        GET_ITEMS: '/api/method/rental_management.api.customer_portal.get_customer_cart_items',
        ADD_ITEM: '/api/method/rental_management.api.customer_portal.add_to_customer_cart',
        REMOVE_ITEM: '/api/method/rental_management.api.customer_portal.remove_from_customer_cart',
        CLEAR: '/api/method/rental_management.api.customer_portal.clear_customer_cart',
    },

    // Customers
    CUSTOMERS: {
        SEARCH: '/api/method/rental_management.api.customer_portal.search_customers',
        CREATE: '/api/method/rental_management.api.customer_portal.create_customer',
        UPDATE: '/api/method/rental_management.api.customer_portal.update_customer',
        GET_DETAILS: '/api/method/rental_management.api.customer_portal.get_customer_details',
    },

    // Bookings
    BOOKINGS: {
        CREATE_FROM_CART: '/api/method/rental_management.api.customer_portal.create_customer_booking_from_cart',
        GET_ACTIVE: '/api/method/rental_management.api.customer_portal.get_customer_active_bookings',
        GET_SUMMARY: '/api/method/rental_management.api.customer_portal.get_booking_payment_summary',
        CONFIRM_WITH_ADVANCE: '/api/method/rental_management.api.customer_portal.confirm_booking_with_advance',
        COLLECT_BALANCE: '/api/method/rental_management.api.customer_portal.collect_balance_and_caution_deposit',
        PROCESS_RETURN: '/api/method/rental_management.api.customer_portal.process_item_return_and_refund',
    },

    // Exchange
    EXCHANGE: {
        GET_BOOKING_ITEMS: '/api/method/rental_management.api.customer_portal.get_booking_items_for_exchange',
        GET_AVAILABLE_ITEMS: '/api/method/rental_management.api.customer_portal.get_available_items_for_exchange',
        CALCULATE_DIFFERENCE: '/api/method/rental_management.api.customer_portal.calculate_exchange_difference',
        PROCESS: '/api/method/rental_management.api.customer_portal.process_exchange',
    },

    // Staff Dashboard
    STAFF: {
        GET_DASHBOARD_STATS: '/api/method/rental_management.api.customer_portal.get_staff_dashboard_stats',
        GET_ALL_BOOKINGS: '/api/method/rental_management.api.customer_portal.get_staff_all_bookings',
        DELIVER_BOOKING: '/api/method/rental_management.api.customer_portal.process_delivery',
    },

    // Authentication
    AUTH: {
        LOGIN: '/api/method/login',
        LOGOUT: '/api/method/logout',
        GET_LOGGED_USER: '/api/method/frappe.auth.get_logged_user',
        GET_CURRENT_USER: '/api/method/rental_management.api.customer_portal.get_current_user_info',
    },
} as const;

export default apiClient;

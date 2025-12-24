import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Frappe API wrapper for calling whitelisted methods
export async function frappeCall<T>(
    method: string,
    args: Record<string, unknown> = {}
): Promise<T> {
    const response = await api.post(
        `/api/method/rental_management.api.customer_portal.${method}`,
        args
    );
    return response.data.message;
}

// Helper for GET-style calls
export async function frappeGet<T>(
    method: string,
    params: Record<string, unknown> = {}
): Promise<T> {
    const response = await api.get(
        `/api/method/rental_management.api.customer_portal.${method}`,
        { params }
    );
    return response.data.message;
}

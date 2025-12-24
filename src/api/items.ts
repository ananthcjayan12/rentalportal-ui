import { apiClient, API_ENDPOINTS } from './client';
import type { Item, ItemsResponse, AvailabilityResponse } from '../types';

export interface GetItemsParams {
    category?: string;
    search?: string;
    sort_by?: 'name' | 'price_low' | 'price_high' | 'newest' | 'random';
    page?: number;
    limit?: number;
}

export async function getRentalItems(params: GetItemsParams = {}): Promise<ItemsResponse> {
    const response = await apiClient.post<ItemsResponse>(API_ENDPOINTS.ITEMS.LIST, params);
    // Handle case where response.data might be the items array directly
    if (Array.isArray(response.data)) {
        return {
            items: response.data as Item[],
            total_count: response.data.length,
            has_more: false,
        };
    }
    return response.data || { items: [], total_count: 0, has_more: false };
}

export async function getItemDetails(item_code: string): Promise<Item | null> {
    const response = await apiClient.post<Item>(API_ENDPOINTS.ITEMS.GET_DETAILS, { item_code });
    return response.data || null;
}

export async function checkItemAvailability(
    item_code: string,
    start_date: string,
    end_date: string
): Promise<AvailabilityResponse> {
    const response = await apiClient.post<AvailabilityResponse>(
        API_ENDPOINTS.ITEMS.CHECK_AVAILABILITY,
        { item_code, start_date, end_date }
    );
    return response.data || { is_available: false };
}

export async function getItemImages(item_code: string): Promise<string[]> {
    const response = await apiClient.post<{ images: string[] }>(
        API_ENDPOINTS.ITEMS.GET_IMAGES,
        { item_code }
    );
    return response.data?.images || [];
}

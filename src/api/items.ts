import { frappeCall } from './client';
import type { Item, ItemsResponse, AvailabilityResponse } from '../types';

export interface GetItemsParams {
    category?: string;
    search?: string;
    sort_by?: 'name' | 'price_low' | 'price_high' | 'newest' | 'random';
    page?: number;
    limit?: number;
}

export async function getRentalItems(params: GetItemsParams = {}): Promise<ItemsResponse> {
    return frappeCall<ItemsResponse>('get_rental_items', params as Record<string, unknown>);
}

export async function getItemDetails(item_code: string): Promise<Item> {
    return frappeCall<Item>('get_item_details', { item_code });
}

export async function checkItemAvailability(
    item_code: string,
    start_date: string,
    end_date: string
): Promise<AvailabilityResponse> {
    return frappeCall<AvailabilityResponse>('check_item_availability', {
        item_code,
        start_date,
        end_date,
    });
}

export async function getItemImages(item_code: string): Promise<{ images: string[] }> {
    return frappeCall<{ images: string[] }>('get_item_images', { item_code });
}

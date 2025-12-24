import { apiClient, API_ENDPOINTS } from './client';
import type { Banner, Category } from '../types';

export async function getPortalBanners(): Promise<Banner[]> {
    const response = await apiClient.get<Banner[]>(API_ENDPOINTS.PORTAL.GET_BANNERS);
    return response.data || [];
}

export async function getPortalCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(API_ENDPOINTS.PORTAL.GET_CATEGORIES);
    return response.data || [];
}

export async function getRentalCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(API_ENDPOINTS.PORTAL.GET_RENTAL_CATEGORIES);
    return response.data || [];
}

import { frappeGet } from './client';
import type { Banner, Category } from '../types';

export async function getPortalBanners(): Promise<Banner[]> {
    return frappeGet<Banner[]>('get_portal_banners');
}

export async function getPortalCategories(): Promise<Category[]> {
    return frappeGet<Category[]>('get_portal_categories');
}

export async function getRentalCategories(): Promise<Category[]> {
    return frappeGet<Category[]>('get_rental_categories');
}

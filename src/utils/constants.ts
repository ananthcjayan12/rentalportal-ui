export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Use a reliable external placeholder for now to ensure UI looks good even if local assets miss
export const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80';

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
export const getImageUrl = (path?: string | null) => {
    if (!path) return PLACEHOLDER_IMAGE;
    if (path.startsWith('http')) return path;
    // If path doesn't start with /, add it
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    // If we are in dev mode, we can trust the proxy, but explicit URL is safer for potential misconfiguration
    // However, for best compat with proxy being just for API, let's use the full URL if we can
    // actually, let's use the API_BASE_URL if it's set (usually empty in dev for proxy)
    // If API_BASE_URL is empty (dev proxy), use relative path so proxy handles it
    if (!API_BASE_URL) return normalizedPath;
    return `${API_BASE_URL}${normalizedPath}`;
};

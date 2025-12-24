// Storage keys for rental portal
const STORAGE_KEYS = {
    USER_DATA: 'rental_portal_user',
    SELECTED_CUSTOMER: 'rental_portal_customer',
};

export interface UserData {
    email: string;
    full_name: string;
    user_type?: string;
    roles?: string[];
}

// Set user data in localStorage
export function setStoredUserData(userData: UserData): void {
    try {
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    } catch (error) {
        console.error('Error storing user data:', error);
    }
}

// Get user data from localStorage
export function getStoredUserData(): UserData | null {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error reading user data:', error);
        return null;
    }
}

// Clear all stored data (on logout)
export function clearAllStoredData(): void {
    try {
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_CUSTOMER);
        // Also clear zustand persisted stores
        localStorage.removeItem('customer-store');
        localStorage.removeItem('cart-store');
    } catch (error) {
        console.error('Error clearing stored data:', error);
    }
}

// Check if user is logged in (basic check)
export function isLoggedIn(): boolean {
    return getStoredUserData() !== null;
}

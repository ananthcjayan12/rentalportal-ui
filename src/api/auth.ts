import { apiClient, API_ENDPOINTS } from './client';
import { setStoredUserData, clearAllStoredData, type UserData } from '../utils/storage';

export interface LoginCredentials {
    usr: string;
    pwd: string;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    full_name?: string;
    user?: UserData;
}

class AuthService {
    /**
     * Login user with email/mobile and password using Frappe's standard login
     */
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
        // Clear any stale data before login attempt
        clearAllStoredData();

        try {
            // Use Frappe's standard login endpoint
            const response = await apiClient.getClient().post(
                API_ENDPOINTS.AUTH.LOGIN,
                credentials
            );

            const loginData = response.data;

            // Frappe login returns { message: "Logged In", full_name: "..." }
            if (loginData.message === 'Logged In') {
                // Get logged user info
                const userResponse = await apiClient.getClient().get(
                    API_ENDPOINTS.AUTH.GET_LOGGED_USER
                );

                const email = userResponse.data?.message?.email || credentials.usr;
                const roles = userResponse.data?.message?.roles || [];

                const userData: UserData = {
                    email: email,
                    full_name: loginData.full_name || email,
                    roles: roles
                };

                setStoredUserData(userData);

                return {
                    success: true,
                    message: 'Logged In',
                    full_name: loginData.full_name,
                    user: userData,
                };
            }

            // Login failed
            return {
                success: false,
                message: loginData.message || 'Login failed',
            };
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle specific error messages from Frappe
            const errorMessage = error?.response?.data?.message
                || error?.message
                || 'Login failed. Please check your credentials.';

            return {
                success: false,
                message: errorMessage,
            };
        }
    }

    /**
     * Logout current user
     */
    async logout(): Promise<void> {
        try {
            await apiClient.getClient().post(API_ENDPOINTS.AUTH.LOGOUT);
        } catch (error) {
            console.error('Logout error:', error);
            // Continue with local logout even if API call fails
        } finally {
            // Clear local storage regardless of API response
            clearAllStoredData();
        }
    }

    /**
     * Check if user is currently authenticated by making an API call
     */
    /**
     * Check if user is currently authenticated by making an API call
     */
    async checkSession(): Promise<{ isLoggedIn: boolean; user?: string }> {
        try {
            // Use our custom whitelisted API to check session and get full details including roles
            const response = await apiClient.getClient().get(
                API_ENDPOINTS.AUTH.GET_CURRENT_USER
            );

            // Response format: { message: { is_logged_in: boolean, user: string, roles: [], ... } }
            const sessionData = response.data?.message;

            if (!sessionData || !sessionData.is_logged_in) {
                clearAllStoredData();
                return { isLoggedIn: false };
            }

            // Update stored user data with latest roles
            const userData: UserData = {
                email: sessionData.email || sessionData.user,
                full_name: sessionData.full_name || sessionData.user,
                roles: sessionData.roles || []
            };
            setStoredUserData(userData);

            return { isLoggedIn: true, user: sessionData.user };
        } catch (error) {
            console.error('Session check error:', error);
            // If API fails (e.g. 403), assume logged out
            clearAllStoredData();
            return { isLoggedIn: false };
        }
    }
}


// Create singleton instance
export const authService = new AuthService();

export interface LoggedUserResponse {
    user: string;
    email: string;
    roles: string[];
    full_name: string;
}

export async function getLoggedUser(): Promise<{ message?: LoggedUserResponse }> {
    // Usage of frappe.auth.get_logged_user is restricted, use our custom whitelist
    const response = await apiClient.getClient().get(API_ENDPOINTS.AUTH.GET_CURRENT_USER);
    // Our custom API returns { message: { ...data... } }
    return response.data;
}

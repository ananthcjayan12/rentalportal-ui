import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../api/auth';
import { getStoredUserData } from '../../utils/storage';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const location = useLocation();
    const { isAuthenticated, isLoading, setUser, setLoading, login } = useAuthStore();

    useEffect(() => {
        // Check if we have stored user data
        const storedUser = getStoredUserData();

        if (storedUser) {
            // We have stored data, verify session is still valid
            authService.checkSession().then(({ isLoggedIn }) => {
                if (isLoggedIn) {
                    login(storedUser);
                } else {
                    setUser(null);
                }
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    // Show loading spinner while checking auth
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Checking authentication...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { ProtectedRoute } from './components/auth';
import {
  HomePage,
  CategoryPage,
  ItemDetailPage,
  CartPage,
  ProfilePage,
  BookingsPage,
  BookingDetailsPage,
  LoginPage,
  StaffDashboardPage,
  OwnerDashboardPage,
  OwnerAddItemPage
} from './pages';


import { useEffect } from 'react';
import { authService } from './api/auth';
import { useAuthStore } from './stores/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const initAuth = async () => {
      // Optimistic load from local storage to avoid latency
      const storedUser = localStorage.getItem('rental_portal_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setLoading(false); // Unblock UI immediately

          // Background validation
          authService.checkSession().then(({ isLoggedIn }) => {
            if (isLoggedIn) {
              // Refresh data (e.g. roles)
              const refreshed = localStorage.getItem('rental_portal_user');
              if (refreshed) setUser(JSON.parse(refreshed));
            } else {
              // Session invalid, log out
              setUser(null);
            }
          });
          return; // Exit main flow, let background task handle rest
        } catch (e) {
          console.error('Error parsing stored user', e);
        }
      }

      // No local data, perform standard check
      setLoading(true);
      try {
        const { isLoggedIn } = await authService.checkSession();
        if (isLoggedIn) {
          const latest = localStorage.getItem('rental_portal_user');
          if (latest) setUser(JSON.parse(latest));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth init error', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<LoginPage />} />


          {/* Staff Dashboard - full width layout */}
          <Route path="/staff" element={
            <ProtectedRoute>
              <StaffDashboardPage />
            </ProtectedRoute>
          } />

          {/* Owner Dashboard - full width layout */}
          <Route path="/owner-dashboard" element={
            <ProtectedRoute>
              <OwnerDashboardPage />
            </ProtectedRoute>
          } />

          {/* Add Item Page - accessible to authorized users */}
          <Route path="/add-item" element={
            <ProtectedRoute>
              <OwnerAddItemPage />
            </ProtectedRoute>
          } />

          {/* Booking Details - full width layout */}
          <Route path="/bookings/:bookingId" element={
            <ProtectedRoute>
              <BookingDetailsPage />
            </ProtectedRoute>
          } />

          {/* Protected routes with Layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/item/:itemCode" element={<ItemDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/bookings" element={<BookingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;


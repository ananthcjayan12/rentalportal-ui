import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout';
import { HomePage, CategoryPage, ItemDetailPage } from './pages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/item/:itemCode" element={<ItemDetailPage />} />
            {/* Placeholder routes - to be implemented */}
            <Route path="/cart" element={<div className="p-4">Cart Page - Coming Soon</div>} />
            <Route path="/bookings" element={<div className="p-4">Bookings Page - Coming Soon</div>} />
            <Route path="/profile" element={<div className="p-4">Profile Page - Coming Soon</div>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface LayoutProps {
    showSearch?: boolean;
}

export function Layout({ showSearch = true }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 lg:pb-0">
            <Header showSearch={showSearch} />
            <main className="max-w-7xl mx-auto">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}

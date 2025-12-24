import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, Calendar, User } from 'lucide-react';

const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/category', icon: Grid3X3, label: 'Categories' },
    { path: '/bookings', icon: Calendar, label: 'Booking' },
    { path: '/profile', icon: User, label: 'My Account' },
];

export function BottomNav() {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 lg:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map(({ path, icon: Icon, label }) => {
                    const isActive = location.pathname === path ||
                        (path !== '/' && location.pathname.startsWith(path));

                    return (
                        <Link
                            key={path}
                            to={path}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-primary' : 'text-gray-500'
                                }`}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
                                {label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

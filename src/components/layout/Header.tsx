import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Bell, Search, LogOut, User, Plus } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';
import { useAuthStore } from '../../stores/authStore';
import { authService } from '../../api/auth';

interface HeaderProps {
    showSearch?: boolean;
}

export function Header({ showSearch = true }: HeaderProps) {
    const navigate = useNavigate();
    const itemCount = useCartStore((state) => state.itemCount);
    const { user, logout } = useAuthStore();
    const [showUserMenu, setShowUserMenu] = useState(false);

    async function handleLogout() {
        await authService.logout();
        logout();
        navigate('/login');
    }

    return (
        <header className="bg-white sticky top-0 z-40 border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4">
                {/* Logo Row */}
                <div className="flex items-center justify-between h-14">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-lg">B</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg leading-tight">
                                Blush<sup className="text-xs">&</sup>
                            </span>
                            <span className="font-bold text-lg leading-tight -mt-1">Glow</span>
                        </div>
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link to="/cart" className="relative p-2">
                            <ShoppingCart size={24} className="text-gray-700" />
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                                    {itemCount}
                                </span>
                            )}
                        </Link>
                        <button className="relative p-2">
                            <Bell size={24} className="text-gray-700" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-secondary rounded-full" />
                        </button>

                        {/* User Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <User size={24} className="text-gray-700" />
                            </button>

                            {showUserMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setShowUserMenu(false)}
                                    />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">
                                        {user && (
                                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                                <p className="font-semibold text-gray-900 truncate">{user.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        )}

                                        {/* Admin / Portal Links */}
                                        {user?.roles?.includes('System Manager') && (
                                            <div className="py-2 border-b border-gray-100">
                                                <Link
                                                    to="/staff"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <User size={18} className="text-blue-500" />
                                                    <span>Staff Portal</span>
                                                </Link>
                                                <Link
                                                    to="/owner-dashboard"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <User size={18} className="text-purple-500" />
                                                    <span>Owner Dashboard</span>
                                                </Link>
                                                <Link
                                                    to="/add-item"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="w-full px-4 py-2 text-left flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                                                >
                                                    <Plus size={18} className="text-emerald-500" />
                                                    <span>Add Item</span>
                                                </Link>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="w-full px-4 py-2 text-left flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors mt-1"
                                        >
                                            <LogOut size={18} />
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <div className="pb-3">
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search for jewellery"
                                className="w-full pl-12 pr-4 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}

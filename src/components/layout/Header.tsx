import { Link } from 'react-router-dom';
import { ShoppingCart, Bell, Search } from 'lucide-react';
import { useCartStore } from '../../stores/cartStore';

interface HeaderProps {
    showSearch?: boolean;
}

export function Header({ showSearch = true }: HeaderProps) {
    const itemCount = useCartStore((state) => state.itemCount);

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

                    <div className="flex items-center gap-3">
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

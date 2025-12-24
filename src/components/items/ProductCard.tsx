import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Item } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../../utils/constants';

interface ProductCardProps {
    item: Item;
}

export function ProductCard({ item }: ProductCardProps) {
    const hasDiscount = item.rental_mrp_per_day && item.rental_mrp_per_day > item.rental_rate_per_day;
    const discountPercent = hasDiscount
        ? Math.round(((item.rental_mrp_per_day! - item.rental_rate_per_day) / item.rental_mrp_per_day!) * 100)
        : 0;

    return (
        <div className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col border border-gray-100">
            {/* Image */}
            <Link to={`/item/${item.item_code}`} className="block relative aspect-[4/5] overflow-hidden bg-gray-50">
                <img
                    src={getImageUrl(item.image)}
                    alt={item.item_name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                    }}
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {hasDiscount && (
                        <span className="px-2 py-1 bg-secondary text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-sm">
                            -{discountPercent}%
                        </span>
                    )}
                </div>

                {/* Quick Add Button - Desktop Only */}
                <button
                    className="absolute bottom-3 right-3 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-900 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary hover:text-white hidden md:flex"
                    aria-label="Add to cart"
                >
                    <ShoppingCart size={18} />
                </button>
            </Link>

            {/* Content */}
            <div className="p-3 md:p-4 flex flex-col flex-1">
                <Link to={`/item/${item.item_code}`} className="block mb-2 flex-1">
                    <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider line-clamp-1">
                        {item.category || item.item_group || 'Jewellery'}
                    </p>
                    <h3 className="font-semibold text-gray-900 leading-tight text-sm md:text-base line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {item.item_name}
                    </h3>
                </Link>

                {/* Price */}
                <div className="mt-auto">
                    <div className="flex items-end gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base md:text-lg">
                            {formatCurrency(item.rental_rate_per_day)}
                            <span className="text-xs text-gray-500 font-normal ml-0.5">/day</span>
                        </span>
                        {hasDiscount && (
                            <span className="text-xs text-gray-400 line-through mb-1">
                                {formatCurrency(item.rental_mrp_per_day!)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Mobile Cart Button - Only visible on small screens */}
                <button
                    className="mt-3 w-full py-2.5 bg-gray-50 text-gray-900 rounded-lg text-sm font-semibold hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2 md:hidden active:scale-95"
                >
                    <ShoppingCart size={16} />
                    <span>View Details</span>
                </button>
            </div>
        </div>
    );
}

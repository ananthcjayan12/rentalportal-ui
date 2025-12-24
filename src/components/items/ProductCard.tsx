import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import type { Item } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { PLACEHOLDER_IMAGE } from '../../utils/constants';

interface ProductCardProps {
    item: Item;
}

export function ProductCard({ item }: ProductCardProps) {
    const hasDiscount = item.rental_mrp_per_day && item.rental_mrp_per_day > item.rental_rate_per_day;
    const discountPercent = hasDiscount
        ? Math.round(((item.rental_mrp_per_day! - item.rental_rate_per_day) / item.rental_mrp_per_day!) * 100)
        : 0;

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Image */}
            <Link to={`/item/${item.item_code}`} className="block">
                <div className="aspect-[3/4] relative overflow-hidden">
                    <img
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.item_name}
                        className="w-full h-full object-cover"
                    />
                </div>
            </Link>

            {/* Content */}
            <div className="p-3">
                <Link to={`/item/${item.item_code}`}>
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm mb-1">
                        {item.item_name}
                    </h3>
                    {item.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                            {item.description}
                        </p>
                    )}
                </Link>

                {/* Price */}
                <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                        <span className="font-bold text-lg text-gray-900">
                            {formatCurrency(item.rental_rate_per_day)}
                        </span>
                        {hasDiscount && (
                            <>
                                <span className="text-xs text-gray-400 line-through">
                                    MRP: {formatCurrency(item.rental_mrp_per_day!)}
                                </span>
                                <span className="text-xs text-secondary font-semibold">
                                    ({discountPercent}% off)
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link
                        to={`/item/${item.item_code}`}
                        className="flex-1 border border-primary text-primary text-center py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors"
                    >
                        Check Availability
                    </Link>
                    <button className="bg-secondary p-2 rounded-lg text-white hover:bg-secondary/90 transition-colors">
                        <ShoppingCart size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}

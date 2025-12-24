import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingCart } from 'lucide-react';
import { getItemDetails, checkItemAvailability } from '../api/items';
import { addToCustomerCart } from '../api/cart';
import { useCustomerStore } from '../stores/customerStore';
import type { Item } from '../types';
import { formatCurrency, formatDateForInput, getDateFromNow } from '../utils/formatters';
import { PLACEHOLDER_IMAGE } from '../utils/constants';

export function ItemDetailPage() {
    const { itemCode } = useParams<{ itemCode: string }>();
    const navigate = useNavigate();
    const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);

    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);
    const [functionDate, setFunctionDate] = useState(formatDateForInput(getDateFromNow(7)));
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        async function loadItem() {
            if (!itemCode) return;
            try {
                const data = await getItemDetails(itemCode);
                setItem(data);
            } catch (error) {
                console.error('Error loading item:', error);
            } finally {
                setLoading(false);
            }
        }
        loadItem();
    }, [itemCode]);

    const handleCheckAvailability = async () => {
        if (!item) return;
        setCheckingAvailability(true);
        try {
            const startDate = new Date(functionDate);
            startDate.setDate(startDate.getDate() - 2);
            const endDate = new Date(functionDate);
            endDate.setDate(endDate.getDate() + 1);

            const result = await checkItemAvailability(
                item.item_code,
                formatDateForInput(startDate),
                formatDateForInput(endDate)
            );
            setIsAvailable(result.is_available);
        } catch (error) {
            console.error('Error checking availability:', error);
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleAddToCart = async () => {
        if (!item || !selectedCustomer) {
            // Redirect to profile to select customer
            navigate('/profile');
            return;
        }

        setAddingToCart(true);
        try {
            const startDate = new Date(functionDate);
            startDate.setDate(startDate.getDate() - 2);
            const endDate = new Date(functionDate);
            endDate.setDate(endDate.getDate() + 1);

            await addToCustomerCart(
                item.item_code,
                selectedCustomer.name,
                formatDateForInput(startDate),
                formatDateForInput(endDate),
                functionDate
            );
            navigate('/cart');
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!item) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Item not found</p>
            </div>
        );
    }

    const images = item.images?.length ? item.images.map(i => i.image) : [item.image || PLACEHOLDER_IMAGE];
    const hasDiscount = item.rental_mrp_per_day && item.rental_mrp_per_day > item.rental_rate_per_day;
    const discountPercent = hasDiscount
        ? Math.round(((item.rental_mrp_per_day! - item.rental_rate_per_day) / item.rental_mrp_per_day!) * 100)
        : 0;

    return (
        <div>
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="absolute top-20 left-4 z-10 w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm"
            >
                <ChevronLeft size={24} />
            </button>

            {/* Image Gallery */}
            <div className="aspect-[3/4] relative bg-gray-100">
                <img
                    src={images[currentImage]}
                    alt={item.item_name}
                    className="w-full h-full object-cover"
                />
                {/* Dots */}
                {images.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {images.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentImage(i)}
                                className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? 'bg-gray-800' : 'bg-gray-400'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="px-4 py-4 -mt-4 bg-white rounded-t-3xl relative">
                <h1 className="text-xl font-bold text-gray-900 mb-2">{item.item_name}</h1>

                {item.description && (
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {item.description}
                    </p>
                )}

                {/* Rating (placeholder) */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                className="text-yellow-400 fill-yellow-400"
                            />
                        ))}
                    </div>
                    <span className="text-sm text-gray-500">103 Reviews</span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-6">
                    {hasDiscount && (
                        <span className="text-lg font-bold text-secondary">-{discountPercent}%</span>
                    )}
                    <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(item.rental_rate_per_day)}
                    </span>
                    {hasDiscount && (
                        <span className="text-sm text-gray-400 line-through">
                            MRP: {formatCurrency(item.rental_mrp_per_day!)}
                        </span>
                    )}
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Function Date
                    </label>
                    <input
                        type="date"
                        value={functionDate}
                        onChange={(e) => {
                            setFunctionDate(e.target.value);
                            setIsAvailable(null);
                        }}
                        min={formatDateForInput(getDateFromNow(1))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg"
                    />
                </div>

                {/* Availability Status */}
                {isAvailable !== null && (
                    <div className={`p-3 rounded-lg mb-4 ${isAvailable ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {isAvailable ? '✅ Item is available!' : '❌ Item is not available for selected dates'}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={handleCheckAvailability}
                        disabled={checkingAvailability}
                        className="flex-1 border border-primary text-primary py-3 rounded-lg font-semibold disabled:opacity-50"
                    >
                        {checkingAvailability ? 'Checking...' : 'Check Availability'}
                    </button>
                    <button
                        onClick={handleAddToCart}
                        disabled={addingToCart || isAvailable === false}
                        className="flex-1 bg-secondary text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <ShoppingCart size={20} />
                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                </div>

                {!selectedCustomer && (
                    <p className="text-center text-sm text-gray-500 mt-3">
                        Please <button onClick={() => navigate('/profile')} className="text-primary font-medium">select a customer</button> to add to cart
                    </p>
                )}
            </div>
        </div>
    );
}

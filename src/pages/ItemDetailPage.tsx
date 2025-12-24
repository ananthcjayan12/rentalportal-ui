import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Star, ShoppingCart, Check, AlertCircle, User } from 'lucide-react';
import { getItemDetails, checkItemAvailability } from '../api/items';
import { addToCustomerCart } from '../api/cart';
import { useCustomerStore } from '../stores/customerStore';
import { useCartStore } from '../stores/cartStore';
import type { Item } from '../types';
import { formatCurrency, formatDateForInput, getDateFromNow } from '../utils/formatters';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/constants';

export function ItemDetailPage() {
    const { itemCode } = useParams<{ itemCode: string }>();
    const navigate = useNavigate();
    const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
    const { setCartData, itemCount } = useCartStore();

    const [item, setItem] = useState<Item | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImage, setCurrentImage] = useState(0);

    // Only function date is needed - backend calculates rental start/end
    const [functionDate, setFunctionDate] = useState(formatDateForInput(getDateFromNow(7)));

    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [checkingAvailability, setCheckingAvailability] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    // Reset availability when function date changes
    useEffect(() => {
        setIsAvailable(null);
        setAlertMessage(null);
    }, [functionDate]);

    // Calculate rental dates from function date (matching backend logic)
    // rental_start = function_date - 2 days
    // rental_end = function_date + 1 day
    const getRentalStartDate = () => {
        const funcDate = new Date(functionDate);
        funcDate.setDate(funcDate.getDate() - 2);
        return formatDateForInput(funcDate);
    };

    const getRentalEndDate = () => {
        const funcDate = new Date(functionDate);
        funcDate.setDate(funcDate.getDate() + 1);
        return formatDateForInput(funcDate);
    };

    // For function bookings, always charge 1 day (backend does the same)
    const rentalDays = 1;
    const totalAmount = item ? item.rental_rate_per_day * rentalDays : 0;
    const mrpTotal = item?.rental_mrp_per_day ? item.rental_mrp_per_day * rentalDays : 0;
    const savings = mrpTotal > totalAmount ? mrpTotal - totalAmount : 0;

    const handleCheckAvailability = async () => {
        if (!item || !functionDate) return;

        setCheckingAvailability(true);
        setAlertMessage(null);

        try {
            const result = await checkItemAvailability(
                item.item_code,
                getRentalStartDate(),
                getRentalEndDate()
            );
            setIsAvailable(result.is_available);

            if (result.is_available) {
                setAlertMessage({ type: 'success', text: 'Item is available for selected date!' });
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Item is not available for selected date.' });
            }
        } catch (error) {
            console.error('Error checking availability:', error);
            setAlertMessage({ type: 'error', text: 'Failed to check availability. Please try again.' });
        } finally {
            setCheckingAvailability(false);
        }
    };

    const handleAddToCart = async () => {
        if (!item) return;

        // Debug logging
        console.log('handleAddToCart called');
        console.log('selectedCustomer:', selectedCustomer);
        console.log('selectedCustomer?.name:', selectedCustomer?.name);

        if (!selectedCustomer) {
            // Redirect to profile to select customer with return info
            navigate(`/profile?return_to=item&return_item=${item.item_code}`);
            return;
        }

        // Additional validation
        if (!selectedCustomer.name) {
            console.error('Customer exists but has no name property:', selectedCustomer);
            setAlertMessage({ type: 'error', text: 'Invalid customer data. Please reselect customer.' });
            return;
        }

        setAddingToCart(true);
        setAlertMessage(null);

        try {
            console.log('Calling addToCustomerCart with:', {
                item_code: item.item_code,
                customer_id: selectedCustomer.name,
                rental_start_date: getRentalStartDate(),
                rental_end_date: getRentalEndDate(),
                function_date: functionDate
            });

            const result = await addToCustomerCart(
                item.item_code,
                selectedCustomer.name,
                getRentalStartDate(),
                getRentalEndDate(),
                functionDate
            );

            if (result.success) {
                // Update cart count
                setCartData({ items: [], total: 0, item_count: (itemCount || 0) + 1 });
                setAlertMessage({ type: 'success', text: 'Added to cart successfully!' });

                // Navigate to cart after brief delay
                setTimeout(() => navigate('/cart'), 1500);
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Failed to add to cart' });
            }
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            setAlertMessage({ type: 'error', text: error.message || 'Failed to add to cart' });
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

    // Handle images - backend may return string[] or ItemImage[]
    const images = item.images?.length
        ? item.images.map((img: any) => typeof img === 'string' ? img : img.image)
        : [item.image || PLACEHOLDER_IMAGE];

    const hasDiscount = item.rental_mrp_per_day && item.rental_mrp_per_day > item.rental_rate_per_day;
    const discountPercent = hasDiscount
        ? Math.round(((item.rental_mrp_per_day! - item.rental_rate_per_day) / item.rental_mrp_per_day!) * 100)
        : 0;

    return (
        <div className="pb-24 lg:pb-8">
            {/* Back Button - Mobile */}
            <button
                onClick={() => navigate(-1)}
                className="lg:hidden absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full border border-gray-100 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
            >
                <ChevronLeft size={24} className="text-gray-800" />
            </button>

            {/* Two Column Layout for Desktop */}
            <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
                <div className="lg:grid lg:grid-cols-2 lg:gap-12">

                    {/* Left Column - Image Gallery */}
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        {/* Main Image */}
                        <div className="relative bg-gray-50 lg:rounded-2xl lg:overflow-hidden">
                            <div className="aspect-[3/4] lg:aspect-square">
                                <img
                                    src={getImageUrl(images[currentImage])}
                                    alt={item.item_name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                    }}
                                />
                            </div>

                            {/* Availability Badge */}
                            <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-semibold ${item.is_available !== false
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {item.is_available !== false ? 'Available' : 'Unavailable'}
                            </div>

                            {/* Image Navigation Dots */}
                            {images.length > 1 && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                    {images.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentImage(i)}
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentImage
                                                ? 'bg-primary scale-125'
                                                : 'bg-gray-400/60'
                                                }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail Strip - Desktop */}
                        {images.length > 1 && (
                            <div className="hidden lg:flex gap-3 mt-4">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImage(i)}
                                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage
                                            ? 'border-primary ring-2 ring-primary/20'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={getImageUrl(img)}
                                            alt={`${item.item_name} ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right Column - Product Info */}
                    <div className="px-4 py-6 lg:px-0 lg:py-0">
                        {/* Breadcrumb - Desktop */}
                        <div className="hidden lg:flex items-center gap-2 text-sm text-gray-500 mb-4">
                            <button onClick={() => navigate('/')} className="hover:text-primary">Home</button>
                            <span>›</span>
                            <span className="text-gray-900">{item.item_name}</span>
                        </div>

                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">{item.item_name}</h1>

                        {item.description && (
                            <p className="text-gray-600 mb-4 leading-relaxed">
                                {item.description}
                            </p>
                        )}

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-5">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={18}
                                        className="text-yellow-400 fill-yellow-400"
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-500">103 Reviews</span>
                        </div>

                        {/* Price Section */}
                        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4 mb-6">
                            <div className="flex items-baseline gap-3 flex-wrap">
                                {hasDiscount && (
                                    <span className="px-2 py-1 bg-secondary text-white text-sm font-bold rounded">
                                        -{discountPercent}%
                                    </span>
                                )}
                                <span className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(item.rental_rate_per_day)}
                                </span>
                                <span className="text-gray-500">/function</span>
                                {hasDiscount && (
                                    <span className="text-gray-400 line-through">
                                        MRP: {formatCurrency(item.rental_mrp_per_day!)}
                                    </span>
                                )}
                            </div>
                            {item.caution_deposit && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Caution Deposit: {formatCurrency(item.caution_deposit)}
                                </p>
                            )}
                        </div>

                        {/* Customer Selection Alert */}
                        {!selectedCustomer && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                                <div className="flex items-start gap-3">
                                    <User className="text-amber-600 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-amber-800">Select Customer</h4>
                                        <p className="text-sm text-amber-700 mt-1">Choose a customer to continue booking</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/profile?return_to=item&return_item=${item.item_code}`)}
                                    className="w-full mt-3 py-2.5 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-colors"
                                >
                                    Select Customer
                                </button>
                            </div>
                        )}

                        {/* Booking Section */}
                        {selectedCustomer && (
                            <div className="border border-gray-200 rounded-xl p-4 mb-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Select Function Date</h3>

                                {/* Alert Message */}
                                {alertMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg mb-4 ${alertMessage.type === 'success'
                                        ? 'bg-green-50 text-green-700'
                                        : 'bg-red-50 text-red-700'
                                        }`}>
                                        {alertMessage.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                        <span className="text-sm">{alertMessage.text}</span>
                                    </div>
                                )}

                                {/* Function Date Input */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Function Date
                                    </label>
                                    <input
                                        type="date"
                                        value={functionDate}
                                        onChange={(e) => setFunctionDate(e.target.value)}
                                        min={formatDateForInput(getDateFromNow(1))}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-lg"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Rental period: {getRentalStartDate()} to {getRentalEndDate()} (4 days)
                                    </p>
                                </div>

                                {/* Rental Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2">
                                    {hasDiscount && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">MRP:</span>
                                            <span className="line-through text-gray-400">
                                                {formatCurrency(item.rental_mrp_per_day!)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Our Rate:</span>
                                        <span className="text-primary font-semibold">
                                            {formatCurrency(item.rental_rate_per_day)}
                                        </span>
                                    </div>
                                    {savings > 0 && (
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span>You Save:</span>
                                            <span>{formatCurrency(savings)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base pt-2 border-t border-gray-200">
                                        <span className="font-semibold">Total Amount:</span>
                                        <span className="font-bold text-primary text-lg">
                                            {formatCurrency(totalAmount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCheckAvailability}
                                        disabled={checkingAvailability || !functionDate}
                                        className="flex-1 py-3 border-2 border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {checkingAvailability ? 'Checking...' : 'Check Availability'}
                                    </button>
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={addingToCart || isAvailable === false}
                                        className="flex-1 py-3 bg-secondary text-white font-semibold rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <ShoppingCart size={20} />
                                        {addingToCart ? 'Adding...' : 'Add to Cart'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Customer Info */}
                        {selectedCustomer && (
                            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                                <div>
                                    <p className="text-sm text-gray-500">Selected Customer</p>
                                    <p className="font-medium text-gray-900">{selectedCustomer.customer_name}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/profile?return_to=item&return_item=${item.item_code}`)}
                                    className="text-primary text-sm font-medium hover:underline"
                                >
                                    Change
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

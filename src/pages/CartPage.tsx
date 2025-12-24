import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Calendar, Edit2, ShoppingBag, Loader2, CheckCircle2 } from 'lucide-react';
import { getCustomerCartItems, removeFromCustomerCart } from '../api/cart';
import { createCustomerBookingFromCart, confirmBookingWithAdvance } from '../api/bookings';
import { useCustomerStore } from '../stores/customerStore';
import { useCartStore } from '../stores/cartStore';
import type { CartItem } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/constants';

export function CartPage() {
    const navigate = useNavigate();
    const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);
    const { setCartData, clearCart } = useCartStore();

    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [removing, setRemoving] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Booking form state
    const [advanceAmount, setAdvanceAmount] = useState(0);
    const [specialInstructions, setSpecialInstructions] = useState('');

    // Success state
    const [bookingSuccess, setBookingSuccess] = useState<{
        bookingId: string;
        advanceCollected: number;
    } | null>(null);

    // Calculate totals
    const subtotal = cartItems.reduce((sum, item) => sum + item.total_amount, 0);
    const deliveryCharge = 0; // Free delivery
    const grandTotal = subtotal + deliveryCharge;
    const remainingBalance = grandTotal - advanceAmount;

    useEffect(() => {
        loadCart();
    }, [selectedCustomer]);

    async function loadCart() {
        if (!selectedCustomer) {
            setLoading(false);
            return;
        }

        try {
            const data = await getCustomerCartItems(selectedCustomer.name);
            setCartItems(data.items || []);
            setCartData(data);
        } catch (error) {
            console.error('Error loading cart:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoveItem(cartItemId: string) {
        if (!selectedCustomer || removing) return;

        setRemoving(cartItemId);
        try {
            await removeFromCustomerCart(cartItemId, selectedCustomer.name);
            const newItems = cartItems.filter((item) => item.cart_item_id !== cartItemId);
            setCartItems(newItems);
            setCartData({ items: newItems, total: 0, item_count: newItems.length });
        } catch (error) {
            console.error('Error removing item:', error);
        } finally {
            setRemoving(null);
        }
    }

    async function handleConfirmBooking() {
        if (!selectedCustomer || cartItems.length === 0 || isProcessing) return;

        setIsProcessing(true);
        try {
            // Create booking from cart
            const result = await createCustomerBookingFromCart(
                selectedCustomer.name,
                0, // We'll handle advance separately
                specialInstructions
            );

            if (result.success && result.booking_id) {
                // If advance amount provided, confirm booking with payment
                if (advanceAmount > 0) {
                    await confirmBookingWithAdvance(
                        result.booking_id,
                        advanceAmount,
                        'Cash'
                    );
                }

                // Show success
                setBookingSuccess({
                    bookingId: result.booking_id,
                    advanceCollected: advanceAmount,
                });

                // Clear cart state
                setCartItems([]);
                clearCart();
            } else {
                alert(result.message || 'Failed to create booking');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Failed to create booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    }

    function handleViewBooking() {
        if (bookingSuccess) {
            navigate(`/bookings/${bookingSuccess.bookingId}`);
        }
    }

    function handleNewBooking() {
        setBookingSuccess(null);
        navigate('/category');
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    // No customer selected
    if (!selectedCustomer) {
        return (
            <div className="px-4 py-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Customer Selected</h2>
                <p className="text-gray-500 mb-6">Please select a customer to view their cart</p>
                <Link
                    to="/profile"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Select Customer
                </Link>
            </div>
        );
    }

    // Booking success screen
    if (bookingSuccess) {
        return (
            <div className="px-4 py-8">
                <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
                        <CheckCircle2 size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Created!</h2>
                    <p className="text-gray-500 mb-6">Your booking has been successfully created</p>

                    <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Booking ID</span>
                            <span className="font-semibold text-gray-900">{bookingSuccess.bookingId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Advance Collected</span>
                            <span className="font-semibold text-green-600">
                                {formatCurrency(bookingSuccess.advanceCollected)}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Balance Due</span>
                            <span className="font-semibold text-gray-900">
                                {formatCurrency(grandTotal - bookingSuccess.advanceCollected)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleViewBooking}
                            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                        >
                            View Booking
                        </button>
                        <button
                            onClick={handleNewBooking}
                            className="w-full py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Create New Booking
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Empty cart
    if (cartItems.length === 0) {
        return (
            <div className="px-4 py-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <ShoppingBag size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                <p className="text-gray-500 mb-6">Add some amazing rental items to get started!</p>
                <Link
                    to="/category"
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Browse Items
                </Link>
            </div>
        );
    }

    return (
        <div className="pb-32">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2">
                        <ChevronLeft size={24} />
                    </button>
                    <div className="flex-1">
                        <h1 className="font-bold text-lg text-gray-900">Shopping Cart</h1>
                        <p className="text-sm text-gray-500">{cartItems.length} items • {selectedCustomer.customer_name}</p>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* Cart Items */}
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Items</h2>
                    <div className="space-y-4">
                        {cartItems.map((item) => (
                            <div
                                key={item.cart_item_id}
                                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
                            >
                                <div className="flex gap-4">
                                    {/* Image */}
                                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={getImageUrl(item.item_image)}
                                            alt={item.item_name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                            }}
                                        />
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                                            {item.item_name}
                                        </h3>

                                        {/* Dates */}
                                        <div className="text-sm text-gray-500 space-y-1 mb-2">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-primary" />
                                                <span>Function: {item.function_date ? formatDate(item.function_date) : 'Not set'}</span>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Rental: {item.rental_start_date ? formatDate(item.rental_start_date) : 'Not set'} - {item.rental_end_date ? formatDate(item.rental_end_date) : 'Not set'}
                                            </p>
                                        </div>

                                        {/* Pricing */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <span className="text-xs text-gray-400">
                                                    {formatCurrency(item.rental_rate)}/day × {item.rental_days} days
                                                </span>
                                                <p className="font-bold text-primary">
                                                    {formatCurrency(item.total_amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                    <Link
                                        to={`/item/${item.item_code}`}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                    >
                                        <Edit2 size={16} />
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleRemoveItem(item.cart_item_id)}
                                        disabled={removing === item.cart_item_id}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                                    >
                                        {removing === item.cart_item_id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Trash2 size={16} />
                                        )}
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Order Summary */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

                    <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal ({cartItems.length} items)</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Delivery</span>
                            <span className="font-semibold text-green-600">FREE</span>
                        </div>
                        <div className="flex justify-between pt-3 border-t border-gray-100">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-lg font-bold text-primary">{formatCurrency(grandTotal)}</span>
                        </div>
                    </div>

                    {/* Advance Payment */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Advance Amount (Optional)
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">₹</span>
                            <input
                                type="number"
                                value={advanceAmount || ''}
                                onChange={(e) => setAdvanceAmount(Math.min(Number(e.target.value) || 0, grandTotal))}
                                placeholder="0"
                                min="0"
                                max={grandTotal}
                                className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg text-lg font-semibold focus:border-primary focus:outline-none"
                            />
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                            Remaining balance: {formatCurrency(remainingBalance)}
                        </p>
                    </div>

                    {/* Special Instructions */}
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Special Instructions (Optional)
                        </label>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            placeholder="Any special requirements or notes..."
                            rows={3}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg resize-none focus:border-primary focus:outline-none"
                        />
                    </div>

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirmBooking}
                        disabled={isProcessing || cartItems.length === 0}
                        className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Creating Booking...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={20} />
                                Confirm Booking
                            </>
                        )}
                    </button>

                    <Link
                        to="/category"
                        className="block text-center text-primary font-medium mt-4 hover:underline"
                    >
                        ← Continue Shopping
                    </Link>
                </section>
            </div>
        </div>
    );
}

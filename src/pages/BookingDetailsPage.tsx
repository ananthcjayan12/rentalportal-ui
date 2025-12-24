import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, Package, User,
    Clock, Check, Truck, RotateCcw, AlertCircle
} from 'lucide-react';
import { getBookingPaymentSummary } from '../api/bookings';
import { formatCurrency, formatDate } from '../utils/formatters';

interface BookingItem {
    item_code: string;
    item_name: string;
    qty: number;
    rate: number;
    amount: number;
}

interface PaymentSummary {
    booking_id: string;
    customer: string;
    customer_id: string;
    booking_status: string;
    total_rental_amount: number;
    booking_items: BookingItem[];

    // Stage 1: Advance
    advance_amount: number;
    advance_collected: boolean;

    // Stage 2: Balance + Caution
    balance_amount_due: number;
    balance_amount_collected: number;
    remaining_balance: number;
    caution_deposit_due: number;
    caution_deposit_collected: number;
    remaining_caution_due: number;
    total_due_at_delivery: number;

    // Stage 3: Return & Refund
    caution_deposit_refunded: number;
    caution_deposit_deduction: number;
    remaining_caution_refund: number;
    deduction_reason: string;

    // Timestamps
    booking_date: string;
    delivery_time?: string;
    return_time?: string;

    // Next actions flags
    can_collect_advance: boolean;
    can_collect_balance: boolean;
    can_collect_caution: boolean;
    can_process_return: boolean;
    can_refund_caution: boolean;
}

export function BookingDetailsPage() {
    const { bookingId } = useParams<{ bookingId: string }>();
    const navigate = useNavigate();
    const [summary, setSummary] = useState<PaymentSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadBookingDetails();
    }, [bookingId]);

    async function loadBookingDetails() {
        if (!bookingId) return;

        setLoading(true);
        setError(null);

        try {
            const result = await getBookingPaymentSummary(bookingId);
            if (result.success && result.summary) {
                setSummary(result.summary as unknown as PaymentSummary);
            } else {
                setError('Failed to load booking details');
            }
        } catch (err) {
            console.error('Error loading booking:', err);
            setError('Failed to load booking details');
        } finally {
            setLoading(false);
        }
    }

    function getStatusBadge(status: string) {
        const statusMap: Record<string, { bg: string; text: string; label: string; icon: typeof Clock }> = {
            '': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending', icon: Clock },
            'Confirmed': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed', icon: Check },
            'Out for Rental': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Delivered', icon: Truck },
            'Returned': { bg: 'bg-green-100', text: 'text-green-700', label: 'Returned', icon: RotateCcw },
            'Completed': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed', icon: Check },
        };
        const config = statusMap[status] || statusMap[''];
        const IconComponent = config.icon;
        return (
            <span className={`px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-1.5 ${config.bg} ${config.text}`}>
                <IconComponent size={14} />
                {config.label}
            </span>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    if (error || !summary) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Booking</h2>
                <p className="text-gray-500 mb-4">{error || 'Booking not found'}</p>
                <button
                    onClick={() => navigate('/bookings')}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                    Back to Bookings
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="flex-1">
                            <h1 className="text-lg font-semibold text-gray-900">{summary.booking_id}</h1>
                            <p className="text-sm text-gray-500">Booking Details</p>
                        </div>
                        {getStatusBadge(summary.booking_status)}
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</h2>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="text-primary" size={24} />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{summary.customer}</p>
                            <p className="text-sm text-gray-500">Customer ID: {summary.customer_id}</p>
                        </div>
                    </div>
                </div>

                {/* Booking Items */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                        Items ({summary.booking_items.length})
                    </h2>
                    <div className="space-y-3">
                        {summary.booking_items.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Package className="text-gray-500" size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{item.item_name}</p>
                                        <p className="text-sm text-gray-500">{item.item_code} × {item.qty}</p>
                                    </div>
                                </div>
                                <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">Total Rental</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(summary.total_rental_amount)}</span>
                    </div>
                </div>

                {/* Payment Timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Payment Timeline</h2>

                    <div className="space-y-4">
                        {/* Stage 1: Advance */}
                        <div className={`p-4 rounded-lg border-2 ${summary.advance_collected ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {summary.advance_collected ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="text-white" size={14} />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                                            <Clock className="text-white" size={14} />
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-900">Stage 1: Advance</span>
                                </div>
                                <span className={`text-sm font-medium ${summary.advance_collected ? 'text-green-600' : 'text-yellow-600'}`}>
                                    {summary.advance_collected ? 'Collected' : 'Pending'}
                                </span>
                            </div>
                            <div className="ml-8">
                                <p className="text-gray-600">
                                    Advance Amount: <span className="font-semibold">{formatCurrency(summary.advance_amount)}</span>
                                </p>
                            </div>
                        </div>

                        {/* Stage 2: Balance + Caution */}
                        <div className={`p-4 rounded-lg border-2 ${summary.remaining_balance <= 0 && summary.remaining_caution_due <= 0
                            ? 'border-green-200 bg-green-50'
                            : summary.booking_status === 'Confirmed' || summary.booking_status === 'Out for Rental'
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {summary.remaining_balance <= 0 && summary.remaining_caution_due <= 0 ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="text-white" size={14} />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">2</span>
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-900">Stage 2: Balance + Caution</span>
                                </div>
                            </div>
                            <div className="ml-8 space-y-1">
                                <p className="text-gray-600">
                                    Balance Due: <span className="font-semibold">{formatCurrency(summary.balance_amount_due)}</span>
                                    {summary.balance_amount_collected > 0 && (
                                        <span className="text-green-600 ml-2">
                                            (Collected: {formatCurrency(summary.balance_amount_collected)})
                                        </span>
                                    )}
                                </p>
                                <p className="text-gray-600">
                                    Caution Deposit: <span className="font-semibold">{formatCurrency(summary.caution_deposit_due)}</span>
                                    {summary.caution_deposit_collected > 0 && (
                                        <span className="text-green-600 ml-2">
                                            (Collected: {formatCurrency(summary.caution_deposit_collected)})
                                        </span>
                                    )}
                                </p>
                                {summary.total_due_at_delivery > 0 && (
                                    <p className="text-red-600 font-semibold mt-2">
                                        Total Due at Delivery: {formatCurrency(summary.total_due_at_delivery)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stage 3: Return & Refund */}
                        <div className={`p-4 rounded-lg border-2 ${summary.booking_status === 'Completed' || summary.booking_status === 'Returned'
                            ? 'border-green-200 bg-green-50'
                            : summary.booking_status === 'Out for Rental'
                                ? 'border-purple-200 bg-purple-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {summary.booking_status === 'Completed' || summary.booking_status === 'Returned' ? (
                                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                            <Check className="text-white" size={14} />
                                        </div>
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                                            <span className="text-white text-xs font-bold">3</span>
                                        </div>
                                    )}
                                    <span className="font-semibold text-gray-900">Stage 3: Return & Refund</span>
                                </div>
                            </div>
                            <div className="ml-8 space-y-1">
                                {summary.caution_deposit_refunded > 0 && (
                                    <p className="text-green-600">
                                        Caution Refunded: {formatCurrency(summary.caution_deposit_refunded)}
                                    </p>
                                )}
                                {summary.caution_deposit_deduction > 0 && (
                                    <p className="text-red-600">
                                        Deduction: {formatCurrency(summary.caution_deposit_deduction)}
                                        {summary.deduction_reason && (
                                            <span className="text-gray-500 ml-2">({summary.deduction_reason})</span>
                                        )}
                                    </p>
                                )}
                                {summary.remaining_caution_refund > 0 && (
                                    <p className="text-blue-600 font-semibold">
                                        Pending Refund: {formatCurrency(summary.remaining_caution_refund)}
                                    </p>
                                )}
                                {summary.booking_status !== 'Out for Rental' &&
                                    summary.booking_status !== 'Completed' &&
                                    summary.booking_status !== 'Returned' && (
                                        <p className="text-gray-400 italic">Items not yet delivered</p>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Timestamps */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Timeline</h2>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="text-gray-400" size={18} />
                            <div>
                                <p className="text-sm text-gray-500">Booking Date</p>
                                <p className="font-medium">{formatDate(summary.booking_date)}</p>
                            </div>
                        </div>
                        {summary.delivery_time && (
                            <div className="flex items-center gap-3">
                                <Truck className="text-green-500" size={18} />
                                <div>
                                    <p className="text-sm text-gray-500">Delivered</p>
                                    <p className="font-medium">{formatDate(summary.delivery_time)}</p>
                                </div>
                            </div>
                        )}
                        {summary.return_time && (
                            <div className="flex items-center gap-3">
                                <RotateCcw className="text-purple-500" size={18} />
                                <div>
                                    <p className="text-sm text-gray-500">Returned</p>
                                    <p className="font-medium">{formatDate(summary.return_time)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Back to Bookings
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex-1 py-3 px-4 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                    >
                        Print Invoice
                    </button>
                </div>
            </div>
        </div>
    );
}

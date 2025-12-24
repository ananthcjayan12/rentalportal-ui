import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Package, Clock } from 'lucide-react';
import { getCustomerActiveBookings } from '../api/bookings';
import { useCustomerStore } from '../stores/customerStore';
import type { Booking } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export function BookingsPage() {
    const navigate = useNavigate();
    const selectedCustomer = useCustomerStore((state) => state.selectedCustomer);

    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        loadBookings();
    }, [selectedCustomer]);

    async function loadBookings() {
        if (!selectedCustomer) {
            setLoading(false);
            return;
        }

        try {
            const result = await getCustomerActiveBookings(selectedCustomer.name);
            if (result.success) {
                setBookings(result.bookings);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredBookings = bookings.filter((booking) => {
        if (filter === 'active') {
            return ['Draft', 'Confirmed', 'Out for Rental'].includes(booking.booking_status || '');
        }
        if (filter === 'completed') {
            return ['Completed', 'Cancelled'].includes(booking.booking_status || '');
        }
        return true;
    });

    function getStatusColor(status: string) {
        switch (status) {
            case 'Draft':
                return 'bg-gray-100 text-gray-700';
            case 'Confirmed':
                return 'bg-green-100 text-green-700';
            case 'Out for Rental':
                return 'bg-blue-100 text-blue-700';
            case 'Completed':
                return 'bg-gray-100 text-gray-700';
            case 'Cancelled':
                return 'bg-red-100 text-red-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
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
                    <Calendar size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">No Customer Selected</h2>
                <p className="text-gray-500 mb-6">Please select a customer to view their bookings</p>
                <button
                    onClick={() => navigate('/profile')}
                    className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Select Customer
                </button>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <h1 className="text-lg font-bold text-gray-900">Bookings</h1>
                <p className="text-sm text-gray-500">{selectedCustomer.customer_name}</p>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-3 bg-gray-50">
                <div className="flex gap-2">
                    {(['all', 'active', 'completed'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === f
                                    ? 'bg-primary text-white'
                                    : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 py-4">
                {filteredBookings.length > 0 ? (
                    <div className="space-y-3">
                        {filteredBookings.map((booking) => (
                            <button
                                key={booking.name}
                                onClick={() => navigate(`/bookings/${booking.name}`)}
                                className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-gray-900">{booking.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {formatDate(booking.posting_date || new Date())}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.booking_status || '')}`}>
                                        {booking.booking_status}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                                    <div className="flex items-center gap-1">
                                        <Package size={14} />
                                        <span>{booking.item_count || 0} items</span>
                                    </div>
                                    {booking.earliest_rental_date && (
                                        <div className="flex items-center gap-1">
                                            <Clock size={14} />
                                            <span>
                                                {formatDate(booking.earliest_rental_date)}
                                                {booking.latest_rental_date && ` - ${formatDate(booking.latest_rental_date)}`}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <span className="text-lg font-bold text-primary">
                                        {formatCurrency(booking.total || 0)}
                                    </span>
                                    <ChevronRight size={20} className="text-gray-400" />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                            <Calendar size={32} className="text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">No Bookings Found</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {filter === 'all'
                                ? 'Start by creating a new booking!'
                                : `No ${filter} bookings found.`}
                        </p>
                        {filter === 'all' && (
                            <button
                                onClick={() => navigate('/category')}
                                className="px-6 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                Browse Items
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

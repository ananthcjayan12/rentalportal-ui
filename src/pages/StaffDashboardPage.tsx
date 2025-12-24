import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock, Truck, RotateCcw, Package, Search, ArrowLeftRight, Plus, Minus,
    Phone, Calendar, DollarSign, Filter, X, Eye, CheckCircle, AlertCircle
} from 'lucide-react';
import {
    getStaffDashboardStats, getStaffAllBookings,
    getBookingItemsForExchange, getAvailableItemsForExchange,
    calculateExchangeDifference, processExchange,
    type DashboardStats, type StaffBooking, type ExchangeItem, type SearchResultItem
} from '../api/staff';
import { confirmBookingWithAdvance, collectBalanceAndCautionDeposit, processItemReturnAndRefund } from '../api/bookings';
import { formatCurrency, formatDate } from '../utils/formatters';

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'delivered' | 'completed';

interface ModalState {
    type: 'advance' | 'deliver' | 'return' | 'exchange' | null;
    booking: StaffBooking | null;
}

export function StaffDashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        pending_advance: 0,
        pending_delivery: 0,
        pending_return: 0,
        total_active: 0,
    });
    const [bookings, setBookings] = useState<StaffBooking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [activeStatCard, setActiveStatCard] = useState<string | null>(null);

    // Modal state
    const [modal, setModal] = useState<ModalState>({ type: null, booking: null });
    const [isProcessing, setIsProcessing] = useState(false);
    const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form states
    const [advanceForm, setAdvanceForm] = useState({ amount: 0, paymentMode: 'Cash' });
    const [deliveryForm, setDeliveryForm] = useState({ balanceAmount: 0, cautionDeposit: 0, paymentMode: 'Cash' });
    const [returnForm, setReturnForm] = useState({ refundAmount: 0, deductionAmount: 0, deductionReason: '', paymentMode: 'Cash' });

    // Exchange modal state
    const [exchangeData, setExchangeData] = useState<{
        currentItems: ExchangeItem[];
        itemsToRemove: ExchangeItem[];
        searchQuery: string;
        searchResults: SearchResultItem[];
        newItems: { item_code: string; item_name: string; rate: number; qty: number }[];
        removedValue: number;
        newValue: number;
        difference: number;
        paymentMode: string;
    }>({
        currentItems: [],
        itemsToRemove: [],
        searchQuery: '',
        searchResults: [],
        newItems: [],
        removedValue: 0,
        newValue: 0,
        difference: 0,
        paymentMode: 'Cash'
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    // Auto-hide alert after 5 seconds
    useEffect(() => {
        if (alertMessage) {
            const timer = setTimeout(() => setAlertMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [alertMessage]);

    async function loadDashboardData() {
        setLoading(true);
        try {
            const [statsData, bookingsData] = await Promise.all([
                getStaffDashboardStats(),
                getStaffAllBookings()
            ]);
            setStats(statsData);
            setBookings(bookingsData);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    function openAdvanceModal(booking: StaffBooking) {
        setAdvanceForm({ amount: booking.total || 0, paymentMode: 'Cash' });
        setModal({ type: 'advance', booking });
    }

    function openDeliveryModal(booking: StaffBooking) {
        const remainingBalance = (booking.total || 0) - (booking.advance_amount || 0) - (booking.balance_amount_collected || 0);
        const remainingCaution = (booking.caution_deposit_amount || 0) - (booking.caution_deposit_collected || 0);
        setDeliveryForm({
            balanceAmount: remainingBalance > 0 ? remainingBalance : 0,
            cautionDeposit: remainingCaution > 0 ? remainingCaution : 0,
            paymentMode: 'Cash'
        });
        setModal({ type: 'deliver', booking });
    }

    function openReturnModal(booking: StaffBooking) {
        setReturnForm({
            refundAmount: booking.caution_deposit_collected || 0,
            deductionAmount: 0,
            deductionReason: '',
            paymentMode: 'Cash'
        });
        setModal({ type: 'return', booking });
    }

    async function openExchangeModal(booking: StaffBooking) {
        setModal({ type: 'exchange', booking });
        // Load booking items for exchange
        try {
            const result = await getBookingItemsForExchange(booking.name);
            if (result.success) {
                setExchangeData({
                    currentItems: result.items,
                    itemsToRemove: [],
                    searchQuery: '',
                    searchResults: [],
                    newItems: [],
                    removedValue: 0,
                    newValue: 0,
                    difference: 0,
                    paymentMode: 'Cash'
                });
            }
        } catch (error) {
            console.error('Error loading exchange items:', error);
        }
    }

    async function searchExchangeItems() {
        if (!exchangeData.searchQuery.trim()) return;
        try {
            const result = await getAvailableItemsForExchange(exchangeData.searchQuery);
            if (result.success) {
                setExchangeData(prev => ({ ...prev, searchResults: result.items }));
            }
        } catch (error) {
            console.error('Error searching items:', error);
        }
    }

    function toggleRemoveItem(item: ExchangeItem) {
        setExchangeData(prev => {
            const exists = prev.itemsToRemove.some(i => i.item_code === item.item_code);
            const newItemsToRemove = exists
                ? prev.itemsToRemove.filter(i => i.item_code !== item.item_code)
                : [...prev.itemsToRemove, item];
            return { ...prev, itemsToRemove: newItemsToRemove };
        });
    }

    function addNewExchangeItem(item: SearchResultItem) {
        setExchangeData(prev => {
            if (prev.newItems.some(i => i.item_code === item.item_code)) return prev;
            return {
                ...prev,
                newItems: [...prev.newItems, {
                    item_code: item.item_code,
                    item_name: item.item_name,
                    rate: item.rental_rate_per_day || 0,
                    qty: 1
                }]
            };
        });
    }

    function removeNewExchangeItem(itemCode: string) {
        setExchangeData(prev => ({
            ...prev,
            newItems: prev.newItems.filter(i => i.item_code !== itemCode)
        }));
    }

    async function updateExchangeDifference() {
        if (!modal.booking || exchangeData.itemsToRemove.length === 0 || exchangeData.newItems.length === 0) {
            setExchangeData(prev => ({ ...prev, removedValue: 0, newValue: 0, difference: 0 }));
            return;
        }
        try {
            const result = await calculateExchangeDifference(
                modal.booking.name,
                exchangeData.itemsToRemove,
                exchangeData.newItems
            );
            if (result.success) {
                setExchangeData(prev => ({
                    ...prev,
                    removedValue: result.removed_value,
                    newValue: result.new_value,
                    difference: result.difference
                }));
            }
        } catch (error) {
            console.error('Error calculating difference:', error);
        }
    }

    // Update difference when items change
    useEffect(() => {
        if (modal.type === 'exchange') {
            updateExchangeDifference();
        }
    }, [exchangeData.itemsToRemove, exchangeData.newItems]);

    async function handleProcessExchange() {
        if (!modal.booking) return;
        if (exchangeData.itemsToRemove.length === 0) {
            setAlertMessage({ type: 'error', text: 'Please select items to exchange' });
            return;
        }
        if (exchangeData.newItems.length === 0) {
            setAlertMessage({ type: 'error', text: 'Please select replacement items' });
            return;
        }
        setIsProcessing(true);
        try {
            const result = await processExchange(
                modal.booking.name,
                exchangeData.itemsToRemove,
                exchangeData.newItems,
                exchangeData.difference,
                exchangeData.paymentMode
            );
            if (result.success) {
                setAlertMessage({ type: 'success', text: `Exchange completed! New booking: ${result.new_booking}` });
                setModal({ type: null, booking: null });
                loadDashboardData();
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Failed to process exchange' });
            }
        } catch (error) {
            setAlertMessage({ type: 'error', text: 'Error processing exchange' });
        } finally {
            setIsProcessing(false);
        }
    }

    // Calculate actual remaining balance for display
    function calculateRemainingBalance(booking: StaffBooking): number {
        const total = booking.total || 0;
        const advancePaid = booking.advance_amount || 0;
        const balanceCollected = booking.balance_amount_collected || 0;
        return Math.max(0, total - advancePaid - balanceCollected);
    }

    async function handleConfirmAdvance() {
        if (!modal.booking) return;
        setIsProcessing(true);
        try {
            const result = await confirmBookingWithAdvance(
                modal.booking.name,
                advanceForm.amount,
                advanceForm.paymentMode
            );
            if (result.success) {
                setAlertMessage({ type: 'success', text: 'Advance collected successfully!' });
                setModal({ type: null, booking: null });
                loadDashboardData();
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Failed to collect advance' });
            }
        } catch (error) {
            setAlertMessage({ type: 'error', text: 'Error collecting advance' });
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleConfirmDelivery() {
        if (!modal.booking) return;
        setIsProcessing(true);
        try {
            const result = await collectBalanceAndCautionDeposit(
                modal.booking.name,
                deliveryForm.balanceAmount,
                deliveryForm.cautionDeposit,
                deliveryForm.paymentMode
            );
            if (result.success) {
                setAlertMessage({ type: 'success', text: 'Delivery processed successfully!' });
                setModal({ type: null, booking: null });
                loadDashboardData();
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Failed to process delivery' });
            }
        } catch (error) {
            setAlertMessage({ type: 'error', text: 'Error processing delivery' });
        } finally {
            setIsProcessing(false);
        }
    }

    async function handleConfirmReturn() {
        if (!modal.booking) return;
        setIsProcessing(true);
        try {
            const result = await processItemReturnAndRefund(
                modal.booking.name,
                returnForm.refundAmount,
                returnForm.deductionAmount,
                returnForm.deductionReason,
                returnForm.paymentMode
            );
            if (result.success) {
                setAlertMessage({ type: 'success', text: 'Return processed successfully!' });
                setModal({ type: null, booking: null });
                loadDashboardData();
            } else {
                setAlertMessage({ type: 'error', text: result.message || 'Failed to process return' });
            }
        } catch (error) {
            setAlertMessage({ type: 'error', text: 'Error processing return' });
        } finally {
            setIsProcessing(false);
        }
    }

    function getStatusBadge(status: string) {
        const statusMap: Record<string, { bg: string; text: string; label: string }> = {
            '': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Advance' },
            'Confirmed': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
            'Out for Rental': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Delivered' },
            'Returned': { bg: 'bg-green-100', text: 'text-green-700', label: 'Returned' },
            'Completed': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Completed' },
        };
        const config = statusMap[status] || statusMap[''];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    }

    // Filter bookings based on search and status
    const filteredBookings = bookings.filter(booking => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = !searchQuery ||
            booking.name.toLowerCase().includes(searchLower) ||
            booking.customer_name.toLowerCase().includes(searchLower) ||
            (booking.mobile_number || '').includes(searchQuery);

        let matchesStatus = true;
        switch (statusFilter) {
            case 'pending':
                matchesStatus = !booking.booking_status || booking.booking_status === '';
                break;
            case 'confirmed':
                matchesStatus = booking.booking_status === 'Confirmed';
                break;
            case 'delivered':
                matchesStatus = booking.booking_status === 'Out for Rental';
                break;
            case 'completed':
                matchesStatus = booking.booking_status === 'Completed' || booking.booking_status === 'Returned';
                break;
            default:
                matchesStatus = true;
        }
        return matchesSearch && matchesStatus;
    });

    const displayedBookings = activeStatCard ? filteredBookings.filter(booking => {
        if (activeStatCard === 'pending_advance') return !booking.booking_status || booking.booking_status === '';
        if (activeStatCard === 'pending_delivery') return booking.booking_status === 'Confirmed';
        if (activeStatCard === 'pending_return') return booking.booking_status === 'Out for Rental';
        return true;
    }) : filteredBookings;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Alert Message */}
            {alertMessage && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${alertMessage.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}>
                    {alertMessage.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {alertMessage.text}
                    <button onClick={() => setAlertMessage(null)} className="ml-2 hover:opacity-75">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 lg:py-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                            <p className="text-gray-500 mt-1">Manage rental bookings and orders</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={loadDashboardData}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <RotateCcw size={16} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <button
                        onClick={() => setActiveStatCard(activeStatCard === 'pending_advance' ? null : 'pending_advance')}
                        className={`bg-white rounded-xl p-4 lg:p-6 border transition-all text-left ${activeStatCard === 'pending_advance'
                            ? 'border-yellow-500 ring-2 ring-yellow-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500">Pending Advance</span>
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                <Clock className="text-yellow-600" size={20} />
                            </div>
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pending_advance}</p>
                    </button>

                    <button
                        onClick={() => setActiveStatCard(activeStatCard === 'pending_delivery' ? null : 'pending_delivery')}
                        className={`bg-white rounded-xl p-4 lg:p-6 border transition-all text-left ${activeStatCard === 'pending_delivery'
                            ? 'border-blue-500 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500">Pending Delivery</span>
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Truck className="text-blue-600" size={20} />
                            </div>
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pending_delivery}</p>
                    </button>

                    <button
                        onClick={() => setActiveStatCard(activeStatCard === 'pending_return' ? null : 'pending_return')}
                        className={`bg-white rounded-xl p-4 lg:p-6 border transition-all text-left ${activeStatCard === 'pending_return'
                            ? 'border-purple-500 ring-2 ring-purple-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500">Pending Return</span>
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <RotateCcw className="text-purple-600" size={20} />
                            </div>
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.pending_return}</p>
                    </button>

                    <button
                        onClick={() => setActiveStatCard(null)}
                        className={`bg-white rounded-xl p-4 lg:p-6 border transition-all text-left ${activeStatCard === null && statusFilter === 'all'
                            ? 'border-green-500 ring-2 ring-green-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-500">Total Active</span>
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Package className="text-green-600" size={20} />
                            </div>
                        </div>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.total_active}</p>
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by booking ID, customer name, or phone..."
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value as StatusFilter);
                                    setActiveStatCard(null);
                                }}
                                className="px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending Advance</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="delivered">Delivered</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>

                        {(searchQuery || statusFilter !== 'all' || activeStatCard) && (
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setStatusFilter('all');
                                    setActiveStatCard(null);
                                }}
                                className="px-4 py-2.5 text-gray-600 hover:text-gray-800 flex items-center gap-2"
                            >
                                <X size={16} />
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Booking</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Function Date</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {displayedBookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                                            No bookings found
                                        </td>
                                    </tr>
                                ) : (
                                    displayedBookings.map((booking) => (
                                        <tr key={booking.name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <p className="font-semibold text-gray-900">{booking.name}</p>
                                                <p className="text-sm text-gray-500">{formatDate(booking.posting_date)}</p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium text-gray-900">{booking.customer_name}</p>
                                                {booking.mobile_number && (
                                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                                        <Phone size={12} />
                                                        {booking.mobile_number}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                {booking.function_date ? (
                                                    <p className="text-gray-600 flex items-center gap-2">
                                                        <Calendar size={14} />
                                                        {formatDate(booking.function_date)}
                                                    </p>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <p className="font-semibold text-gray-900">{formatCurrency(booking.total)}</p>
                                                {(() => {
                                                    const remaining = calculateRemainingBalance(booking);
                                                    return remaining > 0 ? (
                                                        <p className="text-sm text-red-500">
                                                            ₹{remaining.toLocaleString()} due
                                                        </p>
                                                    ) : null;
                                                })()}
                                            </td>
                                            <td className="px-4 py-4">
                                                {getStatusBadge(booking.booking_status)}
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {/* Collect Advance */}
                                                    {(!booking.booking_status || booking.booking_status === '') && (
                                                        <button
                                                            onClick={() => openAdvanceModal(booking)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Collect Advance"
                                                        >
                                                            <DollarSign size={14} />
                                                            <span>Advance</span>
                                                        </button>
                                                    )}

                                                    {/* Deliver */}
                                                    {booking.booking_status === 'Confirmed' && (
                                                        <button
                                                            onClick={() => openDeliveryModal(booking)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Process Delivery"
                                                        >
                                                            <Truck size={14} />
                                                            <span>Deliver</span>
                                                        </button>
                                                    )}

                                                    {/* Return */}
                                                    {booking.booking_status === 'Out for Rental' && (
                                                        <button
                                                            onClick={() => openReturnModal(booking)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Process Return"
                                                        >
                                                            <RotateCcw size={14} />
                                                            <span>Return</span>
                                                        </button>
                                                    )}

                                                    {/* Exchange */}
                                                    {(booking.booking_status === 'Confirmed' || booking.booking_status === 'Out for Rental') && (
                                                        <button
                                                            onClick={() => openExchangeModal(booking)}
                                                            className="px-3 py-1.5 text-xs font-medium bg-violet-100 text-violet-700 hover:bg-violet-200 rounded-lg transition-colors flex items-center gap-1"
                                                            title="Exchange Items"
                                                        >
                                                            <ArrowLeftRight size={14} />
                                                            <span>Exchange</span>
                                                        </button>
                                                    )}

                                                    {/* View Details */}
                                                    <button
                                                        onClick={() => navigate(`/bookings/${booking.name}`)}
                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="text-sm text-gray-500 mt-4">
                    Showing {displayedBookings.length} of {bookings.length} bookings
                </p>
            </div>

            {/* Advance Modal */}
            {modal.type === 'advance' && modal.booking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ type: null, booking: null })}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <DollarSign className="text-yellow-500" size={20} />
                                Collect Advance
                            </h3>
                            <button onClick={() => setModal({ type: null, booking: null })} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-500">Booking</p>
                                <p className="font-semibold">{modal.booking.name}</p>
                                <p className="text-sm text-gray-600">{modal.booking.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Advance Amount (₹)</label>
                                <input
                                    type="number"
                                    value={advanceForm.amount}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={advanceForm.paymentMode}
                                    onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModal({ type: null, booking: null })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAdvance}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Collect Advance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Modal */}
            {modal.type === 'deliver' && modal.booking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ type: null, booking: null })}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Truck className="text-blue-500" size={20} />
                                Process Delivery
                            </h3>
                            <button onClick={() => setModal({ type: null, booking: null })} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-500">Booking</p>
                                <p className="font-semibold">{modal.booking.name}</p>
                                <p className="text-sm text-gray-600">{modal.booking.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Balance Amount (₹)</label>
                                <input
                                    type="number"
                                    value={deliveryForm.balanceAmount}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, balanceAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Caution Deposit (₹)</label>
                                <input
                                    type="number"
                                    value={deliveryForm.cautionDeposit}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, cautionDeposit: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={deliveryForm.paymentMode}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, paymentMode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModal({ type: null, booking: null })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelivery}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Delivery'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Return Modal */}
            {modal.type === 'return' && modal.booking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ type: null, booking: null })}>
                    <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <RotateCcw className="text-purple-500" size={20} />
                                Process Return
                            </h3>
                            <button onClick={() => setModal({ type: null, booking: null })} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-500">Booking</p>
                                <p className="font-semibold">{modal.booking.name}</p>
                                <p className="text-sm text-gray-600">{modal.booking.customer_name}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Caution Deposit Refund (₹)</label>
                                <input
                                    type="number"
                                    value={returnForm.refundAmount}
                                    onChange={(e) => setReturnForm({ ...returnForm, refundAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deduction Amount (₹)</label>
                                <input
                                    type="number"
                                    value={returnForm.deductionAmount}
                                    onChange={(e) => setReturnForm({ ...returnForm, deductionAmount: parseFloat(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deduction Reason</label>
                                <input
                                    type="text"
                                    value={returnForm.deductionReason}
                                    onChange={(e) => setReturnForm({ ...returnForm, deductionReason: e.target.value })}
                                    placeholder="e.g., Damage, Late return"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={returnForm.paymentMode}
                                    onChange={(e) => setReturnForm({ ...returnForm, paymentMode: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModal({ type: null, booking: null })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmReturn}
                                disabled={isProcessing}
                                className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                            >
                                {isProcessing ? 'Processing...' : 'Confirm Return'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exchange Modal */}
            {modal.type === 'exchange' && modal.booking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModal({ type: null, booking: null })}>
                    <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <ArrowLeftRight className="text-violet-500" size={20} />
                                Exchange Items
                            </h3>
                            <button onClick={() => setModal({ type: null, booking: null })} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto flex-1 space-y-6">
                            {/* Booking Info */}
                            <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm text-gray-500">Booking</p>
                                <p className="font-semibold">{modal.booking.name}</p>
                                <p className="text-sm text-gray-600">{modal.booking.customer_name}</p>
                            </div>

                            {/* Step 1: Items to Remove */}
                            <div>
                                <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                                    <Minus size={16} />
                                    Items to Exchange (Remove)
                                </h4>
                                <div className="space-y-2">
                                    {exchangeData.currentItems.map((item) => (
                                        <label
                                            key={item.item_code}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${exchangeData.itemsToRemove.some(i => i.item_code === item.item_code)
                                                    ? 'bg-red-100 border-2 border-red-300'
                                                    : 'bg-red-50 border-2 border-transparent'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={exchangeData.itemsToRemove.some(i => i.item_code === item.item_code)}
                                                onChange={() => toggleRemoveItem(item)}
                                                className="w-4 h-4 rounded"
                                            />
                                            <div className="flex-1">
                                                <p className="font-medium">{item.item_name}</p>
                                                <p className="text-sm text-gray-500">
                                                    Qty: {item.qty} | Rate: ₹{item.rate.toLocaleString()} | Amount: ₹{item.amount.toLocaleString()}
                                                </p>
                                            </div>
                                        </label>
                                    ))}
                                    {exchangeData.currentItems.length === 0 && (
                                        <p className="text-gray-400 text-sm p-3">Loading items...</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 2: Search and Add New Items */}
                            <div>
                                <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                                    <Plus size={16} />
                                    New Items (Replacement)
                                </h4>

                                {/* Search */}
                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={exchangeData.searchQuery}
                                        onChange={(e) => setExchangeData(prev => ({ ...prev, searchQuery: e.target.value }))}
                                        onKeyDown={(e) => e.key === 'Enter' && searchExchangeItems()}
                                        placeholder="Search items..."
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    />
                                    <button
                                        onClick={searchExchangeItems}
                                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                    >
                                        <Search size={18} />
                                    </button>
                                </div>

                                {/* Search Results */}
                                {exchangeData.searchResults.length > 0 && (
                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg mb-3">
                                        {exchangeData.searchResults.map((item) => (
                                            <div
                                                key={item.item_code}
                                                onClick={() => addNewExchangeItem(item)}
                                                className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${exchangeData.newItems.some(i => i.item_code === item.item_code) ? 'bg-green-50' : ''
                                                    }`}
                                            >
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                                    {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.item_name}</p>
                                                    <p className="text-sm text-gray-500">₹{(item.rental_rate_per_day || 0).toLocaleString()}/day</p>
                                                </div>
                                                <Plus size={18} className="text-green-500" />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Selected New Items */}
                                {exchangeData.newItems.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-500">Selected for exchange:</p>
                                        {exchangeData.newItems.map((item) => (
                                            <div
                                                key={item.item_code}
                                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg"
                                            >
                                                <div className="flex-1">
                                                    <p className="font-medium">{item.item_name}</p>
                                                    <p className="text-sm text-gray-500">Rate: ₹{item.rate.toLocaleString()}/day</p>
                                                </div>
                                                <button
                                                    onClick={() => removeNewExchangeItem(item.item_code)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Step 3: Price Difference Summary */}
                            {exchangeData.itemsToRemove.length > 0 && exchangeData.newItems.length > 0 && (
                                <div className="bg-gray-100 rounded-lg p-4">
                                    <h4 className="text-sm font-semibold mb-3">Price Adjustment</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Items being returned:</span>
                                            <span className="text-red-600">- ₹{exchangeData.removedValue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>New items:</span>
                                            <span className="text-green-600">+ ₹{exchangeData.newValue.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                                            <span>{exchangeData.difference >= 0 ? 'Customer owes:' : 'Refund to customer:'}</span>
                                            <span className={exchangeData.difference >= 0 ? 'text-red-600' : 'text-green-600'}>
                                                ₹{Math.abs(exchangeData.difference).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Payment Mode */}
                            {exchangeData.difference !== 0 && exchangeData.itemsToRemove.length > 0 && exchangeData.newItems.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                    <select
                                        value={exchangeData.paymentMode}
                                        onChange={(e) => setExchangeData(prev => ({ ...prev, paymentMode: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 p-4 border-t border-gray-200">
                            <button
                                onClick={() => setModal({ type: null, booking: null })}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcessExchange}
                                disabled={isProcessing || exchangeData.itemsToRemove.length === 0 || exchangeData.newItems.length === 0}
                                className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <ArrowLeftRight size={18} />
                                {isProcessing ? 'Processing...' : 'Process Exchange'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

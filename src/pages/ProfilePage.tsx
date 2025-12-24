import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Plus, Phone, Mail, User, ChevronRight, Edit2, X, Loader2 } from 'lucide-react';
import { searchCustomers, createCustomer, updateCustomer, getCustomerDetails } from '../api/customers';
import { getCustomerActiveBookings } from '../api/bookings';
import { useCustomerStore } from '../stores/customerStore';
import type { Customer, Booking } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

export function ProfilePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const returnTo = searchParams.get('return_to');
    const returnItem = searchParams.get('return_item');

    const { selectedCustomer, setSelectedCustomer } = useCustomerStore();

    const [mode, setMode] = useState<'search' | 'view'>('search');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Customer[]>([]);
    const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
    const [customerBookings, setCustomerBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    // Form states
    const [showNewForm, setShowNewForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
        customer_name: '',
        mobile_number: '',
        email_id: '',
    });
    const [editCustomer, setEditCustomer] = useState({
        name: '',
        customer_name: '',
        mobile_number: '',
        email_id: '',
    });

    useEffect(() => {
        loadRecentCustomers();

        // If we have a selected customer, go to view mode
        if (selectedCustomer && !returnTo) {
            setMode('view');
            loadCustomerBookings(selectedCustomer.name);
        }
    }, []);

    async function loadRecentCustomers() {
        try {
            const customers = await searchCustomers('', 10);
            setRecentCustomers(customers);
        } catch (error) {
            console.error('Error loading recent customers:', error);
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const results = await searchCustomers(searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching customers:', error);
        } finally {
            setSearching(false);
        }
    }

    async function loadCustomerBookings(customerId: string) {
        try {
            const result = await getCustomerActiveBookings(customerId);
            if (result.success) {
                setCustomerBookings(result.bookings);
            }
        } catch (error) {
            console.error('Error loading bookings:', error);
        }
    }

    async function handleSelectCustomer(customerId: string) {
        setLoading(true);
        try {
            const customer = await getCustomerDetails(customerId);
            if (customer) {
                // Set the customer in store (now saves to localStorage synchronously)
                setSelectedCustomer(customer);

                // If returning to item page, navigate back
                if (returnTo === 'item' && returnItem) {
                    navigate(`/item/${returnItem}`);
                    return;
                }

                // Otherwise show customer profile
                setMode('view');
                loadCustomerBookings(customerId);
            }
        } catch (error) {
            console.error('Error selecting customer:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateCustomer(e: React.FormEvent) {
        e.preventDefault();
        if (!newCustomer.customer_name.trim() || !newCustomer.mobile_number.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await createCustomer(
                newCustomer.customer_name,
                newCustomer.mobile_number,
                newCustomer.email_id || undefined
            );

            if (result.success && result.customer_id) {
                // Select the new customer
                await handleSelectCustomer(result.customer_id);
                setShowNewForm(false);
                setNewCustomer({ customer_name: '', mobile_number: '', email_id: '' });
            } else {
                alert(result.message || 'Failed to create customer');
            }
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Failed to create customer');
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleUpdateCustomer(e: React.FormEvent) {
        e.preventDefault();
        if (!editCustomer.customer_name.trim() || !editCustomer.mobile_number.trim()) return;

        setIsSubmitting(true);
        try {
            const result = await updateCustomer(
                editCustomer.name,
                editCustomer.customer_name,
                editCustomer.mobile_number,
                editCustomer.email_id || undefined
            );

            if (result.success) {
                // Refresh customer details
                const updated = await getCustomerDetails(editCustomer.name);
                if (updated) {
                    setSelectedCustomer(updated);
                }
                setShowEditForm(false);
            } else {
                alert(result.message || 'Failed to update customer');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            alert('Failed to update customer');
        } finally {
            setIsSubmitting(false);
        }
    }

    function startEditCustomer() {
        if (selectedCustomer) {
            setEditCustomer({
                name: selectedCustomer.name,
                customer_name: selectedCustomer.customer_name,
                mobile_number: selectedCustomer.mobile_number || '',
                email_id: selectedCustomer.email_id || '',
            });
            setShowEditForm(true);
        }
    }

    function handleNewBooking() {
        navigate('/category');
    }

    function handleChangeCustomer() {
        setMode('search');
        setSearchQuery('');
        setSearchResults([]);
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
        );
    }

    // View Mode - Customer Profile
    if (mode === 'view' && selectedCustomer) {
        return (
            <div className="pb-24">
                {/* Header */}
                <div className="bg-white border-b border-gray-100 px-4 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-lg font-bold text-gray-900">Customer Profile</h1>
                        <button
                            onClick={handleChangeCustomer}
                            className="text-sm text-primary font-medium"
                        >
                            Change
                        </button>
                    </div>
                </div>

                <div className="px-4 py-4 space-y-4">
                    {/* Profile Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <User size={40} className="text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                            {selectedCustomer.customer_name}
                        </h2>
                        {selectedCustomer.email_id && (
                            <p className="text-gray-500 text-sm">{selectedCustomer.email_id}</p>
                        )}

                        {/* Contact Info */}
                        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-left">
                            {selectedCustomer.mobile_number && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Phone size={16} className="text-primary" />
                                    <span>{selectedCustomer.mobile_number}</span>
                                </div>
                            )}
                            {selectedCustomer.email_id && (
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail size={16} className="text-primary" />
                                    <span>{selectedCustomer.email_id}</span>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleNewBooking}
                                className="flex-1 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors"
                            >
                                <Plus size={18} className="inline mr-2" />
                                New Booking
                            </button>
                            <button
                                onClick={startEditCustomer}
                                className="px-4 py-3 border-2 border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Recent Bookings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h3>

                        {customerBookings.length > 0 ? (
                            <div className="space-y-3">
                                {customerBookings.map((booking) => (
                                    <button
                                        key={booking.name}
                                        onClick={() => navigate(`/bookings/${booking.name}`)}
                                        className="w-full flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div>
                                            <p className="font-semibold text-gray-900">{booking.name}</p>
                                            <p className="text-sm text-gray-500">
                                                {booking.item_count || 0} items • {formatDate(booking.posting_date || new Date())}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-primary">
                                                {formatCurrency(booking.total || 0)}
                                            </span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${booking.booking_status === 'Confirmed' ? 'bg-green-100 text-green-700' :
                                                booking.booking_status === 'Out for Rental' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                {booking.booking_status}
                                            </span>
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No bookings yet. Start by creating a new booking!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Edit Customer Modal */}
                {showEditForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                        <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">Edit Customer</h3>
                                <button onClick={() => setShowEditForm(false)}>
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleUpdateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={editCustomer.customer_name}
                                        onChange={(e) => setEditCustomer({ ...editCustomer, customer_name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={editCustomer.mobile_number}
                                        onChange={(e) => setEditCustomer({ ...editCustomer, mobile_number: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={editCustomer.email_id}
                                        onChange={(e) => setEditCustomer({ ...editCustomer, email_id: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Search Mode
    return (
        <div className="pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4">
                <h1 className="text-lg font-bold text-gray-900 text-center">
                    {returnTo === 'item' ? 'Select Customer' : 'Customer Management'}
                </h1>
                {returnTo === 'item' && returnItem && (
                    <p className="text-sm text-gray-500 text-center mt-1">
                        Choose a customer to continue booking
                    </p>
                )}
            </div>

            <div className="px-4 py-4 space-y-4">
                {/* Search Box */}
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                if (e.target.value.length >= 2) {
                                    handleSearch();
                                } else {
                                    setSearchResults([]);
                                }
                            }}
                            placeholder="Search by name, phone, email..."
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setShowNewForm(true)}
                        className="px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <Plus size={24} />
                    </button>
                </div>

                {/* Search Results */}
                {searching && (
                    <div className="text-center py-4">
                        <Loader2 size={24} className="animate-spin mx-auto text-primary" />
                    </div>
                )}

                {searchResults.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Search Results</h3>
                        <div className="space-y-2">
                            {searchResults.map((customer) => (
                                <button
                                    key={customer.name}
                                    onClick={() => handleSelectCustomer(customer.name)}
                                    className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all"
                                >
                                    <p className="font-semibold text-gray-900">{customer.customer_name}</p>
                                    {customer.mobile_number && (
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Phone size={14} />
                                            {customer.mobile_number}
                                        </p>
                                    )}
                                    {customer.email_id && (
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Mail size={14} />
                                            {customer.email_id}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Customers */}
                {searchResults.length === 0 && !searching && (
                    <div>
                        <h3 className="text-sm font-semibold text-gray-500 mb-2">Recent Customers</h3>
                        <div className="space-y-2">
                            {recentCustomers.map((customer) => (
                                <button
                                    key={customer.name}
                                    onClick={() => handleSelectCustomer(customer.name)}
                                    className="w-full bg-white border border-gray-100 rounded-xl p-4 text-left hover:border-primary/50 hover:shadow-sm transition-all"
                                >
                                    <p className="font-semibold text-gray-900">{customer.customer_name}</p>
                                    {customer.mobile_number && (
                                        <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                            <Phone size={14} />
                                            {customer.mobile_number}
                                        </p>
                                    )}
                                    {customer.email_id && (
                                        <p className="text-sm text-gray-500 flex items-center gap-2">
                                            <Mail size={14} />
                                            {customer.email_id}
                                        </p>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* New Customer Form Modal */}
                {showNewForm && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                        <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold">New Customer</h3>
                                <button onClick={() => setShowNewForm(false)}>
                                    <X size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateCustomer} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Customer Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={newCustomer.customer_name}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, customer_name: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mobile Number *
                                    </label>
                                    <input
                                        type="tel"
                                        value={newCustomer.mobile_number}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, mobile_number: e.target.value })}
                                        required
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        value={newCustomer.email_id}
                                        onChange={(e) => setNewCustomer({ ...newCustomer, email_id: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Customer'
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

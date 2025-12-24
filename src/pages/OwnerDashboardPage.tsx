import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Users, ArrowLeft, Mail, Phone, MapPin,
    Hourglass, Wallet, TrendingUp, Package, Box, DollarSign,
    History, AlertCircle, ChevronDown, Plus
} from 'lucide-react';
import {
    getOwnerDashboardData, getAllOwners,
    type OwnerDashboardData, type OwnerSummary
} from '../api/owner';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getLoggedUser } from '../api/auth';

export function OwnerDashboardPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const [data, setData] = useState<OwnerDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [allOwners, setAllOwners] = useState<OwnerSummary[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    const selectedOwnerId = searchParams.get('owner') || undefined;

    useEffect(() => {
        checkUserRole();
        loadDashboardData();
    }, [selectedOwnerId]);

    async function checkUserRole() {
        try {
            const result = await getLoggedUser();
            const admin = result.message?.roles?.includes('System Manager') || false;
            setIsAdmin(admin);

            if (admin) {
                const owners = await getAllOwners();
                setAllOwners(owners);
            }
        } catch (err) {
            console.error('Error checking user role:', err);
        }
    }

    async function loadDashboardData() {
        setLoading(true);
        setError(null);
        try {
            const result = await getOwnerDashboardData(selectedOwnerId);
            if (result.success) {
                setData(result);
            } else {
                setError(result.message || 'Failed to load dashboard data');
            }
        } catch (err) {
            setError('An error occurred while loading the dashboard');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function handleOwnerChange(ownerId: string) {
        if (ownerId) {
            setSearchParams({ owner: ownerId });
        } else {
            setSearchParams({});
        }
    }

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto mt-10 p-6 bg-red-50 rounded-xl border border-red-200 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Access Error</h3>
                <p className="text-red-600 mb-6">{error}</p>
                <div className="flex justify-center gap-4">
                    {isAdmin && allOwners.length > 0 && (
                        <div className="relative">
                            <select
                                className="appearance-none bg-white border border-gray-300 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onChange={(e) => handleOwnerChange(e.target.value)}
                                value={selectedOwnerId || ''}
                            >
                                <option value="">Select Owner</option>
                                {allOwners.map(owner => (
                                    <option key={owner.name} value={owner.name}>
                                        {owner.owner_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    )}
                    <button
                        onClick={() => navigate('/')}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { owner, stats, items, recent_sales, commission_history } = data;

    // Handle Admin with no selected owner
    if (!owner) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white"
                    >
                        <ArrowLeft size={16} />
                        Portal
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center max-w-2xl mx-auto shadow-sm">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Users size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Select Owner to View</h2>
                    <p className="text-gray-500 mb-6">Please select an owner from the list below to view their dashboard.</p>

                    {allOwners.length > 0 && (
                        <div className="max-w-xs mx-auto relative">
                            <select
                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-3 px-4 pr-10 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-sm"
                                onChange={(e) => handleOwnerChange(e.target.value)}
                                value=""
                            >
                                <option value="">Select Owner...</option>
                                {allOwners.map(o => (
                                    <option key={o.name} value={o.name}>
                                        {o.owner_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
                    <p className="text-gray-500 mt-1">Overview of your rental business performance</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {isAdmin && (
                        <div className="relative flex-1 md:flex-none">
                            <select
                                className="w-full appearance-none bg-white border border-gray-300 rounded-lg py-2 px-4 pr-10 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                onChange={(e) => handleOwnerChange(e.target.value)}
                                value={selectedOwnerId || owner.name}
                            >
                                {allOwners.map(o => (
                                    <option key={o.name} value={o.name}>
                                        {o.owner_name} {o.name === owner.name ? '(Current)' : ''}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                        </div>
                    )}

                    <button
                        onClick={() => navigate('/owner-dashboard/add-item')}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        Add Item
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white"
                    >
                        <ArrowLeft size={16} />
                        Portal
                    </button>
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/staff')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white"
                        >
                            <Users size={16} />
                            Staff
                        </button>
                    )}
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row items-center md:items-start gap-6 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-500 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                    {owner.owner_name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h2 className="text-xl font-bold text-gray-900">{owner.owner_name}</h2>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2 text-sm text-gray-500">
                        {owner.email && (
                            <div className="flex items-center gap-1.5">
                                <Mail size={14} />
                                {owner.email}
                            </div>
                        )}
                        {owner.phone && (
                            <div className="flex items-center gap-1.5">
                                <Phone size={14} />
                                {owner.phone}
                            </div>
                        )}
                        {owner.city && (
                            <div className="flex items-center gap-1.5">
                                <MapPin size={14} />
                                {owner.city}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatsCard
                    title="Pending Commission"
                    value={stats.commission_pending}
                    icon={<Hourglass className="text-amber-600" size={20} />}
                    colorClass="bg-amber-100 text-amber-600"
                    isCurrency
                />
                <StatsCard
                    title="Total Earnings"
                    value={stats.commission_earned}
                    icon={<Wallet className="text-emerald-600" size={20} />}
                    colorClass="bg-emerald-100 text-emerald-600"
                    isCurrency
                />
                <StatsCard
                    title="Total Sales"
                    value={stats.total_sales_amount}
                    icon={<TrendingUp className="text-blue-600" size={20} />}
                    colorClass="bg-blue-100 text-blue-600"
                    isCurrency
                />
                <StatsCard
                    title="Listed Items"
                    value={stats.total_items}
                    icon={<Package className="text-purple-600" size={20} />}
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Box size={18} className="text-primary" />
                                Inventory
                            </h3>
                            <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {items.length} items
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Item</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rate</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Commission</th>
                                        <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Revenue</th>
                                        <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No items found in your inventory
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item) => (
                                            <tr key={item.name} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                            {item.image ? (
                                                                <img src={item.image} alt={item.item_name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                    <Package size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{item.item_name}</p>
                                                            <p className="text-xs text-gray-500">{item.item_group || 'General'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm">
                                                    {formatCurrency(item.rental_rate_per_day)}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                    {item.owner_commission_fixed > 0
                                                        ? formatCurrency(item.owner_commission_fixed)
                                                        : `${item.owner_commission_percent}%`
                                                    }
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-sm">
                                                    {formatCurrency(item.total_revenue)}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${!item.disabled
                                                        ? 'bg-green-50 text-green-700 border border-green-200'
                                                        : 'bg-red-50 text-red-700 border border-red-200'
                                                        }`}>
                                                        {!item.disabled ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Payouts & Sales */}
                <div className="space-y-6">
                    {/* Payouts */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <DollarSign size={18} className="text-primary" />
                                Recent Payouts
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {commission_history.length === 0 ? (
                                <div className="px-5 py-8 text-center text-gray-500 text-sm">
                                    No recent payouts
                                </div>
                            ) : (
                                commission_history.map((payment) => (
                                    <div key={payment.journal_entry} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{formatDate(payment.posting_date)}</p>
                                            <p className="text-xs text-gray-500">{payment.journal_entry}</p>
                                        </div>
                                        <p className="font-semibold text-emerald-600 text-sm">
                                            +{formatCurrency(payment.amount)}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Sales */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <History size={18} className="text-gray-500" />
                                Recent Activity
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {recent_sales.length === 0 ? (
                                <div className="px-5 py-8 text-center text-gray-500 text-sm">
                                    No recent activity
                                </div>
                            ) : (
                                recent_sales.map((sale) => (
                                    <div key={sale.invoice_id} className="px-5 py-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="text-sm font-medium text-gray-900 truncate">{sale.item_name}</p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {formatDate(sale.posting_date)} • {sale.customer_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-gray-900 text-sm">{formatCurrency(sale.commission_amount)}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Comm</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatsCard({ title, value, icon, colorClass, isCurrency = false }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
    isCurrency?: boolean;
}) {
    return (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:translate-y-[-2px] hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-3">
                <span className="text-sm font-medium text-gray-500">{title}</span>
                <div className={`p-2 rounded-lg ${colorClass}`}>
                    {icon}
                </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
                {isCurrency ? formatCurrency(value) : value}
            </div>
        </div>
    );
}

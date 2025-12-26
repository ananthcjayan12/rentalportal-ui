import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Package, ArrowLeft, Upload, X, Plus, AlertCircle, Save
} from 'lucide-react';
import {
    createRentalItem, getItemCreationContext,
    type CreateItemData, type NewSupplierData, type UploadedImage,
    type ItemGroup, type Supplier
} from '../api/owner';

export function OwnerAddItemPage() {
    const navigate = useNavigate();

    // Dropdown Data
    const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingContext, setLoadingContext] = useState(true);

    // Form State
    const [formData, setFormData] = useState<CreateItemData>({
        item_code: '',
        item_name: '',
        item_group: '',
        description: '',
        rental_mrp_per_day: 0,
        rental_rate_per_day: 0,
        caution_deposit: 0,
        purchase_cost: 0,
        is_third_party_item: false,
        owner_commission_percent: 30,
        owner_commission_fixed: 0,
        owner_supplier_source: ''
    });

    const [newSupplier, setNewSupplier] = useState<NewSupplierData>({
        supplier_name: '',
        mobile_no: '',
        email_id: '',
        address: ''
    });

    const [images, setImages] = useState<UploadedImage[]>([]);
    const [discountPercentage, setDiscountPercentage] = useState(0);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        loadContext();
    }, []);

    async function loadContext() {
        try {
            const context = await getItemCreationContext();
            setItemGroups(context.item_groups);
            setSuppliers(context.suppliers);
        } catch (err) {
            console.error('Failed to load item context', err);
            setError('Failed to load required data. Please refresh.');
        } finally {
            setLoadingContext(false);
        }
    }

    // Calculations
    useEffect(() => {
        const mrp = formData.rental_mrp_per_day || 0;
        const rate = formData.rental_rate_per_day || 0;

        if (mrp > 0 && rate > 0 && mrp > rate) {
            setDiscountPercentage(((mrp - rate) / mrp) * 100);
        } else {
            setDiscountPercentage(0);
        }
    }, [formData.rental_mrp_per_day, formData.rental_rate_per_day]);

    // Handlers
    function handleInputChange(field: keyof CreateItemData, value: any) {
        setFormData(prev => ({ ...prev, [field]: value }));
    }

    function handleSupplierChange(field: keyof NewSupplierData, value: string) {
        setNewSupplier(prev => ({ ...prev, [field]: value }));
    }

    const handleImageUpload = (files: FileList | null) => {
        if (!files) return;

        Array.from(files).forEach(file => {
            if (file.size > 5 * 1024 * 1024) {
                alert(`Image ${file.name} is too large (max 5MB)`);
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setImages(prev => [...prev, {
                        name: file.name,
                        content: e.target!.result as string
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleImageUpload(e.dataTransfer.files);
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (isSubmitting) return;

        // Validation
        if (!formData.item_code || !formData.item_name || !formData.item_group || !formData.rental_rate_per_day) {
            setError('Please fill all required fields');
            window.scrollTo(0, 0);
            return;
        }

        if (formData.is_third_party_item && !formData.owner_supplier_source && !newSupplier.supplier_name) {
            setError('Please select a supplier or provide new supplier details');
            window.scrollTo(0, 0);
            return;
        }

        if (formData.is_third_party_item && (!formData.purchase_cost || formData.purchase_cost <= 0)) {
            setError('Purchase Cost is mandatory for third-party items');
            window.scrollTo(0, 0);
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const result = await createRentalItem(
                formData,
                (formData.is_third_party_item && !formData.owner_supplier_source) ? newSupplier : null,
                images
            );

            if (result.success) {
                setSuccess('Item created successfully!');
                setTimeout(() => navigate('/owner-dashboard'), 2000);
            } else {
                setError(result.message || 'Failed to create item');
                window.scrollTo(0, 0);
            }
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'An unexpected error occurred');
            window.scrollTo(0, 0);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loadingContext) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add New Item</h1>
                    <p className="text-gray-500 mt-1">Add new rental items to your inventory</p>
                </div>
                <button
                    onClick={() => navigate('/owner-dashboard')}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 bg-white"
                >
                    <ArrowLeft size={16} />
                    Dashboard
                </button>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-red-800">Error</h3>
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Save size={16} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-green-800">Success</h3>
                        <p className="text-green-700 text-sm">{success}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b">
                        <Package className="w-5 h-5 text-primary" />
                        Basic Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g. DRESS-001"
                                value={formData.item_code}
                                onChange={(e) => handleInputChange('item_code', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g. Red Wedding Lehenga"
                                value={formData.item_name}
                                onChange={(e) => handleInputChange('item_name', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Item Group <span className="text-red-500">*</span>
                            </label>
                            <select
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                value={formData.item_group}
                                onChange={(e) => handleInputChange('item_group', e.target.value)}
                            >
                                <option value="">Select Item Group</option>
                                {itemGroups.map(g => (
                                    <option key={g.name} value={g.name}>{g.item_group_name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Caution Deposit (₹)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="5000"
                                value={formData.caution_deposit || ''}
                                onChange={(e) => handleInputChange('caution_deposit', parseFloat(e.target.value))}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rental MRP (₹/day)
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="3000"
                                value={formData.rental_mrp_per_day || ''}
                                onChange={(e) => handleInputChange('rental_mrp_per_day', parseFloat(e.target.value))}
                            />
                            <p className="text-xs text-gray-500 mt-1">Shown as strike-through price</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Rental Rate (₹/day) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="2500"
                                value={formData.rental_rate_per_day || ''}
                                onChange={(e) => handleInputChange('rental_rate_per_day', parseFloat(e.target.value))}
                            />
                        </div>

                        {discountPercentage > 0 && (
                            <div className="md:col-span-2">
                                <div className="inline-flex items-center px-4 py-2 rounded-lg bg-orange-100 text-orange-700 border border-orange-200">
                                    <span className="font-bold mr-2">{discountPercentage.toFixed(1)}% OFF</span>
                                    <span className="text-sm">calculated discount</span>
                                </div>
                            </div>
                        )}

                        <div className="form-group">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Cost (₹)
                                {formData.is_third_party_item && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="number"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                placeholder="e.g., 25000"
                                min="0" step="1"
                                value={formData.purchase_cost || ''}
                                onChange={(e) => handleInputChange('purchase_cost', parseFloat(e.target.value))}
                            />
                            {formData.is_third_party_item && (
                                <p className="text-xs text-orange-600 mt-1">Required for third-party accounting entries</p>
                            )}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary h-24 resize-y"
                                placeholder="Details about size, color, material..."
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Image Upload */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 pb-4 border-b">
                        <Upload className="w-5 h-5 text-primary" />
                        Item Images
                    </h2>

                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-700">Click to upload or drag & drop</p>
                        <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleImageUpload(e.target.files)}
                        />
                    </div>

                    {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                            {images.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group">
                                    <img src={img.content} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={14} />
                                    </button>
                                    {idx === 0 && (
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded">
                                            Primary
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Third Party / Ownership */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" />
                            Ownership Information
                        </h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-5 h-5 text-primary rounded border-gray-300 focus:ring-primary"
                                checked={formData.is_third_party_item}
                                onChange={(e) => handleInputChange('is_third_party_item', e.target.checked)}
                            />
                            <span className="font-medium text-gray-700">Third Party Owned</span>
                        </label>
                    </div>

                    {formData.is_third_party_item && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fixed Commission (₹)
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        placeholder="Optional override"
                                        value={formData.owner_commission_fixed || ''}
                                        onChange={(e) => handleInputChange('owner_commission_fixed', parseFloat(e.target.value))}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Existing Supplier
                                    </label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                        value={formData.owner_supplier_source || ''}
                                        onChange={(e) => handleInputChange('owner_supplier_source', e.target.value)}
                                    >
                                        <option value="">Create New Supplier</option>
                                        {suppliers.map(s => (
                                            <option key={s.name} value={s.name}>{s.supplier_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {!formData.owner_supplier_source && (
                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                    <h4 className="font-semibold text-gray-800 mb-4">New Supplier Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={newSupplier.supplier_name}
                                                onChange={(e) => handleSupplierChange('supplier_name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Mobile</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={newSupplier.mobile_no}
                                                onChange={(e) => handleSupplierChange('mobile_no', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={newSupplier.email_id}
                                                onChange={(e) => handleSupplierChange('email_id', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                value={newSupplier.address}
                                                onChange={(e) => handleSupplierChange('address', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/owner-dashboard')}
                        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Save Item
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

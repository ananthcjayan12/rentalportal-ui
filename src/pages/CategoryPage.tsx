import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getRentalItems, type GetItemsParams } from '../api/items';
import { getRentalCategories } from '../api/portal';
import { ProductCard } from '../components/items';
import type { Item, Category } from '../types';
import { SORT_OPTIONS } from '../utils/constants';

export function CategoryPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const currentCategory = searchParams.get('category') || '';
    const currentSearch = searchParams.get('search') || '';
    const currentSort = (searchParams.get('sort_by') || 'name') as GetItemsParams['sort_by'];
    const currentPage = parseInt(searchParams.get('page') || '1');

    useEffect(() => {
        async function loadData() {
            setLoading(true);
            try {
                const [itemsData, categoriesData] = await Promise.all([
                    getRentalItems({
                        category: currentCategory,
                        search: currentSearch,
                        sort_by: currentSort,
                        page: currentPage,
                        limit: 12,
                    }),
                    getRentalCategories(),
                ]);
                setItems(itemsData.items);
                setTotalCount(itemsData.total_count);
                setCategories(categoriesData);
            } catch (error) {
                console.error('Error loading category data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [currentCategory, currentSearch, currentSort, currentPage]);

    const updateFilter = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.delete('page'); // Reset page on filter change
        setSearchParams(newParams);
    };

    return (
        <div className="px-4 py-4">
            {/* Filter Pills */}
            <section className="mb-4">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <button
                        onClick={() => updateFilter('category', '')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${!currentCategory
                                ? 'bg-primary text-white'
                                : 'border border-gray-300'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => updateFilter('category', cat.name)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${currentCategory === cat.name
                                    ? 'bg-primary text-white'
                                    : 'border border-gray-300'
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </section>

            {/* Sort Dropdown */}
            <section className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                    {totalCount} items found
                </p>
                <select
                    value={currentSort}
                    onChange={(e) => updateFilter('sort_by', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                    {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </section>

            {/* Loading */}
            {loading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No items found</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <ProductCard key={item.item_code} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

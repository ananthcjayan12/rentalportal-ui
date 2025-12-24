import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRentalItems } from '../api/items';
import { getPortalBanners, getPortalCategories } from '../api/portal';
import { ProductCard } from '../components/items';
import type { Item, Banner, Category } from '../types';
import { PLACEHOLDER_IMAGE } from '../utils/constants';

export function HomePage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [trendingItems, setTrendingItems] = useState<Item[]>([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [bannersData, categoriesData, itemsData] = await Promise.all([
                    getPortalBanners(),
                    getPortalCategories(),
                    getRentalItems({ sort_by: 'random', limit: 4 }),
                ]);
                setBanners(bannersData);
                setCategories(categoriesData);
                setTrendingItems(itemsData.items);
            } catch (error) {
                console.error('Error loading home data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // Auto-slide banners
    useEffect(() => {
        if (banners.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentBanner((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="px-4 py-4">
            {/* Banner Carousel */}
            {banners.length > 0 && (
                <section className="mb-6">
                    <div className="relative rounded-2xl overflow-hidden aspect-[2/1]">
                        <div
                            className="flex transition-transform duration-500 h-full"
                            style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                        >
                            {banners.map((banner) => (
                                <div key={banner.name} className="min-w-full h-full">
                                    <img
                                        src={banner.image}
                                        alt={banner.title || 'Banner'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                        {/* Dots */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                            {banners.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentBanner(i)}
                                    className={`w-2 h-2 rounded-full transition-colors ${i === currentBanner ? 'bg-white' : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Filter Pills */}
            <section className="mb-6">
                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    <button className="px-4 py-2 bg-primary text-white rounded-full text-sm font-medium whitespace-nowrap">
                        Latest
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium whitespace-nowrap">
                        Under 600
                    </button>
                    <button className="px-4 py-2 border border-gray-300 rounded-full text-sm font-medium whitespace-nowrap flex items-center gap-1">
                        Filters
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-lg font-bold mb-3">Shop by Category</h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                to={`/category?category=${encodeURIComponent(category.name)}`}
                                className="flex flex-col items-center min-w-[70px]"
                            >
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 mb-2">
                                    <img
                                        src={category.image || PLACEHOLDER_IMAGE}
                                        alt={category.label}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <span className="text-xs text-center font-medium text-gray-700">
                                    {category.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Items */}
            <section>
                <h2 className="text-lg font-bold mb-3">Trending Items</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {trendingItems.map((item) => (
                        <ProductCard key={item.item_code} item={item} />
                    ))}
                </div>
            </section>
        </div>
    );
}

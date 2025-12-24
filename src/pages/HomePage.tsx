import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Filter } from 'lucide-react';
import { getRentalItems } from '../api/items';
import { getPortalBanners, getPortalCategories } from '../api/portal';
import { ProductCard } from '../components/items';
import type { Item, Banner, Category } from '../types';
import { getImageUrl, PLACEHOLDER_IMAGE } from '../utils/constants';

export function HomePage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [trendingItems, setTrendingItems] = useState<Item[]>([]);
    const [currentBanner, setCurrentBanner] = useState(0);
    const [loading, setLoading] = useState(true);
    const bannerTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const [bannersData, categoriesData, itemsData] = await Promise.all([
                    getPortalBanners(),
                    getPortalCategories(),
                    getRentalItems({ sort_by: 'random', limit: 8 }), // Fetch more items
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

    // Auto-slide banners with proper cleanup
    useEffect(() => {
        if (banners.length <= 1) return;

        const startTimer = () => {
            bannerTimerRef.current = setInterval(() => {
                setCurrentBanner((prev) => (prev + 1) % banners.length);
            }, 5000);
        };

        startTimer();
        return () => {
            if (bannerTimerRef.current) clearInterval(bannerTimerRef.current);
        };
    }, [banners.length]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24 space-y-8 bg-gray-50 min-h-screen">
            {/* Hero Section / Banners */}
            {banners.length > 0 && (
                <section className="relative bg-white pt-4 pb-2">
                    <div className="px-4 md:px-6">
                        <div className="relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-[21/9] shadow-lg shadow-gray-200/50 group">
                            <div
                                className="flex transition-transform duration-700 ease-out h-full"
                                style={{ transform: `translateX(-${currentBanner * 100}%)` }}
                            >
                                {banners.map((banner) => (
                                    <div key={banner.name} className="min-w-full h-full relative">
                                        <img
                                            src={getImageUrl(banner.image)}
                                            alt={banner.title || 'Banner'}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                            }}
                                        />
                                        {/* Optional Overlay Gradient */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-60" />
                                    </div>
                                ))}
                            </div>

                            {/* Navigation Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10 px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full">
                                {banners.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentBanner(i)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentBanner
                                            ? 'w-6 bg-white'
                                            : 'w-1.5 bg-white/50 hover:bg-white/80'
                                            }`}
                                        aria-label={`Go to slide ${i + 1}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Filter Pills - Horizontal Scroll */}
            <section className="px-4 md:px-6">
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 mask-linear">
                    <button className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold shadow-lg shadow-primary/30 transform active:scale-95 transition-all">
                        Latest Collection
                    </button>
                    <button className="px-6 py-2.5 bg-white text-gray-700 border border-gray-100 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:border-gray-200 active:scale-95 transition-all whitespace-nowrap">
                        Under ₹600
                    </button>
                    <button className="px-6 py-2.5 bg-white text-gray-700 border border-gray-100 rounded-full text-sm font-medium shadow-sm hover:shadow-md hover:border-gray-200 active:scale-95 transition-all flex items-center gap-2">
                        <span>Filters</span>
                        <Filter size={14} />
                    </button>
                </div>
            </section>

            {/* Categories */}
            {categories.length > 0 && (
                <section className="px-4 md:px-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Shop by Category</h2>
                        <Link
                            to="/category"
                            className="text-sm font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
                        >
                            View All <ChevronRight size={16} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-4 gap-4 md:gap-8 overflow-x-auto no-scrollbar pb-4 snap-x">
                        {categories.map((category) => (
                            <Link
                                key={category.name}
                                to={`/category?category=${encodeURIComponent(category.name)}`}
                                className="flex flex-col items-center gap-3 min-w-[72px] md:min-w-[100px] snap-start group cursor-pointer"
                            >
                                <div className="w-[72px] h-[72px] md:w-24 md:h-24 rounded-full p-1 bg-white border border-gray-100 shadow-md group-hover:shadow-xl group-hover:border-primary/30 group-hover:scale-105 transition-all duration-300">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 relative">
                                        <img
                                            src={getImageUrl(category.image)}
                                            alt={category.label}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                            }}
                                        />
                                    </div>
                                </div>
                                <span className="text-xs md:text-sm font-medium text-gray-700 text-center leading-tight group-hover:text-primary transition-colors line-clamp-2">
                                    {category.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Trending Items Grid */}
            <section className="px-4 md:px-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Trending Now</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Most popular rentals this week</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {trendingItems.map((item) => (
                        <div key={item.item_code} className="w-full">
                            <ProductCard item={item} />
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center">
                    <Link to="/category" className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-medium rounded-full hover:bg-gray-50 hover:border-gray-400 transition-all active:scale-95">
                        Browse All Items
                    </Link>
                </div>
            </section>
        </div>
    );
}

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import { authService } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();

    const [formData, setFormData] = useState({
        usr: '',
        pwd: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Get the intended destination from state or default to home
    const from = (location.state as any)?.from?.pathname || '/';

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!formData.usr.trim() || !formData.pwd.trim()) {
            setError('Please enter both email/mobile and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const result = await authService.login(formData);

            if (result.success && result.user) {
                login(result.user);
                navigate(from, { replace: true });
            } else {
                setError(result.message || 'Login failed. Please try again.');
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo and Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark shadow-lg mb-4">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-1">Sign in to continue to Rental Portal</p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Email/Mobile Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Email or Mobile
                            </label>
                            <input
                                type="text"
                                value={formData.usr}
                                onChange={(e) => setFormData({ ...formData, usr: e.target.value })}
                                placeholder="Enter your email or mobile"
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
                                autoComplete="username"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Password Input */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.pwd}
                                    onChange={(e) => setFormData({ ...formData, pwd: e.target.value })}
                                    placeholder="Enter your password"
                                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none transition-colors"
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 size={20} className="animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    Rental Management Portal • Staff Access
                </p>
            </div>
        </div>
    );
}

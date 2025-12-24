/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#7C3AED',
                    dark: '#6D28D9',
                    light: '#EDE9FE',
                },
                secondary: {
                    DEFAULT: '#F59E0B',
                    light: '#FEF3C7',
                },
                success: {
                    DEFAULT: '#10B981',
                    light: '#D1FAE5',
                },
                warning: {
                    DEFAULT: '#F59E0B',
                    light: '#FEF3C7',
                },
                danger: {
                    DEFAULT: '#EF4444',
                    light: '#FEE2E2',
                },
                info: {
                    DEFAULT: '#3B82F6',
                    light: '#DBEAFE',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

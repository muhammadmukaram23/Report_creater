/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                premium: {
                    dark: '#0f172a',
                    light: '#1e293b',
                    accent: '#3b82f6',
                    glass: 'rgba(255, 255, 255, 0.05)',
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}

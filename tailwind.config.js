/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./src/**/*.{html,js}",
        "./index.html"
    ],
    theme: {
        extend: {
            colors: {
                'game-primary': '#4338ca',
                'game-secondary': '#3730a3',
                'game-accent': '#a855f7',
                'game-success': '#22c55e',
                'game-danger': '#ef4444',
                'game-warning': '#f59e0b'
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both'
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' }
                },
                'pulse-glow': {
                    '0%, 100%': { 
                        opacity: '1',
                        filter: 'brightness(1) blur(0)'
                    },
                    '50%': { 
                        opacity: '0.6',
                        filter: 'brightness(1.2) blur(4px)'
                    }
                },
                shake: {
                    '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
                    '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
                    '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
                    '40%, 60%': { transform: 'translate3d(4px, 0, 0)' }
                }
            },
            backgroundImage: {
                'game-gradient': 'linear-gradient(to bottom right, #4338ca, #3730a3)',
                'menu-overlay': 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.9))'
            }
        }
    },
    plugins: []
};
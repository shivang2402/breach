/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'terminal-green': '#0f0',
                'terminal-black': '#0c0c0c',
                'cyber-red': '#ff003c',
                'cyber-blue': '#00f0ff',
            },
            fontFamily: {
                mono: ['"Fira Code"', 'monospace'],
            },
        },
    },
    plugins: [],
}

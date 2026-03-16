/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx}",     // For Next.js App Router
        "./pages/**/*.{js,jsx}",   // For Next.js Pages Router
        "./components/**/*.{js,jsx}",
        "./src/**/*.{js,jsx}",     // If you are using a src folder
    ],
    theme: {
        extend: {
            colors: {
                primary: "#2563eb",
            },
        },
    },
    plugins: [],
}
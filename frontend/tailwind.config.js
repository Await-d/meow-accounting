import {
    nextui
} from '@nextui-org/react';

/** @type {import('tailwindcss').Config} */
const config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'
    ],
    theme: {
        extend: {},
    },
    darkMode: "class",
    plugins: [nextui({
        themes: {
            light: {
                colors: {
                    background: "#FFFFFF",
                    foreground: "#11181C",
                    primary: {
                        50: "#E6F1FE",
                        100: "#CCE3FD",
                        200: "#99C7FB",
                        300: "#66AAF9",
                        400: "#338EF7",
                        500: "#006FEE",
                        600: "#005BC4",
                        700: "#004493",
                        800: "#002E62",
                        900: "#001731",
                        DEFAULT: "#006FEE",
                        foreground: "#FFFFFF",
                    },
                },
            },
            dark: {
                colors: {
                    background: "#000000",
                    foreground: "#ECEDEE",
                    primary: {
                        50: "#E6F1FE",
                        100: "#CCE3FD",
                        200: "#99C7FB",
                        300: "#66AAF9",
                        400: "#338EF7",
                        500: "#006FEE",
                        600: "#005BC4",
                        700: "#004493",
                        800: "#002E62",
                        900: "#001731",
                        DEFAULT: "#006FEE",
                        foreground: "#FFFFFF",
                    },
                },
            },
        },
    })],
}

export default config;
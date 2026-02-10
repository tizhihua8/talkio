/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2b2bee",
        "primary-light": "#e8e8fd",
        "bg-light": "#ffffff",
        "bg-secondary": "#f5f5f5",
        "bg-chat": "#f0f0f0",
        "nav-light": "#f9f9f9",
        "border-light": "#e5e7eb",
        "text-main": "#1f2937",
        "text-muted": "#6b7280",
        "text-hint": "#9ca3af",
        "bubble-user": "#2b6cb0",
        "bubble-ai": "#ffffff",
        "tag-reasoning": "#fef3c7",
        "tag-vision": "#dbeafe",
        "tag-tools": "#d1fae5",
        "tag-coding": "#ede9fe",
        success: "#10b981",
        warning: "#f59e0b",
        error: "#ef4444",
      },
      fontFamily: {
        display: ["Inter"],
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};

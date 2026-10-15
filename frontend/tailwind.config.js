// Colours come from CSS variables in src/index.css, so light, dark and
// high-contrast themes all work through the same class names.
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-tint": "var(--accent-tint)",
        "on-accent": "var(--on-accent)",
        line: "var(--border)",
        control: "var(--control-border)",
        success: "var(--success)",
        error: "var(--error)",
      },
      fontFamily: {
        heading: ['"Lexend"', '"Atkinson Hyperlegible"', "system-ui", "sans-serif"],
        body: ['"Atkinson Hyperlegible"', '"Segoe UI"', "system-ui", "sans-serif"],
      },
      fontSize: {
        // Type scale from the design guide (rem, so it scales with text-size settings)
        display: ["2.75rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h1: ["2.125rem", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
        h2: ["1.625rem", { lineHeight: "1.25", letterSpacing: "-0.02em" }],
        h3: ["1.25rem", { lineHeight: "1.3" }],
        "body-lg": ["1.25rem", { lineHeight: "1.6" }],
        body: ["1.125rem", { lineHeight: "1.6" }],
        small: ["0.9375rem", { lineHeight: "1.5" }],
        caption: ["0.875rem", { lineHeight: "1.4" }],
        label: ["1.0625rem", { lineHeight: "1.2" }],
      },
      borderRadius: { control: "10px", card: "14px" },
      borderWidth: { theme: "var(--border-width)" },
      maxWidth: { content: "1200px", measure: "68ch" },
    },
  },
  plugins: [],
};

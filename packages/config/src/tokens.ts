/**
 * Handimen design tokens — source of truth for brand values.
 *
 * Web consumes these through `theme.css` (Tailwind v4 CSS variables).
 * Mobile (Expo + NativeWind, Phase 4) imports this module directly so both
 * platforms stay visually aligned.
 *
 * Keep in sync with `theme.css`.
 */

export const colors = {
  /** Primary brand — a trustworthy workshop teal. */
  brand: {
    50: "#f0fdfa",
    100: "#ccfbf1",
    200: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    500: "#14b8a6",
    600: "#0d9488",
    700: "#0f766e",
    800: "#115e59",
    900: "#134e4a",
    950: "#042f2e",
  },
  /** Warm accent — used for highlights, badges, CTAs we want to pop. */
  accent: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  danger: {
    500: "#ef4444",
    600: "#dc2626",
  },
} as const;

export const radii = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  pill: "9999px",
} as const;

export const fonts = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

export type ColorName = keyof typeof colors;

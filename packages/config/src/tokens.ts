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
  /** Primary brand — the light blue sampled from the logo (#40A9DA). */
  brand: {
    50: "#eef8fd",
    100: "#d9eefa",
    200: "#b6e0f6",
    300: "#85ccef",
    400: "#54b8e5",
    500: "#40a9da",
    600: "#2b8fbf",
    700: "#24739b",
    800: "#235f80",
    900: "#22506b",
    950: "#163447",
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

/** Readable ink for text placed on top of the brand blue. */
export const onBrand = "#062431";

export const fonts = {
  sans: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
} as const;

export type ColorName = keyof typeof colors;

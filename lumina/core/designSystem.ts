// Loaded from the product's actual design tokens
// Works for ANY product — reads from their token file
export interface ProductDesignSystem {
  colours: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: { primary: string; secondary: string; };
  };
  typography: {
    fontFamily: { display: string; body: string; mono: string; };
    scale: Record<string, { size: number; weight: number;
                            lineHeight: number; }>;
  };
  spacing: { base: number; scale: number[] };
  borderRadius: Record<string, number>;
  shadows: Record<string, string>;
  motion: {
    duration: { fast: number; normal: number; slow: number; };
    easing: Record<string, string>;
  };
}

// Every visual decision in Lumina goes through this
export const DS = (system: ProductDesignSystem) => ({
  // Colour is never arbitrary — always from the system
  colour: (token: keyof typeof system.colours) => {
    if (token === 'text') return system.colours.text;
    return system.colours[token];
  },

  // Typography is never approximated — exact from the system
  type: (scale: string) => system.typography.scale[scale],

  // Spacing is always a multiple of base — never arbitrary px
  space: (multiplier: number) => system.spacing.base * multiplier,

  // Motion durations from the system — not invented
  duration: (speed: 'fast' | 'normal' | 'slow') =>
    system.motion.duration[speed],
});

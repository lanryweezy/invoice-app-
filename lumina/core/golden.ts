export const PHI = 1.618033988749895;
export const PHI_INV = 1 / PHI;              // 0.618
export const PHI_SQ = PHI * PHI;             // 2.618

export const φ = PHI;

// Spatial relationships
export const goldenSplit = (size: number) => ({
  major: size * PHI_INV,     // 61.8%
  minor: size * (1 - PHI_INV) // 38.2%
});

// Timing relationships
export const goldenTime = (duration: number) => ({
  hook:       duration * (PHI_INV * PHI_INV),  // 23.6%
  world:      duration * PHI_INV,               // 38.2% — cumulative
  turn:       duration / PHI,                   // 61.8% — the pivot
  revelation: duration * (1 - PHI_INV * PHI_INV * PHI_INV), // 85.4%
  end:        duration                          // 100%
});

// Scale relationships
export const goldenScale = {
  xs:   1 / (PHI * PHI * PHI),  // 0.236
  sm:   1 / (PHI * PHI),        // 0.382
  md:   1 / PHI,                 // 0.618
  base: 1,
  lg:   PHI,                     // 1.618
  xl:   PHI * PHI,               // 2.618
  xxl:  PHI * PHI * PHI,        // 4.236
};

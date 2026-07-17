export const breathe = (
  frame: number,
  fps: number,
  options: {
    bpm?: number,       // default 72 (resting heart)
    intensity?: number, // default 1.0
    phase?: number,     // offset for different elements
    type?: 'scale' | 'opacity' | 'position'
  } = {}
) => {
  const { bpm = 72, intensity = 1, phase = 0 } = options;
  const cycle = (fps * 60) / bpm;
  const raw = Math.sin(((frame + phase) / cycle) * Math.PI * 2);

  switch (options.type) {
    case 'scale':    return 1 + raw * 0.003 * intensity;
    case 'opacity':  return 0.97 + raw * 0.03 * intensity;
    case 'position': return raw * 0.8 * intensity;
    default:         return raw * intensity;
  }
};

// Organic multi-layered breath (more alive than single sine)
export const organicBreathe = (frame: number, fps: number) => {
  const primary   = breathe(frame, fps, { bpm: 72,  intensity: 1.0 });
  const secondary = breathe(frame, fps, { bpm: 108, intensity: 0.3 });
  const tertiary  = breathe(frame, fps, { bpm: 36,  intensity: 0.15 });
  return primary + secondary + tertiary;
};

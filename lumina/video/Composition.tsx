import React from 'react';
import { useCurrentFrame, useVideoConfig, AbsoluteFill, interpolate } from 'remotion';
import { organicBreathe } from '../core/breath';
import { ease } from '../core/motion';
import { goldenScale } from '../core/golden';

export const LuminaExperience: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const breathScale = organicBreathe(frame, fps);

  const introOpacity = interpolate(frame, [0, fps], [0, 1], {
    easing: ease.breath,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const mainScale = goldenScale.lg + breathScale;

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          opacity: introOpacity,
          transform: `scale(${mainScale})`,
          color: '#ffffff',
          fontFamily: 'sans-serif',
          fontWeight: 300,
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}
      >
        L U M I N A
      </div>
    </AbsoluteFill>
  );
};

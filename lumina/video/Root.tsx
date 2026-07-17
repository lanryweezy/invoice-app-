import React from 'react';
import { Composition } from 'remotion';
import { LuminaExperience } from './Composition';
import { goldenTime } from '../core/golden';

export const RemotionRoot: React.FC = () => {
  const durationInFrames = 300; // 10 seconds at 30fps

  // Example of using goldenTime to structure the video phases
  // const timing = goldenTime(durationInFrames);

  return (
    <>
      <Composition
        id="LuminaExperience"
        component={LuminaExperience}
        durationInFrames={durationInFrames}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

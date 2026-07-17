import { Easing } from 'remotion';
import { PHI } from './golden';

// Natural easing curves — no straight lines
export const ease = {
  // Breath — asymmetric, organic
  breath: Easing.bezier(0.4, 0.0, 0.2, 1.0),

  // Emergence — things growing from nature
  emerge: Easing.bezier(0.0, 0.0, 0.2, 1.0),

  // Gravity — physical weight
  gravity: Easing.bezier(0.2, 0.0, 1.0, 1.0),

  // Magnetic — pulled toward a point
  magnetic: Easing.bezier(0.6, 0.0, 0.4, 1.2),

  // River — finding the path of least resistance
  river: Easing.bezier(0.25, 0.46, 0.45, 0.94),

  // Heartbeat — life asserting itself
  heartbeat: Easing.bezier(0.68, -0.55, 0.27, 1.55),
};

// Curved path interpolation (no straight lines)
export const curvedPath = (
  progress: number,
  from: {x: number, y: number},
  to:   {x: number, y: number},
  curve: number = 0.3  // curvature magnitude
) => {
  // Quadratic bezier — creates natural arc
  const cx = (from.x + to.x) / 2 +
              (to.y - from.y) * curve * PHI;
  const cy = (from.y + to.y) / 2 -
              (to.x - from.x) * curve * PHI;

  const t = progress;
  return {
    x: (1-t)*(1-t)*from.x + 2*(1-t)*t*cx + t*t*to.x,
    y: (1-t)*(1-t)*from.y + 2*(1-t)*t*cy + t*t*to.y,
  };
};

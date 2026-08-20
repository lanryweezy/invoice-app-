import { describe, it, expect } from 'vitest';
import { getProFeatureContent, registerProFeatureStrategy } from './proFeatureRegistry';

describe('proFeatureRegistry', () => {
  describe('getProFeatureContent', () => {
    it('returns the registered content for an existing feature like Accounting', () => {
      const content = getProFeatureContent('Accounting');
      expect(content.headline).toBe("You've done the hard work. Let's show you the numbers.");
      expect(content.bullets).toContain("See who hasn't paid");
    });

    it('returns the default fallback content for an unknown feature', () => {
      const content = getProFeatureContent('UnknownFeature');
      expect(content.headline).toBe("Unlock more power for your business.");
      expect(content.subhead).toContain('UnknownFeature');
    });
  });

  describe('registerProFeatureStrategy', () => {
    it('allows registering a new feature strategy that can later be retrieved', () => {
      registerProFeatureStrategy('CustomFeature', (featureName) => ({
        headline: `Headline for ${featureName}`,
        subhead: 'Custom subhead',
        bullets: ['Custom bullet']
      }));

      const content = getProFeatureContent('CustomFeature');
      expect(content.headline).toBe('Headline for CustomFeature');
      expect(content.subhead).toBe('Custom subhead');
      expect(content.bullets).toEqual(['Custom bullet']);
    });
  });
});

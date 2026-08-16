/**
 * 🔩 Hinge Extension Point: ProFeatureContentStrategy
 *
 * Pressure: The `<FeatureGate>` rendering block in `App.tsx` had growing ternary
 * operator chains (e.g. `gatedFeature === 'Accounting' ? ... : gatedFeature === 'Branches' ? ...`)
 * for `headline`, `subhead`, and `bullets`. Adding a new gated feature required
 * modifying this core component in multiple places.
 *
 * Contract:
 * - Implementors provide a function that returns an object containing `headline`,
 *   `subhead`, and an array of `bullets` strings.
 */
export type ProFeatureContentStrategy = (featureName: string) => {
  headline: string;
  subhead: string;
  bullets: string[];
};

const proFeatureStrategies = new Map<string, ProFeatureContentStrategy>();

export function registerProFeatureStrategy(featureName: string, strategy: ProFeatureContentStrategy): void {
  proFeatureStrategies.set(featureName, strategy);
}

registerProFeatureStrategy('Accounting', () => ({
  headline: "You've done the hard work. Let's show you the numbers.",
  subhead: "See profit, track who owes you, and be ready for tax season – all from InvoiceApp.",
  bullets: ["See who hasn't paid", "Know your monthly profit", "Export for your accountant"]
}));

registerProFeatureStrategy('Branches', () => ({
  headline: "Grow beyond one location.",
  subhead: "Manage multiple offices, track location-specific revenue, and organize your teams.",
  bullets: ["Add unlimited locations", "Set location-specific addresses", "Filter reports by branch"]
}));

const defaultStrategy: ProFeatureContentStrategy = (featureName) => ({
  headline: "Unlock more power for your business.",
  subhead: `Upgrade to unlock ${featureName} and streamline your workflow.`,
  bullets: ["Unlimited clients and invoices", "Cloud sync across devices", "Priority support"]
});

export function getProFeatureContent(featureName: string) {
  const strategy = proFeatureStrategies.get(featureName) || defaultStrategy;
  return strategy(featureName);
}

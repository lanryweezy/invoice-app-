const fs = require('fs');
let content = fs.readFileSync('apps/web/App.tsx', 'utf8');

// 1. Add import
if (!content.includes("import { FeatureGate }")) {
  content = content.replace(
    "import { ReceiptPreview } from './components/ReceiptPreview';",
    "import { ReceiptPreview } from './components/ReceiptPreview';\nimport { FeatureGate } from './components/FeatureGate';"
  );
}

// 2. Add gatedFeature state
if (!content.includes("const [gatedFeature, setGatedFeature] = useState")) {
  content = content.replace(
    "const [activeView, setActiveView] = useState",
    "const [gatedFeature, setGatedFeature] = useState<'Branches' | 'Accounting' | 'Recurring' | 'Receipts' | 'Integrations' | null>(null);\n  const [activeView, setActiveView] = useState"
  );
}

// 3. Update handleProFeatureClick
content = content.replace(
  /const handleProFeatureClick = useCallback\(\(featureName: 'Branches' \| 'Accounting' \| 'Recurring'\) => \{[\s\S]*?\}, \[isPro\]\);/,
  `const handleProFeatureClick = useCallback((featureName: 'Branches' | 'Accounting' | 'Recurring' | 'Receipts' | 'Integrations') => {
      if (!isPro) {
          setGatedFeature(featureName);
      } else {
          setActiveView(featureName.toLowerCase() as 'branches' | 'accounting' | 'recurring' | 'receipts' | 'integrations');
      }
  }, [isPro]);`
);

// 4. Render FeatureGate
const featureGateRender = `
        {gatedFeature ? (
          <div className="p-4 sm:p-8 max-w-6xl mx-auto">
            <FeatureGate
              featureName={gatedFeature}
              headline={
                gatedFeature === 'Accounting' ? "You've done the hard work. Let's show you the numbers." :
                gatedFeature === 'Branches' ? "Grow beyond one location." :
                "Unlock more power for your business."
              }
              subhead={
                gatedFeature === 'Accounting' ? "See profit, track who owes you, and be ready for tax season – all from InvoiceApp." :
                gatedFeature === 'Branches' ? "Manage multiple offices, track location-specific revenue, and organize your teams." :
                \`Upgrade to unlock \${gatedFeature} and streamline your workflow.\`
              }
              bullets={
                gatedFeature === 'Accounting' ? ["See who hasn't paid", "Know your monthly profit", "Export for your accountant"] :
                gatedFeature === 'Branches' ? ["Add unlimited locations", "Set location-specific addresses", "Filter reports by branch"] :
                ["Unlimited clients and invoices", "Cloud sync across devices", "Priority support"]
              }
              onUpgrade={() => {
                  setPricingModalContent({ title: \`Unlock \${gatedFeature}\`, message: \`Upgrade to Pro to unlock \${gatedFeature} and much more.\` });
                  setIsPricingModalOpen(true);
              }}
              onDismiss={() => {
                  setGatedFeature(null);
                  setActiveView('editor');
              }}
            />
          </div>
        ) : activeView === 'branches' ? (`;

content = content.replace(
  "        {activeView === 'branches' ? (",
  featureGateRender
);

fs.writeFileSync('apps/web/App.tsx', content);
console.log('App.tsx updated');

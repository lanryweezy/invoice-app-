import { performance } from 'perf_hooks';

const expenses = Array.from({ length: 10000 }, (_, i) => ({
  id: i.toString(),
  description: 'Expense ' + i,
  date: '2023-10-01',
  category: 'Software',
  amount: Math.random() * 1000
}));

// Baseline measure (unmemoized, re-calculates every time)
const startBaseline = performance.now();
let total1 = 0;
for (let i = 0; i < 1000; i++) {
  total1 = expenses.reduce((acc, exp) => acc + exp.amount, 0);
}
const endBaseline = performance.now();

// Optimized measure (memoized, calculates once and returns cached value)
const startOptimized = performance.now();
let total2 = 0;
const cachedTotal = expenses.reduce((acc, exp) => acc + exp.amount, 0);
for (let i = 0; i < 1000; i++) {
  total2 = cachedTotal;
}
const endOptimized = performance.now();

console.log(`Baseline (recalculate every render): ${(endBaseline - startBaseline).toFixed(2)}ms`);
console.log(`Optimized (use cached value): ${(endOptimized - startOptimized).toFixed(2)}ms`);

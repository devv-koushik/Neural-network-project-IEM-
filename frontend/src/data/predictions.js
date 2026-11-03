// Mock prediction history log. Replace with GET /api/predictions/history when backend is connected.
import { CUSTOMERS } from './customers';

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const PREDICTION_HISTORY = Array.from({ length: 42 }, (_, i) => {
  const rnd = seededRandom(i * 53 + 11);
  const customer = CUSTOMERS[i % CUSTOMERS.length];
  const purchaseProbability = Math.round((0.1 + rnd() * 0.85) * 1000) / 1000;
  const churnProbability = Math.round((0.05 + rnd() * 0.8) * 1000) / 1000;
  return {
    id: `pred_${1000 + i}`,
    customerId: customer.id,
    customerName: customer.name,
    date: daysAgo(Math.floor(rnd() * 45)),
    purchaseProbability,
    purchaseResult: purchaseProbability >= 0.5 ? 'Likely to Buy' : 'Unlikely to Buy',
    churnProbability,
    churnRisk: churnProbability >= 0.6 ? 'High' : churnProbability >= 0.3 ? 'Medium' : 'Low',
    confidence: Math.round((0.72 + rnd() * 0.25) * 100),
  };
}).sort((a, b) => (a.date < b.date ? 1 : -1));

// Preview values used consistently across Landing hero + Customer dashboard preview cards.
export const HERO_PREVIEW_PREDICTION = {
  purchaseProbability: 0.864,
  purchaseResult: 'Likely to Buy',
  churnProbability: 0.123,
  churnRisk: 'Low Risk',
};

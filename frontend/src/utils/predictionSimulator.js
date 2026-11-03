// ---------------------------------------------------------------------------
// FRONTEND DEMO LOGIC ONLY.
// Replace this simulator with a backend API call once the Flask ML service
// is available, e.g. axios.post('/api/predict/purchase', customerFeatures).
// The function signature below is intentionally kept API-shaped so that
// swapping the implementation will not require changes in any page/component.
// ---------------------------------------------------------------------------

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Runs a deterministic-ish mock prediction based on customer behavior inputs.
 * @param {object} input
 * @returns {{purchaseProbability:number, purchaseLabel:string, churnProbability:number,
 *   churnRisk:string, confidence:number, engagementScore:number,
 *   factors:{positive:string[], risk:string[]}, insights:string}}
 */
export function simulatePrediction(input) {
  const {
    age = 30,
    gender = 'Female',
    device = 'Mobile',
    browsingTime = 10,
    pagesViewed = 5,
    sessions = 3,
    previousPurchases = 2,
    avgOrderValue = 60,
    cartAdditions = 3,
    cartAbandonments = 1,
    daysSinceLastPurchase = 20,
    discountUsage = 1,
    clv = 200,
    supportInteractions = 0,
  } = input;

  // --- Purchase probability -------------------------------------------------
  let purchaseScore = 0.32;
  purchaseScore += clamp(browsingTime / 60, 0, 1) * 0.16; // more browsing -> more likely
  purchaseScore += clamp(pagesViewed / 20, 0, 1) * 0.1;
  purchaseScore += clamp(sessions / 15, 0, 1) * 0.08;
  purchaseScore += clamp(previousPurchases / 20, 0, 1) * 0.18; // history is a strong signal
  purchaseScore += clamp(discountUsage / 5, 0, 1) * 0.05;
  purchaseScore += clamp(cartAdditions / 15, 0, 1) * 0.09;
  purchaseScore -= clamp(cartAbandonments / 10, 0, 1) * 0.22; // abandonment hurts purchase likelihood
  purchaseScore -= clamp(daysSinceLastPurchase / 120, 0, 1) * 0.08;
  purchaseScore += clamp(avgOrderValue / 500, 0, 1) * 0.04;
  const purchaseNoise = (Math.sin((age + sessions) * 12.9898) * 0.02);
  const purchaseProbability = clamp(purchaseScore + purchaseNoise);

  // --- Churn probability -----------------------------------------------------
  let churnScore = 0.18;
  churnScore += clamp(daysSinceLastPurchase / 150, 0, 1) * 0.34; // inactivity is the strongest churn signal
  churnScore -= clamp(previousPurchases / 20, 0, 1) * 0.22; // loyal buyers churn less
  churnScore += clamp(cartAbandonments / 10, 0, 1) * 0.16;
  churnScore -= clamp(sessions / 15, 0, 1) * 0.1;
  churnScore -= clamp(browsingTime / 60, 0, 1) * 0.06;
  churnScore += clamp(supportInteractions / 10, 0, 1) * 0.1; // frequent support contact can signal frustration
  churnScore -= clamp(discountUsage / 5, 0, 1) * 0.03;
  const churnNoise = Math.cos((age + pagesViewed) * 7.233) * 0.02;
  const churnProbability = clamp(churnScore + churnNoise);

  const purchaseLabel = purchaseProbability >= 0.5 ? 'Likely to Buy' : 'Unlikely to Buy';
  const churnRisk = churnProbability >= 0.6 ? 'High Risk' : churnProbability >= 0.3 ? 'Medium Risk' : 'Low Risk';

  const engagementScore = Math.round(
    clamp(sessions / 15, 0, 1) * 35 + clamp(browsingTime / 60, 0, 1) * 35 + clamp(pagesViewed / 20, 0, 1) * 30
  );

  const confidence = Math.round(
    clamp(0.68 + Math.abs(purchaseProbability - 0.5) * 0.4 + Math.abs(churnProbability - 0.5) * 0.2, 0.55, 0.98) * 100
  );

  const positive = [];
  const risk = [];

  if (browsingTime >= 15) positive.push('Frequent browsing sessions');
  if (previousPurchases >= 5) positive.push('Strong purchase history');
  if (sessions >= 6) positive.push('Multiple recent sessions');
  if (discountUsage >= 2) positive.push('Responsive to discounts');
  if (clv >= 500) positive.push('High customer lifetime value');
  if (cartAdditions >= 5 && cartAbandonments <= 1) positive.push('Active cart engagement with low abandonment');

  if (cartAbandonments >= 3) risk.push('Recent cart abandonment');
  if (daysSinceLastPurchase >= 60) risk.push('Extended inactivity since last purchase');
  if (supportInteractions >= 3) risk.push('Elevated support interactions');
  if (previousPurchases <= 1) risk.push('Limited purchase history');
  if (sessions <= 2) risk.push('Low recent session count');

  if (positive.length === 0) positive.push('Baseline engagement within normal range');
  if (risk.length === 0) risk.push('No significant risk signals detected');

  let insights;
  if (purchaseProbability >= 0.7 && churnProbability < 0.3) {
    insights = `Recent browsing activity and purchase history indicate a high likelihood of conversion, with low churn risk. This customer profile (${device.toLowerCase()}, ${sessions} sessions) shows strong loyalty signals.`;
  } else if (purchaseProbability >= 0.5) {
    insights = `This customer shows moderate purchase intent. Engagement patterns are healthy, but ${cartAbandonments >= 2 ? 'recent cart abandonments' : 'session frequency'} suggest targeted incentives could improve conversion.`;
  } else if (churnProbability >= 0.6) {
    insights = `This customer shows elevated churn risk driven primarily by ${daysSinceLastPurchase >= 60 ? 'extended inactivity' : 'reduced engagement'}. A re-engagement campaign is recommended.`;
  } else {
    insights = `Purchase intent is currently low. Browsing and session activity are limited, but churn risk remains manageable — consider a nurture sequence rather than aggressive discounting.`;
  }

  return {
    purchaseProbability: Math.round(purchaseProbability * 1000) / 1000,
    purchaseLabel,
    churnProbability: Math.round(churnProbability * 1000) / 1000,
    churnRisk,
    confidence,
    engagementScore,
    factors: { positive, risk },
    insights,
    meta: { age, gender, device },
  };
}

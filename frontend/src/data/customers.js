// Centralized mock customer dataset used across admin analytics pages.
// Replace with GET /api/customers when Flask backend is connected.

const FIRST = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Ishita', 'Aditya', 'Sneha',
  'Arjun', 'Pooja', 'Kabir', 'Neha', 'Siddharth', 'Riya', 'Aryan', 'Meera',
  'Kunal', 'Tanvi', 'Dev', 'Kavya', 'Varun', 'Shreya', 'Amit', 'Aditi',
  'Nikhil', 'Anjali', 'Rohit', 'Roshni', 'Pranav', 'Swati', 'Karthik', 'Divya',
  'Harsh', 'Simran', 'Yash', 'Deepa', 'Manav', 'Nidhi', 'Akash', 'Shruti',
  'Gaurav', 'Tara', 'Rishi', 'Komal', 'Suresh', 'Bhavna', 'Alok', 'Pallavi'
];

const LAST = [
  'Sharma', 'Verma', 'Patel', 'Iyer', 'Gupta', 'Reddy', 'Chatterjee', 'Rao',
  'Singh', 'Nair', 'Joshi', 'Mehta', 'Kulkarni', 'Mukherjee', 'Das', 'Malhotra',
  'Menon', 'Deshmukh', 'Agarwal', 'Bhat', 'Kapoor', 'Pillai', 'Saxena', 'Goswami',
  'Nambiar', 'Sen', 'Bansal', 'Hegde', 'Chauhan', 'Ghosh', 'Bose', 'Mishra'
];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function buildCustomer(i) {
  const rnd = seededRandom(i * 137 + 7);
  const isDefaultPritam = i === 0;
  const first = isDefaultPritam ? 'Pritam' : FIRST[i % FIRST.length];
  const last = isDefaultPritam ? 'Sharma' : LAST[(i * 7 + 3) % LAST.length];
  const age = isDefaultPritam ? 21 : 18 + Math.floor(rnd() * 50);
  const purchases = Math.floor(rnd() * 40);
  const sessions = Math.floor(rnd() * 60) + 1;
  const browsingMinutes = Math.round((rnd() * 45 + 2) * 10) / 10;
  const cartAdds = Math.floor(rnd() * 20);
  const cartAbandons = Math.floor(rnd() * cartAdds);
  const daysSinceLastPurchase = Math.floor(rnd() * 180);
  const clv = Math.round((purchases * (60 + rnd() * 120) + rnd() * 200) * 100) / 100;
  const engagement = Math.min(100, Math.round((sessions * 1.1 + browsingMinutes * 1.4 + purchases * 1.6) / 2));
  const purchaseProbability = Math.min(0.97, Math.max(0.03, 0.25 + purchases * 0.015 + browsingMinutes * 0.006 - cartAbandons * 0.02 + rnd() * 0.1));
  const churnProbability = Math.min(0.96, Math.max(0.02, 0.15 + daysSinceLastPurchase * 0.0035 - purchases * 0.012 + cartAbandons * 0.015 + rnd() * 0.08));
  const churnRisk = churnProbability >= 0.6 ? 'High' : churnProbability >= 0.3 ? 'Medium' : 'Low';
  return {
    id: `c${i + 1}`,
    name: `${first} ${last}`,
    email: isDefaultPritam ? 'customer@demo.com' : `${first.toLowerCase()}.${last.toLowerCase()}@mail.com`,
    age,
    gender: isDefaultPritam ? 'Male' : (rnd() > 0.5 ? 'Female' : 'Male'),
    device: ['Mobile', 'Desktop', 'Tablet'][Math.floor(rnd() * 3)],
    purchases,
    sessions,
    browsingMinutes,
    cartAdds,
    cartAbandons,
    daysSinceLastPurchase,
    clv,
    engagement,
    purchaseProbability: Math.round(purchaseProbability * 1000) / 1000,
    churnProbability: Math.round(churnProbability * 1000) / 1000,
    churnRisk,
    joined: `2023-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`,
  };
}

export const CUSTOMERS = Array.from({ length: 60 }, (_, i) => buildCustomer(i));

export function getCustomerStats() {
  const total = CUSTOMERS.length;
  const avgPurchaseProbability = CUSTOMERS.reduce((s, c) => s + c.purchaseProbability, 0) / total;
  const highChurn = CUSTOMERS.filter((c) => c.churnRisk === 'High').length;
  return {
    totalCustomers: total,
    avgPurchaseProbability: Math.round(avgPurchaseProbability * 1000) / 1000,
    highChurnRisk: highChurn,
  };
}

export const AGE_DISTRIBUTION = [
  { bucket: '18-24', count: CUSTOMERS.filter((c) => c.age >= 18 && c.age <= 24).length },
  { bucket: '25-34', count: CUSTOMERS.filter((c) => c.age >= 25 && c.age <= 34).length },
  { bucket: '35-44', count: CUSTOMERS.filter((c) => c.age >= 35 && c.age <= 44).length },
  { bucket: '45-54', count: CUSTOMERS.filter((c) => c.age >= 45 && c.age <= 54).length },
  { bucket: '55+', count: CUSTOMERS.filter((c) => c.age >= 55).length },
];

export const CHURN_DISTRIBUTION = [
  { name: 'Low', value: CUSTOMERS.filter((c) => c.churnRisk === 'Low').length, color: '#2BD9A8' },
  { name: 'Medium', value: CUSTOMERS.filter((c) => c.churnRisk === 'Medium').length, color: '#F5A623' },
  { name: 'High', value: CUSTOMERS.filter((c) => c.churnRisk === 'High').length, color: '#F5566B' },
];

export const CUSTOMER_GROWTH = [
  { month: 'Mar', customers: 312 }, { month: 'Apr', customers: 348 }, { month: 'May', customers: 379 },
  { month: 'Jun', customers: 421 }, { month: 'Jul', customers: 468 }, { month: 'Aug', customers: 512 },
  { month: 'Sep', customers: 549 }, { month: 'Oct', customers: 601 }, { month: 'Nov', customers: 648 },
  { month: 'Dec', customers: 702 }, { month: 'Jan', customers: 754 }, { month: 'Feb', customers: 812 },
];

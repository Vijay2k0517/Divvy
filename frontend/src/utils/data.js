// Mock data for the entire application
export const statsCards = [
  {
    title: "Total Balance",
    value: "₹2,45,890",
    change: "+12.5%",
    trend: "up",
    icon: "Wallet",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    title: "Monthly Spending",
    value: "₹48,320",
    change: "-8.2%",
    trend: "down",
    icon: "TrendingDown",
    gradient: "from-blue-500 to-indigo-600",
  },
  {
    title: "Savings Rate",
    value: "34.2%",
    change: "+5.1%",
    trend: "up",
    icon: "PiggyBank",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    title: "AI Risk Score",
    value: "72/100",
    change: "+3",
    trend: "up",
    icon: "Shield",
    gradient: "from-amber-500 to-orange-600",
  },
];

export const monthlySpending = [
  { month: "Aug", amount: 42000 },
  { month: "Sep", amount: 38500 },
  { month: "Oct", amount: 45200 },
  { month: "Nov", amount: 41800 },
  { month: "Dec", amount: 52300 },
  { month: "Jan", amount: 48900 },
  { month: "Feb", amount: 48320 },
];

export const categoryDistribution = [
  { name: "Food & Dining", value: 12400, color: "#8b5cf6" },
  { name: "Transportation", value: 8200, color: "#6366f1" },
  { name: "Shopping", value: 9800, color: "#22d3ee" },
  { name: "Entertainment", value: 5600, color: "#34d399" },
  { name: "Bills & Utilities", value: 7200, color: "#f472b6" },
  { name: "Subscriptions", value: 5120, color: "#fbbf24" },
];

export const weeklyComparison = [
  { week: "Week 1", thisMonth: 12400, lastMonth: 11200 },
  { week: "Week 2", thisMonth: 10800, lastMonth: 13400 },
  { week: "Week 3", thisMonth: 14200, lastMonth: 12800 },
  { week: "Week 4", thisMonth: 10920, lastMonth: 11600 },
];

export const aiInsights = [
  {
    id: 1,
    icon: "UtensilsCrossed",
    text: "You spend 32% more on food this month compared to your average.",
    type: "warning",
  },
  {
    id: 2,
    icon: "Scissors",
    text: "You can save ₹3,200 by reducing unused subscriptions.",
    type: "tip",
  },
  {
    id: 3,
    icon: "TrendingUp",
    text: "Your predicted expense next month: ₹18,450.",
    type: "prediction",
  },
];

export const transactions = [
  {
    id: 1,
    date: "2026-02-27",
    category: "Food & Dining",
    description: "Swiggy Order",
    amount: -580,
    mode: "UPI",
    icon: "UtensilsCrossed",
  },
  {
    id: 2,
    date: "2026-02-26",
    category: "Transportation",
    description: "Uber Ride",
    amount: -245,
    mode: "Credit Card",
    icon: "Car",
  },
  {
    id: 3,
    date: "2026-02-26",
    category: "Shopping",
    description: "Amazon Purchase",
    amount: -3299,
    mode: "Debit Card",
    icon: "ShoppingBag",
  },
  {
    id: 4,
    date: "2026-02-25",
    category: "Income",
    description: "Salary Credit",
    amount: 75000,
    mode: "Bank Transfer",
    icon: "Briefcase",
  },
  {
    id: 5,
    date: "2026-02-25",
    category: "Bills & Utilities",
    description: "Electricity Bill",
    amount: -2100,
    mode: "Auto Debit",
    icon: "Zap",
  },
  {
    id: 6,
    date: "2026-02-24",
    category: "Entertainment",
    description: "Netflix Subscription",
    amount: -649,
    mode: "Credit Card",
    icon: "Tv",
  },
  {
    id: 7,
    date: "2026-02-24",
    category: "Food & Dining",
    description: "Zomato Order",
    amount: -420,
    mode: "UPI",
    icon: "UtensilsCrossed",
  },
  {
    id: 8,
    date: "2026-02-23",
    category: "Shopping",
    description: "Myntra Fashion",
    amount: -1890,
    mode: "Credit Card",
    icon: "ShoppingBag",
  },
  {
    id: 9,
    date: "2026-02-23",
    category: "Transportation",
    description: "Ola Ride",
    amount: -185,
    mode: "UPI",
    icon: "Car",
  },
  {
    id: 10,
    date: "2026-02-22",
    category: "Bills & Utilities",
    description: "Internet Bill",
    amount: -999,
    mode: "Auto Debit",
    icon: "Wifi",
  },
  {
    id: 11,
    date: "2026-02-22",
    category: "Food & Dining",
    description: "Grocery Store",
    amount: -2340,
    mode: "Debit Card",
    icon: "UtensilsCrossed",
  },
  {
    id: 12,
    date: "2026-02-21",
    category: "Subscriptions",
    description: "Spotify Premium",
    amount: -119,
    mode: "Credit Card",
    icon: "Music",
  },
  {
    id: 13,
    date: "2026-02-21",
    category: "Entertainment",
    description: "Movie Tickets",
    amount: -800,
    mode: "UPI",
    icon: "Film",
  },
  {
    id: 14,
    date: "2026-02-20",
    category: "Shopping",
    description: "Flipkart Electronics",
    amount: -4500,
    mode: "Credit Card",
    icon: "ShoppingBag",
  },
  {
    id: 15,
    date: "2026-02-20",
    category: "Food & Dining",
    description: "Restaurant Dinner",
    amount: -1650,
    mode: "Credit Card",
    icon: "UtensilsCrossed",
  },
];

export const analyticsMonthlyData = [
  { month: "Mar", income: 72000, expense: 45000 },
  { month: "Apr", income: 72000, expense: 42000 },
  { month: "May", income: 75000, expense: 48000 },
  { month: "Jun", income: 75000, expense: 38500 },
  { month: "Jul", income: 75000, expense: 45200 },
  { month: "Aug", income: 78000, expense: 41800 },
  { month: "Sep", income: 78000, expense: 52300 },
  { month: "Oct", income: 78000, expense: 48900 },
  { month: "Nov", income: 80000, expense: 44500 },
  { month: "Dec", income: 80000, expense: 55200 },
  { month: "Jan", income: 82000, expense: 48320 },
  { month: "Feb", income: 82000, expense: 46800 },
];

export const heatmapData = (() => {
  const data = [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeks = ["W1", "W2", "W3", "W4"];
  weeks.forEach((week) => {
    days.forEach((day) => {
      data.push({
        week,
        day,
        value: Math.floor(Math.random() * 5000) + 500,
      });
    });
  });
  return data;
})();

export const predictionData = [
  { month: "Sep", actual: 38500, predicted: null },
  { month: "Oct", actual: 45200, predicted: null },
  { month: "Nov", actual: 41800, predicted: null },
  { month: "Dec", actual: 52300, predicted: null },
  { month: "Jan", actual: 48900, predicted: null },
  { month: "Feb", actual: 48320, predicted: null },
  { month: "Mar", actual: null, predicted: 46500 },
  { month: "Apr", actual: null, predicted: 44200 },
  { month: "May", actual: null, predicted: 47800 },
];

export const categories = [
  "All",
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Subscriptions",
  "Income",
];

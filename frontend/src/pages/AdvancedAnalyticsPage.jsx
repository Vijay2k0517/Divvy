import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart,
  PolarGrid, PolarAngleAxis, Radar, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  DollarSign, PieChart as PieIcon, Activity, BarChart3,
  Calendar, Filter, Download,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import StatCard from '../components/StatCard';
import { analytics, dashboard } from '../utils/api';

const ACCENT_COLORS = ['#8b5cf6', '#6366f1', '#22d3ee', '#34d399', '#f472b6', '#fbbf24'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          <span className="text-white/40 text-xs">{p.name || p.dataKey}: </span>
          <span className="font-semibold">₹{p.value?.toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  );
};

const timeRanges = ['7D', '1M', '3M', '6M', '1Y', 'ALL'];

export default function AdvancedAnalyticsPage() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('6M');

  useEffect(() => {
    Promise.all([
      analytics.monthly(),
      dashboard.categoryDistribution(),
      analytics.quickStats(),
    ])
      .then(([monthly, cats, stats]) => {
        setMonthlyData(monthly);
        setCategoryData(cats);
        const icons = [DollarSign, TrendingUp, Activity, BarChart3];
        setQuickStats(stats.map((s, i) => ({ ...s, icon: icons[i] || Activity })));
      })
      .finally(() => setLoading(false));
  }, []);

  // Derive cash flow data
  const cashFlowData = monthlyData.map((d) => ({
    ...d,
    net: (d.income || 0) - (d.expense || 0),
  }));

  // Derive spending by category for radar
  const radarData = categoryData.slice(0, 6).map((c) => ({
    category: c.name || c.category,
    value: c.value || c.amount,
    fullMark: Math.max(...categoryData.map((x) => x.value || x.amount || 0)) * 1.2,
  }));

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28" count={4} />
          </div>
          <Skeleton className="h-96" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Advanced Analytics</h1>
            <p className="text-xs text-white/30 mt-0.5">Deep insights into your spending patterns</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
              {timeRanges.map((range) => (
                <button
                  key={range}
                  onClick={() => setActiveRange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                    activeRange === range
                      ? 'bg-accent/20 text-accent-light border border-accent/20'
                      : 'text-white/40 hover:text-white/60'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <button className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <StatCard
              key={stat.label}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              trend={stat.trend}
              trendLabel={stat.change}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* Cash Flow Chart — Full Width */}
        <GlassCard hover={false} delay={0.3} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Cash Flow Analysis</h3>
              <p className="text-xs text-white/30 mt-0.5">Income vs expenses with net flow</p>
            </div>
            <div className="flex items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-white/40">Income</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                <span className="text-white/40">Expenses</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
                <span className="text-white/40">Net</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <AreaChart data={cashFlowData}>
              <defs>
                <linearGradient id="incomeGradAdv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradAdv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#incomeGradAdv)" dot={false} />
              <Area type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={2} fill="url(#expenseGradAdv)" dot={false} />
              <Line type="monotone" dataKey="net" stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bottom Row: Radar + Donut */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Spending Radar */}
          <GlassCard hover={false} delay={0.4} className="p-6 lg:col-span-3">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Spending Radar</h3>
              <p className="text-xs text-white/30 mt-0.5">Category-wise spending distribution</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </GlassCard>

          {/* Category Breakdown */}
          <GlassCard hover={false} delay={0.5} className="p-6 lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Top Categories</h3>
              <p className="text-xs text-white/30 mt-0.5">Where your money goes</p>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={categoryData.slice(0, 6)}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  strokeWidth={0}
                >
                  {categoryData.slice(0, 6).map((_, i) => (
                    <Cell key={i} fill={ACCENT_COLORS[i % ACCENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-4">
              {categoryData.slice(0, 5).map((cat, i) => (
                <div key={cat.name || i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: ACCENT_COLORS[i % ACCENT_COLORS.length] }}
                    />
                    <span className="text-xs text-white/50">{cat.name || cat.category}</span>
                  </div>
                  <span className="text-xs font-medium text-white/70">
                    ₹{(cat.value || cat.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Monthly Comparison Bar Chart */}
        <GlassCard hover={false} delay={0.6} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Monthly Expense Waterfall</h3>
              <p className="text-xs text-white/30 mt-0.5">Month-over-month spending comparison</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="expense" radius={[6, 6, 0, 0]} barSize={28}>
                {monthlyData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === monthlyData.length - 1 ? '#8b5cf6' : 'rgba(139,92,246,0.3)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

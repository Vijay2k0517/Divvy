import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { analytics } from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-white/50 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            <span className="text-white/40 text-xs">{p.dataKey}: </span>
            <span className="font-semibold">₹{p.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const defaultQuickStats = [
  { label: 'Avg Monthly', value: '...', icon: Calendar, change: '--', trend: 'up' },
  { label: 'Savings Goal', value: '...', icon: Target, change: '--', trend: 'up' },
  { label: 'Efficiency', value: '...', icon: Zap, change: '--', trend: 'up' },
  { label: 'Growth Rate', value: '...', icon: TrendingUp, change: '--', trend: 'up' },
];

// Heatmap intensity levels
const getHeatColor = (value) => {
  if (value < 1000) return 'bg-accent/10';
  if (value < 2000) return 'bg-accent/20';
  if (value < 3000) return 'bg-accent/35';
  if (value < 4000) return 'bg-accent/50';
  return 'bg-accent/70';
};

export default function AnalyticsPage() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeks = ['W1', 'W2', 'W3', 'W4'];

  const [analyticsMonthlyData, setMonthlyData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [predictionData, setPredictionData] = useState([]);
  const [quickStats, setQuickStats] = useState(defaultQuickStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analytics.monthly(),
      analytics.heatmap(),
      analytics.predictions(),
      analytics.quickStats(),
    ])
      .then(([monthly, heatmap, predictions, stats]) => {
        setMonthlyData(monthly);
        setHeatmapData(heatmap);
        setPredictionData(predictions);
        // Map quick stats with icons
        const icons = [Calendar, Target, Zap, TrendingUp];
        setQuickStats(
          stats.map((s, i) => ({ ...s, icon: icons[i] || TrendingUp }))
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-28" count={4} />
          </div>
          <Skeleton className="h-96" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, i) => (
            <GlassCard key={stat.label} gradient delay={i * 0.1} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-accent-light" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.trend === 'up'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/35 mt-1">{stat.label}</p>
            </GlassCard>
          ))}
        </div>

        {/* Income vs Expense Chart */}
        <GlassCard hover={false} delay={0.3} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Income vs Expenses</h3>
              <p className="text-xs text-white/30 mt-0.5">12-month comparison</p>
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
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={analyticsMonthlyData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 5, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="expense" stroke="#8b5cf6" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Heatmap */}
          <GlassCard hover={false} delay={0.4} className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Spending Heatmap</h3>
              <p className="text-xs text-white/30 mt-0.5">Daily spending intensity this month</p>
            </div>
            <div className="space-y-2">
              {/* Day labels */}
              <div className="grid grid-cols-8 gap-1.5 mb-1">
                <div />
                {days.map((d) => (
                  <div key={d} className="text-center text-[10px] text-white/25">{d}</div>
                ))}
              </div>
              {weeks.map((week) => (
                <div key={week} className="grid grid-cols-8 gap-1.5">
                  <div className="text-[10px] text-white/25 flex items-center">{week}</div>
                  {days.map((day) => {
                    const cell = heatmapData.find((d) => d.week === week && d.day === day);
                    return (
                      <motion.div
                        key={`${week}-${day}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.random() * 0.3 + 0.5 }}
                        className={`aspect-square rounded-md ${getHeatColor(cell?.value || 0)} hover:ring-1 hover:ring-accent/30 transition-all cursor-pointer`}
                        title={`₹${cell?.value?.toLocaleString()}`}
                      />
                    );
                  })}
                </div>
              ))}
              {/* Legend */}
              <div className="flex items-center gap-2 mt-4 justify-end">
                <span className="text-[10px] text-white/25">Less</span>
                {['bg-accent/10', 'bg-accent/20', 'bg-accent/35', 'bg-accent/50', 'bg-accent/70'].map((c, i) => (
                  <div key={i} className={`w-4 h-4 rounded-sm ${c}`} />
                ))}
                <span className="text-[10px] text-white/25">More</span>
              </div>
            </div>
          </GlassCard>

          {/* Prediction Chart */}
          <GlassCard hover={false} delay={0.5} className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Expense Prediction</h3>
              <p className="text-xs text-white/30 mt-0.5">AI-powered forecast for next 3 months</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4, stroke: '#1e1b4b', strokeWidth: 2 }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="8 4" dot={{ fill: '#22d3ee', r: 4, stroke: '#0e1729', strokeWidth: 2 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-5 mt-4 justify-center text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-accent rounded" />
                <span className="text-white/40">Actual</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 bg-accent-cyan rounded border-dashed" style={{ borderTop: '2px dashed #22d3ee', height: 0 }} />
                <span className="text-white/40">Predicted</span>
              </span>
            </div>
          </GlassCard>
        </div>

        {/* Category Breakdown Bar Chart */}
        <GlassCard hover={false} delay={0.6} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Category Breakdown by Month</h3>
              <p className="text-xs text-white/30 mt-0.5">See where each month's money goes</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="expense" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="income" fill="#334155" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

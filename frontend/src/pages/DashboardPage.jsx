import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Shield,
  Brain,
  UtensilsCrossed,
  Scissors,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import SpendingLineChart from '../charts/SpendingLineChart';
import CategoryPieChart from '../charts/CategoryPieChart';
import WeeklyBarChart from '../charts/WeeklyBarChart';
import { dashboard } from '../utils/api';

const iconMap = {
  Wallet, TrendingDown, PiggyBank, Shield,
};

const insightIcons = {
  UtensilsCrossed, Scissors, TrendingUp,
};

const insightColors = {
  warning: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
  tip: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
  prediction: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
};

const insightIconColors = {
  warning: 'text-amber-400',
  tip: 'text-emerald-400',
  prediction: 'text-blue-400',
};

export default function DashboardPage() {
  const [statsCards, setStatsCards] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboard.stats(),
      dashboard.monthlySpending(),
      dashboard.categoryDistribution(),
      dashboard.weeklyComparison(),
      dashboard.aiInsights(),
      dashboard.recentTransactions(),
    ])
      .then(([stats, monthly, category, weekly, insights, txns]) => {
        setStatsCards(stats);
        setMonthlyData(monthly);
        setCategoryData(category);
        setWeeklyData(weekly);
        setAiInsights(insights);
        setRecentTx(txns);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Skeleton className="h-28" count={4} />
          </div>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statsCards.map((card, i) => {
            const Icon = iconMap[card.icon];
            return (
              <GlassCard key={card.title} gradient hover delay={i * 0.1} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-white/40 font-medium mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                    <div className="flex items-center gap-1 mt-2">
                      {card.trend === 'up' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${
                          card.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {card.change}
                      </span>
                      <span className="text-xs text-white/20 ml-1">vs last month</span>
                    </div>
                  </div>
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center opacity-80`}
                  >
                    {Icon && <Icon className="w-5 h-5 text-white" />}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Line Chart */}
          <GlassCard hover={false} delay={0.3} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Monthly Spending Trend</h3>
                <p className="text-xs text-white/30 mt-0.5">Last 7 months overview</p>
              </div>
              <select className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/50 outline-none">
                <option>7 Months</option>
                <option>12 Months</option>
              </select>
            </div>
            <SpendingLineChart data={monthlyData} />
          </GlassCard>

          {/* Pie Chart */}
          <GlassCard hover={false} delay={0.4} className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Category Distribution</h3>
              <p className="text-xs text-white/30 mt-0.5">Where your money goes</p>
            </div>
            <CategoryPieChart data={categoryData} />
          </GlassCard>
        </div>

        {/* Bar Chart + AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Bar Chart */}
          <GlassCard hover={false} delay={0.5} className="p-6 lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Weekly Comparison</h3>
                <p className="text-xs text-white/30 mt-0.5">This month vs last month</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent" />
                  <span className="text-white/40">This Month</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-dark-500" />
                  <span className="text-white/40">Last Month</span>
                </span>
              </div>
            </div>
            <WeeklyBarChart data={weeklyData} />
          </GlassCard>

          {/* AI Insights Panel */}
          <GlassCard
            hover={false}
            glow
            delay={0.6}
            className="p-6 lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Brain className="w-4 h-4 text-accent-light" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Insights for You</h3>
                <p className="text-xs text-white/30">Powered by Divvy AI</p>
              </div>
              <Sparkles className="w-4 h-4 text-accent-light/40 ml-auto" />
            </div>

            <div className="space-y-3">
              {aiInsights.map((insight, i) => {
                const InsightIcon = insightIcons[insight.icon];
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.15 }}
                    className={`bg-gradient-to-r ${insightColors[insight.type]} border rounded-xl p-4`}
                  >
                    <div className="flex items-start gap-3">
                      {InsightIcon && (
                        <InsightIcon
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insightIconColors[insight.type]}`}
                        />
                      )}
                      <p className="text-sm text-white/70 leading-relaxed">{insight.text}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* Recent Transactions */}
        <GlassCard hover={false} delay={0.7} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-white/30 mt-0.5">Latest activity</p>
            </div>
            <a href="/transactions" className="text-xs text-accent-light/70 hover:text-accent-light transition-colors">
              View all →
            </a>
          </div>
          <div className="space-y-2">
            {recentTx.slice(0, 5).map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.08 }}
                className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-white/[0.06] transition-colors">
                    <span className="text-white/40 text-xs">{tx.category.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{tx.description}</p>
                    <p className="text-xs text-white/30">{tx.category} · {tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white/70'}`}>
                  {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                </span>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

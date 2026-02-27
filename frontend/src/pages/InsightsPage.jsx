import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Shield,
  Target,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { insights as insightsApi } from '../utils/api';

const insightIconMap = {
  alert: AlertTriangle,
  tip: Lightbulb,
  prediction: TrendingUp,
  achievement: CheckCircle2,
  warning: AlertTriangle,
};

const insightColorMap = {
  alert: { color: 'from-amber-500/20 to-amber-600/5', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400' },
  warning: { color: 'from-amber-500/20 to-amber-600/5', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400', badgeColor: 'bg-amber-500/10 text-amber-400' },
  tip: { color: 'from-emerald-500/20 to-emerald-600/5', borderColor: 'border-emerald-500/20', iconColor: 'text-emerald-400', badgeColor: 'bg-emerald-500/10 text-emerald-400' },
  prediction: { color: 'from-blue-500/20 to-blue-600/5', borderColor: 'border-blue-500/20', iconColor: 'text-blue-400', badgeColor: 'bg-blue-500/10 text-blue-400' },
  achievement: { color: 'from-violet-500/20 to-violet-600/5', borderColor: 'border-violet-500/20', iconColor: 'text-violet-400', badgeColor: 'bg-violet-500/10 text-violet-400' },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([insightsApi.list(), insightsApi.healthScore()])
      .then(([insightsList, hs]) => {
        setInsights(insightsList);
        setHealthScore(hs);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-32" count={3} />
          <Skeleton className="h-64" />
        </div>
      </PageTransition>
    );
  }

  const riskFactors = healthScore?.factors || [];
  const score = healthScore?.score || 0;
  const scoreLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header Card */}
        <GlassCard hover={false} glow delay={0} className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-blue/10 border border-accent/20 flex items-center justify-center">
              <Brain className="w-7 h-7 text-accent-light" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">AI Financial Insights</h2>
                <Sparkles className="w-4 h-4 text-accent-light/50" />
              </div>
              <p className="text-sm text-white/40">
                Divvy AI analyzed 847 data points from your financial activity to generate these personalized insights.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/40">Updated 2 hours ago</span>
            </div>
          </div>
        </GlassCard>

        {/* Insights List */}
        <div className="space-y-4">
          {insights.map((insight, i) => {
            const colors = insightColorMap[insight.type] || insightColorMap.tip;
            const InsightIcon = insightIconMap[insight.type] || Lightbulb;
            return (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
              >
                <div
                  className={`bg-gradient-to-r ${colors.color} border ${colors.borderColor} rounded-2xl p-5 md:p-6
                           hover:border-opacity-40 transition-all duration-300 group cursor-pointer`}
                  style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center flex-shrink-0 ${colors.iconColor}`}>
                      <InsightIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-sm font-semibold text-white">{insight.title}</h3>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${colors.badgeColor}`}>
                          {insight.type}
                        </span>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed mb-3">{insight.description}</p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-white/30">{insight.category}</span>
                        <span className={colors.iconColor}>{insight.impact}</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-white/15 group-hover:text-white/40 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* AI Risk Assessment */}
        <GlassCard hover={false} delay={0.7} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-5 h-5 text-accent-light" />
            <div>
              <h3 className="text-sm font-semibold text-white">Financial Health Score</h3>
              <p className="text-xs text-white/30">AI-powered comprehensive assessment</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Overall Score */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-36 h-36">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="50" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '314', strokeDashoffset: '314' }}
                    animate={{ strokeDashoffset: 314 - (314 * score) / 100 }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                  />
                  <defs>
                    <linearGradient id="scoreGrad">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{score}</span>
                  <span className="text-xs text-white/30">out of 100</span>
                </div>
              </div>
              <p className="text-sm font-medium text-white/60 mt-3">{scoreLabel}</p>
            </div>

            {/* Factors */}
            <div className="space-y-4">
              {riskFactors.map((factor, i) => (
                <div key={factor.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-white/50">{factor.label}</span>
                    <span className="text-xs font-medium text-white/70">{factor.score}%</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${factor.score}%` }}
                      transition={{ duration: 1, delay: 0.9 + i * 0.15, ease: 'easeOut' }}
                      className={`h-full rounded-full ${factor.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Trophy, Shield, Target, Zap, ArrowRight, X, RefreshCw, Loader2,
  Brain, CheckCircle2, Eye,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { insights as insightsApi, recommendations, anomalies } from '../utils/api';

const feedTypeConfig = {
  alert: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15', gradient: 'from-amber-500/15 to-amber-600/5' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15', gradient: 'from-amber-500/15 to-amber-600/5' },
  tip: { icon: Lightbulb, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', gradient: 'from-emerald-500/15 to-emerald-600/5' },
  prediction: { icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15', gradient: 'from-blue-500/15 to-blue-600/5' },
  achievement: { icon: Trophy, color: 'text-accent-light', bg: 'bg-accent/10', border: 'border-accent/15', gradient: 'from-accent/15 to-accent-blue/5' },
  anomaly: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15', gradient: 'from-red-500/15 to-red-600/5' },
  recommendation: { icon: Target, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/15', gradient: 'from-accent-cyan/15 to-cyan-600/5' },
  saving: { icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', gradient: 'from-emerald-500/15 to-emerald-600/5' },
};

export default function FeedPage() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(new Set());
  const [filter, setFilter] = useState('all');

  const buildFeed = useCallback(async () => {
    const items = [];

    // Fetch insights
    try {
      const insightsList = await insightsApi.list();
      (Array.isArray(insightsList) ? insightsList : insightsList.items || []).forEach((ins) => {
        items.push({
          id: `insight-${ins.id}`,
          type: ins.type || 'tip',
          title: ins.title,
          description: ins.description,
          category: ins.category,
          impact: ins.impact,
          timestamp: ins.created_at || new Date().toISOString(),
          source: 'AI Insights',
        });
      });
    } catch { /* skip */ }

    // Fetch anomalies
    try {
      const anomalyList = await anomalies.list();
      (Array.isArray(anomalyList) ? anomalyList : anomalyList.anomalies || anomalyList.items || []).forEach((a) => {
        items.push({
          id: `anomaly-${a.id}`,
          type: 'anomaly',
          title: `Unusual spending detected`,
          description: a.reason || `Transaction of ₹${Math.abs(a.amount || 0).toLocaleString('en-IN')} flagged as anomaly (score: ${(a.anomaly_score || 0).toFixed(1)})`,
          category: a.category,
          timestamp: a.created_at || new Date().toISOString(),
          source: 'Anomaly Detection',
        });
      });
    } catch { /* skip */ }

    // Fetch recommendations
    try {
      const recList = await recommendations.list();
      (Array.isArray(recList) ? recList : recList.recommendations || recList.items || []).forEach((r) => {
        items.push({
          id: `rec-${r.id}`,
          type: 'recommendation',
          title: r.title || 'Budget Recommendation',
          description: r.reason || r.description,
          category: r.category,
          timestamp: r.created_at || new Date().toISOString(),
          source: 'Recommendation Engine',
        });
      });
    } catch { /* skip */ }

    // Sort by timestamp (newest first)
    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return items;
  }, []);

  const loadFeed = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    const items = await buildFeed();
    setFeedItems(items);
    if (isRefresh) setRefreshing(false); else setLoading(false);
  };

  useEffect(() => { loadFeed(); }, []);

  const dismissItem = (id) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const filteredItems = feedItems
    .filter((item) => !dismissed.has(item.id))
    .filter((item) => filter === 'all' || item.type === filter);

  const filterOptions = ['all', 'tip', 'alert', 'prediction', 'anomaly', 'recommendation', 'achievement'];

  // Relative time helper
  const timeAgo = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6 max-w-2xl mx-auto">
          <Skeleton className="h-16" />
          <Skeleton className="h-32" count={5} />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <GlassCard hover={false} glow delay={0} className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-cyan/10 border border-accent/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-accent-light" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white">Your Feed</h1>
                <Sparkles className="w-4 h-4 text-accent-light/50" />
              </div>
              <p className="text-xs text-white/40">
                Personalized insights, alerts, and recommendations curated by AI
              </p>
            </div>
            <button
              onClick={() => loadFeed(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/40 hover:text-white/70 hover:bg-white/[0.05] transition-all"
            >
              {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            </button>
          </div>
        </GlassCard>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterOptions.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-accent/15 text-accent-light border border-accent/20'
                  : 'bg-white/[0.03] text-white/35 border border-white/[0.04] hover:text-white/50'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Feed Items */}
        {filteredItems.length === 0 ? (
          <GlassCard hover={false} className="py-16 text-center">
            <Eye className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/40">No items to show</p>
            <p className="text-xs text-white/20 mt-1">Check back later for new insights</p>
          </GlassCard>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, i) => {
              const cfg = feedTypeConfig[item.type] || feedTypeConfig.tip;
              const ItemIcon = cfg.icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group relative bg-gradient-to-r ${cfg.gradient} border ${cfg.border} rounded-2xl p-5
                             hover:border-opacity-50 transition-all duration-300 cursor-pointer`}
                  style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                      <ItemIcon className={`w-5 h-5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-1">
                        <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                        <button
                          onClick={(e) => { e.stopPropagation(); dismissItem(item.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white/50 transition-all flex-shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-[10px]">
                        {item.category && (
                          <span className="text-white/25">{item.category}</span>
                        )}
                        {item.impact && (
                          <span className={cfg.color}>{item.impact}</span>
                        )}
                        <span className="text-white/15">·</span>
                        <span className="text-white/20">{item.source}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-white/20">{timeAgo(item.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Summary footer */}
        <div className="text-center py-4">
          <p className="text-[10px] text-white/15">
            Showing {filteredItems.length} of {feedItems.length - dismissed.size} items
          </p>
        </div>
      </div>
    </PageTransition>
  );
}

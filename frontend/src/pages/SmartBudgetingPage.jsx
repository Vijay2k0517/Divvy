import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Wallet, Target, TrendingUp, TrendingDown, AlertTriangle,
  CheckCircle2, Sparkles, ChevronRight, Loader2, ThumbsUp, ThumbsDown,
  Lightbulb, Plus, X,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import Modal from '../components/Modal';
import { budgets as budgetsApi, recommendations } from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-white/50 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold text-white">₹{p.value?.toLocaleString('en-IN')}</p>
      ))}
    </div>
  );
};

const statusConfig = {
  safe: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/15', label: 'On Track', icon: CheckCircle2 },
  warning: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15', label: 'Caution', icon: AlertTriangle },
  danger: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15', label: 'Over Budget', icon: AlertTriangle },
};

function getBudgetStatus(spent, budget) {
  const pct = (spent / budget) * 100;
  if (pct > 100) return 'danger';
  if (pct > 80) return 'warning';
  return 'safe';
}

export default function SmartBudgetingPage() {
  const [budgets, setBudgets] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingRecs, setGeneratingRecs] = useState(false);
  const [formData, setFormData] = useState({ category: '', budget: '', color: '#8b5cf6' });
  const [expanded, setExpanded] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      budgetsApi.list(),
      recommendations.list().catch(() => []),
    ])
      .then(([b, r]) => {
        setBudgets(b.budgets || b.items || b);
        setRecs(Array.isArray(r) ? r : r.recommendations || r.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await budgetsApi.create({
        category: formData.category,
        budget: parseFloat(formData.budget),
        color: formData.color,
      });
      setShowModal(false);
      setFormData({ category: '', budget: '', color: '#8b5cf6' });
      fetchData();
    } finally { setSaving(false); }
  };

  const handleGenerateRecs = async () => {
    setGeneratingRecs(true);
    try {
      await recommendations.generate();
      const r = await recommendations.list().catch(() => []);
      setRecs(Array.isArray(r) ? r : r.recommendations || r.items || []);
    } finally { setGeneratingRecs(false); }
  };

  const handleRecAction = async (id, action) => {
    await recommendations.action(id, action);
    setRecs((prev) => prev.filter((r) => r.id !== id));
    if (action === 'accept') fetchData();
  };

  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overallPct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const overBudgetCount = budgets.filter((b) => b.spent > b.budget).length;

  // Simulated daily burn data for the sparkline 
  const burnData = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    spent: Math.round(totalSpent * ((i + 1) / 30) + Math.random() * 500),
  }));

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44" count={4} />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Overview Card with Ring Progress */}
        <GlassCard hover={false} glow delay={0} className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Circular Progress */}
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                <motion.circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke={overallPct > 100 ? '#ef4444' : overallPct > 80 ? '#fbbf24' : '#34d399'}
                  strokeWidth="8" strokeLinecap="round"
                  initial={{ strokeDasharray: '314', strokeDashoffset: '314' }}
                  animate={{ strokeDashoffset: 314 - (314 * Math.min(overallPct, 100)) / 100 }}
                  transition={{ duration: 1.5, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{overallPct}%</span>
                <span className="text-[10px] text-white/30">used</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h2 className="text-lg font-bold text-white mb-1">Budget Overview</h2>
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div>
                  <p className="text-xs text-white/40">Total Budget</p>
                  <p className="text-xl font-bold text-white">₹{totalBudget.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Spent</p>
                  <p className="text-xl font-bold text-white">₹{totalSpent.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Remaining</p>
                  <p className={`text-xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{Math.abs(totalBudget - totalSpent).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              {overBudgetCount > 0 && (
                <p className="text-xs text-red-400/70 mt-3 flex items-center gap-1 justify-center md:justify-start">
                  <AlertTriangle className="w-3 h-3" />
                  {overBudgetCount} {overBudgetCount === 1 ? 'category' : 'categories'} over budget
                </p>
              )}
            </div>

            {/* Burn Rate Sparkline */}
            <div className="w-48 h-20 flex-shrink-0 hidden lg:block">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={burnData}>
                  <Line type="monotone" dataKey="spent" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-white/20 text-center mt-1">Daily burn rate</p>
            </div>
          </div>
        </GlassCard>

        {/* Budget Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((item, i) => {
            const pct = Math.round((item.spent / item.budget) * 100);
            const clampedPct = Math.min(pct, 100);
            const status = getBudgetStatus(item.spent, item.budget);
            const cfg = statusConfig[status];
            const StatusIcon = cfg.icon;
            const isExpanded = expanded === item.category;

            // Daily pace calculation
            const dayOfMonth = new Date().getDate();
            const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
            const idealPace = Math.round((item.budget / daysInMonth) * dayOfMonth);
            const paceStatus = item.spent <= idealPace ? 'ahead' : 'behind';

            return (
              <GlassCard key={item.category} delay={0.2 + i * 0.08} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <h3 className="text-sm font-medium text-white/80">{item.category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                  </div>
                </div>

                {/* Amount Row */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-lg font-bold text-white">
                    ₹{item.spent.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-white/30">
                    of ₹{item.budget.toLocaleString('en-IN')}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${clampedPct}%` }}
                    transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full relative"
                    style={{
                      backgroundColor: status === 'danger' ? '#ef4444' : status === 'warning' ? '#fbbf24' : item.color,
                      boxShadow: `0 0 10px ${status === 'danger' ? 'rgba(239,68,68,0.3)' : status === 'warning' ? 'rgba(251,191,36,0.2)' : `${item.color}30`}`,
                    }}
                  />
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className={paceStatus === 'ahead' ? 'text-emerald-400/70' : 'text-amber-400/70'}>
                    {paceStatus === 'ahead' ? 'Ahead of pace' : 'Behind pace'} (₹{idealPace.toLocaleString('en-IN')} ideal)
                  </span>
                  <span className={`font-medium ${status === 'danger' ? 'text-red-400' : 'text-white/50'}`}>{pct}%</span>
                </div>

                {/* Expandable detail */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : item.category)}
                  className="mt-3 text-[10px] text-accent-light/50 hover:text-accent-light transition-colors flex items-center gap-1"
                >
                  {isExpanded ? 'Less' : 'More details'}
                  <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-white/[0.04] text-xs text-white/40 space-y-1"
                    >
                      <p>Remaining: ₹{Math.max(0, item.budget - item.spent).toLocaleString('en-IN')}</p>
                      <p>Days left: {daysInMonth - dayOfMonth}</p>
                      <p>Daily allowance: ₹{Math.max(0, Math.round((item.budget - item.spent) / Math.max(1, daysInMonth - dayOfMonth))).toLocaleString('en-IN')}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            );
          })}
        </div>

        {/* Add Budget Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => setShowModal(true)}
          className="w-full border-2 border-dashed border-white/[0.06] rounded-2xl py-6 flex flex-col items-center gap-2 hover:border-accent/20 hover:bg-white/[0.01] transition-all duration-300 group"
        >
          <div className="w-9 h-9 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-accent/10 transition-colors">
            <Plus className="w-4 h-4 text-white/20 group-hover:text-accent-light transition-colors" />
          </div>
          <span className="text-xs text-white/25 group-hover:text-white/40 transition-colors">Add budget category</span>
        </motion.button>

        {/* AI Recommendations */}
        <GlassCard hover={false} delay={0.9} className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-accent-light" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Budget Recommendations</h3>
                <p className="text-xs text-white/30">Smart suggestions to optimize your spending</p>
              </div>
            </div>
            <button
              onClick={handleGenerateRecs}
              disabled={generatingRecs}
              className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-xs hover:bg-accent/20 transition-all flex items-center gap-1.5"
            >
              {generatingRecs ? <Loader2 className="w-3 h-3 animate-spin" /> : <Lightbulb className="w-3 h-3" />}
              Generate
            </button>
          </div>

          {recs.length === 0 ? (
            <p className="text-xs text-white/25 text-center py-6">
              No recommendations yet. Click Generate to get AI-powered budget suggestions.
            </p>
          ) : (
            <div className="space-y-3">
              {recs.map((rec, i) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-all"
                >
                  <Lightbulb className="w-4 h-4 text-accent-light mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70">{rec.reason || rec.description || rec.title}</p>
                    {rec.category && (
                      <span className="text-[10px] text-white/30 mt-1 block">{rec.category}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleRecAction(rec.id, 'accept')}
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400 transition-colors"
                      title="Accept"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleRecAction(rec.id, 'dismiss')}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors"
                      title="Dismiss"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Add Budget Modal */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Budget">
          <form className="space-y-4" onSubmit={handleAdd}>
            <input type="text" placeholder="Category name" value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="input-field" required />
            <input type="number" placeholder="Budget amount" value={formData.budget} onChange={(e) => setFormData((p) => ({ ...p, budget: e.target.value }))} className="input-field" required />
            <div className="flex items-center gap-3">
              <label className="text-xs text-white/40">Color:</label>
              <input type="color" value={formData.color} onChange={(e) => setFormData((p) => ({ ...p, color: e.target.value }))} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Budget'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

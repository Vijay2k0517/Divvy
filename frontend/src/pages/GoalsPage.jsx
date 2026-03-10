import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Plus, Loader2, Trophy, Flame, Calendar,
  TrendingUp, Wallet, CheckCircle2, X, Sparkles, ArrowRight,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { goals } from '../utils/api';

const goalIcons = {
  save: Wallet,
  invest: TrendingUp,
  debt: Flame,
  emergency: Target,
  travel: Calendar,
  default: Trophy,
};

const goalColors = [
  { from: '#8b5cf6', to: '#6366f1' },
  { from: '#22d3ee', to: '#06b6d4' },
  { from: '#34d399', to: '#10b981' },
  { from: '#f472b6', to: '#ec4899' },
  { from: '#fbbf24', to: '#f59e0b' },
  { from: '#a78bfa', to: '#8b5cf6' },
];

export default function GoalsPage() {
  const [goalsList, setGoalsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showContribModal, setShowContribModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', target_amount: '', deadline: '', category: 'save' });
  const [contribAmount, setContribAmount] = useState('');

  const fetchGoals = () => {
    setLoading(true);
    goals.list()
      .then((res) => setGoalsList(Array.isArray(res) ? res : res.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await goals.create({
        name: form.name,
        target_amount: parseFloat(form.target_amount),
        deadline: form.deadline || undefined,
        category: form.category,
      });
      setShowAddModal(false);
      setForm({ name: '', target_amount: '', deadline: '', category: 'save' });
      fetchGoals();
    } finally { setSaving(false); }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await goals.contribute(activeGoal.id, parseFloat(contribAmount));
      setShowContribModal(false);
      setContribAmount('');
      fetchGoals();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    await goals.delete(id);
    fetchGoals();
  };

  // Stats
  const totalTarget = goalsList.reduce((s, g) => s + (g.target_amount || 0), 0);
  const totalSaved = goalsList.reduce((s, g) => s + (g.current_amount || 0), 0);
  const completedCount = goalsList.filter((g) => (g.current_amount || 0) >= (g.target_amount || 1)).length;

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" count={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-56" count={4} />
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
            <h1 className="text-xl font-semibold text-white">Financial Goals</h1>
            <p className="text-xs text-white/30 mt-0.5">Set targets and track your savings progress</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-white text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            New Goal
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard gradient delay={0} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
                <Target className="w-5 h-5 text-accent-light" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">₹{totalTarget.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/35 mt-1">Total Target</p>
          </GlassCard>
          <GlassCard gradient delay={0.1} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">₹{totalSaved.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/35 mt-1">Total Saved</p>
          </GlassCard>
          <GlassCard gradient delay={0.2} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/15 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {completedCount}/{goalsList.length}
            </p>
            <p className="text-xs text-white/35 mt-1">Goals Completed</p>
          </GlassCard>
        </div>

        {/* Goals Grid */}
        {goalsList.length === 0 ? (
          <GlassCard hover={false} className="p-0">
            <EmptyState
              icon={Target}
              title="No goals set yet"
              description="Create your first financial goal to start tracking progress."
              action={
                <button onClick={() => setShowAddModal(true)} className="btn-primary text-xs">
                  Create First Goal
                </button>
              }
            />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {goalsList.map((goal, i) => {
              const pct = goal.target_amount > 0 ? Math.round(((goal.current_amount || 0) / goal.target_amount) * 100) : 0;
              const clampedPct = Math.min(pct, 100);
              const isComplete = pct >= 100;
              const colors = goalColors[i % goalColors.length];
              const GoalIcon = goalIcons[goal.category] || goalIcons.default;

              // Days remaining
              const daysLeft = goal.deadline
                ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
                : null;

              const remaining = Math.max(0, (goal.target_amount || 0) - (goal.current_amount || 0));

              return (
                <GlassCard key={goal.id} delay={0.2 + i * 0.08} className="p-5 relative overflow-hidden">
                  {/* Completion celebration */}
                  {isComplete && (
                    <div className="absolute top-3 right-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </motion.div>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${colors.from}20, ${colors.to}10)`, border: `1px solid ${colors.from}30` }}
                    >
                      <GoalIcon className="w-5 h-5" style={{ color: colors.from }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">{goal.name}</h3>
                      {daysLeft !== null && (
                        <p className="text-[10px] text-white/25">
                          {isComplete ? 'Completed!' : `${daysLeft} days remaining`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold text-white">
                      ₹{(goal.current_amount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-white/30">
                      / ₹{goal.target_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Progress Ring + Bar */}
                  <div className="h-3 bg-white/[0.04] rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${clampedPct}%` }}
                      transition={{ duration: 1, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                        boxShadow: `0 0 12px ${colors.from}40`,
                      }}
                    />
                  </div>

                  {/* Footer row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/25">
                      {isComplete ? '🎉 Goal reached!' : `₹${remaining.toLocaleString('en-IN')} to go`}
                    </span>
                    <span className="text-xs font-medium" style={{ color: colors.from }}>{pct}%</span>
                  </div>

                  {/* Action buttons */}
                  {!isComplete && (
                    <div className="mt-4 pt-3 border-t border-white/[0.04] flex gap-2">
                      <button
                        onClick={() => { setActiveGoal(goal); setShowContribModal(true); }}
                        className="flex-1 px-3 py-2 rounded-lg text-xs font-medium text-white/60 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.04] transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3 h-3" />
                        Add Funds
                      </button>
                    </div>
                  )}
                </GlassCard>
              );
            })}
          </div>
        )}

        {/* Motivational Tip */}
        <GlassCard hover={false} delay={0.8} className="p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-accent-light/50 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/40 leading-relaxed">
              <span className="text-white/60 font-medium">Pro tip:</span> Setting up automatic monthly
              contributions helps you reach goals faster. Even ₹500/month adds up to ₹6,000/year.
            </p>
          </div>
        </GlassCard>

        {/* Create Goal Modal */}
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Goal">
          <form className="space-y-4" onSubmit={handleCreate}>
            <input type="text" placeholder="Goal name (e.g., Emergency Fund)" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" required />
            <input type="number" placeholder="Target amount" value={form.target_amount} onChange={(e) => setForm((p) => ({ ...p, target_amount: e.target.value }))} className="input-field" required />
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} className="input-field">
                <option value="save">Savings</option>
                <option value="invest">Investment</option>
                <option value="debt">Debt Payoff</option>
                <option value="emergency">Emergency Fund</option>
                <option value="travel">Travel</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Deadline (optional)</label>
              <input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} className="input-field" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Goal'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Contribute Modal */}
        <Modal open={showContribModal} onClose={() => { setShowContribModal(false); setActiveGoal(null); }} title={`Contribute to ${activeGoal?.name || 'Goal'}`}>
          <form className="space-y-4" onSubmit={handleContribute}>
            <input type="number" placeholder="Amount to contribute" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} className="input-field" required />
            {activeGoal && (
              <p className="text-xs text-white/25">
                Current: ₹{(activeGoal.current_amount || 0).toLocaleString('en-IN')} / ₹{activeGoal.target_amount.toLocaleString('en-IN')}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => { setShowContribModal(false); setActiveGoal(null); }} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Contribute'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

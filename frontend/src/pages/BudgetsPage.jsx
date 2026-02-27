import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Plus, TrendingUp, AlertTriangle, X, Loader2 } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { budgets as budgetsApi } from '../utils/api';

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ category: '', budget: '', color: '#8b5cf6' });

  const fetchBudgets = () => {
    setLoading(true);
    budgetsApi.list()
      .then((res) => setBudgets(res.items || res))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBudgets(); }, []);

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
      fetchBudgets();
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" count={3} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-36" count={4} />
          </div>
        </div>
      </PageTransition>
    );
  }
  const totalBudget = budgets.reduce((s, b) => s + b.budget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard gradient delay={0} className="p-5">
            <p className="text-xs text-white/40 mb-1">Total Budget</p>
            <p className="text-2xl font-bold text-white">₹{totalBudget.toLocaleString()}</p>
            <p className="text-xs text-white/25 mt-1">Monthly allocation</p>
          </GlassCard>
          <GlassCard gradient delay={0.1} className="p-5">
            <p className="text-xs text-white/40 mb-1">Total Spent</p>
            <p className="text-2xl font-bold text-white">₹{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-white/25 mt-1">{((totalSpent / totalBudget) * 100).toFixed(0)}% utilized</p>
          </GlassCard>
          <GlassCard gradient delay={0.2} className="p-5">
            <p className="text-xs text-white/40 mb-1">Remaining</p>
            <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              ₹{Math.abs(totalBudget - totalSpent).toLocaleString()}
            </p>
            <p className="text-xs text-white/25 mt-1">
              {totalBudget - totalSpent >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </GlassCard>
        </div>

        {/* Budget Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((item, i) => {
            const pct = Math.min((item.spent / item.budget) * 100, 100);
            const over = item.spent > item.budget;
            return (
              <GlassCard key={item.category} delay={0.2 + i * 0.08} className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <h3 className="text-sm font-medium text-white/80">{item.category}</h3>
                  </div>
                  {over && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/10">
                      <AlertTriangle className="w-3 h-3" />
                      Over budget
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-white/40">
                    ₹{item.spent.toLocaleString()} / ₹{item.budget.toLocaleString()}
                  </span>
                  <span className={over ? 'text-red-400 font-medium' : 'text-white/50'}>
                    {((item.spent / item.budget) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: over ? '#ef4444' : item.color,
                      boxShadow: over ? '0 0 10px rgba(239,68,68,0.3)' : `0 0 10px ${item.color}30`,
                    }}
                  />
                </div>

                <p className="text-xs text-white/25 mt-3">
                  {over
                    ? `₹${(item.spent - item.budget).toLocaleString()} over`
                    : `₹${(item.budget - item.spent).toLocaleString()} remaining`}
                </p>
              </GlassCard>
            );
          })}
        </div>

        {/* Add Budget */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          onClick={() => setShowModal(true)}
          className="w-full border-2 border-dashed border-white/[0.06] rounded-2xl py-8 flex flex-col items-center gap-2
                     hover:border-accent/20 hover:bg-white/[0.01] transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] flex items-center justify-center group-hover:bg-accent/10 transition-colors">
            <Plus className="w-5 h-5 text-white/20 group-hover:text-accent-light transition-colors" />
          </div>
          <span className="text-xs text-white/25 group-hover:text-white/40 transition-colors">Add new budget category</span>
        </motion.button>

        {/* Add Budget Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                <div className="glass-card w-full max-w-md p-6 md:p-8" style={{ boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)' }}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Add Budget</h3>
                    <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <form className="space-y-4" onSubmit={handleAdd}>
                    <input type="text" placeholder="Category name" value={formData.category} onChange={(e) => setFormData(p => ({...p, category: e.target.value}))} className="input-field" required />
                    <input type="number" placeholder="Budget amount" value={formData.budget} onChange={(e) => setFormData(p => ({...p, budget: e.target.value}))} className="input-field" required />
                    <div className="flex items-center gap-3">
                      <label className="text-xs text-white/40">Color:</label>
                      <input type="color" value={formData.color} onChange={(e) => setFormData(p => ({...p, color: e.target.value}))} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
                      <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Budget'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

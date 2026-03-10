import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Briefcase, Plus, ArrowUpRight,
  ArrowDownRight, Loader2, IndianRupee, PieChart as PieIcon,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { investments } from '../utils/api';

const COLORS = ['#8b5cf6', '#6366f1', '#22d3ee', '#34d399', '#f472b6', '#fbbf24', '#a78bfa'];

const assetTypeLabels = {
  stocks: 'Stocks',
  mutual_funds: 'Mutual Funds',
  crypto: 'Crypto',
  gold: 'Gold',
  fd: 'Fixed Deposit',
  bonds: 'Bonds',
  real_estate: 'Real Estate',
};

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

export default function InvestmentsPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [investmentsList, setInvestmentsList] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', asset_type: 'stocks', units: '', buy_price: '', current_price: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      investments.portfolio().catch(() => null),
      investments.list().catch(() => []),
      investments.performance({ days: 90 }).catch(() => []),
    ])
      .then(([p, list, perf]) => {
        setPortfolio(p);
        setInvestmentsList(Array.isArray(list) ? list : list.items || []);
        setPerformance(Array.isArray(perf) ? perf : perf.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await investments.create({
        name: form.name,
        asset_type: form.asset_type,
        units: parseFloat(form.units),
        buy_price: parseFloat(form.buy_price),
        current_price: parseFloat(form.current_price),
      });
      setShowAddModal(false);
      setForm({ name: '', asset_type: 'stocks', units: '', buy_price: '', current_price: '' });
      fetchData();
    } finally { setSaving(false); }
  };

  const totalValue = portfolio?.total_value || investmentsList.reduce((s, inv) => s + (inv.current_price || 0) * (inv.units || 0), 0);
  const totalGain = portfolio?.total_gain || investmentsList.reduce((s, inv) => s + ((inv.current_price || 0) - (inv.buy_price || 0)) * (inv.units || 0), 0);
  const gainPct = portfolio?.gain_percentage || (totalValue > 0 ? ((totalGain / (totalValue - totalGain)) * 100) : 0);
  const isPositive = totalGain >= 0;

  // Asset allocation for pie chart
  const allocation = portfolio?.allocation || (() => {
    const grouped = {};
    investmentsList.forEach((inv) => {
      const type = inv.asset_type || 'other';
      grouped[type] = (grouped[type] || 0) + (inv.current_price || 0) * (inv.units || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name: assetTypeLabels[name] || name, value }));
  })();

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" count={3} />
          </div>
          <Skeleton className="h-80" />
          <Skeleton className="h-64" />
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
            <h1 className="text-xl font-semibold text-white">Investment Portfolio</h1>
            <p className="text-xs text-white/30 mt-0.5">Track and manage your investments</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent to-accent-blue text-white text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Investment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard gradient glow delay={0} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-accent-light" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">₹{totalValue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/35 mt-1">Portfolio Value</p>
          </GlassCard>

          <GlassCard gradient delay={0.1} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPositive ? 'bg-emerald-500/10 border border-emerald-500/15' : 'bg-red-500/10 border border-red-500/15'}`}>
                {isPositive ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {isPositive ? '+' : ''}{gainPct.toFixed(1)}%
              </span>
            </div>
            <p className={`text-2xl font-bold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}₹{Math.abs(totalGain).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-white/35 mt-1">Total {isPositive ? 'Gain' : 'Loss'}</p>
          </GlassCard>

          <GlassCard gradient delay={0.2} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/15 flex items-center justify-center">
                <PieIcon className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{investmentsList.length}</p>
            <p className="text-xs text-white/35 mt-1">Active Investments</p>
          </GlassCard>
        </div>

        {/* Performance Chart + Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Performance */}
          <GlassCard hover={false} delay={0.3} className="p-6 lg:col-span-3">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Portfolio Performance</h3>
              <p className="text-xs text-white/30 mt-0.5">90-day value trend</p>
            </div>
            {performance.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={performance}>
                  <defs>
                    <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} fill="url(#perfGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-xs text-white/20">
                Add investments and take snapshots to see performance
              </div>
            )}
          </GlassCard>

          {/* Asset Allocation Donut */}
          <GlassCard hover={false} delay={0.4} className="p-6 lg:col-span-2">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Asset Allocation</h3>
              <p className="text-xs text-white/30 mt-0.5">Portfolio diversification</p>
            </div>
            {allocation.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={allocation}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {allocation.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-4">
                  {allocation.map((a, i) => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-xs text-white/50">{a.name}</span>
                      </div>
                      <span className="text-xs font-medium text-white/70">₹{a.value?.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-xs text-white/20">
                No allocation data yet
              </div>
            )}
          </GlassCard>
        </div>

        {/* Holdings Table */}
        <GlassCard hover={false} delay={0.5} className="p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Your Holdings</h3>
          {investmentsList.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="No investments tracked"
              description="Start by adding your first investment above."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-[10px] text-white/30 font-medium py-2 pr-4">Name</th>
                    <th className="text-[10px] text-white/30 font-medium py-2 pr-4">Type</th>
                    <th className="text-[10px] text-white/30 font-medium py-2 pr-4 text-right">Units</th>
                    <th className="text-[10px] text-white/30 font-medium py-2 pr-4 text-right">Buy Price</th>
                    <th className="text-[10px] text-white/30 font-medium py-2 pr-4 text-right">Current</th>
                    <th className="text-[10px] text-white/30 font-medium py-2 text-right">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {investmentsList.map((inv, i) => {
                    const gain = ((inv.current_price || 0) - (inv.buy_price || 0)) * (inv.units || 0);
                    const pos = gain >= 0;
                    return (
                      <motion.tr
                        key={inv.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <span className="text-xs font-medium text-white/70">{inv.name}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40">
                            {assetTypeLabels[inv.asset_type] || inv.asset_type}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-right text-xs text-white/50">{inv.units}</td>
                        <td className="py-3 pr-4 text-right text-xs text-white/50">₹{inv.buy_price?.toLocaleString('en-IN')}</td>
                        <td className="py-3 pr-4 text-right text-xs text-white/70">₹{inv.current_price?.toLocaleString('en-IN')}</td>
                        <td className="py-3 text-right">
                          <span className={`text-xs font-medium flex items-center justify-end gap-1 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                            {pos ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            ₹{Math.abs(gain).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Add Investment Modal */}
        <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add Investment">
          <form className="space-y-4" onSubmit={handleAdd}>
            <input type="text" placeholder="Investment name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="input-field" required />
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Asset Type</label>
              <select value={form.asset_type} onChange={(e) => setForm((p) => ({ ...p, asset_type: e.target.value }))} className="input-field">
                {Object.entries(assetTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <input type="number" step="any" placeholder="Number of units" value={form.units} onChange={(e) => setForm((p) => ({ ...p, units: e.target.value }))} className="input-field" required />
            <input type="number" step="any" placeholder="Buy price per unit" value={form.buy_price} onChange={(e) => setForm((p) => ({ ...p, buy_price: e.target.value }))} className="input-field" required />
            <input type="number" step="any" placeholder="Current price per unit" value={form.current_price} onChange={(e) => setForm((p) => ({ ...p, current_price: e.target.value }))} className="input-field" required />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Copy, UserPlus, LogOut, Plus, Loader2,
  ChevronRight, Crown, Wallet, CheckCircle2,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { collaborative } from '../utils/api';

export default function CollaborativePage() {
  const [sharedBudgets, setSharedBudgets] = useState([]);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', total_budget: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [contribForm, setContribForm] = useState({ amount: '', description: '' });

  const fetchData = () => {
    setLoading(true);
    collaborative.list()
      .then((res) => setSharedBudgets(Array.isArray(res) ? res : res.items || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const fetchDetail = (id) => {
    collaborative.detail(id).then((d) => {
      setDetail(d);
      setSelectedBudget(id);
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await collaborative.create({
        name: createForm.name,
        total_budget: parseFloat(createForm.total_budget),
        description: createForm.description,
      });
      setShowCreateModal(false);
      setCreateForm({ name: '', total_budget: '', description: '' });
      fetchData();
    } finally { setSaving(false); }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await collaborative.join(joinCode);
      setShowJoinModal(false);
      setJoinCode('');
      fetchData();
    } finally { setSaving(false); }
  };

  const handleContribute = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await collaborative.contribute(selectedBudget, {
        amount: parseFloat(contribForm.amount),
        description: contribForm.description,
      });
      setShowContributeModal(false);
      setContribForm({ amount: '', description: '' });
      fetchDetail(selectedBudget);
    } finally { setSaving(false); }
  };

  const handleLeave = async (id) => {
    await collaborative.leave(id);
    setSelectedBudget(null);
    setDetail(null);
    fetchData();
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-16" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-48" count={4} />
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
            <h1 className="text-xl font-semibold text-white">Family Budgets</h1>
            <p className="text-xs text-white/30 mt-0.5">Shared budgets for families and groups</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-all flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Join
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-accent to-accent-blue text-white text-xs font-medium hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Create
            </button>
          </div>
        </div>

        {sharedBudgets.length === 0 ? (
          <GlassCard hover={false} className="p-0">
            <EmptyState
              icon={Users}
              title="No shared budgets yet"
              description="Create a shared budget and invite family members or friends to collaborate."
              action={
                <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs">
                  Create First Budget
                </button>
              }
            />
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Budget Cards */}
            <div className="lg:col-span-1 space-y-3">
              {sharedBudgets.map((sb, i) => {
                const pct = sb.total_budget > 0 ? Math.round(((sb.total_spent || 0) / sb.total_budget) * 100) : 0;
                const isActive = selectedBudget === sb.id;
                return (
                  <motion.div
                    key={sb.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <GlassCard
                      hover
                      delay={0}
                      className={`p-4 cursor-pointer ${isActive ? 'border-accent/30 bg-white/[0.05]' : ''}`}
                      onClick={() => fetchDetail(sb.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-white">{sb.name}</h3>
                        <div className="flex items-center gap-1 text-[10px] text-white/25">
                          <Users className="w-3 h-3" />
                          {sb.member_count || sb.members?.length || 1}
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xs text-white/40">
                          ₹{(sb.total_spent || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-white/25">
                          / ₹{sb.total_budget.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(pct, 100)}%` }}
                          transition={{ duration: 0.8 }}
                          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-blue"
                        />
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </div>

            {/* Detail Panel */}
            <div className="lg:col-span-2">
              {detail ? (
                <GlassCard hover={false} className="p-6">
                  {/* Budget Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-lg font-bold text-white">{detail.name}</h2>
                      {detail.description && (
                        <p className="text-xs text-white/30 mt-0.5">{detail.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowContributeModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-xs hover:bg-accent/20 transition-all flex items-center gap-1.5"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Contribute
                      </button>
                      <button
                        onClick={() => handleLeave(detail.id)}
                        className="px-3 py-1.5 rounded-lg border border-red-500/10 bg-red-500/5 text-red-400/60 text-xs hover:bg-red-500/10 transition-all flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Leave
                      </button>
                    </div>
                  </div>

                  {/* Invite Code */}
                  {detail.invite_code && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] mb-6">
                      <span className="text-xs text-white/30">Invite Code:</span>
                      <code className="text-xs text-accent-light font-mono bg-accent/10 px-2 py-0.5 rounded">
                        {detail.invite_code}
                      </code>
                      <button
                        onClick={() => copyInviteCode(detail.invite_code)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Members */}
                  <div className="mb-6">
                    <h4 className="text-xs text-white/40 font-medium mb-3">Members</h4>
                    <div className="space-y-2">
                      {(detail.members || []).map((member) => (
                        <div key={member.user_id || member.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02]">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent/20 to-accent-blue/10 flex items-center justify-center text-xs font-bold text-accent-light">
                              {(member.name || member.email || '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs text-white/70 font-medium">{member.name || member.email}</p>
                              <p className="text-[10px] text-white/25">
                                Spent: ₹{(member.total_spent || 0).toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>
                          {member.role === 'owner' && (
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contributions */}
                  {detail.contributions && detail.contributions.length > 0 && (
                    <div>
                      <h4 className="text-xs text-white/40 font-medium mb-3">Recent Contributions</h4>
                      <div className="space-y-1.5">
                        {detail.contributions.slice(0, 10).map((c, i) => (
                          <div key={c.id || i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors">
                            <div>
                              <p className="text-xs text-white/50">{c.description || 'Contribution'}</p>
                              <p className="text-[10px] text-white/20">
                                {new Date(c.created_at).toLocaleDateString('en-IN')}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-white/60">
                              ₹{c.amount?.toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </GlassCard>
              ) : (
                <GlassCard hover={false} className="p-0 h-full flex items-center justify-center min-h-[300px]">
                  <EmptyState
                    icon={ChevronRight}
                    title="Select a budget"
                    description="Click on a shared budget to view details"
                  />
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {/* Create Modal */}
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Shared Budget">
          <form className="space-y-4" onSubmit={handleCreate}>
            <input type="text" placeholder="Budget name (e.g., Family Groceries)" value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className="input-field" required />
            <input type="number" placeholder="Total budget amount" value={createForm.total_budget} onChange={(e) => setCreateForm((p) => ({ ...p, total_budget: e.target.value }))} className="input-field" required />
            <textarea placeholder="Description (optional)" value={createForm.description} onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))} className="input-field resize-none" rows={3} />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Join Modal */}
        <Modal open={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Shared Budget">
          <form className="space-y-4" onSubmit={handleJoin}>
            <input type="text" placeholder="Enter invite code" value={joinCode} onChange={(e) => setJoinCode(e.target.value)} className="input-field font-mono" required />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowJoinModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Contribute Modal */}
        <Modal open={showContributeModal} onClose={() => setShowContributeModal(false)} title="Add Contribution">
          <form className="space-y-4" onSubmit={handleContribute}>
            <input type="number" placeholder="Amount" value={contribForm.amount} onChange={(e) => setContribForm((p) => ({ ...p, amount: e.target.value }))} className="input-field" required />
            <input type="text" placeholder="Description (e.g., Weekly groceries)" value={contribForm.description} onChange={(e) => setContribForm((p) => ({ ...p, description: e.target.value }))} className="input-field" />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowContributeModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, BellOff, Check, CheckCheck, Trash2, AlertTriangle,
  TrendingUp, Shield, Wallet, Info, Plus, Loader2,
  Filter, X,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { notifications as notifApi } from '../utils/api';

const typeConfig = {
  budget_alert: { icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/15' },
  anomaly: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/15' },
  insight: { icon: TrendingUp, color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/15' },
  security: { icon: Shield, color: 'text-accent-light', bg: 'bg-accent/10', border: 'border-accent/15' },
  info: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/15' },
};

const ruleTypes = [
  { value: 'budget_threshold', label: 'Budget Threshold', description: 'Alert when budget usage exceeds a percentage' },
  { value: 'spending_limit', label: 'Spending Limit', description: 'Alert when spending exceeds a fixed amount' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ruleForm, setRuleForm] = useState({ rule_type: 'budget_threshold', category: '', threshold: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      notifApi.list(),
      notifApi.rules().catch(() => []),
    ])
      .then(([n, r]) => {
        setNotifications(Array.isArray(n) ? n : n.notifications || n.items || []);
        setRules(Array.isArray(r) ? r : r.rules || r.items || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const markRead = async (id) => {
    await notifApi.markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    await notifApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotif = async (id) => {
    await notifApi.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const createRule = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await notifApi.createRule({
        rule_type: ruleForm.rule_type,
        category: ruleForm.category || undefined,
        threshold: parseFloat(ruleForm.threshold),
      });
      setShowRuleModal(false);
      setRuleForm({ rule_type: 'budget_threshold', category: '', threshold: '' });
      fetchData();
    } finally { setSaving(false); }
  };

  const deleteRule = async (id) => {
    await notifApi.deleteRule(id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const filtered = filter === 'all'
    ? notifications
    : filter === 'unread'
      ? notifications.filter((n) => !n.is_read)
      : notifications.filter((n) => n.type === filter);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-24" count={5} />
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
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-white">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-light text-xs font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-white/30 mt-0.5">Alerts, insights, and important updates</p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="px-3 py-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] text-xs text-white/50 hover:text-white/70 hover:bg-white/[0.05] transition-all flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent-light text-xs hover:bg-accent/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Alert Rule
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'unread', 'budget_alert', 'anomaly', 'insight'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? 'bg-accent/15 text-accent-light border border-accent/20'
                  : 'bg-white/[0.03] text-white/35 border border-white/[0.04] hover:text-white/50'
              }`}
            >
              {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Notifications List */}
        {filtered.length === 0 ? (
          <GlassCard hover={false} className="p-0">
            <EmptyState
              icon={BellOff}
              title="No notifications"
              description="You're all caught up! New alerts will appear here."
            />
          </GlassCard>
        ) : (
          <div className="space-y-2">
            {filtered.map((notif, i) => {
              const cfg = typeConfig[notif.type] || typeConfig.info;
              const NotifIcon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    notif.is_read
                      ? 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.03]'
                      : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.05]'
                  }`}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                    <NotifIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-sm font-medium ${notif.is_read ? 'text-white/50' : 'text-white/80'}`}>
                          {notif.title || notif.message}
                        </p>
                        {notif.message && notif.title && (
                          <p className="text-xs text-white/30 mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p className="text-[10px] text-white/20 mt-2">
                      {new Date(notif.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Alert Rules */}
        {rules.length > 0 && (
          <GlassCard hover={false} delay={0.5} className="p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Active Alert Rules</h3>
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-accent-light/50" />
                    <div>
                      <p className="text-xs text-white/60">
                        {rule.rule_type === 'budget_threshold' ? 'Budget Alert' : 'Spending Limit'}
                        {rule.category && ` · ${rule.category}`}
                      </p>
                      <p className="text-[10px] text-white/25">
                        Threshold: {rule.rule_type === 'budget_threshold' ? `${rule.threshold}%` : `₹${rule.threshold?.toLocaleString('en-IN')}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Add Rule Modal */}
        <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title="Create Alert Rule">
          <form className="space-y-4" onSubmit={createRule}>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Rule Type</label>
              <select
                value={ruleForm.rule_type}
                onChange={(e) => setRuleForm((p) => ({ ...p, rule_type: e.target.value }))}
                className="input-field"
              >
                {ruleTypes.map((rt) => (
                  <option key={rt.value} value={rt.value}>{rt.label}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="Category (optional)"
              value={ruleForm.category}
              onChange={(e) => setRuleForm((p) => ({ ...p, category: e.target.value }))}
              className="input-field"
            />
            <input
              type="number"
              placeholder={ruleForm.rule_type === 'budget_threshold' ? 'Threshold %' : 'Amount limit'}
              value={ruleForm.threshold}
              onChange={(e) => setRuleForm((p) => ({ ...p, threshold: e.target.value }))}
              className="input-field"
              required
            />
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowRuleModal(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Rule'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </PageTransition>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Plus,
  X,
  Calendar,
  CreditCard,
  Tag,
  DollarSign,
  FileText,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { transactions as txApi } from '../utils/api';

const defaultCategories = ['All', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Subscriptions', 'Income'];

export default function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [txList, setTxList] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ description: '', amount: '', date: '', category: 'Food & Dining', mode: 'UPI' });

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    txApi
      .list({ search: searchTerm, category: selectedCategory, limit: 100 })
      .then((res) => setTxList(res.items || res))
      .finally(() => setLoading(false));
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    txApi.categories().then(setCategories).catch(() => {});
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await txApi.create({
        description: formData.description,
        amount: -Math.abs(parseFloat(formData.amount)),
        date: formData.date,
        category: formData.category,
        mode: formData.mode,
      });
      setShowModal(false);
      setFormData({ description: '', amount: '', date: '', category: 'Food & Dining', mode: 'UPI' });
      fetchTransactions();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const filtered = txList;

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <motion.div
              animate={{ width: searchFocused ? 320 : 260 }}
              className="relative"
            >
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="input-field !pl-10 !py-2.5 text-sm w-full"
              />
            </motion.div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field !pl-10 !pr-8 !py-2.5 text-sm appearance-none cursor-pointer min-w-[160px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-dark-800 text-white">
                    {cat}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
            </div>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 text-sm !px-5 !py-2.5"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* Table */}
        <GlassCard hover={false} className="overflow-hidden">
          {/* Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/[0.04] text-xs font-medium text-white/30 uppercase tracking-wider">
            <div className="col-span-1">Date</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Amount</div>
            <div className="col-span-2">Payment Mode</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-white/15" />
                </div>
                <p className="text-sm text-white/30">No transactions found</p>
                <p className="text-xs text-white/15 mt-1">Try adjusting your search or filter</p>
              </div>
            ) : (
              filtered.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  {/* Mobile layout */}
                  <div className="md:hidden flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white/80">{tx.description}</p>
                      <p className="text-xs text-white/30 mt-0.5">{tx.category} · {tx.date} · {tx.mode}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        tx.amount > 0 ? 'text-emerald-400' : 'text-white/70'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>

                  {/* Desktop layout */}
                  <div className="hidden md:block col-span-1 text-xs text-white/40">
                    {tx.date.slice(5)}
                  </div>
                  <div className="hidden md:flex col-span-3 items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.06] transition-colors">
                      <span className="text-xs text-white/40">{tx.category.charAt(0)}</span>
                    </div>
                    <span className="text-sm text-white/75">{tx.description}</span>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] text-white/45">{tx.category}</span>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center">
                    <span
                      className={`text-sm font-semibold ${
                        tx.amount > 0 ? 'text-emerald-400' : 'text-white/70'
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString()}
                    </span>
                  </div>
                  <div className="hidden md:flex col-span-2 items-center text-xs text-white/40">
                    {tx.mode}
                  </div>
                  <div className="hidden md:flex col-span-2 items-center">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/10">
                      Completed
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Add Transaction Modal */}
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowModal(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
              >
                <div
                  className="glass-card w-full max-w-lg p-6 md:p-8"
                  style={{
                    boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)',
                  }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Add Transaction</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/80 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form className="space-y-4" onSubmit={handleAdd}>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-accent-light transition-colors" />
                      <input type="text" placeholder="Description" value={formData.description} onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))} className="input-field !pl-11" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative group">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-accent-light transition-colors" />
                        <input type="number" placeholder="Amount" value={formData.amount} onChange={(e) => setFormData((p) => ({ ...p, amount: e.target.value }))} className="input-field !pl-11" required />
                      </div>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 group-focus-within:text-accent-light transition-colors" />
                        <input type="date" value={formData.date} onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))} className="input-field !pl-11" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                        <select value={formData.category} onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))} className="input-field !pl-11 appearance-none cursor-pointer">
                          {categories.filter((c) => c !== 'All').map((cat) => (
                            <option key={cat} value={cat} className="bg-dark-800 text-white">{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                        <select value={formData.mode} onChange={(e) => setFormData((p) => ({ ...p, mode: e.target.value }))} className="input-field !pl-11 appearance-none cursor-pointer">
                          {['UPI', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cash'].map((m) => (
                            <option key={m} value={m} className="bg-dark-800 text-white">{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="btn-secondary flex-1 text-sm"
                      >
                        Cancel
                      </button>
                      <button type="submit" disabled={saving} className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Transaction'}
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

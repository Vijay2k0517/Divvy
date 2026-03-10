import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { analytics, transactions } from '../utils/api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = ['6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'];

const getHeatColor = (value, max) => {
  if (!max || value === 0) return 'bg-white/[0.02]';
  const ratio = value / max;
  if (ratio < 0.15) return 'bg-accent/10';
  if (ratio < 0.3) return 'bg-accent/20';
  if (ratio < 0.5) return 'bg-accent/35';
  if (ratio < 0.7) return 'bg-accent/50';
  return 'bg-accent/70';
};

const getCategoryHeatColor = (value, max) => {
  if (!max || value === 0) return 'bg-white/[0.02]';
  const ratio = value / max;
  if (ratio < 0.2) return 'bg-emerald-500/15';
  if (ratio < 0.4) return 'bg-emerald-500/25';
  if (ratio < 0.6) return 'bg-accent-cyan/30';
  if (ratio < 0.8) return 'bg-accent/40';
  return 'bg-accent-rose/50';
};

export default function HeatmapPage() {
  const [heatmapData, setHeatmapData] = useState([]);
  const [txData, setTxData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const WEEKS = ['W1', 'W2', 'W3', 'W4'];

  useEffect(() => {
    Promise.all([
      analytics.heatmap(),
      transactions.list({ limit: 200 }),
    ])
      .then(([hm, tx]) => {
        setHeatmapData(hm);
        setTxData(tx.items || tx);
      })
      .finally(() => setLoading(false));
  }, []);

  const maxHeatVal = useMemo(
    () => Math.max(...heatmapData.map((d) => d.value || 0), 1),
    [heatmapData]
  );

  // Build hourly heatmap from transaction timestamps
  const hourlyHeatmap = useMemo(() => {
    const grid = {};
    DAYS.forEach((d) => HOURS.forEach((h) => { grid[`${d}-${h}`] = 0; }));
    // Simulate from transaction data
    (txData || []).forEach((tx) => {
      const date = new Date(tx.date || tx.created_at);
      const dayIdx = (date.getDay() + 6) % 7;
      const hour = date.getHours();
      const dayName = DAYS[dayIdx];
      let hourBucket;
      if (hour < 9) hourBucket = '6am';
      else if (hour < 12) hourBucket = '9am';
      else if (hour < 15) hourBucket = '12pm';
      else if (hour < 18) hourBucket = '3pm';
      else if (hour < 21) hourBucket = '6pm';
      else if (hour < 24) hourBucket = '9pm';
      else hourBucket = '12am';
      grid[`${dayName}-${hourBucket}`] = (grid[`${dayName}-${hourBucket}`] || 0) + Math.abs(tx.amount || 0);
    });
    return grid;
  }, [txData]);

  const maxHourly = useMemo(
    () => Math.max(...Object.values(hourlyHeatmap), 1),
    [hourlyHeatmap]
  );

  // Category × Month heatmap
  const categoryMonthData = useMemo(() => {
    const categories = [...new Set((txData || []).map((t) => t.category))].slice(0, 6);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const grid = {};
    let maxVal = 1;
    categories.forEach((cat) => {
      months.forEach((m) => { grid[`${cat}-${m}`] = 0; });
    });
    (txData || []).forEach((tx) => {
      const date = new Date(tx.date || tx.created_at);
      const mIdx = date.getMonth();
      if (mIdx < 6 && categories.includes(tx.category)) {
        const key = `${tx.category}-${months[mIdx]}`;
        grid[key] = (grid[key] || 0) + Math.abs(tx.amount || 0);
        if (grid[key] > maxVal) maxVal = grid[key];
      }
    });
    return { grid, categories, months, maxVal };
  }, [txData]);

  // Summary stats
  const totalSpend = heatmapData.reduce((s, d) => s + (d.value || 0), 0);
  const peakDay = heatmapData.reduce((max, d) => (d.value || 0) > (max.value || 0) ? d : max, { value: 0 });
  const avgDaily = heatmapData.length ? Math.round(totalSpend / heatmapData.length) : 0;

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-24" count={3} />
          </div>
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-semibold text-white">Spending Heatmaps</h1>
          <p className="text-xs text-white/30 mt-0.5">Visualize when and where you spend the most</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard gradient delay={0} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/15 flex items-center justify-center">
                <Flame className="w-5 h-5 text-accent-light" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">₹{totalSpend.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/35 mt-1">Total This Month</p>
          </GlassCard>
          <GlassCard gradient delay={0.1} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-rose/10 border border-accent-rose/15 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-accent-rose" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">
              {peakDay.day || '–'}, {peakDay.week || '–'}
            </p>
            <p className="text-xs text-white/35 mt-1">Highest Spending Day</p>
          </GlassCard>
          <GlassCard gradient delay={0.2} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 border border-accent-cyan/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent-cyan" />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">₹{avgDaily.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/35 mt-1">Average Daily Spend</p>
          </GlassCard>
        </div>

        {/* Weekly Heatmap */}
        <GlassCard hover={false} delay={0.3} className="p-6">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-white">Weekly Spending Intensity</h3>
            <p className="text-xs text-white/30 mt-0.5">Click a cell to see details</p>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-8 gap-2 mb-1">
              <div />
              {DAYS.map((d) => (
                <div key={d} className="text-center text-[10px] text-white/25 font-medium">{d}</div>
              ))}
            </div>
            {WEEKS.map((week) => (
              <div key={week} className="grid grid-cols-8 gap-2">
                <div className="text-[10px] text-white/25 flex items-center font-medium">{week}</div>
                {DAYS.map((day) => {
                  const cell = heatmapData.find((d) => d.week === week && d.day === day);
                  const val = cell?.value || 0;
                  const isSelected = selectedCell?.week === week && selectedCell?.day === day;
                  return (
                    <motion.div
                      key={`${week}-${day}`}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.random() * 0.3 + 0.4 }}
                      onClick={() => setSelectedCell(isSelected ? null : { week, day, value: val })}
                      className={`aspect-square rounded-lg ${getHeatColor(val, maxHeatVal)} cursor-pointer transition-all duration-200 flex items-center justify-center
                        ${isSelected ? 'ring-2 ring-accent/50 scale-110' : 'hover:ring-1 hover:ring-accent/30'}`}
                    >
                      {val > 0 && (
                        <span className="text-[9px] text-white/40 font-medium">
                          {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 justify-end">
              <span className="text-[10px] text-white/25">Less</span>
              {['bg-white/[0.02]', 'bg-accent/10', 'bg-accent/20', 'bg-accent/35', 'bg-accent/50', 'bg-accent/70'].map((c, i) => (
                <div key={i} className={`w-5 h-5 rounded-md ${c}`} />
              ))}
              <span className="text-[10px] text-white/25">More</span>
            </div>
          </div>

          {/* Selected Cell Detail */}
          {selectedCell && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-5 pt-5 border-t border-white/[0.06]"
            >
              <div className="flex items-center gap-3">
                <ArrowRight className="w-4 h-4 text-accent-light" />
                <p className="text-sm text-white/60">
                  <span className="text-white font-medium">{selectedCell.day}, {selectedCell.week}</span>
                  {' — '}₹{selectedCell.value.toLocaleString('en-IN')} spent
                </p>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Hourly Heatmap */}
        <GlassCard hover={false} delay={0.5} className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent-light" />
              <h3 className="text-sm font-semibold text-white">Spending by Time of Day</h3>
            </div>
            <p className="text-xs text-white/30 mt-0.5">When during the day you spend the most</p>
          </div>
          <div className="space-y-2">
            <div className="grid gap-2" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
              <div />
              {HOURS.map((h) => (
                <div key={h} className="text-center text-[10px] text-white/25 font-medium">{h}</div>
              ))}
            </div>
            {DAYS.map((day) => (
              <div key={day} className="grid gap-2" style={{ gridTemplateColumns: `60px repeat(${HOURS.length}, 1fr)` }}>
                <div className="text-[10px] text-white/25 flex items-center font-medium">{day}</div>
                {HOURS.map((hour) => {
                  const val = hourlyHeatmap[`${day}-${hour}`] || 0;
                  return (
                    <motion.div
                      key={`${day}-${hour}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.random() * 0.3 + 0.6 }}
                      className={`h-8 rounded-md ${getHeatColor(val, maxHourly)} hover:ring-1 hover:ring-accent/30 transition-all cursor-pointer`}
                      title={`${day} ${hour}: ₹${val.toLocaleString('en-IN')}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Category × Month Heatmap */}
        {categoryMonthData.categories.length > 0 && (
          <GlassCard hover={false} delay={0.7} className="p-6">
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-white">Category × Month</h3>
              <p className="text-xs text-white/30 mt-0.5">Spending trends across categories over time</p>
            </div>
            <div className="space-y-2">
              <div className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${categoryMonthData.months.length}, 1fr)` }}>
                <div />
                {categoryMonthData.months.map((m) => (
                  <div key={m} className="text-center text-[10px] text-white/25 font-medium">{m}</div>
                ))}
              </div>
              {categoryMonthData.categories.map((cat) => (
                <div key={cat} className="grid gap-2" style={{ gridTemplateColumns: `100px repeat(${categoryMonthData.months.length}, 1fr)` }}>
                  <div className="text-[10px] text-white/40 flex items-center truncate">{cat}</div>
                  {categoryMonthData.months.map((m) => {
                    const val = categoryMonthData.grid[`${cat}-${m}`] || 0;
                    return (
                      <motion.div
                        key={`${cat}-${m}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.random() * 0.2 + 0.8 }}
                        className={`h-10 rounded-lg ${getCategoryHeatColor(val, categoryMonthData.maxVal)} hover:ring-1 hover:ring-white/10 transition-all cursor-pointer flex items-center justify-center`}
                        title={`${cat} – ${m}: ₹${val.toLocaleString('en-IN')}`}
                      >
                        {val > 0 && (
                          <span className="text-[9px] text-white/40">
                            {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </PageTransition>
  );
}

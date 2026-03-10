import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Brain, Sparkles, TrendingUp, TrendingDown, Activity,
  RefreshCw, Loader2, Info, Zap,
} from 'lucide-react';
import GlassCard from '../components/GlassCard';
import PageTransition from '../components/PageTransition';
import Skeleton from '../components/Skeleton';
import { predictions, analytics } from '../utils/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-white/50 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm" style={{ color: p.color }}>
          <span className="text-white/40 text-xs">{p.name || p.dataKey}: </span>
          <span className="font-semibold">₹{p.value?.toLocaleString('en-IN')}</span>
        </p>
      ))}
    </div>
  );
};

const modelLabels = {
  prophet: { name: 'Prophet', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10' },
  lstm: { name: 'LSTM Neural Net', color: 'text-accent-light', bg: 'bg-accent/10' },
  moving_avg: { name: 'Moving Average', color: 'text-accent-emerald', bg: 'bg-emerald-500/10' },
};

export default function PredictionsPage() {
  const [predictionData, setPredictionData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [months, setMonths] = useState(3);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      predictions.generate({ months_ahead: months }).catch(() => null),
      analytics.predictions().catch(() => []),
    ])
      .then(([pred, hist]) => {
        setPredictionData(pred);
        setHistoricalData(hist);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const regenerate = () => {
    setGenerating(true);
    predictions
      .generate({ months_ahead: months })
      .then((pred) => setPredictionData(pred))
      .finally(() => setGenerating(false));
  };

  // Merge historical + prediction into chart data
  const chartData = (() => {
    if (!predictionData?.predictions) return historicalData;
    const hist = historicalData.map((d) => ({
      month: d.month,
      actual: d.actual,
      predicted: null,
      upper: null,
      lower: null,
    }));
    const preds = predictionData.predictions.map((p) => ({
      month: p.month,
      actual: null,
      predicted: p.amount,
      upper: p.confidence_upper,
      lower: p.confidence_lower,
    }));
    return [...hist, ...preds];
  })();

  const modelUsed = predictionData?.model_used || 'moving_avg';
  const modelInfo = modelLabels[modelUsed] || modelLabels.moving_avg;

  if (loading) {
    return (
      <PageTransition>
        <div className="space-y-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-36" count={3} />
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Header with Model Badge */}
        <GlassCard hover={false} glow delay={0} className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/20 to-accent-cyan/10 border border-accent/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-accent-light" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">AI Spending Forecast</h2>
                  <Sparkles className="w-4 h-4 text-accent-light/50" />
                </div>
                <p className="text-xs text-white/40">
                  Predicting your financial future using machine learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${modelInfo.bg} ${modelInfo.color}`}>
                {modelInfo.name}
              </span>
              <select
                value={months}
                onChange={(e) => setMonths(Number(e.target.value))}
                className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/50 outline-none"
              >
                <option value={1}>1 Month</option>
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
              </select>
              <button
                onClick={regenerate}
                disabled={generating}
                className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/20 text-accent-light text-xs font-medium hover:bg-accent/20 transition-all flex items-center gap-2"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Regenerate
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Main Prediction Chart with Confidence Band */}
        <GlassCard hover={false} delay={0.2} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Forecast Visualization</h3>
              <p className="text-xs text-white/30 mt-0.5">Actual spending vs AI predictions with confidence intervals</p>
            </div>
            <div className="flex items-center gap-5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 rounded bg-accent" />
                <span className="text-white/40">Actual</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-0.5 rounded bg-accent-cyan" style={{ borderTop: '2px dashed #22d3ee', height: 0 }} />
                <span className="text-white/40">Predicted</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-3 rounded-sm bg-accent-cyan/15" />
                <span className="text-white/40">Confidence</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={380}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.1} />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              {/* Confidence band */}
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#confBand)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
              {/* Actual line */}
              <Line type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4, stroke: '#1e1b4b', strokeWidth: 2 }} connectNulls={false} />
              {/* Predicted line */}
              <Line type="monotone" dataKey="predicted" stroke="#22d3ee" strokeWidth={2.5} strokeDasharray="8 4" dot={{ fill: '#22d3ee', r: 4, stroke: '#0e1729', strokeWidth: 2 }} connectNulls={false} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Prediction Summary Cards */}
        {predictionData?.predictions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predictionData.predictions.slice(0, 3).map((pred, i) => (
              <GlassCard key={pred.month} delay={0.4 + i * 0.1} className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/40">{pred.month}</span>
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-accent-cyan" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-white">
                  ₹{pred.amount?.toLocaleString('en-IN')}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, delay: 0.6 + i * 0.15 }}
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent-cyan"
                    />
                  </div>
                </div>
                {pred.confidence_lower && pred.confidence_upper && (
                  <p className="text-[10px] text-white/25 mt-2">
                    Range: ₹{pred.confidence_lower?.toLocaleString('en-IN')} – ₹{pred.confidence_upper?.toLocaleString('en-IN')}
                  </p>
                )}
              </GlassCard>
            ))}
          </div>
        )}

        {/* Model Info */}
        <GlassCard hover={false} delay={0.7} className="p-5">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-white/30 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-white/50 leading-relaxed">
                Predictions are generated using the <span className={modelInfo.color}>{modelInfo.name}</span> model,
                selected automatically based on the volume of your historical data.
                More transaction history improves accuracy and may unlock advanced models (LSTM, Prophet).
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </PageTransition>
  );
}

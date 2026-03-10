import GlassCard from './GlassCard';

export default function StatCard({ icon: Icon, label, value, sub, trend, trendLabel, delay = 0, gradient: gradientClass }) {
  return (
    <GlassCard gradient delay={delay} className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            gradientClass || 'bg-accent/10 border border-accent/15'
          }`}
        >
          {Icon && <Icon className="w-5 h-5 text-accent-light" />}
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              trend === 'up'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {trendLabel || trend}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/35 mt-1">{label}</p>
      {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
    </GlassCard>
  );
}

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-white/50 mb-2">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-sm" style={{ color: p.color }}>
            <span className="text-white/40 text-xs">{p.dataKey === 'thisMonth' ? 'This Month' : 'Last Month'}: </span>
            <span className="font-semibold">₹{p.value.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function WeeklyBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="thisMonth" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={24} />
        <Bar dataKey="lastMonth" fill="#334155" radius={[6, 6, 0, 0]} barSize={24} />
      </BarChart>
    </ResponsiveContainer>
  );
}

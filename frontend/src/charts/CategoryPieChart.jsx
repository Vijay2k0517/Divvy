import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-800/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-xl">
        <p className="text-xs text-white/50 mb-1">{payload[0].name}</p>
        <p className="text-sm font-semibold text-white">₹{payload[0].value.toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function CategoryPieChart({ data }) {
  const categoryDistribution = data || [];
  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={categoryDistribution}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={4}
            dataKey="value"
            stroke="none"
          >
            {categoryDistribution.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap md:flex-col gap-2 text-xs">
        {categoryDistribution.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-white/50 whitespace-nowrap">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

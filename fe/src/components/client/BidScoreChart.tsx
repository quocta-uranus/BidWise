'use client';

interface ScoreBarProps {
  label: string;
  value: number;
  max?: number;
  color?: string;
}

function ScoreBar({ label, value, max = 1, color = 'blue' }: ScoreBarProps) {
  const pct = Math.round((value / max) * 100);
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    purple: 'bg-purple-500',
    rose: 'bg-rose-500',
    cyan: 'bg-cyan-500',
    indigo: 'bg-indigo-500',
  };
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-24 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorMap[color] ?? colorMap.blue}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-700 w-10 text-right">{pct}%</span>
    </div>
  );
}

interface BidScoreChartProps {
  breakdown: {
    normalizedCriteria: Record<string, number>;
    weightedCriteria: Record<string, number>;
    distanceToIdeal: number;
    distanceToNegIdeal: number;
  } | null;
  topsisScore: number;
  weights: Record<string, number>;
}

const CRITERIA_LABELS: Record<string, { label: string; color: string }> = {
  price: { label: 'Giá bid', color: 'rose' },
  skillMatch: { label: 'Kỹ năng', color: 'blue' },
  experience: { label: 'Kinh nghiệm', color: 'green' },
  rating: { label: 'Đánh giá', color: 'amber' },
  speed: { label: 'Tốc độ', color: 'purple' },
  deadlineFit: { label: 'Deadline fit', color: 'cyan' },
  portfolioScore: { label: 'Portfolio', color: 'indigo' },
};

export default function BidScoreChart({ breakdown, topsisScore, weights }: BidScoreChartProps) {
  if (!breakdown) return null;

  const maxW = Math.max(...Object.values(breakdown.weightedCriteria));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Điểm TOPSIS</span>
        <span className="text-lg font-black text-blue-600">{(topsisScore * 100).toFixed(1)}%</span>
      </div>

      <div className="space-y-2">
        {Object.entries(breakdown.weightedCriteria).map(([key, val]) => {
          const meta = CRITERIA_LABELS[key];
          if (!meta) return null;
          return (
            <ScoreBar
              key={key}
              label={meta.label}
              value={val}
              max={maxW || 1}
              color={meta.color}
            />
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-500">
        <div>
          <span className="font-medium text-slate-700">D+:</span> {breakdown.distanceToIdeal.toFixed(4)}
        </div>
        <div>
          <span className="font-medium text-slate-700">D−:</span> {breakdown.distanceToNegIdeal.toFixed(4)}
        </div>
      </div>
    </div>
  );
}

'use client';

// Map criterion key → weight key in AHP weights object
const WEIGHT_KEY_MAP: Record<string, string> = {
  price:         'priceWeight',
  skillMatch:    'skillWeight',
  experience:    'experienceWeight',
  rating:        'ratingWeight',
  speed:         'speedWeight',
  deadlineFit:   'deadlineWeight',
  portfolioScore:'portfolioWeight',
};

const CRITERIA_META: Record<string, { label: string; colorClass: string; bgClass: string; hint: string }> = {
  price:         { label: 'Giá bid',      colorClass: 'bg-rose-500',    bgClass: 'bg-rose-50',    hint: 'Thấp hơn = tốt hơn (cost criterion)' },
  skillMatch:    { label: 'Kỹ năng',      colorClass: 'bg-blue-500',    bgClass: 'bg-blue-50',    hint: 'Tỷ lệ kỹ năng khớp với job' },
  experience:    { label: 'Kinh nghiệm',  colorClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', hint: 'Số năm kinh nghiệm' },
  rating:        { label: 'Đánh giá',     colorClass: 'bg-amber-500',   bgClass: 'bg-amber-50',   hint: 'Điểm reputation (0–5)' },
  speed:         { label: 'Tốc độ',       colorClass: 'bg-purple-500',  bgClass: 'bg-purple-50',  hint: 'Ít ngày = tốt hơn (cost criterion)' },
  deadlineFit:   { label: 'Deadline fit', colorClass: 'bg-cyan-500',    bgClass: 'bg-cyan-50',    hint: 'Mức độ phù hợp deadline' },
  portfolioScore:{ label: 'Portfolio',    colorClass: 'bg-indigo-500',  bgClass: 'bg-indigo-50',  hint: 'Số lượng dự án portfolio' },
};

const ORDERED_KEYS = ['price', 'skillMatch', 'experience', 'rating', 'speed', 'deadlineFit', 'portfolioScore'];

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

export default function BidScoreChart({ breakdown, topsisScore, weights }: BidScoreChartProps) {
  if (!breakdown) return null;

  const { normalizedCriteria, distanceToIdeal, distanceToNegIdeal } = breakdown;
  const dPlus  = distanceToIdeal;
  const dMinus = distanceToNegIdeal;
  const cc     = dMinus / (dPlus + dMinus);

  return (
    <div className="space-y-3">
      {/* Header: TOPSIS score */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide">Điểm TOPSIS</p>
          <p className="text-[10px] text-slate-400 mt-0.5">CC = D⁻ / (D⁺ + D⁻)</p>
        </div>
        <span className="text-2xl font-black text-blue-600">{(topsisScore * 100).toFixed(1)}%</span>
      </div>

      {/* Criteria rows: normalized score (actual 0–1) + AHP weight */}
      <div className="space-y-2.5">
        {ORDERED_KEYS.map((key) => {
          const meta      = CRITERIA_META[key];
          const normScore = normalizedCriteria[key] ?? 0;
          const pct       = Math.round(normScore * 100);
          const weightVal = weights[WEIGHT_KEY_MAP[key]] ?? 0;
          const isZero    = pct === 0 && key === 'skillMatch';

          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-slate-600 truncate">{meta.label}</span>
                  {isZero && (
                    <span className="text-[10px] text-rose-500 font-medium shrink-0">⚠ Không khớp</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono">w={weightVal}%</span>
                  <span className={`text-xs font-semibold font-mono w-9 text-right ${pct === 0 ? 'text-rose-500' : 'text-slate-700'}`}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isZero ? 'bg-rose-300' : meta.colorClass}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Distance section */}
      <div className="pt-2 border-t border-slate-100 space-y-1.5">
        <p className="text-[10px] text-slate-400 uppercase tracking-wide font-medium">Khoảng cách TOPSIS</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
            <p className="text-[10px] text-slate-400">D⁺ đến lý tưởng tốt</p>
            <p className="text-sm font-bold text-slate-700 font-mono">{dPlus.toFixed(4)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
            <p className="text-[10px] text-slate-400">D⁻ đến lý tưởng xấu</p>
            <p className="text-sm font-bold text-slate-700 font-mono">{dMinus.toFixed(4)}</p>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 text-center">
          CC = {dMinus.toFixed(4)} / ({dPlus.toFixed(4)} + {dMinus.toFixed(4)}) = <span className="font-semibold text-blue-600">{(cc * 100).toFixed(1)}%</span>
        </p>
      </div>
    </div>
  );
}

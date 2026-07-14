'use client';

import { useEffect, useState } from 'react';
import { reputationApi, MyReputationData } from '@/lib/api/reputation.api';

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  NEW:      { label: 'New',      color: 'text-slate-500', bg: 'bg-slate-100 border-slate-300', icon: '○' },
  SILVER:   { label: 'Silver',   color: 'text-slate-600', bg: 'bg-slate-200 border-slate-400', icon: '◆' },
  GOLD:     { label: 'Gold',     color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', icon: '★' },
  VERIFIED: { label: 'Verified', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', icon: '✦' },
};

const AXES = ['frontend', 'backend', 'mobile', 'design', 'devops', 'data'];
const AXIS_LABELS: Record<string, string> = {
  frontend: 'Frontend', backend: 'Backend', mobile: 'Mobile',
  design: 'Design', devops: 'DevOps', data: 'Data',
};

// Custom SVG hexagonal radar chart — no external dependencies
function RadarChart({
  scores,
  benchmarks,
  size = 220,
}: {
  scores: Record<string, number>;
  benchmarks: Record<string, number>;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.35;
  const n = AXES.length;

  const angle = (i: number) => (i * 2 * Math.PI) / n - Math.PI / 2;

  const pt = (i: number, val: number, max = 5) => ({
    x: cx + r * (val / max) * Math.cos(angle(i)),
    y: cy + r * (val / max) * Math.sin(angle(i)),
  });

  const toPolyPoints = (vals: number[]) =>
    vals.map((v, i) => { const p = pt(i, v); return `${p.x},${p.y}`; }).join(' ');

  const scoreVals = AXES.map((a) => scores[a] ?? 0);
  const benchVals = AXES.map((a) => benchmarks[a] ?? 0);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[1, 2, 3, 4, 5].map((level) => (
        <polygon
          key={level}
          points={AXES.map((_, i) => { const p = pt(i, level); return `${p.x},${p.y}`; }).join(' ')}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={level === 5 ? 1.5 : 1}
        />
      ))}

      {/* Axis spokes */}
      {AXES.map((_, i) => {
        const ep = pt(i, 5);
        return <line key={i} x1={cx} y1={cy} x2={ep.x} y2={ep.y} stroke="#e2e8f0" strokeWidth="1" />;
      })}

      {/* Market benchmark polygon */}
      {benchVals.some((v) => v > 0) && (
        <polygon
          points={toPolyPoints(benchVals)}
          fill="#94a3b8"
          fillOpacity="0.12"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeDasharray="5 3"
        />
      )}

      {/* My score polygon */}
      <polygon
        points={toPolyPoints(scoreVals)}
        fill="#3b82f6"
        fillOpacity="0.2"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Score dots */}
      {scoreVals.map((v, i) => {
        if (v === 0) return null;
        const p = pt(i, v);
        return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />;
      })}

      {/* Axis labels */}
      {AXES.map((axis, i) => {
        const ep = pt(i, 5);
        const labelR = r + 18;
        const lx = cx + labelR * Math.cos(angle(i));
        const ly = cy + labelR * Math.sin(angle(i));
        const s = scoreVals[i];
        return (
          <g key={axis}>
            <text
              x={lx}
              y={ly - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="8"
              fontWeight="700"
              fill="#64748b"
              className="uppercase tracking-wide"
            >
              {AXIS_LABELS[axis]}
            </text>
            {s > 0 && (
              <text
                x={lx}
                y={ly + 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="8"
                fontWeight="800"
                fill="#3b82f6"
              >
                {s.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="3" fill="#e2e8f0" />
    </svg>
  );
}

export default function ReputationDashboard() {
  const [data, setData] = useState<MyReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reputationApi
      .getMyReputation()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
        <div className="h-48 bg-slate-50 rounded-xl" />
      </div>
    );
  }

  const tier = data?.tier ?? 'NEW';
  const tc = TIER_CONFIG[tier];

  const scoreMap = Object.fromEntries((data?.clusters ?? []).map((c) => [c.cluster, c.score]));
  const benchMap = Object.fromEntries(
    (data?.marketComparison ?? []).map((c) => [c.cluster, c.marketAvg]),
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Danh tiếng theo kỹ năng</h3>
          <p className="text-xs text-slate-400 mt-0.5">Dựa trên đánh giá từ khách hàng (WMA Kokkodis)</p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-bold text-sm ${tc.bg} ${tc.color}`}>
          {tc.icon} {tc.label}
        </div>
      </div>

      {data?.totalReviews === 0 ? (
        <div className="bg-slate-50 rounded-xl p-6 text-center space-y-2">
          <p className="text-slate-400 text-xs font-semibold">
            Chưa có đánh giá nào. Hoàn thành hợp đồng đầu tiên để xây dựng danh tiếng.
          </p>
          {data.assessmentScore && (
            <p className="text-xs text-blue-600 font-bold">
              Assessment: {data.assessmentScore} điểm ({data.assessmentLevel}) — đang ở mức {tier}
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Radar chart + stats */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <RadarChart scores={scoreMap} benchmarks={benchMap} size={220} />

            <div className="flex-1 space-y-3 w-full">
              <div className="text-center sm:text-left">
                <p className="text-2xl font-black text-slate-900">
                  {data?.overallScore.toFixed(2)} <span className="text-base text-slate-400 font-bold">/ 5.00</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{data?.totalReviews} đánh giá nhận được</p>
              </div>

              {/* Cluster breakdown */}
              <div className="space-y-2">
                {(data?.marketComparison ?? []).map((c) => (
                  <div key={c.cluster}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-slate-600 uppercase">{AXIS_LABELS[c.cluster]}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-blue-700">{c.myScore.toFixed(1)}</span>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                          c.aboveMarket ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-50'
                        }`}>
                          {c.aboveMarket ? `+${c.delta.toFixed(1)}` : c.delta.toFixed(1)} vs thị trường
                        </span>
                      </div>
                    </div>
                    <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      {/* Market benchmark */}
                      <div
                        className="absolute h-full bg-slate-200 rounded-full"
                        style={{ width: `${(c.marketAvg / 5) * 100}%` }}
                      />
                      {/* My score */}
                      <div
                        className="absolute h-full bg-blue-500 rounded-full"
                        style={{ width: `${(c.myScore / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-3">
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-blue-500 inline-block" /> Điểm của bạn
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-0.5 bg-slate-400 inline-block border-dashed border-t" style={{ borderStyle: 'dashed' }} /> Trung bình thị trường
            </span>
          </div>
        </>
      )}
    </div>
  );
}

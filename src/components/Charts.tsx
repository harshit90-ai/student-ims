import { useState } from 'react';

export interface AttendanceChartPoint {
  label: string;
  present: number;
  absent: number;
  leave: number;
}

export function AttendanceBarChart({ data }: { data: AttendanceChartPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const maxVal = Math.max(
    10,
    ...data.map((d) => d.present + d.absent + d.leave)
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#1D4ED8]" /> Present
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Leave
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Absent
          </span>
        </div>
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="text-xs font-mono tabular-nums text-slate-700 bg-slate-100 px-2.5 py-1 rounded">
            {data[hoveredIdx].label}: {data[hoveredIdx].present}P · {data[hoveredIdx].leave}L · {data[hoveredIdx].absent}A
          </div>
        )}
      </div>

      <div className="relative h-52 flex items-end gap-3 pt-4 pb-6 border-b border-slate-200">
        {/* Horizontal gridlines */}
        <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
          {[100, 75, 50, 25, 0].map((pct) => (
            <div key={pct} className="w-full border-t border-dashed border-slate-100 flex items-center">
              <span className="text-[10px] font-mono tabular-nums text-slate-400 -mt-3 bg-white pr-1">
                {Math.round((maxVal * pct) / 100)}
              </span>
            </div>
          ))}
        </div>

        {data.map((point, idx) => {
          const presentH = (point.present / maxVal) * 100;
          const leaveH = (point.leave / maxVal) * 100;
          const absentH = (point.absent / maxVal) * 100;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={point.label}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer z-10"
            >
              <div
                className={`w-full max-w-[36px] flex flex-col-reverse rounded-t overflow-hidden transition-opacity ${
                  hoveredIdx !== null && !isHovered ? 'opacity-65' : 'opacity-100'
                }`}
                style={{ height: '100%' }}
              >
                <div className="w-full bg-[#1D4ED8] transition-all duration-300" style={{ height: `${presentH}%` }} />
                <div className="w-full bg-amber-500 transition-all duration-300" style={{ height: `${leaveH}%` }} />
                <div className="w-full bg-rose-500 transition-all duration-300" style={{ height: `${absentH}%` }} />
              </div>
              <span className="absolute -bottom-6 text-[11px] font-mono tabular-nums text-slate-500 whitespace-nowrap">
                {point.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export interface PerformancePoint {
  label: string;
  avgScore: number;
  passRate: number;
}

export function PerformanceLineChart({ data }: { data: PerformancePoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const width = 460;
  const height = 180;
  const padX = 34;
  const padY = 20;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const points = data.map((d, idx) => {
    const x = padX + (data.length > 1 ? (idx / (data.length - 1)) * innerW : innerW / 2);
    const y = padY + innerH - ((d.avgScore - 50) / 50) * innerH;
    return { ...d, x, y };
  });

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`
      : '';

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">Average Examination Score (%) by Term</span>
        {hoveredIdx !== null && points[hoveredIdx] && (
          <span className="text-xs font-mono tabular-nums text-[#0B1F3A] bg-blue-50 px-2.5 py-1 rounded">
            {points[hoveredIdx].label}: {points[hoveredIdx].avgScore}% avg · {points[hoveredIdx].passRate}% pass
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48 overflow-visible">
        <defs>
          <linearGradient id="perfArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {[60, 75, 90, 100].map((val) => {
          const y = padY + innerH - ((val - 50) / 50) * innerH;
          return (
            <g key={val}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" />
              <text x={4} y={y + 4} className="fill-slate-400 text-[10px] font-mono tabular-nums">
                {val}%
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#perfArea)" />}
        {linePath && <path d={linePath} fill="none" stroke="#1D4ED8" strokeWidth="2.5" strokeLinecap="round" />}

        {points.map((p, idx) => (
          <g
            key={p.label}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="cursor-pointer"
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIdx === idx ? 6 : 4}
              fill="#FFFFFF"
              stroke="#1D4ED8"
              strokeWidth="2.5"
            />
            <text
              x={p.x}
              y={height - 2}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-mono"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

export function DepartmentDonutChart({ slices }: { slices: DonutSlice[] }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          {slices.map((slice, idx) => {
            const pct = slice.value / total;
            const dash = pct * circumference;
            const offset = -cumulativeOffset;
            cumulativeOffset += dash;
            return (
              <circle
                key={slice.label}
                cx="70"
                cy="70"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={activeIdx === idx ? 20 : 16}
                strokeDasharray={`${dash} ${circumference}`}
                strokeDashoffset={offset}
                onMouseEnter={() => setActiveIdx(idx)}
                onMouseLeave={() => setActiveIdx(null)}
                className="transition-all duration-200 cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xl font-bold font-display text-slate-900 tabular-nums">
            {activeIdx !== null ? slices[activeIdx].value : total}
          </span>
          <span className="text-[11px] text-slate-500">
            {activeIdx !== null ? 'Students' : 'Total'}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {slices.map((slice, idx) => {
          const pct = Math.round((slice.value / total) * 100);
          return (
            <div
              key={slice.label}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              className={`flex items-center justify-between text-xs py-1 px-2 rounded transition-colors cursor-pointer ${
                activeIdx === idx ? 'bg-slate-100' : ''
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-slate-700 truncate">{slice.label}</span>
              </div>
              <span className="font-mono tabular-nums text-slate-900 font-medium ml-3 shrink-0">
                {slice.value} ({pct}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

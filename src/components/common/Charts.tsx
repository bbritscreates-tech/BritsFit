import React, { useState } from 'react';

export interface ChartDataPoint {
  label: string; // e.g. "10 Oct" or "W38"
  value: number;
  subValue?: string | number;
  date?: string;
  tooltipContext?: string;
}

interface LineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string; // hex or tailwind stroke class
  fillColor?: string;
  unit?: string;
  formatValue?: (val: number) => string;
  emptyMessage?: string;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  height = 200,
  color = '#10b981',
  fillColor = '#10b981',
  unit = '',
  formatValue = (v) => v.toString(),
  emptyMessage = 'No data recorded for this period',
}) => {
  const [activePoint, setActivePoint] = useState<ChartDataPoint | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
        style={{ height }}
      >
        {emptyMessage}
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const paddingY = (maxVal - minVal) * 0.15 || (maxVal > 0 ? maxVal * 0.1 : 1);
  const effectiveMin = Math.max(0, minVal - paddingY);
  const effectiveMax = maxVal + paddingY;
  const range = effectiveMax - effectiveMin || 1;

  const width = 600;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 30;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + plotWidth / 2
        : padLeft + (i / (data.length - 1)) * plotWidth;
    const y = padTop + plotHeight - ((d.value - effectiveMin) / range) * plotHeight;
    return { x, y, dataPoint: d, index: i };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${padTop + plotHeight} L ${points[0].x} ${padTop + plotHeight} Z`
      : '';

  // 3-4 Y-axis ticks
  const ticks = [
    effectiveMin,
    effectiveMin + range * 0.5,
    effectiveMax,
  ];

  return (
    <div className="relative w-full select-none">
      {/* Tooltip */}
      {activePoint && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-slate-800 text-white text-xs border border-slate-700 shadow-md">
          <span className="font-medium text-slate-300">{activePoint.label}:</span>
          <span className="font-bold tabular-nums">
            {formatValue(activePoint.value)} {unit}
          </span>
          {activePoint.tooltipContext && (
            <span className="text-slate-400">({activePoint.tooltipContext})</span>
          )}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseLeave={() => {
          setActivePoint(null);
          setActiveIndex(null);
        }}
      >
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity="0.25" />
            <stop offset="100%" stopColor={fillColor} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {ticks.map((tick, i) => {
          const y = padTop + plotHeight - ((tick - effectiveMin) / range) * plotHeight;
          return (
            <g key={i}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray="3 3"
              />
              <text
                x={padLeft - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                {Math.round(tick * 10) / 10}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {points.length > 1 && (
          <path d={areaD} fill={`url(#grad-${color})`} />
        )}

        {/* Path line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* X-axis labels (render up to 6 labels evenly spaced) */}
        {points.map((p, i) => {
          const shouldShowLabel =
            data.length <= 6 ||
            i === 0 ||
            i === data.length - 1 ||
            i % Math.ceil(data.length / 5) === 0;

          return (
            <g key={i}>
              {shouldShowLabel && (
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono"
                >
                  {p.dataPoint.label}
                </text>
              )}

              {/* Interactive target & point */}
              <circle
                cx={p.x}
                cy={p.y}
                r={activeIndex === i ? 6 : 3.5}
                fill={activeIndex === i ? '#ffffff' : color}
                stroke={color}
                strokeWidth={activeIndex === i ? 3 : 1.5}
                className="transition-all"
              />

              {/* Invisible large touch target */}
              <rect
                x={p.x - plotWidth / (data.length * 2)}
                y={padTop}
                width={plotWidth / data.length || 30}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setActivePoint(p.dataPoint);
                  setActiveIndex(i);
                }}
                onTouchStart={() => {
                  setActivePoint(p.dataPoint);
                  setActiveIndex(i);
                }}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface BarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  unit?: string;
  formatValue?: (val: number) => string;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 180,
  color = '#06b6d4',
  unit = '',
  formatValue = (v) => v.toString(),
}) => {
  const [active, setActive] = useState<ChartDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl"
        style={{ height }}
      >
        No activity recorded
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);

  const width = 500;
  const padLeft = 35;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 26;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const barWidth = Math.min(36, Math.max(12, (plotWidth / data.length) * 0.65));

  return (
    <div className="relative w-full select-none">
      {active && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs shadow-md">
          <span className="text-slate-300">{active.label}:</span>
          <span className="font-bold tabular-nums">
            {formatValue(active.value)} {unit}
          </span>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <line
          x1={padLeft}
          y1={padTop + plotHeight}
          x2={width - padRight}
          y2={padTop + plotHeight}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
        />

        {data.map((d, i) => {
          const barHeight = Math.max(2, (d.value / maxVal) * plotHeight);
          const x = padLeft + (i + 0.5) * (plotWidth / data.length) - barWidth / 2;
          const y = padTop + plotHeight - barHeight;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                fill={color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                onMouseEnter={() => setActive(d)}
                onTouchStart={() => setActive(d)}
              />
              <text
                x={x + barWidth / 2}
                y={height - 6}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const ProgressRing: React.FC<{
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}> = ({
  percentage,
  size = 56,
  strokeWidth = 5,
  color = '#10b981',
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-800"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-[11px] font-bold tabular-nums text-slate-800 dark:text-slate-100">
        {label || `${Math.round(clamped)}%`}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BodyMeasurementEntry, UserSettings } from '../../types/fitness';
import { db } from '../../services/db';
import { calculateBMI, calculateWaistToHipRatio } from '../../services/calculations';
import { LineChart } from '../common/Charts';
import {
  Scale,
  Plus,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react';

interface BodyViewProps {
  measurements: BodyMeasurementEntry[];
  settings: UserSettings;
  onOpenBodyEditor: (entry?: BodyMeasurementEntry) => void;
  onRefresh: () => void;
}

export const BodyView: React.FC<BodyViewProps> = ({
  measurements,
  settings,
  onOpenBodyEditor,
  onRefresh,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<string>('weightKg');

  const handleDelete = (id: string, date: string) => {
    if (confirm(`Delete body measurement entry from ${new Date(date).toLocaleDateString()}?`)) {
      db.deleteMeasurement(id);
      onRefresh();
    }
  };

  const latest = measurements[0];
  const baseline = measurements[measurements.length - 1];

  const calculateChange = (current?: number | null, start?: number | null) => {
    if (current === undefined || current === null || start === undefined || start === null) {
      return null;
    }
    const delta = Math.round((current - start) * 10) / 10;
    const percent = start !== 0 ? Math.round(((current - start) / start) * 1000) / 10 : 0;
    return { delta, percent };
  };

  const weightChange = calculateChange(latest?.weightKg, baseline?.weightKg);
  const waistChange = calculateChange(latest?.waistCm, baseline?.waistCm);
  const chestChange = calculateChange(latest?.chestCm, baseline?.chestCm);
  const hipChange = calculateChange(latest?.hipCm, baseline?.hipCm);

  // Estimates
  const bmiEstimate = calculateBMI(latest?.weightKg, settings.userHeightCm);
  const whrEstimate = calculateWaistToHipRatio(latest?.waistCm, latest?.hipCm);

  // Prepare chart data for selected metric
  const sortedDesc = [...measurements].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = sortedDesc
    .filter((m) => {
      const val = (m as any)[selectedMetric];
      return val !== null && val !== undefined && typeof val === 'number' && val > 0;
    })
    .map((m) => ({
      label: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: (m as any)[selectedMetric] as number,
      tooltipContext: 'Measured value',
    }));

  const metricLabels: Record<string, { title: string; unit: string; color: string }> = {
    weightKg: { title: 'Weight', unit: 'kg', color: '#8b5cf6' },
    bodyFatPercentage: { title: 'Body Fat', unit: '%', color: '#ec4899' },
    waistCm: { title: 'Waist', unit: 'cm', color: '#10b981' },
    hipCm: { title: 'Hips', unit: 'cm', color: '#06b6d4' },
    chestCm: { title: 'Chest', unit: 'cm', color: '#f59e0b' },
    leftArmCm: { title: 'Left Arm', unit: 'cm', color: '#3b82f6' },
    rightArmCm: { title: 'Right Arm', unit: 'cm', color: '#3b82f6' },
    leftThighCm: { title: 'Left Thigh', unit: 'cm', color: '#6366f1' },
    rightThighCm: { title: 'Right Thigh', unit: 'cm', color: '#6366f1' },
    neckCm: { title: 'Neck', unit: 'cm', color: '#14b8a6' },
  };

  const currentMetricConfig = metricLabels[selectedMetric] || {
    title: selectedMetric,
    unit: 'cm',
    color: '#8b5cf6',
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Weight & Body Measurements
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Physical dimensions, circumference changes, and baseline comparisons
          </p>
        </div>

        <button
          onClick={() => onOpenBodyEditor()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Measurements</span>
        </button>
      </div>

      {/* Baseline Comparison Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Weight */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-xs text-slate-500">Weight</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest?.weightKg ? `${latest.weightKg} kg` : '--'}
          </div>
          {weightChange ? (
            <div className="flex items-center gap-1 text-xs mt-1">
              {weightChange.delta <= 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    {weightChange.delta} kg ({weightChange.percent}%)
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums">
                    +{weightChange.delta} kg (+{weightChange.percent}%)
                  </span>
                </>
              )}
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 mt-1 block">Baseline entry</span>
          )}
        </div>

        {/* Waist */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-xs text-slate-500">Waist Circumference</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest?.waistCm ? `${latest.waistCm} cm` : '--'}
          </div>
          {waistChange ? (
            <div className="flex items-center gap-1 text-xs mt-1">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                {waistChange.delta <= 0 ? '' : '+'}{waistChange.delta} cm ({waistChange.percent}%)
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 mt-1 block">Baseline entry</span>
          )}
        </div>

        {/* Chest */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-xs text-slate-500">Chest Circumference</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest?.chestCm ? `${latest.chestCm} cm` : '--'}
          </div>
          {chestChange ? (
            <div className="flex items-center gap-1 text-xs mt-1">
              <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {chestChange.delta <= 0 ? '' : '+'}{chestChange.delta} cm
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 mt-1 block">Baseline entry</span>
          )}
        </div>

        {/* Hips */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <span className="text-xs text-slate-500">Hip Circumference</span>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
            {latest?.hipCm ? `${latest.hipCm} cm` : '--'}
          </div>
          {hipChange ? (
            <div className="flex items-center gap-1 text-xs mt-1">
              <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {hipChange.delta <= 0 ? '' : '+'}{hipChange.delta} cm
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 mt-1 block">Baseline entry</span>
          )}
        </div>
      </div>

      {/* Calculated Estimates vs Measured Values Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <p className="font-semibold text-slate-900 dark:text-white">
            Calculated Estimates vs. Measured Values
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-slate-500 dark:text-slate-400">
            {bmiEstimate && (
              <span>
                <strong className="text-slate-700 dark:text-slate-200">BMI (Estimated):</strong> {bmiEstimate.value} ({bmiEstimate.label})
              </span>
            )}
            {whrEstimate && (
              <span>
                <strong className="text-slate-700 dark:text-slate-200">Waist-to-Hip Ratio (Estimated):</strong> {whrEstimate.value} ({whrEstimate.risk})
              </span>
            )}
            <span>
              Unrecorded dimensions are strictly preserved as unmeasured and never assumed to be zero.
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Trend Chart */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Metric Progression Trend: {currentMetricConfig.title}
            </h3>
            <p className="text-[11px] text-slate-400">
              Historical measurements recorded in {currentMetricConfig.unit}
            </p>
          </div>

          {/* Metric Selector Dropdown */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="weightKg">Weight (kg)</option>
            <option value="bodyFatPercentage">Body Fat (%)</option>
            <option value="waistCm">Waist (cm)</option>
            <option value="hipCm">Hips (cm)</option>
            <option value="chestCm">Chest (cm)</option>
            <option value="leftArmCm">Left Arm (cm)</option>
            <option value="rightArmCm">Right Arm (cm)</option>
            <option value="leftThighCm">Left Thigh (cm)</option>
            <option value="rightThighCm">Right Thigh (cm)</option>
            <option value="neckCm">Neck (cm)</option>
          </select>
        </div>

        <LineChart
          data={chartData}
          height={200}
          color={currentMetricConfig.color}
          fillColor={currentMetricConfig.color}
          unit={currentMetricConfig.unit}
          formatValue={(v) => v.toFixed(1)}
          emptyMessage={`No data recorded for ${currentMetricConfig.title}`}
        />
      </div>

      {/* Measurement History Table */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Measurement Log History ({measurements.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Weight</th>
                <th className="py-2 px-2">Body Fat</th>
                <th className="py-2 px-2">Waist</th>
                <th className="py-2 px-2">Hips</th>
                <th className="py-2 px-2">Chest</th>
                <th className="py-2 px-2">Arms (L/R)</th>
                <th className="py-2 px-2">Thighs (L/R)</th>
                <th className="py-2 px-2">Neck</th>
                <th className="py-2 px-2">Custom</th>
                <th className="py-2 px-2 w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {measurements.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-2 text-slate-900 dark:text-white font-semibold font-sans">
                    {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                  </td>
                  <td className="py-2 px-2 font-bold tabular-nums">
                    {entry.weightKg ? `${entry.weightKg} kg` : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 tabular-nums">
                    {entry.bodyFatPercentage ? `${entry.bodyFatPercentage}%` : '--'}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {entry.waistCm ? `${entry.waistCm} cm` : '--'}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {entry.hipCm ? `${entry.hipCm} cm` : '--'}
                  </td>
                  <td className="py-2 px-2 tabular-nums">
                    {entry.chestCm ? `${entry.chestCm} cm` : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 tabular-nums">
                    {entry.leftArmCm || entry.rightArmCm
                      ? `${entry.leftArmCm || '--'} / ${entry.rightArmCm || '--'}`
                      : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 tabular-nums">
                    {entry.leftThighCm || entry.rightThighCm
                      ? `${entry.leftThighCm || '--'} / ${entry.rightThighCm || '--'}`
                      : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 tabular-nums">
                    {entry.neckCm ? `${entry.neckCm} cm` : '--'}
                  </td>
                  <td className="py-2 px-2 text-slate-500 font-sans text-[11px]">
                    {entry.customMeasurements?.map((c) => `${c.name}: ${c.valueCm}cm`).join(', ') || '--'}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenBodyEditor(entry)}
                        className="p-1 text-slate-400 hover:text-purple-500 cursor-pointer"
                        title="Edit entry"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id, entry.date)}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

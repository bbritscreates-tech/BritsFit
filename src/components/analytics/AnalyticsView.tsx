import React, { useState } from 'react';
import {
  WorkoutSession,
  CardioSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
  GoalItem,
  ExerciseItem,
} from '../../types/fitness';
import { db } from '../../services/db';
import {
  formatDuration,
  formatPace,
  calculatePaceMinPerKm,
} from '../../services/calculations';
import { LineChart, BarChart } from '../common/Charts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface AnalyticsViewProps {
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  measurements: BodyMeasurementEntry[];
  habits: DailyHabitEntry[];
  goals: GoalItem[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  workouts,
  cardio,
  measurements,
  habits,
  goals,
}) => {
  const [exercisesLibrary] = useState<ExerciseItem[]>(db.getExercises());
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(
    exercisesLibrary[0]?.id || ''
  );
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<
    'exercises' | 'cardio' | 'body' | 'period_compare' | 'data_table'
  >('exercises');

  // Period Comparison states (Days)
  const [periodDays, setPeriodDays] = useState<number>(30);

  // Exercise Performance Over Time
  const selectedExercise = exercisesLibrary.find((e) => e.id === selectedExerciseId);

  const exerciseHistoryData: Array<{
    date: string;
    label: string;
    maxWeight: number;
    totalReps: number;
    longestHold: number;
    avgRepDuration: number;
  }> = [];

  [...workouts]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .forEach((w) => {
      const match = w.exercises.find((e) => e.exerciseId === selectedExerciseId);
      if (match && match.sets.length > 0) {
        let maxWeight = 0;
        let totalReps = 0;
        let longestHold = 0;
        let repDurationSum = 0;
        let repDurationCount = 0;

        match.sets.forEach((s) => {
          if (s.weightKg && s.weightKg > maxWeight) maxWeight = s.weightKg;
          totalReps += s.reps || 0;
          if (s.holdDurationSeconds && s.holdDurationSeconds > longestHold) {
            longestHold = s.holdDurationSeconds;
          }
          if (s.averageRepDurationSeconds && s.averageRepDurationSeconds > 0) {
            repDurationSum += s.averageRepDurationSeconds;
            repDurationCount++;
          }
        });

        exerciseHistoryData.push({
          date: w.date,
          label: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          maxWeight,
          totalReps,
          longestHold,
          avgRepDuration: repDurationCount > 0 ? Math.round((repDurationSum / repDurationCount) * 10) / 10 : 0,
        });
      }
    });

  const weightChartPoints = exerciseHistoryData.map((d) => ({
    label: d.label,
    value: selectedExercise?.isTimed ? d.longestHold : d.maxWeight || d.totalReps,
    tooltipContext: selectedExercise?.isTimed
      ? `${d.longestHold}s hold`
      : d.maxWeight > 0
      ? `${d.maxWeight} kg`
      : `${d.totalReps} total reps`,
  }));

  const repDurationChartPoints = exerciseHistoryData
    .filter((d) => d.avgRepDuration > 0)
    .map((d) => ({
      label: d.label,
      value: d.avgRepDuration,
      tooltipContext: `${d.avgRepDuration}s / rep`,
    }));

  // Period Comparison Math
  const now = new Date().getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const pAStart = now - periodDays * dayMs;
  const pBStart = now - periodDays * 2 * dayMs;

  const workoutsA = workouts.filter((w) => {
    const t = new Date(w.date).getTime();
    return t >= pAStart && t <= now;
  });
  const workoutsB = workouts.filter((w) => {
    const t = new Date(w.date).getTime();
    return t >= pBStart && t < pAStart;
  });

  const cardioA = cardio.filter((c) => {
    const t = new Date(c.date).getTime();
    return t >= pAStart && t <= now;
  });
  const cardioB = cardio.filter((c) => {
    const t = new Date(c.date).getTime();
    return t >= pBStart && t < pAStart;
  });

  const distA = cardioA.reduce((sum, c) => sum + c.distanceKm, 0);
  const distB = cardioB.reduce((sum, c) => sum + c.distanceKm, 0);

  const durationA = workoutsA.reduce((sum, w) => sum + w.totalDurationSeconds, 0);
  const durationB = workoutsB.reduce((sum, w) => sum + w.totalDurationSeconds, 0);

  const calcDelta = (valA: number, valB: number) => {
    const diff = valA - valB;
    const pct = valB !== 0 ? Math.round((diff / valB) * 100) : 0;
    return { diff, pct };
  };

  const distDelta = calcDelta(distA, distB);
  const workoutsDelta = calcDelta(workoutsA.length, workoutsB.length);
  const durationDelta = calcDelta(durationA, durationB);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Progress Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Interactive charts, period comparisons, and complete data records
          </p>
        </div>

        <button
          onClick={() => {
            const blob = new Blob([db.exportWorkoutsCSV()], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `BritsFit_Analytics_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Analysis Section Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveAnalysisTab('exercises')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
            activeAnalysisTab === 'exercises'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Exercise Performance
        </button>
        <button
          onClick={() => setActiveAnalysisTab('cardio')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
            activeAnalysisTab === 'cardio'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Cardio & Mileage
        </button>
        <button
          onClick={() => setActiveAnalysisTab('period_compare')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
            activeAnalysisTab === 'period_compare'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Period Comparison
        </button>
        <button
          onClick={() => setActiveAnalysisTab('data_table')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition cursor-pointer ${
            activeAnalysisTab === 'data_table'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Data Records Table
        </button>
      </div>

      {/* TAB 1: Exercise Performance */}
      {activeAnalysisTab === 'exercises' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Exercise to Analyze
              </label>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white min-w-64"
              >
                {exercisesLibrary.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{exerciseHistoryData.length} logged sessions recorded</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Weight or Hold over time */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {selectedExercise?.isTimed ? 'Hold Duration Trend (sec)' : 'Max Weight / Reps Trend'}
                </h3>
                <span className="text-[11px] text-slate-400">Progression</span>
              </div>
              <LineChart
                data={weightChartPoints}
                height={200}
                color="#10b981"
                fillColor="#10b981"
                unit={selectedExercise?.isTimed ? 's' : 'kg'}
                emptyMessage="No performance logged for this exercise yet"
              />
            </div>

            {/* Chart 2: Average Repetition Duration */}
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Average Repetition Duration (sec)
                </h3>
                <span className="text-[11px] text-slate-400">Tempo control</span>
              </div>
              <LineChart
                data={repDurationChartPoints}
                height={200}
                color="#06b6d4"
                fillColor="#06b6d4"
                unit="s"
                formatValue={(v) => `${v}s`}
                emptyMessage="No rep duration timings logged for this exercise"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Cardio & Mileage */}
      {activeAnalysisTab === 'cardio' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pace Improvement Across Sessions (min/km)
              </h3>
              <LineChart
                data={cardio.map((c) => ({
                  label: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  value: c.paceMinPerKm,
                  tooltipContext: `${formatPace(c.paceMinPerKm)} (${c.distanceKm.toFixed(1)} km)`,
                }))}
                height={200}
                color="#10b981"
                fillColor="#10b981"
                unit="min/km"
                formatValue={(v) => formatPace(v)}
                emptyMessage="No cardio sessions logged"
              />
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Session Distance Breakdown (km)
              </h3>
              <BarChart
                data={cardio.slice(0, 10).map((c) => ({
                  label: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  value: c.distanceKm,
                  tooltipContext: `${c.distanceKm.toFixed(1)} km`,
                }))}
                height={200}
                color="#06b6d4"
                unit="km"
                formatValue={(v) => `${v.toFixed(1)} km`}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Period Comparison */}
      {activeAnalysisTab === 'period_compare' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Comparison Timeframe:
            </span>
            <div className="flex items-center gap-1">
              {[7, 14, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(d)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    periodDays === d
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Last {d} Days vs Prior {d} Days
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Workouts Delta */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
              <span className="text-xs text-slate-500">Workouts Completed</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {workoutsA.length}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  vs {workoutsB.length} prior
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold font-mono">
                {workoutsDelta.diff >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{workoutsDelta.diff} sessions (+{workoutsDelta.pct}%)
                  </span>
                ) : (
                  <span className="text-rose-500">
                    {workoutsDelta.diff} sessions ({workoutsDelta.pct}%)
                  </span>
                )}
              </div>
            </div>

            {/* Cardio Mileage Delta */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
              <span className="text-xs text-slate-500">Cardio Mileage</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {distA.toFixed(1)} km
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  vs {distB.toFixed(1)} km prior
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold font-mono">
                {distDelta.diff >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{distDelta.diff.toFixed(1)} km (+{distDelta.pct}%)
                  </span>
                ) : (
                  <span className="text-rose-500">
                    {distDelta.diff.toFixed(1)} km ({distDelta.pct}%)
                  </span>
                )}
              </div>
            </div>

            {/* Training Duration Delta */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
              <span className="text-xs text-slate-500">Workout Duration</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {formatDuration(durationA)}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  vs {formatDuration(durationB)}
                </span>
              </div>
              <div className="mt-1 text-xs font-semibold font-mono">
                {durationDelta.diff >= 0 ? (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    +{formatDuration(durationDelta.diff)} (+{durationDelta.pct}%)
                  </span>
                ) : (
                  <span className="text-rose-500">
                    -{formatDuration(Math.abs(durationDelta.diff))} ({durationDelta.pct}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Raw Data Table */}
      {activeAnalysisTab === 'data_table' && (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Consolidated Records Table
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {workouts.length} workouts · {cardio.length} cardio · {measurements.length} measurements
            </span>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                <tr className="text-[10px] text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-2.5">Date</th>
                  <th className="py-2 px-2.5">Type</th>
                  <th className="py-2 px-2.5">Title / Details</th>
                  <th className="py-2 px-2.5">Volume / Distance</th>
                  <th className="py-2 px-2.5">Duration</th>
                  <th className="py-2 px-2.5">Effort</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {workouts.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-1.5 px-2.5 font-sans">
                      {new Date(w.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="py-1.5 px-2.5 text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                      Workout
                    </td>
                    <td className="py-1.5 px-2.5 font-sans">{w.name} ({w.exercises.length} ex)</td>
                    <td className="py-1.5 px-2.5 tabular-nums">
                      {w.exercises.reduce((s, e) => s + e.sets.length, 0)} sets
                    </td>
                    <td className="py-1.5 px-2.5 tabular-nums">{formatDuration(w.totalDurationSeconds)}</td>
                    <td className="py-1.5 px-2.5 tabular-nums">{w.overallEffort}/10</td>
                  </tr>
                ))}
                {cardio.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="py-1.5 px-2.5 font-sans">
                      {new Date(c.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                    </td>
                    <td className="py-1.5 px-2.5 text-cyan-600 dark:text-cyan-400 font-semibold font-sans">
                      Cardio
                    </td>
                    <td className="py-1.5 px-2.5 font-sans capitalize">{c.activityType.replace('_', ' ')}</td>
                    <td className="py-1.5 px-2.5 tabular-nums">{c.distanceKm.toFixed(2)} km</td>
                    <td className="py-1.5 px-2.5 tabular-nums">{formatDuration(c.durationSeconds)}</td>
                    <td className="py-1.5 px-2.5 tabular-nums">{c.effort}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

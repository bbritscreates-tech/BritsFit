import React, { useState } from 'react';
import {
  WorkoutSession,
  CardioSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
  GoalItem,
  DateRangePreset,
  UserSettings,
} from '../../types/fitness';
import {
  formatDuration,
  formatPace,
  isWithinDateRange,
  extractPersonalRecords,
  calculateBMI,
  calculateWaistToHipRatio,
} from '../../services/calculations';
import { LineChart, BarChart, ProgressRing } from '../common/Charts';
import {
  Dumbbell,
  Footprints,
  Scale,
  Sparkles,
  Trophy,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock,
  Calendar,
  Flame,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  measurements: BodyMeasurementEntry[];
  habits: DailyHabitEntry[];
  goals: GoalItem[];
  settings: UserSettings;
  onOpenWorkoutEditor: (session?: WorkoutSession) => void;
  onOpenCardioEditor: (session?: CardioSession) => void;
  onOpenBodyEditor: (entry?: BodyMeasurementEntry) => void;
  onOpenHabitEditor: (entry?: DailyHabitEntry) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  workouts,
  cardio,
  measurements,
  habits,
  goals,
  settings,
  onOpenWorkoutEditor,
  onOpenCardioEditor,
  onOpenBodyEditor,
  onOpenHabitEditor,
  onNavigateTab,
}) => {
  const [dateRange, setDateRange] = useState<DateRangePreset>('30d');

  // Filter datasets by selected range
  const filteredWorkouts = workouts.filter((w) => isWithinDateRange(w.date, dateRange));
  const filteredCardio = cardio.filter((c) => isWithinDateRange(c.date, dateRange));
  const filteredMeasurements = measurements.filter((m) => isWithinDateRange(m.date, dateRange));
  const filteredHabits = habits.filter((h) => isWithinDateRange(h.date, dateRange));

  // 1. Weight & Body summary
  const latestMeasurement = measurements[0];
  const startingMeasurement = measurements[measurements.length - 1];
  const startingWeight = settings.startingWeightKg || startingMeasurement?.weightKg || null;
  const currentWeight = latestMeasurement?.weightKg || null;
  const weightDelta =
    currentWeight && startingWeight
      ? Math.round((currentWeight - startingWeight) * 10) / 10
      : null;

  const bmiEstimate = calculateBMI(currentWeight, settings.userHeightCm);
  const whrEstimate = calculateWaistToHipRatio(
    latestMeasurement?.waistCm,
    latestMeasurement?.hipCm
  );

  // 2. Activity Totals
  const totalWorkouts = filteredWorkouts.length;
  const totalExerciseSeconds = filteredWorkouts.reduce(
    (sum, w) => sum + (w.totalDurationSeconds || 0),
    0
  );

  const totalCardioDistance = filteredCardio.reduce(
    (sum, c) => sum + (c.distanceKm || 0),
    0
  );
  const totalCardioSessions = filteredCardio.length;
  const totalCardioSeconds = filteredCardio.reduce(
    (sum, c) => sum + (c.durationSeconds || 0),
    0
  );

  // 3. Cardio PRs for standard distances
  const personalRecords = extractPersonalRecords(workouts, cardio);
  const standardRuns = [
    { label: '1 km', pr: personalRecords.find((r) => r.id === 'cardio-1 km') },
    { label: '3 km', pr: personalRecords.find((r) => r.id === 'cardio-3 km') },
    { label: '5 km', pr: personalRecords.find((r) => r.id === 'cardio-5 km') },
    { label: '10 km', pr: personalRecords.find((r) => r.id === 'cardio-10 km') },
  ];

  // 4. Wellbeing averages
  const validWater = filteredHabits.map((h) => h.waterLitres).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgWater = validWater.length > 0 ? (validWater.reduce((a, b) => a + b, 0) / validWater.length).toFixed(1) : null;

  const validSleep = filteredHabits.map((h) => h.sleepHours).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgSleep = validSleep.length > 0 ? (validSleep.reduce((a, b) => a + b, 0) / validSleep.length).toFixed(1) : null;

  const validEnergy = filteredHabits.map((h) => h.energyRating).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgEnergy = validEnergy.length > 0 ? (validEnergy.reduce((a, b) => a + b, 0) / validEnergy.length).toFixed(1) : null;

  const validStress = filteredHabits.map((h) => h.stressRating).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgStress = validStress.length > 0 ? (validStress.reduce((a, b) => a + b, 0) / validStress.length).toFixed(1) : null;

  // Active Goals
  const activeGoals = goals.filter((g) => g.status === 'active').slice(0, 4);

  // Cardio Chart Data
  const cardioChartData = [...filteredCardio]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((c) => ({
      label: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: c.distanceKm,
      tooltipContext: `${formatDuration(c.durationSeconds)} @ ${formatPace(c.paceMinPerKm)}`,
    }));

  // Weight Trend Data
  const weightChartData = [...filteredMeasurements]
    .filter((m) => m.weightKg !== null && m.weightKg !== undefined && m.weightKg > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((m) => ({
      label: new Date(m.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: m.weightKg!,
      tooltipContext: 'Morning weigh-in',
    }));

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Top Banner & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Personal Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Consolidated exercise logs, cardio progress, body metrics, and wellbeing
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto self-start sm:self-auto max-w-full">
          {(['7d', '30d', '90d', '6m', '1y', 'all'] as DateRangePreset[]).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                dateRange === range
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {range === '7d'
                ? '7D'
                : range === '30d'
                ? '30D'
                : range === '90d'
                ? '90D'
                : range === '6m'
                ? '6M'
                : range === '1y'
                ? '1Y'
                : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Buttons (Thumb friendly) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => onOpenWorkoutEditor()}
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-[#1677E8]/50 hover:bg-[#1677E8]/5 transition text-left cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-[#1677E8]/10 text-[#1677E8] shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#1677E8]">
              + Workout
            </span>
            <span className="text-[10px] text-slate-400">Sets &amp; Reps</span>
          </div>
        </button>

        <button
          onClick={() => onOpenCardioEditor()}
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-[#12B8C7]/50 hover:bg-[#12B8C7]/5 transition text-left cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-[#12B8C7]/10 text-[#12B8C7] shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#12B8C7]">
              + Run / Walk
            </span>
            <span className="text-[10px] text-slate-400">Cardio Log</span>
          </div>
        </button>

        <button
          onClick={() => onOpenBodyEditor()}
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-purple-500/50 hover:bg-purple-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400">
              + Body Metric
            </span>
            <span className="text-[10px] text-slate-400">Weight & Size</span>
          </div>
        </button>

        <button
          onClick={() => onOpenHabitEditor()}
          className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-amber-500/50 hover:bg-amber-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400">
              + Wellbeing
            </span>
            <span className="text-[10px] text-slate-400">Sleep & Water</span>
          </div>
        </button>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Weight & Change */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Current Weight</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {currentWeight ? `${currentWeight} kg` : '--'}
            </div>
            {weightDelta !== null && (
              <div className="flex items-center gap-1 mt-1 text-xs">
                {weightDelta <= 0 ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {Math.abs(weightDelta)} kg loss
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                      +{weightDelta} kg gain
                    </span>
                  </>
                )}
                <span className="text-slate-400">· from start</span>
              </div>
            )}
            {bmiEstimate && (
              <div className="text-[10px] text-slate-400 mt-1">
                BMI: {bmiEstimate.value} ({bmiEstimate.label}) · estimated
              </div>
            )}
          </div>
        </div>

        {/* Metric 2: Workouts Completed */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Workouts Completed</span>
            <Dumbbell className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalWorkouts}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {formatDuration(totalExerciseSeconds)}
              </span>
              <span> total training</span>
            </div>
          </div>
        </div>

        {/* Metric 3: Cardio Mileage */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Cardio Distance</span>
            <Footprints className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalCardioDistance.toFixed(1)} km
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                {totalCardioSessions} sessions
              </span>
              <span> · {formatDuration(totalCardioSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Wellbeing Consistency */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Daily Wellbeing</span>
            <Sparkles className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span>Avg Sleep:</span>
              <span className="font-mono tabular-nums">{avgSleep ? `${avgSleep}h` : '--'}</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center justify-between mt-0.5">
              <span>Avg Water:</span>
              <span className="font-mono tabular-nums">{avgWater ? `${avgWater}L` : '--'}</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Energy: {avgEnergy || '--'} / 5 · Stress: {avgStress || '--'} / 5
            </div>
          </div>
        </div>
      </div>

      {/* Best Times for Standard Running Distances */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Best Times for Common Distances
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('cardio')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Cardio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {standardRuns.map((sr) => (
            <div
              key={sr.label}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60"
            >
              <span className="text-[11px] text-slate-400 block font-medium">{sr.label} Personal Best</span>
              {sr.pr ? (
                <>
                  <span className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5 block">
                    {sr.pr.value}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                    {sr.pr.context}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic block mt-1">No recorded run</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2-Column Trends & Goal Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cardio Mileage Chart */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Walking & Running Distance
              </h3>
              <p className="text-[11px] text-slate-400">Kilometres per logged session</p>
            </div>
            <button
              onClick={() => onNavigateTab('cardio')}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Details →
            </button>
          </div>
          <LineChart
            data={cardioChartData}
            height={190}
            color="#06b6d4"
            fillColor="#06b6d4"
            unit="km"
            formatValue={(v) => v.toFixed(2)}
            emptyMessage="No cardio sessions in this period"
          />
        </div>

        {/* Weight Progression Chart */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Weight Trend
              </h3>
              <p className="text-[11px] text-slate-400">Recorded weigh-ins (kg)</p>
            </div>
            <button
              onClick={() => onNavigateTab('body')}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Measurements →
            </button>
          </div>
          <LineChart
            data={weightChartData}
            height={190}
            color="#8b5cf6"
            fillColor="#8b5cf6"
            unit="kg"
            formatValue={(v) => v.toFixed(1)}
            emptyMessage="No body weigh-ins in this period"
          />
        </div>
      </div>

      {/* Active Goals & Recent PRs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Active Goals
            </h3>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              View All Goals →
            </button>
          </div>

          <div className="space-y-2.5">
            {activeGoals.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No active goals. Set your targets in the Goals tab!
              </div>
            ) : (
              activeGoals.map((goal) => {
                let progressPercent = 0;
                if (goal.isLowerBetter) {
                  const totalDiff = goal.startingValue - goal.targetValue;
                  const currentDiff = goal.startingValue - goal.currentValue;
                  progressPercent = totalDiff !== 0 ? Math.round((currentDiff / totalDiff) * 100) : 0;
                } else {
                  const totalDiff = goal.targetValue - goal.startingValue;
                  const currentDiff = goal.currentValue - goal.startingValue;
                  progressPercent = totalDiff !== 0 ? Math.round((currentDiff / totalDiff) * 100) : 0;
                }
                const clamped = Math.min(100, Math.max(0, progressPercent));

                return (
                  <div
                    key={goal.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-900 dark:text-white truncate">
                          {goal.title}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {clamped}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${clamped}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span>Current: {goal.currentValue} {goal.unit}</span>
                        <span>Target: {goal.targetValue} {goal.unit}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Achievements & Personal Records */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Personal Records & Achievements
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {personalRecords.length} Total PRs
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {personalRecords.slice(0, 5).map((pr) => (
              <div
                key={pr.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                    {pr.title}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {pr.date ? new Date(pr.date).toLocaleDateString() : 'Baseline'} · {pr.context || pr.metric}
                  </span>
                </div>
                <span className="font-mono font-bold text-sm text-amber-500 tabular-nums shrink-0">
                  {pr.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

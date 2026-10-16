import React, { useState } from 'react';
import { DailyHabitEntry } from '../../types/fitness';
import { db } from '../../services/db';
import { LineChart, BarChart } from '../common/Charts';
import {
  Sparkles,
  Plus,
  Moon,
  Droplet,
  Zap,
  Smile,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Calendar,
  Edit2,
  Trash2,
  Info,
} from 'lucide-react';

interface HabitsViewProps {
  habits: DailyHabitEntry[];
  onOpenHabitEditor: (entry?: DailyHabitEntry, date?: string) => void;
  onRefresh: () => void;
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onOpenHabitEditor,
  onRefresh,
}) => {
  const [selectedDaysCount, setSelectedDaysCount] = useState<number>(14);

  const handleDelete = (id: string, date: string) => {
    if (confirm(`Delete wellbeing log for ${date}?`)) {
      db.deleteHabit(id);
      onRefresh();
    }
  };

  const sortedHabits = [...habits].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentHabits = sortedHabits.slice(-selectedDaysCount);

  // Sleep chart data
  const sleepChartData = recentHabits
    .filter((h) => h.sleepHours !== null && h.sleepHours !== undefined && h.sleepHours > 0)
    .map((h) => ({
      label: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: h.sleepHours!,
      tooltipContext: 'Sleep duration',
    }));

  // Water chart data
  const waterChartData = recentHabits
    .filter((h) => h.waterLitres !== null && h.waterLitres !== undefined && h.waterLitres > 0)
    .map((h) => ({
      label: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: h.waterLitres!,
      tooltipContext: 'Hydration',
    }));

  // Energy vs Stress trend
  const energyData = recentHabits
    .filter((h) => h.energyRating !== null && h.energyRating !== undefined)
    .map((h) => ({
      label: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: h.energyRating!,
      tooltipContext: 'Energy (1-5)',
    }));

  // Vape-free days count
  const vapeFreeCount = habits.filter((h) => h.isVapeFree).length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Daily Habits & Wellbeing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log hydration, sleep, subjective energy, soreness, and recovery
          </p>
        </div>

        <button
          onClick={() => onOpenHabitEditor()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-amber-600 hover:bg-amber-500 text-white shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Daily Wellbeing</span>
        </button>
      </div>

      {/* Descriptive Correlation Disclaimer Banner */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-white">
            Descriptive Observation Rule
          </p>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Trends and correlations between sleep, water, and energy are presented purely as descriptive observations of your recorded data, without claiming that one variable causes another.
          </p>
        </div>
      </div>

      {/* Top Habit Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Logged Nights</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {habits.filter((h) => h.sleepHours).length} days
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Hydration Logs</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {habits.filter((h) => h.waterLitres).length} days
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Vape-Free Days</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {vapeFreeCount} days
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 block">Rest Days Logged</span>
            <span className="text-xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
              {habits.filter((h) => h.isRestDay).length} days
            </span>
          </div>
        </div>
      </div>

      {/* Charts: Sleep Trends & Water Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Sleep Duration (Hours)
            </h3>
            <span className="text-[11px] text-slate-400">Nightly logs</span>
          </div>
          <LineChart
            data={sleepChartData}
            height={180}
            color="#6366f1"
            fillColor="#6366f1"
            unit="hrs"
            formatValue={(v) => v.toFixed(1)}
            emptyMessage="No sleep entries logged yet"
          />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Daily Water Intake (Litres)
            </h3>
            <span className="text-[11px] text-slate-400">Hydration volume</span>
          </div>
          <LineChart
            data={waterChartData}
            height={180}
            color="#06b6d4"
            fillColor="#06b6d4"
            unit="L"
            formatValue={(v) => v.toFixed(1)}
            emptyMessage="No hydration entries logged yet"
          />
        </div>
      </div>

      {/* History Log */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Daily Log Entries ({habits.length})
        </h3>

        <div className="space-y-2.5">
          {habits.map((entry) => (
            <div
              key={entry.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {new Date(entry.date + 'T12:00:00').toLocaleDateString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  {entry.isRestDay && (
                    <span className="text-[10px] text-amber-500 font-medium">· Rest Day</span>
                  )}
                  {entry.isVapeFree && (
                    <span className="text-[10px] text-emerald-500 font-medium">· Vape-Free</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  {entry.sleepHours && <span>Sleep: {entry.sleepHours}h</span>}
                  {entry.waterLitres && <span>Water: {entry.waterLitres}L</span>}
                  {entry.energyRating && <span>Energy: {entry.energyRating}/5</span>}
                  {entry.moodRating && <span>Mood: {entry.moodRating}/5</span>}
                  {entry.stressRating && <span>Stress: {entry.stressRating}/5</span>}
                  {entry.muscleSoreness !== null && entry.muscleSoreness !== undefined && (
                    <span>Soreness: {entry.muscleSoreness}/10</span>
                  )}
                  {entry.stepCount && <span>{entry.stepCount.toLocaleString()} steps</span>}
                </div>

                {entry.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic mt-1 font-sans">
                    "{entry.notes}"
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => onOpenHabitEditor(entry)}
                  className="p-1.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                  title="Edit entry"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(entry.id, entry.date)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

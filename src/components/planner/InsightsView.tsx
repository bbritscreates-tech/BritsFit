import React, { useState } from 'react';
import {
  PlannerTask,
  PlannedActivity,
  WorkoutSession,
  CardioSession,
  DailyHabitEntry,
  GoalItem,
  FocusSession,
} from '../../types/fitness';
import {
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  CheckCircle2,
  Clock,
  Sparkles,
  Trophy,
  Droplet,
  Flame,
} from 'lucide-react';
import { formatDuration } from '../../services/calculations';

interface InsightsViewProps {
  tasks: PlannerTask[];
  plannedActivities: PlannedActivity[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  habits: DailyHabitEntry[];
  goals: GoalItem[];
  focusSessions: FocusSession[];
}

export const InsightsView: React.FC<InsightsViewProps> = ({
  tasks,
  plannedActivities,
  workouts,
  cardio,
  habits,
  goals,
  focusSessions,
}) => {
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, -1 = last week, etc.

  // Calculate start (Monday) and end (Sunday) of the selected week
  const getSelectedWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.setDate(diff + weekOffset * 7));
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startYmd = monday.toISOString().slice(0, 10);
    const endYmd = sunday.toISOString().slice(0, 10);

    return { monday, sunday, startYmd, endYmd };
  };

  const { monday, sunday, startYmd, endYmd } = getSelectedWeekRange();

  // Filter records within this week range
  const weekPlanned = plannedActivities.filter((a) => a.date >= startYmd && a.date <= endYmd);
  const weekCompletedWorkouts = workouts.filter(
    (w) => w.date.slice(0, 10) >= startYmd && w.date.slice(0, 10) <= endYmd
  );
  const weekCompletedCardio = cardio.filter(
    (c) => c.date.slice(0, 10) >= startYmd && c.date.slice(0, 10) <= endYmd
  );
  const weekTasks = tasks.filter((t) => t.dueDate && t.dueDate >= startYmd && t.dueDate <= endYmd);
  const weekCompletedTasks = tasks.filter(
    (t) => t.status === 'completed' && t.completedAt && t.completedAt.slice(0, 10) >= startYmd && t.completedAt.slice(0, 10) <= endYmd
  );
  const weekHabits = habits.filter((h) => h.date >= startYmd && h.date <= endYmd);
  const weekFocus = focusSessions.filter((f) => f.date >= startYmd && f.date <= endYmd);

  // Computations
  const totalWorkoutDurationSeconds = weekCompletedWorkouts.reduce(
    (acc, w) => acc + (w.totalDurationSeconds || 0),
    0
  );
  const totalCardioDistanceKm = weekCompletedCardio.reduce(
    (acc, c) => acc + (c.distanceKm || 0),
    0
  );
  const totalCardioSeconds = weekCompletedCardio.reduce(
    (acc, c) => acc + (c.durationSeconds || 0),
    0
  );
  const totalFocusMinutes = weekFocus.reduce((acc, f) => acc + (f.actualMinutes || 0), 0);

  // Overdue tasks calculation for this week
  const todayYmd = new Date().toISOString().slice(0, 10);
  const overdueCount = weekTasks.filter((t) => t.status !== 'completed' && t.dueDate! < todayYmd).length;

  // Average sleep & water
  const sleepEntries = weekHabits.map((h) => h.sleepHours).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgSleep = sleepEntries.length > 0 ? (sleepEntries.reduce((a, b) => a + b, 0) / sleepEntries.length).toFixed(1) : null;

  const waterEntries = weekHabits.map((h) => h.waterLitres).filter((v): v is number => v !== null && v !== undefined && v > 0);
  const avgWater = waterEntries.length > 0 ? (waterEntries.reduce((a, b) => a + b, 0) / waterEntries.length).toFixed(1) : null;

  const restDays = weekHabits.filter((h) => h.isRestDay).length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header & Week Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#1677E8]" />
            Weekly Insights &amp; Reviews
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Holistic weekly summaries across workouts, running, task completion, and wellness
          </p>
        </div>

        {/* Week navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold px-2 text-slate-800 dark:text-slate-200">
            {monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} –{' '}
            {sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            {weekOffset === 0 && ' (This Week)'}
          </span>

          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Workouts */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Strength Workouts</span>
            <Dumbbell className="w-4 h-4 text-[#1677E8]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {weekCompletedWorkouts.length}
            <span className="text-xs text-slate-400 font-sans font-medium ml-1">
              / {weekPlanned.filter((p) => !['run', 'walk', 'treadmill'].includes(p.activityType)).length} planned
            </span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {formatDuration(totalWorkoutDurationSeconds)} total time
          </span>
        </div>

        {/* Cardio */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Cardio &amp; Distance</span>
            <Footprints className="w-4 h-4 text-[#12B8C7]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalCardioDistanceKm.toFixed(1)} <span className="text-xs font-sans">km</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {weekCompletedCardio.length} sessions ({formatDuration(totalCardioSeconds)})
          </span>
        </div>

        {/* Tasks Completed */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Tasks Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {weekCompletedTasks.length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {overdueCount > 0 ? `${overdueCount} need rescheduling` : 'Zero overdue items'}
          </span>
        </div>

        {/* Focus Time */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Focus Deep Work</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalFocusMinutes} <span className="text-xs font-sans">mins</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {weekFocus.length} Pomodoro sessions logged
          </span>
        </div>
      </div>

      {/* Narrative Factual Summary Card */}
      <div className="p-5 rounded-3xl border border-[#1677E8]/30 bg-gradient-to-br from-[#102B55]/5 to-[#1677E8]/10 dark:from-[#102B55]/30 dark:to-[#1677E8]/20 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#1677E8]" />
          Weekly Summary &amp; Training Balance
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl">
          During this week ({monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}), you logged{' '}
          <strong className="text-slate-900 dark:text-white">{weekCompletedWorkouts.length} strength sessions</strong> and covered{' '}
          <strong className="text-slate-900 dark:text-white">{totalCardioDistanceKm.toFixed(1)} km</strong> of cardio. You completed{' '}
          <strong className="text-slate-900 dark:text-white">{weekCompletedTasks.length} general tasks</strong>.
          {restDays > 0 ? ` You dedicated ${restDays} days to active recovery.` : ''}
          {avgSleep ? ` Average sleep was logged at ${avgSleep} hours.` : ''}
          {avgWater ? ` Average daily hydration reached ${avgWater}L.` : ''}
        </p>
      </div>

      {/* Wellness & Habits Consistency Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#1677E8]" />
            Sleep Consistency
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {avgSleep ? `${avgSleep} hrs/night` : 'No sleep data'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Targeting 7.5–8.5 hours optimizes muscular repair and nervous system recovery.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
            <Droplet className="w-4 h-4 text-blue-500" />
            Hydration Average
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {avgWater ? `${avgWater} L/day` : 'No hydration data'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Consistent water intake sustains joint lubrication and training endurance.
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Active Recovery Days
          </span>
          <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {restDays} {restDays === 1 ? 'day' : 'days'}
          </span>
          <p className="text-[11px] text-slate-400 mt-1">
            Rest and mobility are vital components of athletic adaptation, not missed workouts.
          </p>
        </div>
      </div>
    </div>
  );
};

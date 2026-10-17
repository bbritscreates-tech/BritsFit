import React, { useState } from 'react';
import {
  PlannerTask,
  PlannedActivity,
  WorkoutSession,
  CardioSession,
  DailyHabitEntry,
  PersonalNote,
  UserSettings,
  MyDayCardConfig,
} from '../../types/fitness';
import { db } from '../../services/db';
import {
  Sun,
  Dumbbell,
  Footprints,
  CheckSquare,
  Calendar,
  Droplet,
  Sparkles,
  Clock,
  BookOpen,
  Plus,
  Play,
  Check,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';

interface MyDayViewProps {
  tasks: PlannerTask[];
  plannedActivities: PlannedActivity[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  habits: DailyHabitEntry[];
  notes: PersonalNote[];
  settings: UserSettings;
  onOpenTaskEditor: (task?: PlannerTask, initialDate?: string) => void;
  onOpenActivityModal: (activity?: PlannedActivity, initialDate?: string) => void;
  onOpenWorkoutEditor: (session?: WorkoutSession) => void;
  onOpenCardioEditor: (session?: CardioSession) => void;
  onOpenNoteEditor: (note?: PersonalNote) => void;
  onOpenHabitEditor: (habit?: DailyHabitEntry, date?: string) => void;
  onOpenFocusTimer: (taskId?: string) => void;
  onOpenSmartPlanner: () => void;
  onOpenCustomizeCards: () => void;
  onStartPlannedWorkout: (activity: PlannedActivity) => void;
  onStartPlannedCardio: (activity: PlannedActivity) => void;
  onRefresh: () => void;
}

export const MyDayView: React.FC<MyDayViewProps> = ({
  tasks,
  plannedActivities,
  workouts,
  cardio,
  habits,
  notes,
  settings,
  onOpenTaskEditor,
  onOpenActivityModal,
  onOpenWorkoutEditor,
  onOpenCardioEditor,
  onOpenNoteEditor,
  onOpenHabitEditor,
  onOpenFocusTimer,
  onOpenSmartPlanner,
  onOpenCustomizeCards,
  onStartPlannedWorkout,
  onStartPlannedCardio,
  onRefresh,
}) => {
  const [showCompleted, setShowCompleted] = useState(false);

  const todayYmd = new Date().toISOString().slice(0, 10);
  const cardConfig: MyDayCardConfig = settings.plannerPreferences?.myDayCards || {
    plannedWorkouts: true,
    plannedCardio: true,
    tasks: true,
    appointments: true,
    water: true,
    habits: true,
    focusTimer: true,
    quickNotes: true,
  };

  // Today's records
  const todayHabit = habits.find((h) => h.date === todayYmd) || {
    id: `habit-${todayYmd}`,
    date: todayYmd,
    waterLitres: 0,
    sleepHours: 0,
    isRestDay: false,
    isVapeFree: true,
    createdAt: new Date().toISOString(),
  };

  // 1. Workouts scheduled for today
  const todayPlannedWorkouts = plannedActivities.filter(
    (a) => a.date === todayYmd && !['run', 'walk', 'treadmill'].includes(a.activityType)
  );

  // 2. Cardio scheduled for today
  const todayPlannedCardio = plannedActivities.filter(
    (a) => a.date === todayYmd && ['run', 'walk', 'treadmill', 'cardio'].includes(a.activityType)
  );

  // 3. Appointments scheduled for today
  const todayAppointments = plannedActivities.filter(
    (a) => a.date === todayYmd && a.activityType === 'appointment'
  );

  // 4. Tasks due today
  const todayTasks = tasks.filter((t) => t.dueDate === todayYmd && t.status !== 'completed');
  const timedTasks = todayTasks.filter((t) => !!t.startTime);
  const unscheduledTasks = todayTasks.filter((t) => !t.startTime);

  // 5. Completed items today
  const completedTasksToday = tasks.filter((t) => t.status === 'completed' && t.dueDate === todayYmd);
  const completedActsToday = plannedActivities.filter((a) => a.status === 'completed' && a.date === todayYmd);

  // Quick Water logging (+250ml or +500ml)
  const handleAddWater = (litres: number) => {
    const cur = todayHabit.waterLitres || 0;
    const updated: DailyHabitEntry = {
      ...todayHabit,
      waterLitres: Math.round((cur + litres) * 10) / 10,
    };
    db.saveHabit(updated);
    onRefresh();
  };

  // Chronological agenda items (timed activities + timed tasks)
  const chronologicalAgenda = [
    ...todayPlannedWorkouts.map((w) => ({
      id: w.id,
      kind: 'workout' as const,
      time: w.startTime || '09:00',
      title: w.title,
      subtitle: `${w.durationMinutes || 60}m session`,
      item: w,
      completed: w.status === 'completed',
    })),
    ...todayPlannedCardio.map((c) => ({
      id: c.id,
      kind: 'cardio' as const,
      time: c.startTime || '08:00',
      title: c.title,
      subtitle: `${c.targetDistanceKm ? `${c.targetDistanceKm} km` : ''} ${c.cardioActivityType || 'Cardio'}`,
      item: c,
      completed: c.status === 'completed',
    })),
    ...timedTasks.map((t) => ({
      id: t.id,
      kind: 'task' as const,
      time: t.startTime || '12:00',
      title: t.title,
      subtitle: `${t.estimatedDurationMinutes || 30}m • ${t.category}`,
      item: t,
      completed: t.status === 'completed',
    })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const waterTarget = 2.8;
  const currentWater = todayHabit.waterLitres || 0;
  const waterProgress = Math.min(100, Math.round((currentWater / waterTarget) * 100));

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Sun className="w-6 h-6 text-amber-500 fill-amber-500" />
              My Day
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1677E8]/10 text-[#1677E8] dark:text-[#38E1EE]">
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Personalised daily command center for workouts, tasks, hydration, and wellbeing
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenSmartPlanner}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition cursor-pointer"
            title="Generate smart daily schedule proposal"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            <span>Smart Planner</span>
          </button>

          <button
            onClick={onOpenCustomizeCards}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#1677E8]" />
            <span>Customize</span>
          </button>
        </div>
      </div>

      {/* Quick Action Button Strip (Thumb-friendly) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => onOpenTaskEditor(undefined, todayYmd)}
          className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-[#1677E8]/50 hover:bg-[#1677E8]/5 transition text-left cursor-pointer group shadow-xs"
        >
          <div className="p-2 rounded-xl bg-[#1677E8]/10 text-[#1677E8] shrink-0">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#1677E8] truncate">
              + Task
            </span>
            <span className="text-[10px] text-slate-400">Add to today</span>
          </div>
        </button>

        <button
          onClick={() => onOpenActivityModal(undefined, todayYmd)}
          className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-[#12B8C7]/50 hover:bg-[#12B8C7]/5 transition text-left cursor-pointer group shadow-xs"
        >
          <div className="p-2 rounded-xl bg-[#12B8C7]/10 text-[#12B8C7] shrink-0">
            <Dumbbell className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#12B8C7] truncate">
              + Workout
            </span>
            <span className="text-[10px] text-slate-400">Schedule lift</span>
          </div>
        </button>

        <button
          onClick={() => onOpenCardioEditor()}
          className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition text-left cursor-pointer group shadow-xs"
        >
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 shrink-0">
            <Footprints className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-cyan-500 truncate">
              + Cardio
            </span>
            <span className="text-[10px] text-slate-400">Run or walk</span>
          </div>
        </button>

        <button
          onClick={() => handleAddWater(0.25)}
          className="flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-blue-500/50 hover:bg-blue-500/5 transition text-left cursor-pointer group shadow-xs"
        >
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Droplet className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-blue-500 truncate">
              + 250ml Water
            </span>
            <span className="text-[10px] text-slate-400">{currentWater}L logged</span>
          </div>
        </button>

        <button
          onClick={() => onOpenNoteEditor()}
          className="col-span-2 sm:col-span-1 flex items-center gap-2 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-purple-500/50 hover:bg-purple-500/5 transition text-left cursor-pointer group shadow-xs"
        >
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-500 truncate">
              + Quick Note
            </span>
            <span className="text-[10px] text-slate-400">Daily reflection</span>
          </div>
        </button>
      </div>

      {/* Main Grid: Left Column (Agenda & Workouts) + Right Column (Tasks & Wellbeing) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols wide on desktop): Chronological Agenda & Workouts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card: Chronological Agenda for Scheduled Items */}
          <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#1677E8]" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                  Today's Chronological Agenda
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                {chronologicalAgenda.length} scheduled slots
              </span>
            </div>

            {chronologicalAgenda.length === 0 ? (
              <div className="text-center py-10 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No scheduled activities with specific times yet today.
                </p>
                <button
                  onClick={() => onOpenActivityModal(undefined, todayYmd)}
                  className="mt-3 px-3.5 py-1.5 rounded-xl bg-[#1677E8] text-white text-xs font-bold hover:bg-[#1361BD] transition"
                >
                  Schedule Today’s Workout
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {chronologicalAgenda.map((slot) => (
                  <div
                    key={`${slot.kind}-${slot.id}`}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                      slot.completed
                        ? 'opacity-65 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40'
                        : slot.kind === 'workout'
                        ? 'border-[#1677E8]/40 bg-[#1677E8]/5 dark:bg-[#1677E8]/10'
                        : slot.kind === 'cardio'
                        ? 'border-[#12B8C7]/40 bg-[#12B8C7]/5 dark:bg-[#12B8C7]/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 text-center shrink-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block font-mono">
                          {slot.time}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {slot.kind}
                        </span>
                      </div>

                      <div className="w-px h-8 bg-slate-200 dark:border-slate-800" />

                      <div>
                        <span
                          className={`font-bold text-xs text-slate-900 dark:text-white block ${
                            slot.completed ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {slot.title}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {slot.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {!slot.completed && slot.kind === 'workout' && (
                        <button
                          onClick={() => onStartPlannedWorkout(slot.item as PlannedActivity)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {!slot.completed && slot.kind === 'cardio' && (
                        <button
                          onClick={() => onStartPlannedCardio(slot.item as PlannedActivity)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#12B8C7] hover:bg-[#0E94A0] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Start</span>
                        </button>
                      )}

                      {!slot.completed && slot.kind === 'task' && (
                        <button
                          onClick={() => {
                            db.toggleTaskComplete(slot.item.id);
                            onRefresh();
                          }}
                          className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition cursor-pointer"
                          title="Mark complete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {slot.completed && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10">
                          Done
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Unscheduled / Flexible Tasks */}
          {cardConfig.tasks && (
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#1677E8]" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Today's Unscheduled Tasks
                  </h3>
                </div>
                <button
                  onClick={() => onOpenTaskEditor(undefined, todayYmd)}
                  className="text-xs font-bold text-[#1677E8] hover:underline"
                >
                  + Add Task
                </button>
              </div>

              {unscheduledTasks.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 dark:text-slate-400">
                  All today's tasks are either scheduled or completed!
                </div>
              ) : (
                <div className="space-y-2">
                  {unscheduledTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onOpenTaskEditor(task)}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-[#1677E8]/40 transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            db.toggleTaskComplete(task.id);
                            onRefresh();
                          }}
                          className="w-5 h-5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-emerald-500 flex items-center justify-center shrink-0"
                        >
                          {task.status === 'completed' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {task.category} • {task.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenFocusTimer(task.id);
                        }}
                        className="p-1.5 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-500/10 transition"
                        title="Start focus block"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Hydration, Wellbeing, Completed Items */}
        <div className="space-y-6">
          {/* Card: Hydration Tracker */}
          {cardConfig.water && (
            <div className="p-5 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent dark:from-blue-500/10 dark:to-slate-900/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
                  <Droplet className="w-4 h-4 fill-current" />
                  <span>Hydration Target</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentWater} / {waterTarget} L
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-[#12B8C7] rounded-full transition-all duration-500"
                  style={{ width: `${waterProgress}%` }}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => handleAddWater(0.25)}
                  className="flex-1 py-1.5 rounded-xl border border-blue-300 dark:border-blue-900/50 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 transition cursor-pointer"
                >
                  +250 ml
                </button>
                <button
                  onClick={() => handleAddWater(0.5)}
                  className="flex-1 py-1.5 rounded-xl border border-blue-300 dark:border-blue-900/50 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 transition cursor-pointer"
                >
                  +500 ml
                </button>
              </div>
            </div>
          )}

          {/* Card: Daily Wellbeing Snapshot */}
          {cardConfig.habits && (
            <div className="p-5 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
                  <Sparkles className="w-4 h-4 text-[#12B8C7]" />
                  <span>Daily Wellbeing</span>
                </div>
                <button
                  onClick={() => onOpenHabitEditor(todayHabit, todayYmd)}
                  className="text-xs font-bold text-[#1677E8] hover:underline"
                >
                  Log
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Sleep Logged</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {todayHabit.sleepHours ? `${todayHabit.sleepHours} hrs` : 'Not logged'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Rest Day</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {todayHabit.isRestDay ? 'Active Recovery' : 'Training Day'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Collapsible Completed Items for Today */}
          <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xs">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>
                  Completed Today ({completedTasksToday.length + completedActsToday.length})
                </span>
              </div>
              {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCompleted && (
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                {completedTasksToday.length === 0 && completedActsToday.length === 0 ? (
                  <p className="text-slate-400 text-center py-2 text-[11px]">
                    No items marked completed yet today.
                  </p>
                ) : (
                  <>
                    {completedActsToday.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="line-through truncate">{a.title}</span>
                        <span className="text-emerald-500 font-bold shrink-0">Workout Done</span>
                      </div>
                    ))}
                    {completedTasksToday.map((t) => (
                      <div key={t.id} className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="line-through truncate">{t.title}</span>
                        <span className="text-slate-400 text-[10px] shrink-0">
                          {t.completedAt ? new Date(t.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

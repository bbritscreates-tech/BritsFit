import React, { useState } from 'react';
import {
  PlannerTask,
  PlannedActivity,
  WorkoutSession,
  CardioSession,
  WorkoutTemplate,
} from '../../types/fitness';
import { db } from '../../services/db';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Dumbbell,
  Footprints,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  plannedActivities: PlannedActivity[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  templates: WorkoutTemplate[];
  onOpenTaskEditor: (task?: PlannerTask, initialDate?: string) => void;
  onOpenActivityModal: (activity?: PlannedActivity, initialDate?: string) => void;
  onStartPlannedWorkout: (activity: PlannedActivity) => void;
  onStartPlannedCardio: (activity: PlannedActivity) => void;
  onRefresh: () => void;
}

type CalendarViewMode = 'today' | 'tomorrow' | 'week' | 'month' | 'agenda';

export const PlannerCalendarView: React.FC<PlannerCalendarViewProps> = ({
  tasks,
  plannedActivities,
  workouts,
  cardio,
  templates,
  onOpenTaskEditor,
  onOpenActivityModal,
  onStartPlannedWorkout,
  onStartPlannedCardio,
  onRefresh,
}) => {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDateYmd, setSelectedDateYmd] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  const todayYmd = new Date().toISOString().slice(0, 10);

  // Date shifting
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'today' || viewMode === 'tomorrow') {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    }
    setCurrentDate(next);
    setSelectedDateYmd(next.toISOString().slice(0, 10));
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'today' || viewMode === 'tomorrow') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
    setSelectedDateYmd(next.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateYmd(today.toISOString().slice(0, 10));
  };

  // Switch between Today and Tomorrow shortcut modes
  const handleSetTodayMode = () => {
    setViewMode('today');
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateYmd(today.toISOString().slice(0, 10));
  };

  const handleSetTomorrowMode = () => {
    setViewMode('tomorrow');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setCurrentDate(tomorrow);
    setSelectedDateYmd(tomorrow.toISOString().slice(0, 10));
  };

  // Get items for a specific date
  const getItemsForDate = (dateYmd: string) => {
    const dayTasks = tasks.filter((t) => t.dueDate === dateYmd);
    const dayActs = plannedActivities.filter((a) => a.date === dateYmd);
    const completedWorkouts = workouts.filter((w) => w.date.slice(0, 10) === dateYmd);
    const completedCardio = cardio.filter((c) => c.date.slice(0, 10) === dateYmd);
    return { dayTasks, dayActs, completedWorkouts, completedCardio };
  };

  // Conflict detection: detect overlapping timed items for the selected date
  const checkConflicts = (dateYmd: string) => {
    const { dayTasks, dayActs } = getItemsForDate(dateYmd);
    const timedItems: { title: string; start: number; end: number }[] = [];

    const parseMinutes = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    dayActs.forEach((a) => {
      if (a.startTime) {
        const start = parseMinutes(a.startTime);
        const end = start + (a.durationMinutes || 60);
        timedItems.push({ title: a.title, start, end });
      }
    });

    dayTasks.forEach((t) => {
      if (t.startTime) {
        const start = parseMinutes(t.startTime);
        const end = t.endTime ? parseMinutes(t.endTime) : start + (t.estimatedDurationMinutes || 30);
        timedItems.push({ title: t.title, start, end });
      }
    });

    const conflicts: string[] = [];
    for (let i = 0; i < timedItems.length; i++) {
      for (let j = i + 1; j < timedItems.length; j++) {
        const a = timedItems[i];
        const b = timedItems[j];
        if (a.start < b.end && b.start < a.end) {
          conflicts.push(`"${a.title}" overlaps with "${b.title}"`);
        }
      }
    }
    return conflicts;
  };

  // Generate days for Week View (Monday to Sunday)
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(curr.setDate(diff));

    const week: { date: Date; ymd: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push({ date: d, ymd: d.toISOString().slice(0, 10) });
    }
    return week;
  };

  // Generate days for Month View
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; ymd: string; isCurrentMonth: boolean }[] = [];

    // Pad beginning to Monday
    let startDayOfWeek = firstDay.getDay();
    let padStart = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    for (let i = padStart; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      days.push({ date: d, ymd: d.toISOString().slice(0, 10), isCurrentMonth: false });
    }

    // Days in current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, ymd: d.toISOString().slice(0, 10), isCurrentMonth: true });
    }

    // Pad end to complete 35 or 42 grid
    const remaining = 35 - days.length;
    if (remaining > 0) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, ymd: d.toISOString().slice(0, 10), isCurrentMonth: false });
      }
    }

    return days;
  };

  const selectedDateConflicts = checkConflicts(selectedDateYmd);
  const selectedDayItems = getItemsForDate(selectedDateYmd);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-[#1677E8]" />
            Planner &amp; Calendar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Synchronised agenda for workouts, cardio sessions, appointments, and daily tasks
          </p>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenTaskEditor(undefined, selectedDateYmd)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Task</span>
          </button>
          <button
            onClick={() => onOpenActivityModal(undefined, selectedDateYmd)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>+ Schedule Workout</span>
          </button>
        </div>
      </div>

      {/* Navigation & View Mode Selectors */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Date Navigator */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="font-bold text-sm text-slate-900 dark:text-white ml-2">
            {currentDate.toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
              ...(viewMode === 'today' || viewMode === 'tomorrow'
                ? { weekday: 'short', day: 'numeric' }
                : {}),
            })}
          </span>
        </div>

        {/* View Modes */}
        <div className="flex items-center gap-1 overflow-x-auto self-start md:self-auto max-w-full">
          {[
            { id: 'today', label: 'Today', onClick: handleSetTodayMode },
            { id: 'tomorrow', label: 'Tomorrow', onClick: handleSetTomorrowMode },
            { id: 'week', label: 'Week', onClick: () => setViewMode('week') },
            { id: 'month', label: 'Month', onClick: () => setViewMode('month') },
            { id: 'agenda', label: 'Agenda', onClick: () => setViewMode('agenda') },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={mode.onClick}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                viewMode === mode.id
                  ? 'bg-[#1677E8] text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conflict Warning Alert */}
      {selectedDateConflicts.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Scheduling Conflict Warning:</span>
            <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-[11px]">
              {selectedDateConflicts.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {getWeekDays().map((day) => {
            const isToday = day.ymd === todayYmd;
            const isSelected = day.ymd === selectedDateYmd;
            const items = getItemsForDate(day.ymd);

            return (
              <div
                key={day.ymd}
                onClick={() => setSelectedDateYmd(day.ymd)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                  isSelected
                    ? 'border-[#1677E8] bg-[#1677E8]/5 ring-2 ring-[#1677E8]/20'
                    : isToday
                    ? 'border-[#12B8C7] bg-white dark:bg-slate-900/80 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {day.date.toLocaleDateString(undefined, { weekday: 'short' })}
                    </span>
                    <span
                      className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-[#1677E8] text-white'
                          : isSelected
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.date.getDate()}
                    </span>
                  </div>

                  {/* Planned Activities Chips */}
                  <div className="space-y-1">
                    {items.dayActs.map((act) => (
                      <div
                        key={act.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenActivityModal(act);
                        }}
                        className={`text-[10px] font-semibold px-1.5 py-1 rounded-md truncate flex items-center gap-1 ${
                          act.status === 'completed'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE]'
                        }`}
                      >
                        <Dumbbell className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{act.title}</span>
                      </div>
                    ))}

                    {/* Tasks Chips */}
                    {items.dayTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskEditor(t);
                        }}
                        className={`text-[10px] px-1.5 py-1 rounded-md truncate flex items-center gap-1 ${
                          t.status === 'completed'
                            ? 'line-through text-slate-400 bg-slate-100 dark:bg-slate-800'
                            : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80'
                        }`}
                      >
                        <span className="truncate">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 mt-2 flex items-center justify-between">
                  <span>{items.dayActs.length + items.dayTasks.length} items</span>
                  <Plus className="w-3 h-3 text-[#1677E8]" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {getMonthDays().map((d) => {
              const items = getItemsForDate(d.ymd);
              const isToday = d.ymd === todayYmd;
              const isSelected = d.ymd === selectedDateYmd;

              return (
                <div
                  key={d.ymd}
                  onClick={() => setSelectedDateYmd(d.ymd)}
                  className={`min-h-[75px] p-1.5 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1677E8] bg-[#1677E8]/10'
                      : isToday
                      ? 'border-[#12B8C7] bg-[#12B8C7]/5'
                      : d.isCurrentMonth
                      ? 'border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'opacity-30 border-transparent'
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-[#1677E8] text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.date.getDate()}
                  </span>

                  <div className="space-y-0.5">
                    {items.dayActs.length > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-[#1677E8]" title={`${items.dayActs.length} workouts`} />
                    )}
                    {items.dayTasks.length > 0 && (
                      <div className="w-full h-1.5 rounded-full bg-[#12B8C7]" title={`${items.dayTasks.length} tasks`} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AGENDA & SELECTED DATE DETAIL VIEW (Always shown or for Today/Tomorrow/Agenda) */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <span>Agenda for</span>
              <span className="text-[#1677E8]">
                {selectedDateYmd === todayYmd
                  ? 'Today'
                  : new Date(selectedDateYmd + 'T00:00:00').toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                    })}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {selectedDayItems.dayActs.length} planned activities • {selectedDayItems.dayTasks.length} tasks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTaskEditor(undefined, selectedDateYmd)}
              className="text-xs font-semibold text-[#1677E8] hover:underline"
            >
              + Add Task
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={() => onOpenActivityModal(undefined, selectedDateYmd)}
              className="text-xs font-semibold text-[#12B8C7] hover:underline"
            >
              + Schedule Workout
            </button>
          </div>
        </div>

        {/* Selected Day Agenda Items */}
        {selectedDayItems.dayActs.length === 0 && selectedDayItems.dayTasks.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
            No scheduled items for this date. Click "+ Add Task" or "+ Schedule Workout" above to plan ahead.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Planned Activities */}
            {selectedDayItems.dayActs.map((act) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-[#1677E8]/10 text-[#1677E8] shrink-0">
                    {['run', 'walk', 'treadmill'].includes(act.activityType) ? (
                      <Footprints className="w-5 h-5" />
                    ) : (
                      <Dumbbell className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {act.title}
                      </span>
                      {act.status === 'completed' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Completed
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      {act.startTime && (
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-[#1677E8]" />
                          {act.startTime} ({act.durationMinutes}m)
                        </span>
                      )}
                      {act.targetDistanceKm && <span>{act.targetDistanceKm} km target</span>}
                      {act.linkedTemplateName && <span>Template: {act.linkedTemplateName}</span>}
                    </div>
                    {act.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
                        "{act.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {act.status !== 'completed' && (
                    <button
                      onClick={() => {
                        if (['run', 'walk', 'treadmill'].includes(act.activityType)) {
                          onStartPlannedCardio(act);
                        } else {
                          onStartPlannedWorkout(act);
                        }
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Session</span>
                    </button>
                  )}
                  <button
                    onClick={() => onOpenActivityModal(act)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-100"
                  >
                    Edit Plan
                  </button>
                </div>
              </div>
            ))}

            {/* Tasks for date */}
            {selectedDayItems.dayTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => onOpenTaskEditor(t)}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between gap-3 cursor-pointer hover:border-[#1677E8]/40 transition"
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      db.toggleTaskComplete(t.id);
                      onRefresh();
                    }}
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer ${
                      t.status === 'completed'
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {t.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </button>
                  <div>
                    <span className={`text-xs font-bold text-slate-900 dark:text-white ${t.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                      {t.title}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-2">({t.category})</span>
                  </div>
                </div>

                {t.startTime && (
                  <span className="text-xs text-slate-500 font-medium">
                    {t.startTime}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

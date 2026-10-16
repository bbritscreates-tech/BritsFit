import React, { useState } from 'react';
import {
  WorkoutSession,
  CardioSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
} from '../../types/fitness';
import { db } from '../../services/db';
import { formatDuration, formatPace } from '../../services/calculations';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Footprints,
  Scale,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Plus,
} from 'lucide-react';

interface CalendarViewProps {
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  measurements: BodyMeasurementEntry[];
  habits: DailyHabitEntry[];
  onOpenWorkoutEditor: (session?: WorkoutSession) => void;
  onOpenCardioEditor: (session?: CardioSession) => void;
  onOpenBodyEditor: (entry?: BodyMeasurementEntry) => void;
  onOpenHabitEditor: (entry?: DailyHabitEntry, date?: string) => void;
  onRefresh: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  workouts,
  cardio,
  measurements,
  habits,
  onOpenWorkoutEditor,
  onOpenCardioEditor,
  onOpenBodyEditor,
  onOpenHabitEditor,
  onRefresh,
}) => {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2026, 9, 1)); // October 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );

  // Month navigation
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Calendar matrix math
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Create date lookup keys YYYY-MM-DD
  const formatDayKey = (day: number) => {
    return `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  };

  // Filter items for selected day
  const selectedWorkouts = workouts.filter((w) => w.date.startsWith(selectedDateStr));
  const selectedCardio = cardio.filter((c) => c.date.startsWith(selectedDateStr));
  const selectedMeasurements = measurements.filter((m) => m.date.startsWith(selectedDateStr));
  const selectedHabit = habits.find((h) => h.date === selectedDateStr);

  const totalEntriesForDay =
    selectedWorkouts.length +
    selectedCardio.length +
    selectedMeasurements.length +
    (selectedHabit ? 1 : 0);

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Calendar & History
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View, inspect, and modify everything logged on any calendar day
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white min-w-32 text-center">
            {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      {/* Grid: Left Calendar + Right Day Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Matrix (7 columns) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          {/* Day of week headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400 mb-2">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {/* Blank leading days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`blank-${i}`} className="h-14 sm:h-20 rounded-xl bg-transparent" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayKey = formatDayKey(day);
              const isSelected = selectedDateStr === dayKey;

              const hasWorkout = workouts.some((w) => w.date.startsWith(dayKey));
              const hasCardio = cardio.some((c) => c.date.startsWith(dayKey));
              const hasBody = measurements.some((m) => m.date.startsWith(dayKey));
              const hasHabit = habits.some((h) => h.date === dayKey);

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDateStr(dayKey)}
                  className={`h-14 sm:h-20 p-1.5 rounded-xl border flex flex-col justify-between items-start text-left transition cursor-pointer select-none ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-white dark:bg-slate-900'
                  }`}
                >
                  <span
                    className={`text-xs font-mono font-semibold ${
                      isSelected
                        ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>

                  {/* Activity indicators */}
                  <div className="flex flex-wrap gap-1 mt-auto w-full">
                    {hasWorkout && (
                      <span
                        className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"
                        title="Workout"
                      />
                    )}
                    {hasCardio && (
                      <span
                        className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"
                        title="Cardio"
                      />
                    )}
                    {hasBody && (
                      <span
                        className="w-2 h-2 rounded-full bg-purple-500 shrink-0"
                        title="Body Measurement"
                      />
                    )}
                    {hasHabit && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                        title="Habit"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Workout</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Cardio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>Body Metric</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Wellbeing</span>
            </div>
          </div>
        </div>

        {/* Day Inspector Panel */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(selectedDateStr + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
              <p className="text-[11px] text-slate-400">
                {totalEntriesForDay} {totalEntriesForDay === 1 ? 'entry' : 'entries'} recorded
              </p>
            </div>

            {/* Quick Add For This Day */}
            <button
              onClick={() => onOpenHabitEditor(undefined, selectedDateStr)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Day</span>
            </button>
          </div>

          {totalEntriesForDay === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              No activity or metrics logged for this date.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {/* Workouts */}
              {selectedWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {w.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenWorkoutEditor(w)}
                        className="p-1 text-slate-400 hover:text-emerald-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete workout "${w.name}"?`)) {
                            db.deleteWorkout(w.id);
                            onRefresh();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatDuration(w.totalDurationSeconds)} · {w.exercises.length} exercises · Effort: {w.overallEffort}/10
                  </div>
                </div>
              ))}

              {/* Cardio */}
              {selectedCardio.map((c) => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Footprints className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                        {c.activityType.replace('_', ' ')}: {c.distanceKm.toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenCardioEditor(c)}
                        className="p-1 text-slate-400 hover:text-cyan-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete cardio entry?`)) {
                            db.deleteCardio(c.id);
                            onRefresh();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {formatDuration(c.durationSeconds)} · Pace: {formatPace(c.paceMinPerKm)} · Speed: {c.speedKmH.toFixed(1)} km/h
                  </div>
                </div>
              ))}

              {/* Body Measurements */}
              {selectedMeasurements.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl border border-purple-500/20 bg-purple-500/5 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Body Weigh-in: {m.weightKg ? `${m.weightKg} kg` : 'Measurements'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenBodyEditor(m)}
                        className="p-1 text-slate-400 hover:text-purple-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete body measurement?`)) {
                            db.deleteMeasurement(m.id);
                            onRefresh();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {m.waistCm && <span>Waist: {m.waistCm}cm · </span>}
                    {m.chestCm && <span>Chest: {m.chestCm}cm · </span>}
                    {m.bodyFatPercentage && <span>BF: {m.bodyFatPercentage}%</span>}
                  </div>
                </div>
              ))}

              {/* Habit */}
              {selectedHabit && (
                <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Wellbeing & Recovery
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenHabitEditor(selectedHabit)}
                        className="p-1 text-slate-400 hover:text-amber-500 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete habit entry?`)) {
                            db.deleteHabit(selectedHabit.id);
                            onRefresh();
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {selectedHabit.sleepHours && <span>Sleep: {selectedHabit.sleepHours}h · </span>}
                    {selectedHabit.waterLitres && <span>Water: {selectedHabit.waterLitres}L · </span>}
                    {selectedHabit.energyRating && <span>Energy: {selectedHabit.energyRating}/5</span>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

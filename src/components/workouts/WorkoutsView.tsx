import React, { useState } from 'react';
import { WorkoutSession, WorkoutTemplate } from '../../types/fitness';
import { db } from '../../services/db';
import { formatDuration } from '../../services/calculations';
import {
  Dumbbell,
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  AlertCircle,
} from 'lucide-react';

interface WorkoutsViewProps {
  workouts: WorkoutSession[];
  onOpenWorkoutEditor: (session?: WorkoutSession) => void;
  onOpenTemplates: () => void;
  onOpenLibrary: () => void;
  onRefresh: () => void;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({
  workouts,
  onOpenWorkoutEditor,
  onOpenTemplates,
  onOpenLibrary,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.exercises.some((e) => e.exerciseName.toLowerCase().includes(search.toLowerCase())) ||
      (w.notes && w.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'all' || w.workoutType === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleDuplicate = (workout: WorkoutSession) => {
    const duplicate: WorkoutSession = {
      ...JSON.parse(JSON.stringify(workout)),
      id: 'w-' + Date.now(),
      date: new Date().toISOString().slice(0, 16),
      name: `${workout.name} (Copy)`,
      createdAt: new Date().toISOString(),
    };
    db.saveWorkout(duplicate);
    onRefresh();
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      db.deleteWorkout(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-5 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Workouts & Resistance Training
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Log multi-exercise sessions, set intervals, rep duration, and effort
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenLibrary}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Exercise Library</span>
          </button>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5 text-cyan-500" />
            <span>Templates</span>
          </button>

          <button
            onClick={() => onOpenWorkoutEditor()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Workout</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Search workouts, exercises, notes..."
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">All Types</option>
          <option value="Strength">Strength</option>
          <option value="Hypertrophy">Hypertrophy</option>
          <option value="Calisthenics">Calisthenics</option>
          <option value="Full Body">Full Body</option>
          <option value="Circuit">Circuit</option>
          <option value="Mobility">Mobility</option>
        </select>
      </div>

      {/* Workout Sessions List */}
      <div className="space-y-3">
        {filteredWorkouts.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Dumbbell className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No workout logs found matching your filters.
            </p>
            <button
              onClick={() => onOpenWorkoutEditor()}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 inline-block"
            >
              Log Your First Workout
            </button>
          </div>
        ) : (
          filteredWorkouts.map((workout) => {
            const isExpanded = expandedWorkoutId === workout.id;
            const totalSets = workout.exercises.reduce((s, e) => s + e.sets.length, 0);

            return (
              <div
                key={workout.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                {/* Main Card Header */}
                <div
                  onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {workout.name}
                      </h3>
                      <span className="text-[11px] text-slate-400">
                        · {workout.workoutType}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span>{new Date(workout.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span>·</span>
                      <span className="font-mono tabular-nums">{formatDuration(workout.totalDurationSeconds)}</span>
                      <span>·</span>
                      <span>{workout.exercises.length} exercises ({totalSets} sets)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[11px] font-bold">
                        RPE {workout.overallEffort}/10
                      </div>
                      {workout.overallPainDiscomfort > 0 && (
                        <div className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 font-mono text-[11px] font-bold">
                          Pain {workout.overallPainDiscomfort}/10
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDuplicate(workout)}
                        className="p-1.5 text-slate-400 hover:text-cyan-500 rounded-lg cursor-pointer"
                        title="Duplicate workout"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onOpenWorkoutEditor(workout)}
                        className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg cursor-pointer"
                        title="Edit workout"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(workout.id, workout.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer"
                        title="Delete workout"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : workout.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details: Exercises and Sets Table */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/40 dark:bg-slate-900/40">
                    {workout.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-2">
                        "{workout.notes}"
                      </p>
                    )}

                    <div className="space-y-3">
                      {workout.exercises.map((ex, exIdx) => (
                        <div
                          key={ex.id || exIdx}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                {ex.exerciseName}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ({ex.muscleGroup})
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {ex.sets.length} sets
                            </span>
                          </div>

                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs font-mono">
                              <thead>
                                <tr className="text-[10px] text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <th className="py-1 px-2">Set</th>
                                  <th className="py-1 px-2">{ex.isTimed ? 'Hold Duration' : 'Reps & Weight'}</th>
                                  <th className="py-1 px-2">Set Time</th>
                                  <th className="py-1 px-2">Avg Rep Time</th>
                                  <th className="py-1 px-2">Rest</th>
                                  <th className="py-1 px-2">RPE</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                {ex.sets.map((set) => (
                                  <tr key={set.id} className="text-slate-700 dark:text-slate-300">
                                    <td className="py-1.5 px-2 text-slate-400">{set.setNumber}</td>
                                    <td className="py-1.5 px-2 font-semibold">
                                      {ex.isTimed
                                        ? `${set.holdDurationSeconds || set.totalSetDurationSeconds}s hold`
                                        : `${set.reps} reps ${set.weightKg ? `@ ${set.weightKg} kg` : '(BW)'}`}
                                    </td>
                                    <td className="py-1.5 px-2 tabular-nums">
                                      {set.totalSetDurationSeconds}s
                                    </td>
                                    <td className="py-1.5 px-2 tabular-nums text-slate-400">
                                      {set.averageRepDurationSeconds ? `${set.averageRepDurationSeconds}s` : '--'}
                                    </td>
                                    <td className="py-1.5 px-2 tabular-nums text-slate-400">
                                      {set.restDurationSeconds}s
                                    </td>
                                    <td className="py-1.5 px-2 tabular-nums">
                                      {set.effort}/10
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

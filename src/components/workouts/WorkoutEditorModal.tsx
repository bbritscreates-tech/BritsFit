import React, { useState, useEffect } from 'react';
import {
  WorkoutSession,
  WorkoutExercise,
  WorkoutSet,
  WorkoutType,
  ExerciseItem,
} from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import {
  formatDuration,
  parseDurationToSeconds,
  calculateAverageRepDuration,
  getPreviousExercisePerformance,
} from '../../services/calculations';
import { Plus, Trash2, Clock, Timer, ArrowUpRight, Copy, Save } from 'lucide-react';

interface WorkoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutToEdit?: WorkoutSession | null;
  templateToLoad?: any;
  onSaved: () => void;
}

export const WorkoutEditorModal: React.FC<WorkoutEditorModalProps> = ({
  isOpen,
  onClose,
  workoutToEdit,
  templateToLoad,
  onSaved,
}) => {
  const [exercisesLibrary, setExercisesLibrary] = useState<ExerciseItem[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutSession[]>([]);

  // Form states
  const [id, setId] = useState<string>('');
  const [name, setName] = useState<string>('Upper Body Workout');
  const [date, setDate] = useState<string>('');
  const [workoutType, setWorkoutType] = useState<WorkoutType>('Hypertrophy');
  const [totalDurationSeconds, setTotalDurationSeconds] = useState<number>(3000);
  const [overallEffort, setOverallEffort] = useState<number>(7);
  const [overallPainDiscomfort, setOverallPainDiscomfort] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  // Live Timer utility
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [selectedExerciseToAdd, setSelectedExerciseToAdd] = useState<string>('');

  // Quick create exercise modal state
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [quickExName, setQuickExName] = useState('');
  const [quickExType, setQuickExType] = useState<'reps' | 'timed' | 'distance'>('reps');
  const [quickExMuscle, setQuickExMuscle] = useState<string>('Full Body');
  const [quickExInstructions, setQuickExInstructions] = useState('');
  const [quickExError, setQuickExError] = useState('');

  const refreshLibrary = () => {
    setExercisesLibrary(db.getExercises().filter((e) => !e.isArchived));
    setAllWorkouts(db.getWorkouts());
  };

  useEffect(() => {
    refreshLibrary();
    const unsub = db.subscribe(() => {
      refreshLibrary();
    });
    return () => unsub();
  }, [isOpen]);

  useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  useEffect(() => {
    if (workoutToEdit) {
      setId(workoutToEdit.id);
      setName(workoutToEdit.name);
      setDate(workoutToEdit.date);
      setWorkoutType(workoutToEdit.workoutType);
      setTotalDurationSeconds(workoutToEdit.totalDurationSeconds);
      setOverallEffort(workoutToEdit.overallEffort);
      setOverallPainDiscomfort(workoutToEdit.overallPainDiscomfort);
      setNotes(workoutToEdit.notes || '');
      setExercises(JSON.parse(JSON.stringify(workoutToEdit.exercises)));
    } else if (templateToLoad) {
      setId('w-' + Date.now());
      setName(templateToLoad.name);
      const now = new Date();
      setDate(now.toISOString().slice(0, 16));
      setWorkoutType(templateToLoad.workoutType);
      setTotalDurationSeconds(3000);
      setOverallEffort(7);
      setOverallPainDiscomfort(0);
      setNotes(templateToLoad.notes || '');
      setExercises(
        templateToLoad.exercises.map((te: any, index: number) => ({
          id: 'we-' + Date.now() + '-' + index,
          exerciseId: te.exerciseId,
          exerciseName: te.exerciseName,
          category: te.category,
          muscleGroup: te.muscleGroup,
          isTimed: te.isTimed,
          notes: '',
          sets: Array.from({ length: te.defaultSets || 3 }).map((_, sIdx) => ({
            id: 'ws-' + Date.now() + '-' + index + '-' + sIdx,
            setNumber: sIdx + 1,
            reps: te.isTimed ? 0 : 10,
            weightKg: null,
            isTimed: te.isTimed,
            holdDurationSeconds: te.isTimed ? 60 : undefined,
            totalSetDurationSeconds: te.isTimed ? 60 : 30,
            restDurationSeconds: 90,
            effort: 7,
            painDiscomfort: 0,
          })),
        }))
      );
    } else {
      // New workout default
      const now = new Date();
      setId('w-' + Date.now());
      setName('Full Body Workout');
      setDate(now.toISOString().slice(0, 16));
      setWorkoutType('Strength');
      setTotalDurationSeconds(3000);
      setOverallEffort(7);
      setOverallPainDiscomfort(0);
      setNotes('');

      // Pick first exercise if available
      const defaultLib = db.getExercises();
      if (defaultLib.length > 0) {
        const first = defaultLib[0];
        setExercises([
          {
            id: 'we-' + Date.now(),
            exerciseId: first.id,
            exerciseName: first.name,
            category: first.category,
            muscleGroup: first.muscleGroup,
            isTimed: first.isTimed,
            notes: '',
            sets: [
              {
                id: 'ws-' + Date.now() + '-1',
                setNumber: 1,
                reps: first.isTimed ? 0 : 10,
                weightKg: null,
                isTimed: first.isTimed,
                holdDurationSeconds: first.isTimed ? 60 : undefined,
                totalSetDurationSeconds: first.isTimed ? 60 : 30,
                restDurationSeconds: 90,
                effort: 7,
                painDiscomfort: 0,
              },
            ],
          },
        ]);
      } else {
        setExercises([]);
      }
    }
  }, [workoutToEdit, templateToLoad, isOpen]);

  const handleAddExercise = (exerciseId: string) => {
    const exItem = exercisesLibrary.find((e) => e.id === exerciseId);
    if (!exItem) return;

    const newEx: WorkoutExercise = {
      id: 'we-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      exerciseId: exItem.id,
      exerciseName: exItem.name,
      category: exItem.category,
      muscleGroup: exItem.muscleGroup,
      isTimed: exItem.isTimed,
      notes: '',
      sets: [
        {
          id: 'ws-' + Date.now() + '-1',
          setNumber: 1,
          reps: exItem.isTimed ? 0 : 10,
          weightKg: null,
          isTimed: exItem.isTimed,
          holdDurationSeconds: exItem.isTimed ? 60 : undefined,
          totalSetDurationSeconds: exItem.isTimed ? 60 : 30,
          restDurationSeconds: 90,
          effort: 7,
          painDiscomfort: 0,
        },
      ],
    };

    setExercises([...exercises, newEx]);
    setSelectedExerciseToAdd('');
  };

  const handleQuickSaveExercise = () => {
    const trimmed = quickExName.trim();
    if (!trimmed) {
      setQuickExError('Exercise name is required.');
      return;
    }

    // Check duplicate
    const exists = exercisesLibrary.some(
      (e) => e.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setQuickExError(`"${trimmed}" already exists in the Exercise Library.`);
      return;
    }

    const categoryMap: Record<string, any> = {
      Chest: 'chest',
      Back: 'back',
      Arms: 'biceps',
      Legs: 'quads',
      Core: 'core',
      'Full Body': 'full_body',
      Other: 'other',
    };

    const newExItem: ExerciseItem = {
      id: 'ex-' + Date.now(),
      name: trimmed,
      category: categoryMap[quickExMuscle] || 'other',
      muscleGroup: quickExMuscle,
      muscleGroupTarget: quickExMuscle as any,
      equipment: 'bodyweight',
      exerciseType: quickExType,
      isTimed: quickExType === 'timed',
      instructions: quickExInstructions.trim() || undefined,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    db.saveExercise(newExItem);

    // Add directly to current workout sets
    const newEx: WorkoutExercise = {
      id: 'we-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      exerciseId: newExItem.id,
      exerciseName: newExItem.name,
      category: newExItem.category,
      muscleGroup: newExItem.muscleGroup,
      isTimed: newExItem.isTimed,
      notes: '',
      sets: [
        {
          id: 'ws-' + Date.now() + '-1',
          setNumber: 1,
          reps: newExItem.isTimed ? 0 : 10,
          weightKg: null,
          isTimed: newExItem.isTimed,
          holdDurationSeconds: newExItem.isTimed ? 60 : undefined,
          totalSetDurationSeconds: newExItem.isTimed ? 60 : 30,
          restDurationSeconds: 90,
          effort: 7,
          painDiscomfort: 0,
        },
      ],
    };

    setExercises([...exercises, newEx]);
    setIsQuickCreateOpen(false);
    setQuickExName('');
    setQuickExInstructions('');
    setQuickExError('');
  };

  const handleRemoveExercise = (exIndex: number) => {
    setExercises(exercises.filter((_, i) => i !== exIndex));
  };

  const handleAddSet = (exIndex: number) => {
    const targetEx = exercises[exIndex];
    const prevSet = targetEx.sets[targetEx.sets.length - 1];
    const newSet: WorkoutSet = {
      id: 'ws-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      setNumber: targetEx.sets.length + 1,
      reps: prevSet ? prevSet.reps : targetEx.isTimed ? 0 : 10,
      weightKg: prevSet ? prevSet.weightKg : null,
      isTimed: targetEx.isTimed,
      holdDurationSeconds: prevSet?.holdDurationSeconds ?? (targetEx.isTimed ? 60 : undefined),
      totalSetDurationSeconds: prevSet ? prevSet.totalSetDurationSeconds : 30,
      restDurationSeconds: prevSet ? prevSet.restDurationSeconds : 90,
      effort: prevSet ? prevSet.effort : 7,
      painDiscomfort: 0,
    };

    const updated = [...exercises];
    updated[exIndex].sets.push(newSet);
    setExercises(updated);
  };

  const handleRemoveSet = (exIndex: number, setIndex: number) => {
    const updated = [...exercises];
    updated[exIndex].sets = updated[exIndex].sets
      .filter((_, i) => i !== setIndex)
      .map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    setExercises(updated);
  };

  const handleUpdateSet = (
    exIndex: number,
    setIndex: number,
    field: keyof WorkoutSet,
    val: any
  ) => {
    const updated = [...exercises];
    const currentSet = { ...updated[exIndex].sets[setIndex], [field]: val };

    // Auto-calculate average rep duration when totalSetDuration or reps or repSeconds change
    if (field === 'totalSetDurationSeconds' || field === 'reps' || field === 'repSeconds') {
      const avg = calculateAverageRepDuration(
        currentSet.totalSetDurationSeconds,
        currentSet.reps,
        currentSet.repSeconds
      );
      currentSet.averageRepDurationSeconds = avg;
    }

    updated[exIndex].sets[setIndex] = currentSet;
    setExercises(updated);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a workout name');
      return;
    }

    const session: WorkoutSession = {
      id: id || 'w-' + Date.now(),
      name: name.trim(),
      date: date || new Date().toISOString(),
      workoutType,
      totalDurationSeconds: Number(totalDurationSeconds) || 0,
      overallEffort: Number(overallEffort),
      overallPainDiscomfort: Number(overallPainDiscomfort),
      notes: notes.trim(),
      exercises,
      createdAt: workoutToEdit?.createdAt || new Date().toISOString(),
    };

    db.saveWorkout(session);
    onSaved();
    onClose();
  };

  const handleSaveAsTemplate = () => {
    const templateName = prompt('Enter a name for this workout template:', name);
    if (!templateName) return;

    db.saveTemplate({
      id: 'tmpl-' + Date.now(),
      name: templateName,
      workoutType,
      notes: notes || 'Created from workout session',
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        exerciseName: e.exerciseName,
        category: e.category,
        muscleGroup: e.muscleGroup,
        isTimed: e.isTimed,
        defaultSets: e.sets.length,
        defaultTarget: e.isTimed
          ? `${e.sets[0]?.holdDurationSeconds || 60}s hold`
          : `${e.sets[0]?.reps || 10} reps`,
      })),
    });
    alert('Template saved successfully!');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={workoutToEdit ? 'Edit Workout Session' : 'Log Workout Session'}
      subtitle="Record exercises, sets, repetition timing, rest, and effort"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Top Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Upper Body Strength"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Workout Type
            </label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as WorkoutType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Strength">Strength (Heavy / Compound)</option>
              <option value="Hypertrophy">Hypertrophy (Muscle Building)</option>
              <option value="Calisthenics">Calisthenics (Bodyweight)</option>
              <option value="Full Body">Full Body</option>
              <option value="Circuit">Circuit Training</option>
              <option value="Mobility">Mobility & Flexibility</option>
              <option value="Cardio Conditioning">Cardio Conditioning</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Total Duration: {formatDuration(totalDurationSeconds)}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="60"
                value={Math.round(totalDurationSeconds / 60)}
                onChange={(e) => setTotalDurationSeconds(Math.max(0, Number(e.target.value) * 60))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
                placeholder="Minutes"
              />
              <span className="text-xs text-slate-500 whitespace-nowrap">mins</span>
            </div>
          </div>
        </div>

        {/* Effort & Pain Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Overall Effort (RPE)</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {overallEffort} / 10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={overallEffort}
              onChange={(e) => setOverallEffort(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Pain or Discomfort</span>
              <span
                className={`font-bold tabular-nums ${
                  overallPainDiscomfort > 3 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {overallPainDiscomfort} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={overallPainDiscomfort}
              onChange={(e) => setOverallPainDiscomfort(Number(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Live Set / Rest Stopwatch Tool */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-slate-700 dark:text-slate-200">
              Live Set/Rest Timer:
            </span>
            <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatDuration(timerSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTimerRunning(!timerRunning)}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] transition cursor-pointer"
            >
              {timerRunning ? 'Pause' : 'Start'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setTimerSeconds(0);
              }}
              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] hover:bg-slate-300 transition cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Exercises List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Exercises ({exercises.length})
            </h3>

            {/* Quick add exercise dropdown & New button */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedExerciseToAdd}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '__CREATE_NEW__') {
                    setIsQuickCreateOpen(true);
                    setSelectedExerciseToAdd('');
                  } else if (val) {
                    handleAddExercise(val);
                  }
                }}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="">+ Add Exercise...</option>
                <option value="__CREATE_NEW__" className="text-emerald-600 font-semibold">
                  + Create New Exercise...
                </option>
                {exercisesLibrary.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.muscleGroup.split(',')[0]})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setIsQuickCreateOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer whitespace-nowrap"
                title="Create a new custom exercise"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Quick Create Exercise Form */}
          {isQuickCreateOpen && (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-emerald-500/20">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  Add New Custom Exercise to Library
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickCreateOpen(false);
                    setQuickExError('');
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {quickExError && (
                <div className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                  {quickExError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Exercise Name *
                  </label>
                  <input
                    type="text"
                    value={quickExName}
                    onChange={(e) => {
                      setQuickExName(e.target.value);
                      setQuickExError('');
                    }}
                    placeholder="e.g. Bulgarian Split Squat"
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Exercise Type *
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickExType('reps')}
                      className={`py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                        quickExType === 'reps'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Reps
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickExType('timed')}
                      className={`py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                        quickExType === 'timed'
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Timed
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickExType('distance')}
                      className={`py-1 text-xs font-semibold rounded-lg border cursor-pointer ${
                        quickExType === 'distance'
                          ? 'bg-cyan-600 text-white border-cyan-600'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Distance
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                    Muscle Group *
                  </label>
                  <select
                    value={quickExMuscle}
                    onChange={(e) => setQuickExMuscle(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Full Body">Full Body</option>
                    <option value="Arms">Arms</option>
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Core">Core</option>
                    <option value="Legs">Legs</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    Optional Description / Form Notes
                  </label>
                  <input
                    type="text"
                    value={quickExInstructions}
                    onChange={(e) => setQuickExInstructions(e.target.value)}
                    placeholder="Instructions, cues, tempo..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsQuickCreateOpen(false)}
                  className="px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleQuickSaveExercise}
                  className="px-4 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  Save & Add to Workout
                </button>
              </div>
            </div>
          )}

          {exercises.length === 0 && !isQuickCreateOpen && (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-400">
              No exercises added yet. Use the dropdown above to add an exercise from your library.
            </div>
          )}

          {exercises.map((ex, exIdx) => {
            // Find previous performance of this exercise to compare
            const prevSession = getPreviousExercisePerformance(allWorkouts, ex.exerciseId, id);

            return (
              <div
                key={ex.id || exIdx}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">
                        {ex.exerciseName}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {ex.isTimed ? '· Timed Hold' : '· Repetitions'}
                      </span>
                    </div>

                    {/* Previous session comparison inline */}
                    {prevSession && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                        <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                        <span>Previous ({new Date(prevSession.sessionDate).toLocaleDateString()}):</span>
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {prevSession.sets
                            .map((s) => (s.isTimed ? `${s.holdDurationSeconds || 0}s` : `${s.reps}r`))
                            .join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 transition rounded-lg cursor-pointer"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                        <th className="py-1 px-1.5 w-8">Set</th>
                        {ex.isTimed ? (
                          <th className="py-1 px-1.5">Hold (sec)</th>
                        ) : (
                          <>
                            <th className="py-1 px-1.5">Reps</th>
                            <th className="py-1 px-1.5">Weight (kg)</th>
                          </>
                        )}
                        <th className="py-1 px-1.5">Set Time (s)</th>
                        {!ex.isTimed && <th className="py-1 px-1.5">Avg Rep (s)</th>}
                        <th className="py-1 px-1.5">Rest (s)</th>
                        <th className="py-1 px-1.5">RPE</th>
                        <th className="py-1 px-1.5 w-6"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {ex.sets.map((set, sIdx) => (
                        <tr key={set.id || sIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="py-1.5 px-1.5 font-mono text-slate-500 text-[11px]">
                            {set.setNumber}
                          </td>

                          {ex.isTimed ? (
                            <td className="py-1.5 px-1.5">
                              <input
                                type="number"
                                min="1"
                                value={set.holdDurationSeconds || ''}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  handleUpdateSet(exIdx, sIdx, 'holdDurationSeconds', val);
                                  handleUpdateSet(exIdx, sIdx, 'totalSetDurationSeconds', val);
                                }}
                                className="w-16 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                                placeholder="sec"
                              />
                            </td>
                          ) : (
                            <>
                              <td className="py-1.5 px-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  value={set.reps || ''}
                                  onChange={(e) =>
                                    handleUpdateSet(exIdx, sIdx, 'reps', Number(e.target.value))
                                  }
                                  className="w-14 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums font-semibold"
                                  placeholder="0"
                                />
                              </td>
                              <td className="py-1.5 px-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.5"
                                  value={set.weightKg ?? ''}
                                  onChange={(e) =>
                                    handleUpdateSet(
                                      exIdx,
                                      sIdx,
                                      'weightKg',
                                      e.target.value === '' ? null : Number(e.target.value)
                                    )
                                  }
                                  className="w-16 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                                  placeholder="BW"
                                />
                              </td>
                            </>
                          )}

                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              min="0"
                              value={set.totalSetDurationSeconds || ''}
                              onChange={(e) =>
                                handleUpdateSet(
                                  exIdx,
                                  sIdx,
                                  'totalSetDurationSeconds',
                                  Number(e.target.value)
                                )
                              }
                              className="w-14 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                              placeholder="sec"
                            />
                          </td>

                          {!ex.isTimed && (
                            <td className="py-1.5 px-1.5 font-mono text-[11px] text-slate-500 tabular-nums">
                              {set.averageRepDurationSeconds ? `${set.averageRepDurationSeconds}s` : '--'}
                            </td>
                          )}

                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              min="0"
                              step="15"
                              value={set.restDurationSeconds || ''}
                              onChange={(e) =>
                                handleUpdateSet(
                                  exIdx,
                                  sIdx,
                                  'restDurationSeconds',
                                  Number(e.target.value)
                                )
                              }
                              className="w-14 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                              placeholder="90s"
                            />
                          </td>

                          <td className="py-1.5 px-1.5">
                            <input
                              type="number"
                              min="1"
                              max="10"
                              value={set.effort || ''}
                              onChange={(e) =>
                                handleUpdateSet(exIdx, sIdx, 'effort', Number(e.target.value))
                              }
                              className="w-12 px-1.5 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                              placeholder="7"
                            />
                          </td>

                          <td className="py-1.5 px-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exIdx, sIdx)}
                              className="text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Delete set"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Set button */}
                <button
                  type="button"
                  onClick={() => handleAddSet(exIdx)}
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Workout Notes & Modifications
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="How did the session feel? Any equipment modifications, tempo adjustments, or fatigue..."
          />
        </div>

        {/* Footer actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleSaveAsTemplate}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Save as Template</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition cursor-pointer"
            >
              Save Workout
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

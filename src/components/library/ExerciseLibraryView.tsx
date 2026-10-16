import React, { useState, useEffect } from 'react';
import {
  ExerciseItem,
  ExerciseType,
  MuscleGroupTarget,
  EquipmentType,
  ExerciseCategory,
} from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Dumbbell,
  Timer,
  Navigation as NavigationIcon,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ExerciseLibraryViewProps {
  onRefresh?: () => void;
}

export const ExerciseLibraryView: React.FC<ExerciseLibraryViewProps> = ({ onRefresh }) => {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<ExerciseItem | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ExerciseType>('reps');
  const [formMuscleGroup, setFormMuscleGroup] = useState<MuscleGroupTarget>('Chest');
  const [formInstructions, setFormInstructions] = useState('');
  const [formEquipment, setFormEquipment] = useState<EquipmentType>('bodyweight');
  const [formPreferredTarget, setFormPreferredTarget] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = () => {
    setExercises(db.getExercises());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = db.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingExercise(null);
    setFormName('');
    setFormType('reps');
    setFormMuscleGroup('Chest');
    setFormInstructions('');
    setFormEquipment('bodyweight');
    setFormPreferredTarget('8-12 reps');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ex: ExerciseItem) => {
    setEditingExercise(ex);
    setFormName(ex.name);
    setFormType(ex.exerciseType || (ex.isTimed ? 'timed' : 'reps'));
    
    // Determine muscle group target
    let target = ex.muscleGroupTarget;
    if (!target) {
      const lower = (ex.muscleGroup || ex.category || '').toLowerCase();
      if (lower.includes('chest')) target = 'Chest';
      else if (lower.includes('back') || lower.includes('lat')) target = 'Back';
      else if (lower.includes('arm') || lower.includes('bicep') || lower.includes('tricep') || lower.includes('shoulder')) target = 'Arms';
      else if (lower.includes('core') || lower.includes('ab')) target = 'Core';
      else if (lower.includes('leg') || lower.includes('quad') || lower.includes('hamstring') || lower.includes('glute') || lower.includes('calv')) target = 'Legs';
      else if (lower.includes('full')) target = 'Full Body';
      else target = 'Other';
    }

    setFormMuscleGroup(target);
    setFormInstructions(ex.instructions || '');
    setFormEquipment(ex.equipment || 'bodyweight');
    setFormPreferredTarget(ex.preferredTarget || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveExercise = () => {
    const trimmedName = formName.trim();
    if (!trimmedName) {
      setErrorMessage('Exercise name is required.');
      return;
    }

    // Duplicate check: prevent duplicate exercise names (case-insensitive)
    const isDuplicate = exercises.some(
      (e) =>
        e.id !== editingExercise?.id &&
        e.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      setErrorMessage(`An exercise named "${trimmedName}" already exists in your library.`);
      return;
    }

    // Map MuscleGroupTarget to default ExerciseCategory
    const categoryMap: Record<MuscleGroupTarget, ExerciseCategory> = {
      Chest: 'chest',
      Back: 'back',
      Arms: 'biceps',
      Legs: 'quads',
      Core: 'core',
      'Full Body': 'full_body',
      Other: 'other',
    };

    const exItem: ExerciseItem = {
      id: editingExercise ? editingExercise.id : 'ex-' + Date.now(),
      name: trimmedName,
      category: editingExercise ? editingExercise.category : categoryMap[formMuscleGroup],
      muscleGroup: formMuscleGroup,
      muscleGroupTarget: formMuscleGroup,
      equipment: formEquipment,
      exerciseType: formType,
      isTimed: formType === 'timed',
      preferredTarget: formPreferredTarget.trim() || (formType === 'timed' ? '60s hold' : '8-12 reps'),
      instructions: formInstructions.trim() || undefined,
      isCustom: editingExercise ? editingExercise.isCustom ?? true : true,
      isArchived: editingExercise?.isArchived || false,
      createdAt: editingExercise?.createdAt || new Date().toISOString(),
    };

    db.saveExercise(exItem);
    setIsModalOpen(false);
    loadData();
    if (onRefresh) onRefresh();
  };

  const handleDeleteExercise = (ex: ExerciseItem) => {
    if (confirm(`Are you sure you want to delete "${ex.name}" from your Exercise Library?`)) {
      db.deleteExercise(ex.id);
      loadData();
      if (onRefresh) onRefresh();
    }
  };

  // Filter exercises
  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase()) ||
      (ex.instructions && ex.instructions.toLowerCase().includes(search.toLowerCase()));

    // Muscle filter
    let matchesMuscle = true;
    if (selectedMuscle !== 'all') {
      const lower = (ex.muscleGroupTarget || ex.muscleGroup || ex.category || '').toLowerCase();
      matchesMuscle = lower.includes(selectedMuscle.toLowerCase());
    }

    // Type filter
    let matchesType = true;
    if (selectedType !== 'all') {
      const currentType = ex.exerciseType || (ex.isTimed ? 'timed' : 'reps');
      matchesType = currentType === selectedType;
    }

    return matchesSearch && matchesMuscle && matchesType && !ex.isArchived;
  });

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Exercise Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage your movements, add custom exercises, and configure muscle groups
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition active:scale-95 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exercise</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="relative sm:col-span-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Search exercises by name or description..."
          />
        </div>

        <div>
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Muscle Groups</option>
            <option value="Chest">Chest</option>
            <option value="Back">Back</option>
            <option value="Arms">Arms</option>
            <option value="Legs">Legs</option>
            <option value="Core">Core</option>
            <option value="Full Body">Full Body</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="all">All Types (Reps / Timed / Distance)</option>
            <option value="reps">Reps (Repetition Based)</option>
            <option value="timed">Timed (Hold Duration)</option>
            <option value="distance">Distance</option>
          </select>
        </div>
      </div>

      {/* Exercises List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>{filteredExercises.length} Exercises Available</span>
          <span>Immediately available in Workout Log dropdown</span>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/40">
            <Dumbbell className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No exercises match your search or filter.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 inline-block cursor-pointer"
            >
              Add New Exercise
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredExercises.map((ex) => {
              const currentType = ex.exerciseType || (ex.isTimed ? 'timed' : 'reps');

              return (
                <div
                  key={ex.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {ex.name}
                          </h3>
                          {ex.isCustom && (
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Custom
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {ex.muscleGroupTarget || ex.muscleGroup}
                          </span>
                          <span>·</span>
                          <span className="capitalize">
                            {currentType === 'timed' ? (
                              <span className="text-amber-500 font-medium">Timed Hold</span>
                            ) : currentType === 'distance' ? (
                              <span className="text-cyan-500 font-medium">Distance</span>
                            ) : (
                              'Repetitions'
                            )}
                          </span>
                          {ex.equipment && (
                            <>
                              <span>·</span>
                              <span className="capitalize">{ex.equipment.replace('_', ' ')}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(ex)}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 rounded-lg cursor-pointer transition"
                          title="Edit exercise"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExercise(ex)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg cursor-pointer transition"
                          title="Delete exercise"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {ex.instructions && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2.5 leading-relaxed line-clamp-2">
                        {ex.instructions}
                      </p>
                    )}
                  </div>

                  {ex.preferredTarget && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400 font-mono">
                      Target: {ex.preferredTarget}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Exercise Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExercise ? 'Edit Exercise' : 'Add New Exercise'}
        subtitle="This exercise will immediately be available in your Workout Log dropdown"
        maxWidth="md"
      >
        <div className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Exercise Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exercise Name *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                setErrorMessage('');
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g. Incline Dumbbell Press, Bulgarian Split Squat..."
              autoFocus
            />
          </div>

          {/* Exercise Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Exercise Type *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormType('reps')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  formType === 'reps'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Dumbbell className="w-4 h-4 mb-1" />
                <span>Reps</span>
              </button>

              <button
                type="button"
                onClick={() => setFormType('timed')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  formType === 'timed'
                    ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Timer className="w-4 h-4 mb-1" />
                <span>Timed</span>
              </button>

              <button
                type="button"
                onClick={() => setFormType('distance')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  formType === 'distance'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <NavigationIcon className="w-4 h-4 mb-1" />
                <span>Distance</span>
              </button>
            </div>
          </div>

          {/* Muscle Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Muscle Group *
            </label>
            <select
              value={formMuscleGroup}
              onChange={(e) => setFormMuscleGroup(e.target.value as MuscleGroupTarget)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Full Body">Full Body</option>
              <option value="Arms">Arms (Biceps, Triceps, Shoulders)</option>
              <option value="Chest">Chest</option>
              <option value="Back">Back</option>
              <option value="Core">Core (Abs, Obliques)</option>
              <option value="Legs">Legs (Quads, Hamstrings, Glutes, Calves)</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Equipment & Preferred Target */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Equipment
              </label>
              <select
                value={formEquipment}
                onChange={(e) => setFormEquipment(e.target.value as EquipmentType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="bodyweight">Bodyweight</option>
                <option value="dumbbell">Dumbbell</option>
                <option value="barbell">Barbell</option>
                <option value="kettlebell">Kettlebell</option>
                <option value="cable">Cable Machine</option>
                <option value="machine">Gym Machine</option>
                <option value="resistance_bands">Resistance Bands</option>
                <option value="pullup_bar">Pull-up Bar</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Preferred Target
              </label>
              <input
                type="text"
                value={formPreferredTarget}
                onChange={(e) => setFormPreferredTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                placeholder={formType === 'timed' ? 'e.g. 60s hold' : 'e.g. 8-12 reps'}
              />
            </div>
          </div>

          {/* Description or Instructions */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Description or Instructions (Optional)
            </label>
            <textarea
              rows={3}
              value={formInstructions}
              onChange={(e) => setFormInstructions(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Form cues, posture reminders, range of motion, bench angle..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveExercise}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer"
            >
              {editingExercise ? 'Save Changes' : 'Add to Library'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

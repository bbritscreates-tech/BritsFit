import React, { useState, useEffect } from 'react';
import { ExerciseItem, ExerciseCategory, EquipmentType } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { Search, Plus, Edit2, Archive, Check } from 'lucide-react';

interface ExerciseLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExercisesUpdated: () => void;
}

export const ExerciseLibraryModal: React.FC<ExerciseLibraryModalProps> = ({
  isOpen,
  onClose,
  onExercisesUpdated,
}) => {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Edit / Add form state
  const [editingEx, setEditingEx] = useState<ExerciseItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ExerciseCategory>('chest');
  const [formMuscleGroup, setFormMuscleGroup] = useState('');
  const [formEquipment, setFormEquipment] = useState<EquipmentType>('bodyweight');
  const [formIsTimed, setFormIsTimed] = useState(false);
  const [formPreferredTarget, setFormPreferredTarget] = useState('');
  const [formInstructions, setFormInstructions] = useState('');
  const [formModifications, setFormModifications] = useState('');

  const loadData = () => {
    setExercises(db.getExercises());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setIsCreatingNew(false);
      setEditingEx(null);
    }
  }, [isOpen]);

  const handleStartCreate = () => {
    setFormName('');
    setFormCategory('chest');
    setFormMuscleGroup('');
    setFormEquipment('bodyweight');
    setFormIsTimed(false);
    setFormPreferredTarget('8-12 reps');
    setFormInstructions('');
    setFormModifications('');
    setEditingEx(null);
    setIsCreatingNew(true);
  };

  const handleStartEdit = (ex: ExerciseItem) => {
    setEditingEx(ex);
    setFormName(ex.name);
    setFormCategory(ex.category);
    setFormMuscleGroup(ex.muscleGroup);
    setFormEquipment(ex.equipment);
    setFormIsTimed(ex.isTimed);
    setFormPreferredTarget(ex.preferredTarget || '');
    setFormInstructions(ex.instructions || '');
    setFormModifications(ex.modifications || '');
    setIsCreatingNew(false);
  };

  const handleSaveForm = () => {
    if (!formName.trim()) {
      alert('Please enter an exercise name');
      return;
    }

    const exItem: ExerciseItem = {
      id: editingEx ? editingEx.id : 'ex-' + Date.now(),
      name: formName.trim(),
      category: formCategory,
      muscleGroup: formMuscleGroup.trim() || formCategory,
      equipment: formEquipment,
      isTimed: formIsTimed,
      preferredTarget: formPreferredTarget.trim() || undefined,
      instructions: formInstructions.trim() || undefined,
      modifications: formModifications.trim() || undefined,
      isArchived: editingEx?.isArchived || false,
      createdAt: editingEx?.createdAt || new Date().toISOString(),
    };

    db.saveExercise(exItem);
    loadData();
    onExercisesUpdated();
    setIsCreatingNew(false);
    setEditingEx(null);
  };

  const handleToggleArchive = (ex: ExerciseItem) => {
    db.saveExercise({
      ...ex,
      isArchived: !ex.isArchived,
    });
    loadData();
    onExercisesUpdated();
  };

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || ex.category === selectedCategory;
    const matchesArchived = showArchived ? true : !ex.isArchived;

    return matchesSearch && matchesCategory && matchesArchived;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exercise Library"
      subtitle="Browse, customize, or create exercises with muscle targets and modifications"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Editor Form View */}
        {isCreatingNew || editingEx ? (
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white">
                {editingEx ? 'Edit Exercise' : 'Add New Exercise'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingEx(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Exercise Name *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g. Bulgarian Split Squat"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Primary Category
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ExerciseCategory)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="biceps">Biceps</option>
                  <option value="triceps">Triceps</option>
                  <option value="quads">Quadriceps</option>
                  <option value="hamstrings">Hamstrings</option>
                  <option value="glutes">Glutes</option>
                  <option value="calves">Calves</option>
                  <option value="core">Core & Abs</option>
                  <option value="full_body">Full Body</option>
                  <option value="mobility">Mobility</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Target Muscle Group
                </label>
                <input
                  type="text"
                  value={formMuscleGroup}
                  onChange={(e) => setFormMuscleGroup(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g. Quadriceps, Gluteus Medius"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Equipment
                </label>
                <select
                  value={formEquipment}
                  onChange={(e) => setFormEquipment(e.target.value as EquipmentType)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="bodyweight">Bodyweight</option>
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="kettlebell">Kettlebell</option>
                  <option value="cable">Cable</option>
                  <option value="machine">Machine</option>
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
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="e.g. 8-12 reps or 60s hold"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={formIsTimed}
                    onChange={(e) => setFormIsTimed(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Timed exercise (measured in seconds, like plank)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Instructions or Personal Form Notes
              </label>
              <textarea
                rows={2}
                value={formInstructions}
                onChange={(e) => setFormInstructions(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="Form cues, foot placement, tempo reminders..."
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Optional Modifications / Regressions
              </label>
              <input
                type="text"
                value={formModifications}
                onChange={(e) => setFormModifications(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                placeholder="e.g. elevated hands for easier variation, add vest for progression"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCreatingNew(false);
                  setEditingEx(null);
                }}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveForm}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
              >
                Save Exercise
              </button>
            </div>
          </div>
        ) : null}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none"
              placeholder="Search exercise by name or muscle..."
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="chest">Chest</option>
              <option value="back">Back</option>
              <option value="shoulders">Shoulders</option>
              <option value="quads">Quadriceps</option>
              <option value="hamstrings">Hamstrings</option>
              <option value="core">Core</option>
              <option value="full_body">Full Body</option>
            </select>

            <button
              type="button"
              onClick={handleStartCreate}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Exercises List */}
        <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
          {filteredExercises.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching exercises found.
            </div>
          ) : (
            filteredExercises.map((ex) => (
              <div
                key={ex.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 transition flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">
                      {ex.name}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      · {ex.category} · {ex.equipment.replace('_', ' ')}
                    </span>
                    {ex.isTimed && (
                      <span className="text-[10px] text-amber-500 font-medium">· Timed</span>
                    )}
                    {ex.isArchived && (
                      <span className="text-[10px] text-slate-400 italic">· Archived</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {ex.muscleGroup}
                  </p>
                  {ex.instructions && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 line-clamp-1">
                      {ex.instructions}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(ex)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    title="Edit exercise"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleArchive(ex)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                    title={ex.isArchived ? 'Unarchive exercise' : 'Archive exercise'}
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Show archived exercises</span>
          </label>
          <span className="tabular-nums font-mono">
            {filteredExercises.length} / {exercises.length} total
          </span>
        </div>
      </div>
    </Modal>
  );
};

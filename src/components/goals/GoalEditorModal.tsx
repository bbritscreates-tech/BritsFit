import React, { useState, useEffect } from 'react';
import { GoalItem, GoalCategory, GoalStatus } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface GoalEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: GoalItem | null;
  onSaved: () => void;
}

export const GoalEditorModal: React.FC<GoalEditorModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
  onSaved,
}) => {
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('weight');
  const [unit, setUnit] = useState('kg');
  const [startingValue, setStartingValue] = useState<string>('84.0');
  const [targetValue, setTargetValue] = useState<string>('79.0');
  const [currentValue, setCurrentValue] = useState<string>('80.8');
  const [isLowerBetter, setIsLowerBetter] = useState<boolean>(true);
  const [targetDate, setTargetDate] = useState<string>('');
  const [status, setStatus] = useState<GoalStatus>('active');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (goalToEdit) {
      setId(goalToEdit.id);
      setTitle(goalToEdit.title);
      setCategory(goalToEdit.category);
      setUnit(goalToEdit.unit);
      setStartingValue(goalToEdit.startingValue.toString());
      setTargetValue(goalToEdit.targetValue.toString());
      setCurrentValue(goalToEdit.currentValue.toString());
      setIsLowerBetter(goalToEdit.isLowerBetter);
      setTargetDate(goalToEdit.targetDate || '');
      setStatus(goalToEdit.status);
      setNotes(goalToEdit.notes || '');
    } else {
      setId('g-' + Date.now());
      setTitle('Target Body Weight');
      setCategory('weight');
      setUnit('kg');
      setStartingValue('84.5');
      setTargetValue('79.0');
      setCurrentValue('80.8');
      setIsLowerBetter(true);
      setTargetDate('2026-12-31');
      setStatus('active');
      setNotes('');
    }
  }, [goalToEdit, isOpen]);

  // Adjust unit default when category changes
  const handleCategoryChange = (newCat: GoalCategory) => {
    setCategory(newCat);
    if (newCat === 'weight') {
      setUnit('kg');
      setIsLowerBetter(true);
    } else if (newCat === 'distance_time') {
      setUnit('sec');
      setIsLowerBetter(true);
    } else if (newCat === 'distance') {
      setUnit('km/wk');
      setIsLowerBetter(false);
    } else if (newCat === 'frequency') {
      setUnit('sessions/wk');
      setIsLowerBetter(false);
    } else if (newCat === 'reps_sets') {
      setUnit('reps');
      setIsLowerBetter(false);
    } else if (newCat === 'timed_exercise') {
      setUnit('sec');
      setIsLowerBetter(false);
    } else if (newCat === 'measurement') {
      setUnit('cm');
      setIsLowerBetter(true);
    } else if (newCat === 'water') {
      setUnit('L/day');
      setIsLowerBetter(false);
    } else if (newCat === 'sleep') {
      setUnit('hrs/day');
      setIsLowerBetter(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert('Please enter a goal title');
      return;
    }

    const sVal = parseFloat(startingValue) || 0;
    const tVal = parseFloat(targetValue) || 0;
    const cVal = parseFloat(currentValue) || 0;

    const item: GoalItem = {
      id: id || 'g-' + Date.now(),
      title: title.trim(),
      category,
      unit: unit.trim() || 'units',
      startingValue: sVal,
      targetValue: tVal,
      currentValue: cVal,
      isLowerBetter,
      targetDate: targetDate || undefined,
      status,
      notes: notes.trim() || undefined,
      createdAt: goalToEdit?.createdAt || new Date().toISOString(),
    };

    db.saveGoal(item);
    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Goal' : 'Create Custom Goal'}
      subtitle="Define targets for exercise volume, cardio time, body composition, or habits"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Goal Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="e.g. 5 km Run Under 24:00"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value as GoalCategory)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="weight">Body Weight</option>
              <option value="distance_time">Cardio Distance-Specific Time</option>
              <option value="distance">Cardio Mileage (e.g. Weekly)</option>
              <option value="frequency">Workout Frequency</option>
              <option value="reps_sets">Repetition Target</option>
              <option value="timed_exercise">Timed Exercise Hold</option>
              <option value="measurement">Body Measurement (cm)</option>
              <option value="water">Daily Water Intake</option>
              <option value="sleep">Daily Sleep Target</option>
              <option value="custom">Other Custom Metric</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Unit
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. kg, reps, sec, km/wk"
            />
          </div>
        </div>

        {/* Value inputs */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400">Starting</span>
            <input
              type="number"
              step="any"
              value={startingValue}
              onChange={(e) => setStartingValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-semibold"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400">Current</span>
            <input
              type="number"
              step="any"
              value={currentValue}
              onChange={(e) => setCurrentValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <div>
            <span className="text-[10px] text-slate-400">Target</span>
            <input
              type="number"
              step="any"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-bold"
            />
          </div>
        </div>

        {/* Direction Toggle */}
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isLowerBetter}
              onChange={(e) => setIsLowerBetter(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-semibold block">Lower value is better</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Enable for run times, weight loss, or waist reduction
              </span>
            </div>
          </label>
        </div>

        {/* Target Date & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Date (optional)
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as GoalStatus)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Goal Notes & Action Plan
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Training plan, milestones, progress thoughts..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            Save Goal
          </button>
        </div>
      </div>
    </Modal>
  );
};

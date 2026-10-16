import React, { useState, useEffect } from 'react';
import { DailyHabitEntry } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';

interface HabitEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: DailyHabitEntry | null;
  targetDate?: string;
  onSaved: () => void;
}

export const HabitEditorModal: React.FC<HabitEditorModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  targetDate,
  onSaved,
}) => {
  const [id, setId] = useState('');
  const [date, setDate] = useState('');
  const [waterLitres, setWaterLitres] = useState<string>('2.5');
  const [sleepHours, setSleepHours] = useState<string>('7.5');
  const [energyRating, setEnergyRating] = useState<number | null>(4);
  const [moodRating, setMoodRating] = useState<number | null>(4);
  const [stressRating, setStressRating] = useState<number | null>(2);
  const [muscleSoreness, setMuscleSoreness] = useState<string>('2');
  const [painDiscomfort, setPainDiscomfort] = useState<string>('0');
  const [stepCount, setStepCount] = useState<string>('10000');
  const [isRestDay, setIsRestDay] = useState<boolean>(false);
  const [isVapeFree, setIsVapeFree] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (entryToEdit) {
      setId(entryToEdit.id);
      setDate(entryToEdit.date);
      setWaterLitres(entryToEdit.waterLitres !== undefined && entryToEdit.waterLitres !== null ? entryToEdit.waterLitres.toString() : '');
      setSleepHours(entryToEdit.sleepHours !== undefined && entryToEdit.sleepHours !== null ? entryToEdit.sleepHours.toString() : '');
      setEnergyRating(entryToEdit.energyRating ?? null);
      setMoodRating(entryToEdit.moodRating ?? null);
      setStressRating(entryToEdit.stressRating ?? null);
      setMuscleSoreness(entryToEdit.muscleSoreness !== undefined && entryToEdit.muscleSoreness !== null ? entryToEdit.muscleSoreness.toString() : '');
      setPainDiscomfort(entryToEdit.painDiscomfort !== undefined && entryToEdit.painDiscomfort !== null ? entryToEdit.painDiscomfort.toString() : '');
      setStepCount(entryToEdit.stepCount !== undefined && entryToEdit.stepCount !== null ? entryToEdit.stepCount.toString() : '');
      setIsRestDay(entryToEdit.isRestDay);
      setIsVapeFree(entryToEdit.isVapeFree);
      setNotes(entryToEdit.notes || '');
    } else {
      const todayStr = targetDate || new Date().toISOString().slice(0, 10);
      setId('h-' + Date.now());
      setDate(todayStr);
      setWaterLitres('2.5');
      setSleepHours('7.5');
      setEnergyRating(4);
      setMoodRating(4);
      setStressRating(2);
      setMuscleSoreness('2');
      setPainDiscomfort('0');
      setStepCount('10000');
      setIsRestDay(false);
      setIsVapeFree(true);
      setNotes('');
    }
  }, [entryToEdit, targetDate, isOpen]);

  const handleSave = () => {
    const parseOrNull = (v: string): number | null => {
      const num = parseFloat(v);
      return !isNaN(num) ? num : null;
    };

    const entry: DailyHabitEntry = {
      id: id || 'h-' + Date.now(),
      date: date || new Date().toISOString().slice(0, 10),
      waterLitres: parseOrNull(waterLitres),
      sleepHours: parseOrNull(sleepHours),
      energyRating: energyRating ?? null,
      moodRating: moodRating ?? null,
      stressRating: stressRating ?? null,
      muscleSoreness: parseOrNull(muscleSoreness),
      painDiscomfort: parseOrNull(painDiscomfort),
      stepCount: stepCount ? parseInt(stepCount) : null,
      isRestDay,
      isVapeFree,
      notes: notes.trim() || undefined,
      createdAt: entryToEdit?.createdAt || new Date().toISOString(),
    };

    db.saveHabit(entry);
    onSaved();
    onClose();
  };

  const addWater = (amount: number) => {
    const current = parseFloat(waterLitres) || 0;
    setWaterLitres((Math.round((current + amount) * 10) / 10).toString());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? 'Edit Daily Habit & Wellbeing' : 'Log Daily Wellbeing'}
      subtitle="Track your sleep, water, energy, soreness, and recovery"
      maxWidth="md"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Water & Sleep */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Water Intake (L)
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => addWater(0.25)}
                  className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-cyan-500/30 rounded text-cyan-600 dark:text-cyan-400 font-medium cursor-pointer"
                >
                  +250ml
                </button>
                <button
                  type="button"
                  onClick={() => addWater(0.5)}
                  className="px-1.5 py-0.5 text-[10px] bg-white dark:bg-slate-800 border border-cyan-500/30 rounded text-cyan-600 dark:text-cyan-400 font-medium cursor-pointer"
                >
                  +500ml
                </button>
              </div>
            </div>
            <input
              type="number"
              step="0.1"
              min="0"
              value={waterLitres}
              onChange={(e) => setWaterLitres(e.target.value)}
              className="w-full px-2.5 py-1.5 text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
              placeholder="e.g. 2.5"
            />
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Sleep Duration (Hours)
            </label>
            <input
              type="number"
              step="0.25"
              min="0"
              max="24"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
              className="w-full px-2.5 py-1.5 text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
              placeholder="e.g. 7.5"
            />
          </div>
        </div>

        {/* 1-5 Ratings: Energy, Mood, Stress */}
        <div className="space-y-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Energy Level (1-5)</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {energyRating ? `${energyRating} / 5` : 'Skipped'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setEnergyRating(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    energyRating === lvl
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Mood (1-5)</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {moodRating ? `${moodRating} / 5` : 'Skipped'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setMoodRating(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    moodRating === lvl
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Stress (1-5)</span>
              <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {stressRating ? `${stressRating} / 5` : 'Skipped'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setStressRating(lvl)}
                  className={`py-1.5 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                    stressRating === lvl
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Muscle Soreness & Pain & Steps */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Soreness (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={muscleSoreness}
              onChange={(e) => setMuscleSoreness(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Pain (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={painDiscomfort}
              onChange={(e) => setPainDiscomfort(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Step Count
            </label>
            <input
              type="number"
              min="0"
              value={stepCount}
              onChange={(e) => setStepCount(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
              placeholder="e.g. 10000"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isRestDay}
              onChange={(e) => setIsRestDay(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Rest Day</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isVapeFree}
              onChange={(e) => setIsVapeFree(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Vape-Free Day</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Wellbeing Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Notes on recovery, mood, nutrition, sleep quality..."
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
            Save Wellbeing Entry
          </button>
        </div>
      </div>
    </Modal>
  );
};

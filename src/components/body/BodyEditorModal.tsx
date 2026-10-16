import React, { useState, useEffect } from 'react';
import { BodyMeasurementEntry, CustomMeasurement } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { Plus, Trash2 } from 'lucide-react';

interface BodyEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  entryToEdit?: BodyMeasurementEntry | null;
  onSaved: () => void;
}

export const BodyEditorModal: React.FC<BodyEditorModalProps> = ({
  isOpen,
  onClose,
  entryToEdit,
  onSaved,
}) => {
  const [id, setId] = useState('');
  const [date, setDate] = useState('');
  const [weightKg, setWeightKg] = useState<string>('');
  const [bodyFatPercentage, setBodyFatPercentage] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [hipCm, setHipCm] = useState<string>('');
  const [chestCm, setChestCm] = useState<string>('');
  const [leftArmCm, setLeftArmCm] = useState<string>('');
  const [rightArmCm, setRightArmCm] = useState<string>('');
  const [leftThighCm, setLeftThighCm] = useState<string>('');
  const [rightThighCm, setRightThighCm] = useState<string>('');
  const [neckCm, setNeckCm] = useState<string>('');
  const [customMeasurements, setCustomMeasurements] = useState<CustomMeasurement[]>([]);
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (entryToEdit) {
      setId(entryToEdit.id);
      setDate(entryToEdit.date);
      setWeightKg(entryToEdit.weightKg !== undefined && entryToEdit.weightKg !== null ? entryToEdit.weightKg.toString() : '');
      setBodyFatPercentage(entryToEdit.bodyFatPercentage !== undefined && entryToEdit.bodyFatPercentage !== null ? entryToEdit.bodyFatPercentage.toString() : '');
      setWaistCm(entryToEdit.waistCm !== undefined && entryToEdit.waistCm !== null ? entryToEdit.waistCm.toString() : '');
      setHipCm(entryToEdit.hipCm !== undefined && entryToEdit.hipCm !== null ? entryToEdit.hipCm.toString() : '');
      setChestCm(entryToEdit.chestCm !== undefined && entryToEdit.chestCm !== null ? entryToEdit.chestCm.toString() : '');
      setLeftArmCm(entryToEdit.leftArmCm !== undefined && entryToEdit.leftArmCm !== null ? entryToEdit.leftArmCm.toString() : '');
      setRightArmCm(entryToEdit.rightArmCm !== undefined && entryToEdit.rightArmCm !== null ? entryToEdit.rightArmCm.toString() : '');
      setLeftThighCm(entryToEdit.leftThighCm !== undefined && entryToEdit.leftThighCm !== null ? entryToEdit.leftThighCm.toString() : '');
      setRightThighCm(entryToEdit.rightThighCm !== undefined && entryToEdit.rightThighCm !== null ? entryToEdit.rightThighCm.toString() : '');
      setNeckCm(entryToEdit.neckCm !== undefined && entryToEdit.neckCm !== null ? entryToEdit.neckCm.toString() : '');
      setCustomMeasurements(entryToEdit.customMeasurements ? [...entryToEdit.customMeasurements] : []);
      setNotes(entryToEdit.notes || '');
    } else {
      setId('m-' + Date.now());
      setDate(new Date().toISOString().slice(0, 16));
      setWeightKg('80.5');
      setBodyFatPercentage('');
      setWaistCm('');
      setHipCm('');
      setChestCm('');
      setLeftArmCm('');
      setRightArmCm('');
      setLeftThighCm('');
      setRightThighCm('');
      setNeckCm('');
      setCustomMeasurements([]);
      setNotes('');
    }
  }, [entryToEdit, isOpen]);

  const handleAddCustom = () => {
    const name = prompt('Custom measurement name (e.g., Forearms, Calves, Shoulders):');
    if (!name || !name.trim()) return;
    setCustomMeasurements([...customMeasurements, { name: name.trim(), valueCm: 35 }]);
  };

  const handleRemoveCustom = (idx: number) => {
    setCustomMeasurements(customMeasurements.filter((_, i) => i !== idx));
  };

  const handleUpdateCustom = (idx: number, val: number) => {
    const updated = [...customMeasurements];
    updated[idx].valueCm = val;
    setCustomMeasurements(updated);
  };

  const handleSave = () => {
    const parseOrNull = (v: string): number | null => {
      const num = parseFloat(v);
      return !isNaN(num) && num > 0 ? num : null;
    };

    const entry: BodyMeasurementEntry = {
      id: id || 'm-' + Date.now(),
      date: date || new Date().toISOString(),
      weightKg: parseOrNull(weightKg),
      bodyFatPercentage: parseOrNull(bodyFatPercentage),
      waistCm: parseOrNull(waistCm),
      hipCm: parseOrNull(hipCm),
      chestCm: parseOrNull(chestCm),
      leftArmCm: parseOrNull(leftArmCm),
      rightArmCm: parseOrNull(rightArmCm),
      leftThighCm: parseOrNull(leftThighCm),
      rightThighCm: parseOrNull(rightThighCm),
      neckCm: parseOrNull(neckCm),
      customMeasurements: customMeasurements.filter((c) => c.valueCm > 0),
      notes: notes.trim() || undefined,
      createdAt: entryToEdit?.createdAt || new Date().toISOString(),
    };

    db.saveMeasurement(entry);
    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entryToEdit ? 'Edit Body Measurements' : 'Log Body Measurements'}
      subtitle="Leave any unmeasured fields blank — empty fields are never treated as zero"
      maxWidth="lg"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        {/* Primary Metrics: Weight & Body Fat */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="350"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
              placeholder="e.g. 80.5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Body Fat % (optional)
            </label>
            <input
              type="number"
              step="0.1"
              min="3"
              max="65"
              value={bodyFatPercentage}
              onChange={(e) => setBodyFatPercentage(e.target.value)}
              className="w-full px-3 py-2 text-base font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white tabular-nums"
              placeholder="e.g. 17.5"
            />
          </div>
        </div>

        {/* Circumferences in Centimetres */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Circumference Measurements (cm)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div>
              <span className="text-[11px] text-slate-500">Waist</span>
              <input
                type="number"
                step="0.1"
                min="30"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Hips</span>
              <input
                type="number"
                step="0.1"
                min="30"
                value={hipCm}
                onChange={(e) => setHipCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Chest</span>
              <input
                type="number"
                step="0.1"
                min="30"
                value={chestCm}
                onChange={(e) => setChestCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Left Arm</span>
              <input
                type="number"
                step="0.1"
                min="15"
                value={leftArmCm}
                onChange={(e) => setLeftArmCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Right Arm</span>
              <input
                type="number"
                step="0.1"
                min="15"
                value={rightArmCm}
                onChange={(e) => setRightArmCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Neck</span>
              <input
                type="number"
                step="0.1"
                min="20"
                value={neckCm}
                onChange={(e) => setNeckCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Left Thigh</span>
              <input
                type="number"
                step="0.1"
                min="25"
                value={leftThighCm}
                onChange={(e) => setLeftThighCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>

            <div>
              <span className="text-[11px] text-slate-500">Right Thigh</span>
              <input
                type="number"
                step="0.1"
                min="25"
                value={rightThighCm}
                onChange={(e) => setRightThighCm(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
            </div>
          </div>
        </div>

        {/* Custom Measurements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Custom Measurements ({customMeasurements.length})
            </h4>
            <button
              type="button"
              onClick={handleAddCustom}
              className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Metric</span>
            </button>
          </div>

          {customMeasurements.map((cm, idx) => (
            <div key={idx} className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 w-28 truncate">
                {cm.name}
              </span>
              <input
                type="number"
                step="0.1"
                value={cm.valueCm}
                onChange={(e) => handleUpdateCustom(idx, parseFloat(e.target.value) || 0)}
                className="w-24 px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
                placeholder="cm"
              />
              <span className="text-xs text-slate-400">cm</span>
              <button
                type="button"
                onClick={() => handleRemoveCustom(idx)}
                className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
            placeholder="Time of day, hydration state, tape placement notes..."
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
            Save Measurements
          </button>
        </div>
      </div>
    </Modal>
  );
};

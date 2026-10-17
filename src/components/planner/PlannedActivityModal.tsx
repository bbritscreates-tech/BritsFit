import React, { useState, useEffect } from 'react';
import {
  PlannedActivity,
  PlannedActivityType,
  WorkoutTemplate,
  CardioActivityType,
  RecurrenceType,
} from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  Dumbbell,
  Footprints,
  Repeat,
  Bell,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface PlannedActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityToEdit?: PlannedActivity | null;
  initialDate?: string;
  onSaved: () => void;
}

export const PlannedActivityModal: React.FC<PlannedActivityModalProps> = ({
  isOpen,
  onClose,
  activityToEdit,
  initialDate,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<PlannedActivityType>('workout_template');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [linkedTemplateId, setLinkedTemplateId] = useState('');
  const [cardioActivityType, setCardioActivityType] = useState<CardioActivityType>('running');
  const [targetDistanceKm, setTargetDistanceKm] = useState('5.0');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderAdvance, setReminderAdvance] = useState('15');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');
  const [notes, setNotes] = useState('');

  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    setTemplates(db.getTemplates());
  }, [isOpen]);

  useEffect(() => {
    if (activityToEdit) {
      setTitle(activityToEdit.title);
      setActivityType(activityToEdit.activityType);
      setDate(activityToEdit.date);
      setStartTime(activityToEdit.startTime || '09:00');
      setDurationMinutes(activityToEdit.durationMinutes?.toString() || '60');
      setLinkedTemplateId(activityToEdit.linkedTemplateId || '');
      setCardioActivityType(activityToEdit.cardioActivityType || 'running');
      setTargetDistanceKm(activityToEdit.targetDistanceKm?.toString() || '5.0');
      setReminderEnabled(!!activityToEdit.reminder?.enabled);
      setReminderAdvance(activityToEdit.reminder?.advanceMinutes?.toString() || '15');
      setRecurrenceType(activityToEdit.recurrence?.type || 'none');
      setNotes(activityToEdit.notes || '');
    } else {
      setTitle('');
      setActivityType('workout_template');
      setDate(initialDate || new Date().toISOString().slice(0, 10));
      setStartTime('09:00');
      setDurationMinutes('60');
      setLinkedTemplateId(templates[0]?.id || '');
      setCardioActivityType('running');
      setTargetDistanceKm('5.0');
      setReminderEnabled(true);
      setReminderAdvance('15');
      setRecurrenceType('none');
      setNotes('');
    }
  }, [activityToEdit, initialDate, isOpen, templates]);

  const handleTemplateChange = (tmplId: string) => {
    setLinkedTemplateId(tmplId);
    const tmpl = templates.find((t) => t.id === tmplId);
    if (tmpl && (!title || title.startsWith('Workout:') || title === '')) {
      setTitle(tmpl.name);
    }
  };

  const handleTypeChange = (type: PlannedActivityType) => {
    setActivityType(type);
    if (type === 'workout_template' && templates.length > 0) {
      setTitle(templates[0].name);
      setLinkedTemplateId(templates[0].id);
    } else if (type === 'run') {
      setTitle('Outdoor Run (5 km)');
      setCardioActivityType('running');
      setDurationMinutes('35');
    } else if (type === 'walk') {
      setTitle('Outdoor Walk');
      setCardioActivityType('walking');
      setDurationMinutes('40');
    } else if (type === 'treadmill') {
      setTitle('Treadmill Session');
      setCardioActivityType('treadmill');
      setDurationMinutes('30');
    } else if (type === 'rest_day') {
      setTitle('Rest & Mobility Day');
      setDurationMinutes('20');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle =
      title.trim() ||
      (activityType === 'workout_template'
        ? templates.find((t) => t.id === linkedTemplateId)?.name || 'Planned Workout'
        : 'Planned Fitness Session');

    const activity: PlannedActivity = {
      id: activityToEdit?.id || `pa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: finalTitle,
      activityType,
      date: date || new Date().toISOString().slice(0, 10),
      startTime: startTime || undefined,
      durationMinutes: parseInt(durationMinutes) || 45,
      linkedTemplateId: activityType === 'workout_template' ? linkedTemplateId || undefined : undefined,
      linkedTemplateName:
        activityType === 'workout_template'
          ? templates.find((t) => t.id === linkedTemplateId)?.name
          : undefined,
      cardioActivityType:
        ['run', 'walk', 'treadmill', 'cardio'].includes(activityType)
          ? cardioActivityType
          : undefined,
      targetDistanceKm:
        ['run', 'walk', 'treadmill', 'cardio'].includes(activityType)
          ? parseFloat(targetDistanceKm) || undefined
          : undefined,
      status: activityToEdit?.status || 'scheduled',
      reminder: reminderEnabled
        ? {
            enabled: true,
            time: startTime,
            advanceMinutes: parseInt(reminderAdvance) || 15,
          }
        : undefined,
      recurrence:
        recurrenceType !== 'none'
          ? {
              type: recurrenceType,
              interval: 1,
            }
          : undefined,
      notes: notes.trim() || undefined,
      createdAt: activityToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.savePlannedActivity(activity);

    // Save linked reminder
    if (reminderEnabled && date && startTime) {
      db.saveReminder({
        id: `rem-activity-${activity.id}`,
        title: `Workout Reminder: ${activity.title}`,
        message: `Scheduled today at ${startTime} (${activity.durationMinutes} mins)`,
        targetType: 'workout',
        targetId: activity.id,
        triggerTime: `${date}T${startTime}`,
        advanceMinutes: parseInt(reminderAdvance) || 15,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      });
    }

    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!activityToEdit) return;
    if (confirm('Cancel and remove this scheduled workout?')) {
      db.deletePlannedActivity(activityToEdit.id);
      db.deleteReminder(`rem-activity-${activityToEdit.id}`);
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activityToEdit ? 'Edit Scheduled Activity' : 'Schedule Workout or Cardio'}
      subtitle="Plan fitness sessions in advance on your calendar and agenda"
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Activity Type Picker */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
            Activity Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { id: 'workout_template', label: 'Workout Template', icon: Dumbbell },
              { id: 'run', label: 'Outdoor Run', icon: Footprints },
              { id: 'walk', label: 'Walk', icon: Footprints },
              { id: 'treadmill', label: 'Treadmill', icon: Footprints },
              { id: 'rest_day', label: 'Rest & Recovery', icon: Sparkles },
              { id: 'workout', label: 'Custom Session', icon: Dumbbell },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleTypeChange(t.id as PlannedActivityType)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-left cursor-pointer transition ${
                    activityType === t.id
                      ? 'border-[#1677E8] bg-[#1677E8]/10 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workout Template Selection */}
        {activityType === 'workout_template' && (
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Saved Template
            </label>
            <select
              value={linkedTemplateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.exercises.length} exercises)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Session Title
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Upper Body Push, 5K Tempo Run..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Date, Time & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1677E8]" />
              Date
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#12B8C7]" />
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duration (mins)
            </label>
            <input
              type="number"
              min="5"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Cardio Target Distance */}
        {['run', 'walk', 'treadmill', 'cardio'].includes(activityType) && (
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Distance (km)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={targetDistanceKm}
                onChange={(e) => setTargetDistanceKm(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cardio Mode
              </label>
              <select
                value={cardioActivityType}
                onChange={(e) => setCardioActivityType(e.target.value as CardioActivityType)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="running">Running</option>
                <option value="walking">Walking</option>
                <option value="treadmill_run">Treadmill Run</option>
                <option value="treadmill_walk">Treadmill Walk</option>
                <option value="cycling">Cycling</option>
                <option value="rowing">Rowing</option>
                <option value="hiit">HIIT Cardio</option>
              </select>
            </div>
          </div>
        )}

        {/* Reminders & Recurrence */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-[#1677E8]" />
                Reminder
              </label>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#1677E8]"
              />
            </div>
            {reminderEnabled && (
              <select
                value={reminderAdvance}
                onChange={(e) => setReminderAdvance(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="0">At scheduled time</option>
                <option value="15">15 minutes before</option>
                <option value="30">30 minutes before</option>
                <option value="60">1 hour before</option>
              </select>
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
              <Repeat className="w-3.5 h-3.5 text-[#12B8C7]" />
              Recurrence
            </label>
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="none">Once only</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every weekday (Mon-Fri)</option>
              <option value="weekly">Weekly on this day</option>
              <option value="biweekly">Every 2 weeks</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Focus & Preparation Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus on deep squat depth, hydrate 30m prior..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          {activityToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Cancel Plan</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-xs transition cursor-pointer"
            >
              {activityToEdit ? 'Save Changes' : 'Schedule Activity'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

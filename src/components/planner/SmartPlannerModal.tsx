import React, { useState } from 'react';
import { PlannerTask, PlannedActivity } from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import {
  Sparkles,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Dumbbell,
  Check,
} from 'lucide-react';

interface SmartPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: PlannerTask[];
  plannedActivities: PlannedActivity[];
  onScheduleApplied: () => void;
}

interface ProposedScheduleItem {
  id: string;
  type: 'workout' | 'task';
  title: string;
  proposedStartTime: string;
  proposedEndTime: string;
  durationMinutes: number;
  priority: string;
  isConfirmed: boolean;
}

export const SmartPlannerModal: React.FC<SmartPlannerModalProps> = ({
  isOpen,
  onClose,
  tasks,
  plannedActivities,
  onScheduleApplied,
}) => {
  const [wakeTime, setWakeTime] = useState('07:30');
  const [dayEndTime, setDayEndTime] = useState('21:30');
  const [preferredWorkoutWindow, setPreferredWorkoutWindow] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [hasGenerated, setHasGenerated] = useState(false);
  const [proposedSchedule, setProposedSchedule] = useState<ProposedScheduleItem[]>([]);

  const todayYmd = new Date().toISOString().slice(0, 10);

  const generateOptimalSchedule = () => {
    // Collect today's incomplete tasks and workouts
    const todaysTasks = tasks.filter((t) => t.status !== 'completed' && (!t.dueDate || t.dueDate === todayYmd));
    const todaysWorkouts = plannedActivities.filter((a) => a.date === todayYmd && a.status !== 'completed');

    const schedule: ProposedScheduleItem[] = [];

    // Schedule workout according to preferred window
    let currentHour = preferredWorkoutWindow === 'morning' ? 8 : preferredWorkoutWindow === 'afternoon' ? 14 : 18;
    let currentMinute = 30;

    const formatSlot = (h: number, m: number) =>
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    // 1. Position workouts first
    todaysWorkouts.forEach((w) => {
      const dur = w.durationMinutes || 60;
      const start = formatSlot(currentHour, currentMinute);
      const endMins = currentHour * 60 + currentMinute + dur;
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      const end = formatSlot(endH, endM);

      schedule.push({
        id: w.id,
        type: 'workout',
        title: w.title,
        proposedStartTime: start,
        proposedEndTime: end,
        durationMinutes: dur,
        priority: 'high',
        isConfirmed: true,
      });

      // advance slot
      currentHour = endH + (endM + 30 >= 60 ? 1 : 0);
      currentMinute = (endM + 30) % 60;
    });

    // 2. Sort tasks by urgent -> high -> normal -> low
    const priorityWeight: Record<string, number> = { urgent: 4, high: 3, normal: 2, low: 1 };
    const sortedTasks = [...todaysTasks].sort(
      (a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1)
    );

    // If starting time after workout is earlier than 10:00, start tasks from 10:30
    if (currentHour < 10 && preferredWorkoutWindow === 'morning') {
      currentHour = 10;
      currentMinute = 30;
    }

    sortedTasks.slice(0, 5).forEach((t) => {
      const dur = t.estimatedDurationMinutes || 30;
      const start = formatSlot(currentHour, currentMinute);
      const endMins = currentHour * 60 + currentMinute + dur;
      const endH = Math.floor(endMins / 60);
      const endM = endMins % 60;
      const end = formatSlot(endH, endM);

      schedule.push({
        id: t.id,
        type: 'task',
        title: t.title,
        proposedStartTime: start,
        proposedEndTime: end,
        durationMinutes: dur,
        priority: t.priority,
        isConfirmed: true,
      });

      // 15 min buffer between tasks
      const nextMins = endMins + 15;
      currentHour = Math.floor(nextMins / 60);
      currentMinute = nextMins % 60;
    });

    setProposedSchedule(schedule);
    setHasGenerated(true);
  };

  const toggleConfirm = (id: string) => {
    setProposedSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isConfirmed: !item.isConfirmed } : item))
    );
  };

  const handleApplySchedule = () => {
    // User must approve! Only updates confirmed items
    proposedSchedule
      .filter((item) => item.isConfirmed)
      .forEach((item) => {
        if (item.type === 'workout') {
          const act = plannedActivities.find((a) => a.id === item.id);
          if (act) {
            db.savePlannedActivity({
              ...act,
              startTime: item.proposedStartTime,
            });
          }
        } else {
          const task = tasks.find((t) => t.id === item.id);
          if (task) {
            db.saveTask({
              ...task,
              dueDate: todayYmd,
              startTime: item.proposedStartTime,
              endTime: item.proposedEndTime,
            });
          }
        }
      });

    onScheduleApplied();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Daily Planning Assistant"
      subtitle="Generate a structured, productive daily schedule based on priorities and workouts"
      maxWidth="lg"
    >
      <div className="space-y-5 text-xs">
        {/* Settings Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Day Start Time
            </label>
            <input
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target End of Day
            </label>
            <input
              type="time"
              value={dayEndTime}
              onChange={(e) => setDayEndTime(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Workout Window
            </label>
            <select
              value={preferredWorkoutWindow}
              onChange={(e) => setPreferredWorkoutWindow(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="morning">Morning (08:30)</option>
              <option value="afternoon">Afternoon (14:30)</option>
              <option value="evening">Evening (18:30)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        {!hasGenerated && (
          <div className="text-center py-6 space-y-3">
            <p className="text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
              The assistant will inspect your incomplete tasks, priorities, and today’s planned workouts to suggest a balanced, conflict-free agenda.
            </p>
            <button
              onClick={generateOptimalSchedule}
              className="px-6 py-2.5 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-md cursor-pointer inline-flex items-center gap-2 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#12B8C7]" />
              <span>Generate Today’s Schedule Proposal</span>
            </button>
          </div>
        )}

        {/* Proposed Schedule Result Table */}
        {hasGenerated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#1677E8]" />
                Proposed Schedule for Today ({proposedSchedule.length} slots)
              </span>
              <button
                onClick={generateOptimalSchedule}
                className="text-[11px] font-bold text-[#1677E8] hover:underline"
              >
                Regenerate
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto p-1">
              {proposedSchedule.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleConfirm(item.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                    item.isConfirmed
                      ? 'border-[#1677E8] bg-[#1677E8]/5 dark:bg-[#1677E8]/10'
                      : 'border-slate-200 dark:border-slate-800 opacity-50 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ${
                        item.isConfirmed
                          ? 'bg-[#1677E8] border-[#1677E8] text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {item.isConfirmed && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.type}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#1677E8]" />
                        {item.proposedStartTime} – {item.proposedEndTime} ({item.durationMinutes}m)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              Confirmation required: No changes will be applied to your calendar without clicking "Apply Selected Schedule".
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          {hasGenerated && (
            <button
              type="button"
              onClick={handleApplySchedule}
              className="px-5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-xs transition cursor-pointer"
            >
              Apply Selected Schedule
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

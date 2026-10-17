import React, { useState } from 'react';
import { MyDayCardConfig } from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import {
  Dumbbell,
  Footprints,
  CheckSquare,
  Calendar,
  Droplet,
  Sparkles,
  Clock,
  BookOpen,
  Check,
} from 'lucide-react';

interface CustomizeMyDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MyDayCardConfig;
  onSaved: () => void;
}

export const CustomizeMyDayModal: React.FC<CustomizeMyDayModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaved,
}) => {
  const [cards, setCards] = useState<MyDayCardConfig>(config);

  const toggle = (key: keyof MyDayCardConfig) => {
    setCards((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    db.savePlannerPreferences({ myDayCards: cards });
    onSaved();
    onClose();
  };

  const cardItems = [
    { key: 'plannedWorkouts', label: 'Today’s Planned Workouts', desc: 'Scheduled strength sessions & workout templates', icon: Dumbbell },
    { key: 'plannedCardio', label: 'Today’s Planned Cardio', desc: 'Running, outdoor walking, and treadmill logs', icon: Footprints },
    { key: 'tasks', label: 'Daily Tasks & Checklist', desc: 'To-dos with priorities, deadlines, and subtasks', icon: CheckSquare },
    { key: 'appointments', label: 'Appointments & Events', desc: 'Scheduled commitments and calendar activities', icon: Calendar },
    { key: 'water', label: 'Water & Hydration Tracker', desc: 'Daily target progress with quick +250ml logging', icon: Droplet },
    { key: 'habits', label: 'Daily Wellbeing & Habits', desc: 'Sleep, energy, recovery and rest day tracking', icon: Sparkles },
    { key: 'focusTimer', label: 'Focus Timer Block', desc: 'Quick-access Pomodoro deep work timer widget', icon: Clock },
    { key: 'quickNotes', label: 'Quick Journal & Notes', desc: 'Daily training reflections and personal notes', icon: BookOpen },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize My Day"
      subtitle="Choose which cards and widgets appear on your personal dashboard"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="space-y-2">
          {cardItems.map((item) => {
            const Icon = item.icon;
            const isChecked = cards[item.key as keyof MyDayCardConfig];

            return (
              <div
                key={item.key}
                onClick={() => toggle(item.key as keyof MyDayCardConfig)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                  isChecked
                    ? 'border-[#1677E8] bg-[#1677E8]/5 dark:bg-[#1677E8]/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 ${
                      isChecked ? 'bg-[#1677E8] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      {item.label}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                    isChecked
                      ? 'bg-[#1677E8] border-[#1677E8] text-white'
                      : 'border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-xs transition cursor-pointer"
          >
            Save Layout
          </button>
        </div>
      </div>
    </Modal>
  );
};

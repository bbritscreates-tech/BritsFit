import React from 'react';
import { Modal } from './Modal';
import { Dumbbell, Footprints, Scale, Sparkles } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: 'workout' | 'cardio' | 'body' | 'habit') => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSelectAction,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Entry"
      subtitle="Select the type of activity or metric to record"
      maxWidth="sm"
    >
      <div className="grid grid-cols-1 gap-2.5">
        <button
          onClick={() => {
            onClose();
            onSelectAction('workout');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 bg-white dark:bg-slate-900 hover:bg-emerald-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              Workout Session
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Exercises, sets, repetitions, and rest intervals
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            onClose();
            onSelectAction('cardio');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 bg-white dark:bg-slate-900 hover:bg-cyan-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Footprints className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
              Walking & Running
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Distance, pace, duration, steps, elevation
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            onClose();
            onSelectAction('body');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/50 bg-white dark:bg-slate-900 hover:bg-purple-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400">
              Body Measurement
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Weight, body fat %, waist, and circumferences
            </span>
          </div>
        </button>

        <button
          onClick={() => {
            onClose();
            onSelectAction('habit');
          }}
          className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 bg-white dark:bg-slate-900 hover:bg-amber-500/5 transition text-left cursor-pointer group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400">
              Daily Wellbeing Log
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Sleep, hydration, energy, mood, and soreness
            </span>
          </div>
        </button>
      </div>
    </Modal>
  );
};

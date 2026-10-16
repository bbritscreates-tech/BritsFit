import React, { useState, useEffect } from 'react';
import { WorkoutTemplate } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import { Play, Trash2, Plus } from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  const loadData = () => {
    setTemplates(db.getTemplates());
  };

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete template "${name}"?`)) {
      db.deleteTemplate(id);
      loadData();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Templates"
      subtitle="Reusable routines for fast session launching"
      maxWidth="md"
    >
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No templates saved yet. You can save any workout as a template while logging!
          </div>
        ) : (
          templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-3"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {tmpl.name}
                </h4>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {tmpl.workoutType} · {tmpl.exercises.length} exercises
                </span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {tmpl.exercises.map((e) => e.exerciseName).join(', ')}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(tmpl);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(tmpl.id, tmpl.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                  title="Delete template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

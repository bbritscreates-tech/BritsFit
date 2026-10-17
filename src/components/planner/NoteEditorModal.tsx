import React, { useState, useEffect } from 'react';
import { PersonalNote, TaskList, PlannerTask } from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import { Calendar, Tag, Trash2, Pin, ListTodo } from 'lucide-react';

interface NoteEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: PersonalNote | null;
  initialDate?: string;
  onSaved: () => void;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
  initialDate,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [linkedDate, setLinkedDate] = useState('');
  const [linkedListId, setLinkedListId] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  const [taskLists, setTaskLists] = useState<TaskList[]>([]);

  const categories = ['General', 'Journal', 'Ideas', 'Workout Reflection', 'Project', 'Nutrition'];

  useEffect(() => {
    setTaskLists(db.getTaskLists());
  }, [isOpen]);

  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContent(noteToEdit.content);
      setCategory(noteToEdit.category || 'General');
      setLinkedDate(noteToEdit.linkedDate || '');
      setLinkedListId(noteToEdit.linkedListId || '');
      setTagsInput(noteToEdit.tags?.join(', ') || '');
      setIsPinned(!!noteToEdit.isPinned);
    } else {
      setTitle('');
      setContent('');
      setCategory('General');
      setLinkedDate(initialDate || new Date().toISOString().slice(0, 10));
      setLinkedListId('');
      setTagsInput('');
      setIsPinned(false);
    }
  }, [noteToEdit, initialDate, isOpen]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const note: PersonalNote = {
      id: noteToEdit?.id || `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      category,
      linkedDate: linkedDate || undefined,
      linkedListId: linkedListId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      isPinned,
      createdAt: noteToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveNote(note);
    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!noteToEdit) return;
    if (confirm('Delete this note permanently?')) {
      db.deleteNote(noteToEdit.id);
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noteToEdit ? 'Edit Note' : 'New Note or Journal Entry'}
      subtitle="Private fitness reflections, ideas, and daily journal"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Title & Pin */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title or reflection headline..."
            className="flex-1 px-3 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-xl border transition cursor-pointer ${
              isPinned
                ? 'bg-amber-500/15 border-amber-500 text-amber-500 font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600'
            }`}
            title="Pin note to top"
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#1677E8]" />
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#12B8C7]" />
              Linked Date
            </label>
            <input
              type="date"
              value={linkedDate}
              onChange={(e) => setLinkedDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <ListTodo className="w-3.5 h-3.5 text-purple-500" />
              Linked Project
            </label>
            <select
              value={linkedListId}
              onChange={(e) => setLinkedListId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">No Project (Standalone)</option>
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Note Content
          </label>
          <textarea
            rows={8}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your personal reflections, training takeaways, ideas or logs..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-sans leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tags (comma separated)
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. Running, Recovery, High Energy, Goals"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          {noteToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Note</span>
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
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-xs transition cursor-pointer"
            >
              {noteToEdit ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

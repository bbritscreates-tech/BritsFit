import React, { useState, useEffect } from 'react';
import {
  PlannerTask,
  TaskPriority,
  TaskStatus,
  RecurrenceType,
  TaskSubtask,
  TaskList,
  WorkoutTemplate,
  CardioActivityType,
} from '../../types/fitness';
import { db } from '../../services/db';
import { Modal } from '../common/Modal';
import {
  Calendar,
  Clock,
  Flag,
  ListTodo,
  Tag,
  Repeat,
  Bell,
  Trash2,
  Plus,
  Dumbbell,
  Footprints,
  CheckCircle2,
} from 'lucide-react';

interface TaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: PlannerTask | null;
  initialDate?: string;
  initialCategory?: string;
  initialListId?: string;
  onSaved: () => void;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  isOpen,
  onClose,
  taskToEdit,
  initialDate,
  initialCategory,
  initialListId,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState('30');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [status, setStatus] = useState<TaskStatus>('not_started');
  const [category, setCategory] = useState('Personal');
  const [listId, setListId] = useState<string>('');
  const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Reminder settings
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [reminderAdvance, setReminderAdvance] = useState('15');

  // Recurrence settings
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('none');

  // Linked fitness activity
  const [linkedTemplateId, setLinkedTemplateId] = useState('');
  const [linkedCardioType, setLinkedCardioType] = useState<CardioActivityType | ''>('');

  // Data lists
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    setTaskLists(db.getTaskLists());
    setTemplates(db.getTemplates());
    const prefs = db.getPlannerPreferences();
    setCategories(prefs.customCategories || [
      'Personal',
      'Household',
      'Work',
      'Shopping',
      'Appointments',
      'Fitness',
      'Health',
      'Other',
    ]);
  }, [isOpen]);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setDueDate(taskToEdit.dueDate || '');
      setStartTime(taskToEdit.startTime || '');
      setEndTime(taskToEdit.endTime || '');
      setEstimatedDurationMinutes(taskToEdit.estimatedDurationMinutes?.toString() || '30');
      setPriority(taskToEdit.priority || 'normal');
      setStatus(taskToEdit.status || 'not_started');
      setCategory(taskToEdit.category || 'Personal');
      setListId(taskToEdit.listId || '');
      setSubtasks(taskToEdit.subtasks || []);
      setNotes(taskToEdit.notes || '');

      setReminderEnabled(!!taskToEdit.reminder?.enabled);
      setReminderTime(taskToEdit.reminder?.time || '');
      setReminderAdvance(taskToEdit.reminder?.advanceMinutes?.toString() || '15');

      setRecurrenceType(taskToEdit.recurrence?.type || 'none');
      setLinkedTemplateId(taskToEdit.linkedWorkoutTemplateId || '');
      setLinkedCardioType(taskToEdit.linkedCardioType || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(initialDate || new Date().toISOString().slice(0, 10));
      setStartTime('');
      setEndTime('');
      setEstimatedDurationMinutes('30');
      setPriority('normal');
      setStatus('not_started');
      setCategory(initialCategory || 'Personal');
      setListId(initialListId || '');
      setSubtasks([]);
      setNotes('');
      setReminderEnabled(false);
      setReminderTime('');
      setReminderAdvance('15');
      setRecurrenceType('none');
      setLinkedTemplateId('');
      setLinkedCardioType('');
    }
  }, [taskToEdit, initialDate, initialCategory, initialListId, isOpen]);

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const sub: TaskSubtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, sub]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((s) =>
        s.id === id
          ? {
              ...s,
              completed: !s.completed,
              completedAt: !s.completed ? new Date().toISOString() : undefined,
            }
          : s
      )
    );
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const task: PlannerTask = {
      id: taskToEdit?.id || `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      estimatedDurationMinutes: parseInt(estimatedDurationMinutes) || 30,
      actualDurationMinutes: taskToEdit?.actualDurationMinutes,
      priority,
      status,
      category,
      listId: listId || undefined,
      subtasks,
      notes: notes.trim() || undefined,
      reminder: reminderEnabled
        ? {
            enabled: true,
            time: reminderTime || startTime || undefined,
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
      linkedWorkoutTemplateId: linkedTemplateId || undefined,
      linkedCardioType: linkedCardioType ? (linkedCardioType as CardioActivityType) : undefined,
      completedAt: status === 'completed' ? taskToEdit?.completedAt || new Date().toISOString() : undefined,
      createdAt: taskToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveTask(task);

    // If reminder is enabled and has a due date, also sync to Reminders
    if (reminderEnabled && dueDate) {
      const remId = `rem-task-${task.id}`;
      const trigger = `${dueDate}T${reminderTime || startTime || '09:00'}`;
      db.saveReminder({
        id: remId,
        title: `Task: ${task.title}`,
        message: task.description || `Priority: ${task.priority.toUpperCase()}`,
        targetType: 'task',
        targetId: task.id,
        triggerTime: trigger,
        advanceMinutes: parseInt(reminderAdvance) || 15,
        isEnabled: true,
        createdAt: new Date().toISOString(),
      });
    }

    onSaved();
    onClose();
  };

  const handleDelete = () => {
    if (!taskToEdit) return;
    if (confirm('Are you sure you want to delete this task?')) {
      db.deleteTask(taskToEdit.id);
      db.deleteReminder(`rem-task-${taskToEdit.id}`);
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskToEdit ? 'Edit Task' : 'New Task'}
      subtitle="Organise deadlines, priorities, reminders and subtasks"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Pack gym gear, review training log, call dentist..."
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1677E8]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
            Description or Checklist Notes
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional context or details..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#1677E8]"
          />
        </div>

        {/* Date, Times & Estimated Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#1677E8]" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Leave empty for Inbox</span>
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
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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
              value={estimatedDurationMinutes}
              onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Priority, Status, Category, Project List */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Flag className="w-3.5 h-3.5 text-amber-500" />
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

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
              <ListTodo className="w-3.5 h-3.5 text-purple-500" />
              Project / List
            </label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
            >
              <option value="">No Project (General)</option>
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subtasks Checklist */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
          <label className="block font-bold text-slate-800 dark:text-slate-200">
            Subtasks Checklist ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
          </label>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {subtasks.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <button
                  type="button"
                  onClick={() => handleToggleSubtask(s.id)}
                  className="flex items-center gap-2 text-left flex-1 cursor-pointer"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center ${
                      s.completed
                        ? 'bg-[#1677E8] border-[#1677E8] text-white'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {s.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className={s.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}>
                    {s.title}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSubtask(s.id)}
                  className="text-slate-400 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="Add a subtask..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask(e);
                }
              }}
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-300 transition"
            >
              Add
            </button>
          </div>
        </div>

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
              <div className="grid grid-cols-2 gap-2 mt-2">
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <select
                  value={reminderAdvance}
                  onChange={(e) => setReminderAdvance(e.target.value)}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="0">At time</option>
                  <option value="10">10m before</option>
                  <option value="15">15m before</option>
                  <option value="30">30m before</option>
                  <option value="60">1 hour before</option>
                </select>
              </div>
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
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every weekday (Mon-Fri)</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        {/* Optional Link to Fitness Routine */}
        <div className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
          <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-[#1677E8]" />
            Link to Workout or Cardio Session (Optional)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={linkedTemplateId}
              onChange={(e) => {
                setLinkedTemplateId(e.target.value);
                if (e.target.value) setLinkedCardioType('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">No workout template linked</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  Template: {t.name}
                </option>
              ))}
            </select>

            <select
              value={linkedCardioType}
              onChange={(e) => {
                setLinkedCardioType(e.target.value as CardioActivityType);
                if (e.target.value) setLinkedTemplateId('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="">No cardio activity linked</option>
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
          {taskToEdit ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-semibold transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Task</span>
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
              {taskToEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

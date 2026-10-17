import React, { useState } from 'react';
import { PlannerTask, TaskList, TaskPriority } from '../../types/fitness';
import { db } from '../../services/db';
import {
  CheckSquare,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Flag,
  FolderPlus,
  Trash2,
  CheckCircle2,
  Circle,
  Inbox,
  AlertCircle,
  Play,
  MoreVertical,
  Check,
  RotateCcw,
} from 'lucide-react';

interface TasksViewProps {
  tasks: PlannerTask[];
  taskLists: TaskList[];
  onOpenTaskEditor: (task?: PlannerTask, initialListId?: string) => void;
  onOpenFocusTimer: (taskId?: string) => void;
  onRefresh: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  taskLists,
  onOpenTaskEditor,
  onOpenFocusTimer,
  onRefresh,
}) => {
  const [selectedListId, setSelectedListId] = useState<string>('all'); // 'all', 'inbox', or listId
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');

  const todayYmd = new Date().toISOString().slice(0, 10);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // List matching
    if (selectedListId === 'inbox') {
      if (task.listId || task.dueDate) return false;
    } else if (selectedListId !== 'all') {
      if (task.listId !== selectedListId) return false;
    }

    // Status / date filters
    if (activeFilter === 'today') {
      if (task.dueDate !== todayYmd) return false;
    } else if (activeFilter === 'upcoming') {
      if (!task.dueDate || task.dueDate <= todayYmd || task.status === 'completed') return false;
    } else if (activeFilter === 'overdue') {
      if (!task.dueDate || task.dueDate >= todayYmd || task.status === 'completed') return false;
    } else if (activeFilter === 'completed') {
      if (task.status !== 'completed') return false;
    }

    // Category filter
    if (selectedCategory !== 'all' && task.category !== selectedCategory) return false;

    // Priority filter
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = (task.description || '').toLowerCase().includes(q);
      const matchCategory = task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCategory) return false;
    }

    return true;
  });

  const handleToggleTask = (task: PlannerTask, e: React.MouseEvent) => {
    e.stopPropagation();
    db.toggleTaskComplete(task.id);
    onRefresh();
  };

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const newList: TaskList = {
      id: `list-${Date.now()}`,
      name: newListName.trim(),
      color: '#1677E8',
      isProject: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.saveTaskList(newList);
    setNewListName('');
    setIsAddingList(false);
    setSelectedListId(newList.id);
    onRefresh();
  };

  const handleDeleteList = (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this list? Tasks within it will be moved to general tasks.')) {
      db.deleteTaskList(listId);
      setSelectedListId('all');
      onRefresh();
    }
  };

  const priorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900';
      case 'high':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900';
      case 'normal':
        return 'text-[#1677E8] bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900';
      case 'low':
        return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    }
  };

  // Counts
  const overdueCount = tasks.filter((t) => t.dueDate && t.dueDate < todayYmd && t.status !== 'completed').length;
  const todayCount = tasks.filter((t) => t.dueDate === todayYmd && t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-[#1677E8]" />
            To-Do Lists &amp; Tasks
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organise tasks, projects, fitness preparation checklists, and recurring routines
          </p>
        </div>

        <button
          onClick={() => onOpenTaskEditor(undefined, selectedListId !== 'all' && selectedListId !== 'inbox' ? selectedListId : undefined)}
          className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white shadow-xs cursor-pointer self-start sm:self-auto transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Main Layout: Left List Sidebar + Right Task Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Sidebar: Named Lists & Projects */}
        <div className="space-y-4 lg:col-span-1">
          <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-1 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1 block">
              Views
            </span>

            <button
              onClick={() => setSelectedListId('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer text-left ${
                selectedListId === 'all'
                  ? 'bg-[#1677E8] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CheckSquare className="w-4 h-4" />
                <span>All Tasks</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedListId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {tasks.filter((t) => t.status !== 'completed').length}
              </span>
            </button>

            <button
              onClick={() => setSelectedListId('inbox')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-semibold transition cursor-pointer text-left ${
                selectedListId === 'inbox'
                  ? 'bg-[#1677E8] text-white shadow-xs'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Inbox / Unscheduled</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedListId === 'inbox' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {tasks.filter((t) => !t.dueDate && t.status !== 'completed').length}
              </span>
            </button>

            {/* Named Project Lists */}
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between px-2 py-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Lists &amp; Projects ({taskLists.length})
                </span>
                <button
                  onClick={() => setIsAddingList(!isAddingList)}
                  className="text-[#1677E8] hover:underline text-[11px] font-bold"
                >
                  + Add
                </button>
              </div>

              {isAddingList && (
                <form onSubmit={handleCreateList} className="p-2 space-y-2 mt-1">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="List or project name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingList(false)}
                      className="px-2 py-1 rounded text-[11px] text-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded bg-[#1677E8] text-white font-bold text-[11px]"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-0.5 mt-1">
                {taskLists.map((l) => {
                  const listTasks = tasks.filter((t) => t.listId === l.id);
                  const completedListTasks = listTasks.filter((t) => t.status === 'completed');
                  const percent = listTasks.length > 0 ? Math.round((completedListTasks.length / listTasks.length) * 100) : 0;

                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedListId(l.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition cursor-pointer text-left group ${
                        selectedListId === l.id
                          ? 'bg-[#1677E8] text-white font-bold shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: l.color || '#1677E8' }} />
                        <span className="truncate">{l.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[10px] ${selectedListId === l.id ? 'text-white/80' : 'text-slate-400'}`}>
                          {listTasks.length > 0 ? `${percent}%` : '0'}
                        </span>
                        <Trash2
                          onClick={(e) => handleDeleteList(l.id, e)}
                          className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition ${
                            selectedListId === l.id ? 'text-white hover:text-rose-200' : 'text-slate-400 hover:text-rose-500'
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Main Content: Filters & Task Cards */}
        <div className="space-y-4 lg:col-span-3">
          {/* Top Filter Buttons & Search */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All' },
                { id: 'today', label: `Today (${todayCount})` },
                { id: 'upcoming', label: 'Upcoming' },
                { id: 'overdue', label: `Overdue (${overdueCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeFilter === f.id
                      ? 'bg-[#1677E8] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Task Items List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <div className="w-12 h-12 rounded-2xl bg-[#1677E8]/10 text-[#1677E8] flex items-center justify-center mx-auto mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                No tasks found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {activeFilter === 'overdue'
                  ? 'Great job! You have zero overdue tasks.'
                  : 'Add tasks, checklist items, or fitness preparation routines.'}
              </p>
              <button
                onClick={() => onOpenTaskEditor(undefined, selectedListId !== 'all' && selectedListId !== 'inbox' ? selectedListId : undefined)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const isOverdue = task.dueDate && task.dueDate < todayYmd && task.status !== 'completed';
                const completedSubs = task.subtasks.filter((s) => s.completed).length;

                return (
                  <div
                    key={task.id}
                    onClick={() => onOpenTaskEditor(task)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group bg-white dark:bg-slate-900/70 shadow-xs ${
                      task.status === 'completed'
                        ? 'opacity-65 border-slate-200 dark:border-slate-800'
                        : isOverdue
                        ? 'border-rose-400 dark:border-rose-800/80 hover:border-rose-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-[#1677E8]/50'
                    }`}
                  >
                    {/* Left: Checkbox & Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={(e) => handleToggleTask(task, e)}
                        className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-700 hover:border-[#1677E8] bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {task.status === 'completed' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4
                            className={`font-bold text-sm tracking-tight text-slate-900 dark:text-white ${
                              task.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : ''
                            }`}
                          >
                            {task.title}
                          </h4>

                          {/* Priority Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityColor(task.priority)}`}>
                            {task.priority.toUpperCase()}
                          </span>

                          {/* Category Badge */}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {task.category}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Meta: Due date, time, subtasks */}
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex-wrap">
                          {task.dueDate && (
                            <span className={`flex items-center gap-1 font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}>
                              <Calendar className="w-3.5 h-3.5 text-[#1677E8]" />
                              {task.dueDate === todayYmd ? 'Today' : task.dueDate}
                              {task.startTime && ` at ${task.startTime}`}
                            </span>
                          )}

                          {task.subtasks && task.subtasks.length > 0 && (
                            <span className="flex items-center gap-1 text-slate-500">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              {completedSubs}/{task.subtasks.length} subtasks
                            </span>
                          )}

                          {task.actualDurationMinutes ? (
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              {task.actualDurationMinutes}m focused
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Focus Timer trigger */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {task.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenFocusTimer(task.id);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-bold text-xs transition cursor-pointer"
                          title="Start focus timer for this task"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Focus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { PlannerTask, FocusSession } from '../../types/fitness';
import { db } from '../../services/db';
import { notifications } from '../../services/notificationService';
import { Modal } from '../common/Modal';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  ListTodo,
  Check,
} from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTaskId?: string;
  onSessionCompleted?: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  isOpen,
  onClose,
  selectedTaskId,
  onSessionCompleted,
}) => {
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string>('');
  const [presetDuration, setPresetDuration] = useState<number>(25); // minutes
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [completedSessions, setCompletedSessions] = useState<FocusSession[]>([]);

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      const allTasks = db.getTasks().filter((t) => t.status !== 'completed');
      setTasks(allTasks);
      setActiveTaskId(selectedTaskId || (allTasks[0]?.id || ''));
      setCompletedSessions(db.getFocusSessions().slice(0, 5));
    }
  }, [isOpen, selectedTaskId]);

  useEffect(() => {
    setTimeLeftSeconds(presetDuration * 60);
    setElapsedSeconds(0);
    setIsRunning(false);
  }, [presetDuration]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            handleCompleteSession(true);
            return 0;
          }
          return prev - 1;
        });
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleCompleteSession = (reachedTarget: boolean) => {
    setIsRunning(false);
    notifications.notify(
      'Focus Session Complete! 🎯',
      `You focused for ${Math.round(elapsedSeconds / 60)} minutes.`
    );

    const task = tasks.find((t) => t.id === activeTaskId);
    const actualMins = Math.max(1, Math.round(elapsedSeconds / 60));

    const session: FocusSession = {
      id: `focus-${Date.now()}`,
      taskId: task?.id,
      taskTitle: task?.title || 'Freeform Focus',
      durationMinutes: presetDuration,
      actualMinutes: actualMins,
      completed: reachedTarget,
      notes: sessionNotes.trim() || undefined,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    db.saveFocusSession(session);

    // If attached to a task, increment its actualDurationMinutes without overwriting estimated duration!
    if (task) {
      const curActual = task.actualDurationMinutes || 0;
      db.saveTask({
        ...task,
        actualDurationMinutes: curActual + actualMins,
      });
    }

    setCompletedSessions(db.getFocusSessions().slice(0, 5));
    if (onSessionCompleted) onSessionCompleted();
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeftSeconds(presetDuration * 60);
    setElapsedSeconds(0);
  };

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const selectedTask = tasks.find((t) => t.id === activeTaskId);
  const progressPercent = Math.min(100, Math.round((elapsedSeconds / (presetDuration * 60)) * 100));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Timer & Deep Work"
      subtitle="Pomodoro focus blocks for tasks, reading, or workout prep"
      maxWidth="md"
    >
      <div className="space-y-6 text-center">
        {/* Task Selector */}
        <div className="text-left">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <ListTodo className="w-3.5 h-3.5 text-[#1677E8]" />
            Target Task (Optional)
          </label>
          <select
            value={activeTaskId}
            onChange={(e) => setActiveTaskId(e.target.value)}
            disabled={isRunning}
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
          >
            <option value="">Freeform Focus (No linked task)</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.priority.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Preset duration buttons */}
        <div className="flex items-center justify-center gap-2">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                if (!isRunning) setPresetDuration(mins);
              }}
              disabled={isRunning}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                presetDuration === mins
                  ? 'bg-[#1677E8] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Circular Display */}
        <div className="relative w-56 h-56 mx-auto flex flex-col items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="112"
              cy="112"
              r="96"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="112"
              cy="112"
              r="96"
              className="stroke-[#1677E8] transition-all duration-1000 ease-linear"
              strokeWidth="10"
              strokeDasharray={2 * Math.PI * 96}
              strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatTime(timeLeftSeconds)}
            </span>
            <span className="text-[11px] font-bold text-[#12B8C7] uppercase tracking-wider mt-1">
              {isRunning ? 'Focus In Progress' : 'Ready to Focus'}
            </span>
            {selectedTask && (
              <span className="text-[10px] text-slate-400 max-w-[140px] truncate mt-1">
                {selectedTask.title}
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#1677E8] hover:bg-[#1361BD] text-white font-bold shadow-md cursor-pointer transition active:scale-95"
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            disabled={elapsedSeconds === 0}
            className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {elapsedSeconds > 60 && (
            <button
              onClick={() => handleCompleteSession(false)}
              className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition cursor-pointer text-xs"
              title="Record completed minutes"
            >
              <Check className="w-4 h-4" />
              <span>Log {Math.round(elapsedSeconds / 60)}m</span>
            </button>
          )}
        </div>

        {/* Recent Focus Log */}
        {completedSessions.length > 0 && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-left">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Recent Completed Focus Sessions
            </h4>
            <div className="space-y-1.5">
              {completedSessions.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                    {s.taskTitle}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    +{s.actualMinutes} mins
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

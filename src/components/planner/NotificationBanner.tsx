import React, { useEffect, useState } from 'react';
import { notifications } from '../../services/notificationService';
import { db } from '../../services/db';
import { Bell, Check, Clock, X } from 'lucide-react';

interface ActiveNotification {
  id: string;
  title: string;
  message: string;
  targetId?: string;
  timestamp: number;
}

export const NotificationBanner: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<ActiveNotification[]>([]);

  useEffect(() => {
    // 1. Subscribe to notificationService
    const unsub = notifications.subscribeInApp((title, message, targetId) => {
      const alert: ActiveNotification = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        message,
        targetId,
        timestamp: Date.now(),
      };
      setActiveAlerts((prev) => [alert, ...prev.slice(0, 2)]);
    });

    // 2. Periodic reminder checker (checks tasks and reminders)
    const checkReminders = () => {
      const now = new Date();
      const currentIso = now.toISOString();
      const todayYmd = currentIso.slice(0, 10);
      const currentHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      // Check reminders table
      const allReminders = db.getReminders();
      allReminders.forEach((rem) => {
        if (!rem.isEnabled || rem.isCompleted) return;

        // If snoozed, check snooze time
        if (rem.isSnoozed && rem.snoozedUntil) {
          if (new Date(rem.snoozedUntil).getTime() <= now.getTime()) {
            notifications.notify(rem.title, rem.message || 'Scheduled Reminder', rem.id);
            db.saveReminder({ ...rem, isSnoozed: false, snoozedUntil: undefined });
          }
          return;
        }

        // Compare triggerTime
        if (rem.triggerTime) {
          // Format may be YYYY-MM-DDTHH:MM or YYYY-MM-DD
          if (rem.triggerTime.includes('T')) {
            const [datePart, timePart] = rem.triggerTime.split('T');
            if (datePart === todayYmd && timePart.slice(0, 5) === currentHhMm) {
              notifications.notify(rem.title, rem.message || 'Scheduled Reminder', rem.id);
            }
          }
        }
      });

      // Check tasks with reminders
      const tasks = db.getTasks();
      tasks.forEach((t) => {
        if (t.status === 'completed' || !t.reminder?.enabled || !t.dueDate || t.reminder.notified) return;
        if (t.dueDate === todayYmd && t.reminder.time) {
          if (t.reminder.time.slice(0, 5) === currentHhMm) {
            notifications.notify(`Task Reminder: ${t.title}`, t.description || `Due today at ${t.reminder.time}`, t.id);
            db.saveTask({
              ...t,
              reminder: { ...t.reminder, notified: true },
            });
          }
        }
      });
    };

    const interval = setInterval(checkReminders, 25000);
    checkReminders();

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = (id: string) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSnooze = (alert: ActiveNotification) => {
    if (alert.targetId) {
      db.snoozeReminder(alert.targetId, 15);
    }
    handleDismiss(alert.id);
  };

  const handleComplete = (alert: ActiveNotification) => {
    if (alert.targetId) {
      // Check if it's a task or reminder
      const task = db.getTask(alert.targetId);
      if (task) {
        db.toggleTaskComplete(task.id);
      } else {
        const rem = db.getReminders().find((r) => r.id === alert.targetId);
        if (rem) {
          db.saveReminder({ ...rem, isCompleted: true });
        }
      }
    }
    handleDismiss(alert.id);
  };

  if (activeAlerts.length === 0) return null;

  return (
    <div className="fixed top-18 right-4 left-4 sm:left-auto sm:w-96 z-50 space-y-2 pointer-events-none">
      {activeAlerts.map((alert) => (
        <div
          key={alert.id}
          className="pointer-events-auto bg-[#102B55] text-white p-4 rounded-2xl border border-[#1677E8]/40 shadow-2xl animate-in slide-in-from-top-4 duration-300 flex flex-col gap-2.5 backdrop-blur-md"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-[#1677E8] text-white shrink-0 shadow-xs">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight leading-snug">
                  {alert.title}
                </h4>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                  {alert.message}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/10 text-xs">
            <button
              onClick={() => handleSnooze(alert)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition cursor-pointer"
            >
              <Clock className="w-3 h-3 text-[#12B8C7]" />
              <span>Snooze 15m</span>
            </button>
            <button
              onClick={() => handleComplete(alert)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-[#1677E8] hover:bg-[#1361BD] text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>Complete</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

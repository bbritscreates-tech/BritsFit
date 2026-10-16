import React, { useState } from 'react';
import { GoalItem, GoalStatus, WorkoutSession, CardioSession } from '../../types/fitness';
import { db } from '../../services/db';
import { extractPersonalRecords, formatDuration, formatPace } from '../../services/calculations';
import {
  Trophy,
  Plus,
  CheckCircle2,
  PauseCircle,
  Archive,
  PlayCircle,
  Edit2,
  Trash2,
  Flame,
  Award,
} from 'lucide-react';

interface GoalsViewProps {
  goals: GoalItem[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  onOpenGoalEditor: (goal?: GoalItem) => void;
  onRefresh: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  workouts,
  cardio,
  onOpenGoalEditor,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<GoalStatus>('active');

  const filteredGoals = goals.filter((g) => g.status === activeTab);

  const personalRecords = extractPersonalRecords(workouts, cardio);

  const handleUpdateStatus = (goal: GoalItem, newStatus: GoalStatus) => {
    db.saveGoal({
      ...goal,
      status: newStatus,
    });
    onRefresh();
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete goal "${title}"?`)) {
      db.deleteGoal(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Goals & Personal Records
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Track custom performance milestones, endurance targets, and all-time personal records
          </p>
        </div>

        <button
          onClick={() => onOpenGoalEditor()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Personal Records Showcase */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" />
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              All-Time Personal Records
            </h3>
            <p className="text-[11px] text-slate-400">
              Automatically recognized from your workout sets and cardio sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {personalRecords.map((pr) => (
            <div
              key={pr.id}
              className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-start justify-between gap-2"
            >
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {pr.title}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {pr.category === 'cardio' ? 'Cardio PR' : 'Resistance PR'} · {pr.metric}
                </span>
                {pr.context && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1">
                    {pr.context}
                  </span>
                )}
                {pr.date && (
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    Set on {new Date(pr.date).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="text-right shrink-0">
                <span className="text-base font-bold font-mono text-amber-500 tabular-nums">
                  {pr.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goals Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-1">
            {(['active', 'completed', 'paused', 'archived'] as GoalStatus[]).map((tab) => {
              const count = goals.filter((g) => g.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition cursor-pointer ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-3">
          {filteredGoals.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Trophy className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                No {activeTab} goals found.
              </p>
            </div>
          ) : (
            filteredGoals.map((goal) => {
              let progressPercent = 0;
              if (goal.isLowerBetter) {
                const totalDiff = goal.startingValue - goal.targetValue;
                const currentDiff = goal.startingValue - goal.currentValue;
                progressPercent = totalDiff !== 0 ? Math.round((currentDiff / totalDiff) * 100) : 0;
              } else {
                const totalDiff = goal.targetValue - goal.startingValue;
                const currentDiff = goal.currentValue - goal.startingValue;
                progressPercent = totalDiff !== 0 ? Math.round((currentDiff / totalDiff) * 100) : 0;
              }
              const clamped = Math.min(100, Math.max(0, progressPercent));

              return (
                <div
                  key={goal.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                          {goal.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                          · {goal.category.replace('_', ' ')}
                        </span>
                        {goal.isLowerBetter && (
                          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">
                            · Lower is better
                          </span>
                        )}
                      </div>
                      {goal.targetDate && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Progress Percentage & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {clamped}%
                      </span>

                      {/* State Transitions */}
                      {goal.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(goal, 'completed')}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                            title="Mark completed"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(goal, 'paused')}
                            className="p-1.5 text-slate-400 hover:text-amber-500 cursor-pointer"
                            title="Pause goal"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {goal.status === 'paused' && (
                        <button
                          onClick={() => handleUpdateStatus(goal, 'active')}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                          title="Resume goal"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}

                      {goal.status !== 'archived' ? (
                        <button
                          onClick={() => handleUpdateStatus(goal, 'archived')}
                          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          title="Archive goal"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateStatus(goal, 'active')}
                          className="p-1.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                          title="Unarchive goal"
                        >
                          <PlayCircle className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onOpenGoalEditor(goal)}
                        className="p-1.5 text-slate-400 hover:text-purple-500 cursor-pointer"
                        title="Edit goal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(goal.id, goal.title)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        clamped >= 100
                          ? 'bg-emerald-500'
                          : clamped >= 50
                          ? 'bg-emerald-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${clamped}%` }}
                    />
                  </div>

                  {/* Values Row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                    <span>
                      Start: {goal.startingValue} {goal.unit}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      Current: {goal.currentValue} {goal.unit}
                    </span>
                    <span>
                      Target: {goal.targetValue} {goal.unit}
                    </span>
                  </div>

                  {goal.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                      "{goal.notes}"
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

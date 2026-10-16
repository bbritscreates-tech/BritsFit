import React from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  Footprints,
  Scale,
  Sparkles,
  Trophy,
  BarChart3,
  Calendar,
  Settings,
  BookOpen,
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showMoreMenu: boolean;
  setShowMoreMenu: (show: boolean) => void;
}

export const MobileBottomNav: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  showMoreMenu,
  setShowMoreMenu,
}) => {
  const primaryTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'cardio', label: 'Cardio', icon: Footprints },
    { id: 'body', label: 'Body', icon: Scale },
    { id: 'habits', label: 'Habits', icon: Sparkles },
  ];

  return (
    <>
      {/* "More" Drawer for remaining tabs on mobile */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="fixed bottom-16 left-0 right-0 bg-white dark:bg-[#0E203C] border-t border-slate-200 dark:border-slate-800 p-4 rounded-t-2xl shadow-xl space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setActiveTab('library');
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition ${
                  activeTab === 'library'
                    ? 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#1677E8]" />
                <span>Exercise Library</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('goals');
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition ${
                  activeTab === 'goals'
                    ? 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Goals & PRs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('analytics');
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition ${
                  activeTab === 'analytics'
                    ? 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#12B8C7]" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('calendar');
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition ${
                  activeTab === 'calendar'
                    ? 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4 text-indigo-400" />
                <span>Calendar & Logs</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('settings');
                  setShowMoreMenu(false);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition ${
                  activeTab === 'settings'
                    ? 'bg-[#1677E8]/15 text-[#1677E8] dark:text-[#38E1EE] font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Data & Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A1A32]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 lg:hidden px-1">
        <div className="grid grid-cols-6 items-center h-16">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowMoreMenu(false);
                }}
                className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#1677E8] dark:text-[#38E1EE]'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] font-medium tracking-tight mt-1 whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            );
          })}

          {/* More trigger */}
          <button
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`min-h-[44px] flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
              ['library', 'goals', 'analytics', 'calendar', 'settings'].includes(activeTab) || showMoreMenu
                ? 'text-[#1677E8] dark:text-[#38E1EE]'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <div className="grid grid-cols-2 gap-0.5 p-1 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};

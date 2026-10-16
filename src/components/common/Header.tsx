import React from 'react';
import { Sun, Moon, Plus, Users, CloudCheck, RefreshCw, CloudAlert, Shield } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { BritsFitLogo } from './BritsFitLogo';
import { FamilyProfile, CloudSyncStatus } from '../../types/fitness';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onOpenQuickAdd: () => void;
  activeProfile: FamilyProfile;
  syncStatus: CloudSyncStatus;
  onOpenFamilyProfiles: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  theme,
  toggleTheme,
  onOpenQuickAdd,
  activeProfile,
  syncStatus,
  onOpenFamilyProfiles,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#0A1A32]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-3 md:gap-6">
        {/* Zone 1: BritsFit Logo & Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="cursor-pointer hover:opacity-95 transition text-left"
          >
            <BritsFitLogo size="sm" showText={true} />
          </button>
        </div>

        {/* Zone 2: Desktop clean single-line text links */}
        <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-300">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'dashboard'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'workouts'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Workouts
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'library'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Exercise Library
          </button>
          <button
            onClick={() => setActiveTab('cardio')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'cardio'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Walking & Running
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'body'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Body
          </button>
          <button
            onClick={() => setActiveTab('habits')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'habits'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Daily Habits
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'goals'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Goals & PRs
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'analytics'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'calendar'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Calendar
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap transition-colors cursor-pointer py-1 ${
              activeTab === 'settings'
                ? 'text-[#1677E8] dark:text-[#38E1EE] font-bold border-b-2 border-[#1677E8]'
                : 'hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data & Sync
          </button>
        </nav>

        {/* Zone 3: Family Profile Switcher, Sync status, Theme toggle, PWA install, Primary Log Action */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Family Member Profile & Sync Badge */}
          <button
            type="button"
            onClick={onOpenFamilyProfiles}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition cursor-pointer text-left shadow-2xs"
            title="Family Member Profile & Cloud Sync"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
              style={{ backgroundColor: activeProfile.avatarColor || '#1677E8' }}
            >
              {activeProfile.avatarEmoji || activeProfile.name.charAt(0)}
            </div>

            <div className="hidden sm:flex flex-col">
              <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight max-w-[85px] truncate">
                {activeProfile.name}
              </span>
              <span className="text-[9px] text-[#12B8C7] font-semibold leading-none">
                {activeProfile.relationship || 'Account'}
              </span>
            </div>

            {/* Cloud Sync Status Icon */}
            <div className="pl-0.5">
              {syncStatus === 'synced' ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 inline-block" title="Cloud Synced" />
              ) : syncStatus === 'syncing' ? (
                <span title="Syncing..."><RefreshCw className="w-3 h-3 text-[#1677E8] animate-spin" /></span>
              ) : syncStatus === 'error' ? (
                <span title="Sync Notice"><CloudAlert className="w-3.5 h-3.5 text-amber-500" /></span>
              ) : (
                <span title="Local Private Storage"><Shield className="w-3 h-3 text-slate-400" /></span>
              )}
            </div>
          </button>

          <PWAInstallButton />

          <button
            onClick={toggleTheme}
            className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle dark/light theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-[#102B55]" />
            )}
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1677E8] hover:bg-[#12B8C7] text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Log Entry</span>
            <span className="sm:hidden">Log</span>
          </button>
        </div>
      </div>
    </header>
  );
};

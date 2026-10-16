import React, { useState } from 'react';
import { UserSettings, CloudSyncStatus, AuthUserProfile } from '../../types/fitness';
import { db } from '../../services/db';
import {
  ShieldCheck,
  Download,
  Upload,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  User,
  Smartphone,
  BookOpen,
  ArrowRight,
  Cloud,
  Users,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { BritsFitLogo } from '../common/BritsFitLogo';

interface SettingsViewProps {
  settings: UserSettings;
  onRefresh: () => void;
  onNavigateToLibrary?: () => void;
  onOpenFamilyProfiles?: () => void;
  authUser?: AuthUserProfile | null;
  syncStatus?: CloudSyncStatus;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onRefresh,
  onNavigateToLibrary,
  onOpenFamilyProfiles,
  authUser,
  syncStatus = 'local_only',
}) => {
  const [userName, setUserName] = useState(settings.userName || '');
  const [userHeightCm, setUserHeightCm] = useState(settings.userHeightCm?.toString() || '180');
  const [startingWeightKg, setStartingWeightKg] = useState(
    settings.startingWeightKg?.toString() || '84.5'
  );
  const [startingDate, setStartingDate] = useState(settings.startingDate || '2026-09-01');
  const [defaultRestSeconds, setDefaultRestSeconds] = useState(
    settings.defaultRestSeconds?.toString() || '90'
  );
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = () => {
    db.saveSettings({
      userName: userName.trim(),
      userHeightCm: parseFloat(userHeightCm) || undefined,
      startingWeightKg: parseFloat(startingWeightKg) || undefined,
      startingDate,
      defaultRestSeconds: parseInt(defaultRestSeconds) || 90,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onRefresh();
  };

  const handleExportJSON = () => {
    const backup = db.exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BritsFit_FullBackup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const success = db.importBackup(parsed);
        if (success) {
          alert('BritsFit backup restored successfully!');
          onRefresh();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const handleDeleteAll = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      alert('Please type DELETE in capital letters to confirm.');
      return;
    }

    db.clearAllData();
    setDeleteConfirmationText('');
    alert('All personal records have been deleted.');
    onRefresh();
  };

  const handleResetSampleData = () => {
    if (confirm('Reset to initial starter fitness data? Current custom logs will be overwritten.')) {
      db.resetToDefaults();
      alert('Sample fitness data reloaded.');
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Data Management & Settings
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          BritsFit cloud synchronisation, family member profiles, offline backups, and personal baselines
        </p>
      </div>

      {/* 1. Cloud & Family Account Switcher Card */}
      <div className="p-5 rounded-2xl border border-[#1677E8]/30 bg-gradient-to-br from-[#102B55]/5 to-[#1677E8]/10 dark:from-[#102B55]/30 dark:to-[#1677E8]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-[#1677E8] text-white shrink-0 shadow-xs">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Google Cloud Sync & Family Accounts
              </h3>
              {syncStatus === 'synced' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Synced
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl leading-relaxed">
              {authUser
                ? `Signed in as ${authUser.displayName || authUser.email}. Your data syncs securely with Google Cloud Firestore across your phone and desktop.`
                : 'Sign in with Google to enable automatic cross-device synchronisation and keep independent fitness logs for each family member.'}
            </p>
          </div>
        </div>

        {onOpenFamilyProfiles && (
          <button
            onClick={onOpenFamilyProfiles}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white shadow-xs cursor-pointer self-start sm:self-auto shrink-0 transition active:scale-95"
          >
            <Users className="w-4 h-4" />
            <span>Manage Family & Account</span>
          </button>
        )}
      </div>

      {/* 2. Privacy & Storage Model Guarantee */}
      <div className="p-5 rounded-2xl border border-[#12B8C7]/30 bg-[#12B8C7]/5 dark:bg-[#12B8C7]/10 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#12B8C7]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Private, Resilient Architecture
          </h3>
        </div>
        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          BritsFit operates locally on your device with instant offline responsiveness, backing up to your personal Google Cloud Firestore space when connected. All workouts, cardio runs, body measurements, and wellbeing entries remain private to your account and family members. You retain 100% data ownership with 1-click JSON and CSV exports.
        </p>
      </div>

      {/* Exercise Library Quick Access */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#1677E8]/10 text-[#1677E8] shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Exercise Library & Custom Movements
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your movement catalog, create custom exercises, and configure muscle groups
            </p>
          </div>
        </div>

        {onNavigateToLibrary && (
          <button
            onClick={onNavigateToLibrary}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#102B55] hover:bg-[#1677E8] text-white shadow-xs cursor-pointer self-start sm:self-auto shrink-0 transition"
          >
            <span>Open Exercise Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 3. Personal Profile & Baseline Settings */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Personal Baseline & Measurement Profile
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              User / Display Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
              placeholder="e.g. Brian"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Height (cm) — For BMI Estimate
            </label>
            <input
              type="number"
              value={userHeightCm}
              onChange={(e) => setUserHeightCm(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
              placeholder="180"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Starting Weight (kg)
            </label>
            <input
              type="number"
              step="0.1"
              value={startingWeightKg}
              onChange={(e) => setStartingWeightKg(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
              placeholder="84.5"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Tracking Starting Date
            </label>
            <input
              type="date"
              value={startingDate}
              onChange={(e) => setStartingDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1677E8]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            {isSaved && <span className="text-emerald-500 font-semibold">Preferences saved!</span>}
          </span>
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#1677E8] hover:bg-[#1361BD] text-white shadow-xs cursor-pointer transition"
          >
            Save Profile
          </button>
        </div>
      </div>

      {/* 4. Backup & Restore (Full JSON) */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Full Database Backup & Restore
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export your complete BritsFit database (all workouts, cardio, body measurements, habits, goals, family profiles, and custom exercises) into a single JSON file. You can restore it on any device anytime.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-[#102B55] text-white hover:bg-[#1677E8] transition cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Full JSON Backup</span>
          </button>

          <label className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-700 dark:text-slate-300">
            <Upload className="w-3.5 h-3.5" />
            <span>Restore from Backup File</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 5. CSV Exports (Excel-Compatible) */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#1677E8]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Export Records to CSV (Excel Compatible)
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Export individual data tables to standard CSV format for spreadsheet analysis:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() =>
              downloadCSV(
                db.exportWorkoutsCSV(),
                `BritsFit_Workouts_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#1677E8] text-left cursor-pointer transition"
          >
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Workouts & Sets
            </span>
            <span className="text-[10px] text-slate-400">CSV Export</span>
          </button>

          <button
            onClick={() =>
              downloadCSV(
                db.exportCardioCSV(),
                `BritsFit_Cardio_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#12B8C7] text-left cursor-pointer transition"
          >
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Walking & Running
            </span>
            <span className="text-[10px] text-slate-400">CSV Export</span>
          </button>

          <button
            onClick={() =>
              downloadCSV(
                db.exportMeasurementsCSV(),
                `BritsFit_Measurements_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-[#102B55] text-left cursor-pointer transition"
          >
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Body Measurements
            </span>
            <span className="text-[10px] text-slate-400">CSV Export</span>
          </button>

          <button
            onClick={() =>
              downloadCSV(
                db.exportHabitsCSV(),
                `BritsFit_Habits_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500 text-left cursor-pointer transition"
          >
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Daily Wellbeing
            </span>
            <span className="text-[10px] text-slate-400">CSV Export</span>
          </button>
        </div>
      </div>

      {/* 6. Mobile & PWA Installation Instructions */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#12B8C7]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Installation on Android & iPhone
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              Android Phone (Chrome / Firefox):
            </span>
            <p>
              1. Tap the three dots (⋮) menu in Chrome.<br />
              2. Tap <strong>Install BritsFit</strong> or <strong>Add to Home screen</strong>.<br />
              3. BritsFit runs in full-screen mode with offline capability and instant cloud sync.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              Apple iPhone / iPad (Safari):
            </span>
            <p>
              1. Tap the <strong>Share</strong> icon at the bottom of Safari.<br />
              2. Scroll down and tap <strong>Add to Home Screen</strong>.<br />
              3. Tap <strong>Add</strong> in the top right corner.
            </p>
          </div>
        </div>
      </div>

      {/* 7. Sample Data & Danger Zone */}
      <div className="p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
            Danger Zone & Data Reset
          </h3>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-rose-200 dark:border-rose-900/50">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">
              Reset to Starter Fitness Data
            </span>
            <span className="text-[11px] text-slate-500">
              Reload realistic starter workouts, cardio runs, and measurements.
            </span>
          </div>
          <button
            onClick={handleResetSampleData}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sample Data</span>
          </button>
        </div>

        <div className="pt-3 border-t border-rose-200 dark:border-rose-900/50 space-y-2">
          <div>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block">
              Permanently Delete All Personal Records
            </span>
            <span className="text-[11px] text-slate-500">
              Clears all workouts, cardio sessions, measurements, and habits from this device.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="px-3 py-1.5 text-xs rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
            <button
              onClick={handleDeleteAll}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete All Records</span>
            </button>
          </div>
        </div>
      </div>

      {/* BritsFit Brand Footer */}
      <div className="pt-6 pb-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <BritsFitLogo size="sm" showText={true} />
        <div className="text-xs text-slate-500 dark:text-slate-400">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            Your fitness. Your progress. Your journey.
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            BritsFit v2.0 • Independent Multi-User Family Accounts &amp; Cloud Sync
          </p>
        </div>
      </div>
    </div>
  );
};

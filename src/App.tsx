/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from './services/db';
import {
  WorkoutSession,
  CardioSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
  GoalItem,
  UserSettings,
  WorkoutTemplate,
  FamilyProfile,
  AuthUserProfile,
  CloudSyncStatus,
} from './types/fitness';
import { subscribeToAuth } from './services/firebase';
import { Header } from './components/common/Header';
import { MobileBottomNav } from './components/common/Navigation';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { QuickAddModal } from './components/common/QuickAddModal';
import { FamilyProfilesModal } from './components/common/FamilyProfilesModal';
import { SplashScreen } from './components/common/SplashScreen';

// Modals
import { WorkoutEditorModal } from './components/workouts/WorkoutEditorModal';
import { ExerciseLibraryModal } from './components/workouts/ExerciseLibraryModal';
import { TemplatesModal } from './components/workouts/TemplatesModal';
import { CardioEditorModal } from './components/cardio/CardioEditorModal';
import { BodyEditorModal } from './components/body/BodyEditorModal';
import { HabitEditorModal } from './components/habits/HabitEditorModal';
import { GoalEditorModal } from './components/goals/GoalEditorModal';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { WorkoutsView } from './components/workouts/WorkoutsView';
import { CardioView } from './components/cardio/CardioView';
import { BodyView } from './components/body/BodyView';
import { HabitsView } from './components/habits/HabitsView';
import { GoalsView } from './components/goals/GoalsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { ExerciseLibraryView } from './components/library/ExerciseLibraryView';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  // Authentication & Family Profiles state
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [authUser, setAuthUser] = useState<AuthUserProfile | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>(db.getCloudSyncStatus());
  const [profiles, setProfiles] = useState<FamilyProfile[]>(db.getFamilyProfiles());
  const [activeProfile, setActiveProfile] = useState<FamilyProfile>(db.getActiveProfile());
  const [isFamilyProfilesOpen, setIsFamilyProfilesOpen] = useState<boolean>(false);

  // Database reactive state
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([]);
  const [cardio, setCardio] = useState<CardioSession[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurementEntry[]>([]);
  const [habits, setHabits] = useState<DailyHabitEntry[]>([]);
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [settings, setSettings] = useState<UserSettings>(db.getSettings());

  // Theme management
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const loadData = () => {
    const curActive = db.getActiveProfile();
    setActiveProfile(curActive);
    setProfiles(db.getFamilyProfiles());
    setWorkouts(db.getWorkouts(curActive.id));
    setCardio(db.getCardio(curActive.id));
    setMeasurements(db.getMeasurements(curActive.id));
    setHabits(db.getHabits(curActive.id));
    setGoals(db.getGoals(curActive.id));

    const currentSettings = db.getSettings();
    setSettings(currentSettings);
    if (currentSettings.theme === 'light') {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  };

  useEffect(() => {
    loadData();
    setIsInitialLoading(false);

    // Subscribe to DB changes
    const unsubDb = db.subscribe(() => {
      loadData();
    });

    // Subscribe to Cloud Sync status changes
    const unsubSync = db.subscribeSyncStatus((status) => {
      setSyncStatus(status);
    });

    // Subscribe to Firebase Auth state
    const unsubAuth = subscribeToAuth((user) => {
      setAuthUser(user);
      db.attachCloudUser(user);
    });

    return () => {
      unsubDb();
      unsubSync();
      unsubAuth();
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    db.saveSettings({ theme: nextTheme });
  };

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const [isWorkoutEditorOpen, setIsWorkoutEditorOpen] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState<WorkoutSession | null>(null);
  const [templateToLoad, setTemplateToLoad] = useState<WorkoutTemplate | null>(null);

  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);

  const [isCardioEditorOpen, setIsCardioEditorOpen] = useState(false);
  const [cardioToEdit, setCardioToEdit] = useState<CardioSession | null>(null);

  const [isBodyEditorOpen, setIsBodyEditorOpen] = useState(false);
  const [bodyToEdit, setBodyToEdit] = useState<BodyMeasurementEntry | null>(null);

  const [isHabitEditorOpen, setIsHabitEditorOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<DailyHabitEntry | null>(null);
  const [habitTargetDate, setHabitTargetDate] = useState<string | undefined>(undefined);

  const [isGoalEditorOpen, setIsGoalEditorOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<GoalItem | null>(null);

  const handleOpenWorkoutEditor = (session?: WorkoutSession) => {
    setWorkoutToEdit(session || null);
    setTemplateToLoad(null);
    setIsWorkoutEditorOpen(true);
  };

  const handleOpenCardioEditor = (session?: CardioSession) => {
    setCardioToEdit(session || null);
    setIsCardioEditorOpen(true);
  };

  const handleOpenBodyEditor = (entry?: BodyMeasurementEntry) => {
    setBodyToEdit(entry || null);
    setIsBodyEditorOpen(true);
  };

  const handleOpenHabitEditor = (entry?: DailyHabitEntry, date?: string) => {
    setHabitToEdit(entry || null);
    setHabitTargetDate(date);
    setIsHabitEditorOpen(true);
  };

  const handleOpenGoalEditor = (goal?: GoalItem) => {
    setGoalToEdit(goal || null);
    setIsGoalEditorOpen(true);
  };

  const handleStartTemplate = (template: WorkoutTemplate) => {
    setWorkoutToEdit(null);
    setTemplateToLoad(template);
    setIsWorkoutEditorOpen(true);
  };

  const handleQuickAddSelection = (action: 'workout' | 'cardio' | 'body' | 'habit') => {
    if (action === 'workout') handleOpenWorkoutEditor();
    else if (action === 'cardio') handleOpenCardioEditor();
    else if (action === 'body') handleOpenBodyEditor();
    else if (action === 'habit') handleOpenHabitEditor();
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#071326] text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {showSplash && (
        <SplashScreen
          isLoading={isInitialLoading}
          authUser={authUser}
          onFinish={() => setShowSplash(false)}
        />
      )}
      <OfflineIndicator />

      {/* Top Bar with BritsFit Logo and Family Profile switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        activeProfile={activeProfile}
        syncStatus={syncStatus}
        onOpenFamilyProfiles={() => setIsFamilyProfilesOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'dashboard' && (
          <DashboardView
            workouts={workouts}
            cardio={cardio}
            measurements={measurements}
            habits={habits}
            goals={goals}
            settings={settings}
            onOpenWorkoutEditor={handleOpenWorkoutEditor}
            onOpenCardioEditor={handleOpenCardioEditor}
            onOpenBodyEditor={handleOpenBodyEditor}
            onOpenHabitEditor={handleOpenHabitEditor}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'workouts' && (
          <WorkoutsView
            workouts={workouts}
            onOpenWorkoutEditor={handleOpenWorkoutEditor}
            onOpenTemplates={() => setIsTemplatesOpen(true)}
            onOpenLibrary={() => setActiveTab('library')}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'library' && (
          <ExerciseLibraryView onRefresh={loadData} />
        )}

        {activeTab === 'cardio' && (
          <CardioView
            cardio={cardio}
            onOpenCardioEditor={handleOpenCardioEditor}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'body' && (
          <BodyView
            measurements={measurements}
            settings={settings}
            onOpenBodyEditor={handleOpenBodyEditor}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'habits' && (
          <HabitsView
            habits={habits}
            onOpenHabitEditor={handleOpenHabitEditor}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsView
            goals={goals}
            workouts={workouts}
            cardio={cardio}
            onOpenGoalEditor={handleOpenGoalEditor}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            workouts={workouts}
            cardio={cardio}
            measurements={measurements}
            habits={habits}
            goals={goals}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            workouts={workouts}
            cardio={cardio}
            measurements={measurements}
            habits={habits}
            onOpenWorkoutEditor={handleOpenWorkoutEditor}
            onOpenCardioEditor={handleOpenCardioEditor}
            onOpenBodyEditor={handleOpenBodyEditor}
            onOpenHabitEditor={handleOpenHabitEditor}
            onRefresh={loadData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onRefresh={loadData}
            onNavigateToLibrary={() => setActiveTab('library')}
            onOpenFamilyProfiles={() => setIsFamilyProfilesOpen(true)}
            authUser={authUser}
            syncStatus={syncStatus}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showMoreMenu={showMoreMenu}
        setShowMoreMenu={setShowMoreMenu}
      />

      {/* Modals */}
      <FamilyProfilesModal
        isOpen={isFamilyProfilesOpen}
        onClose={() => setIsFamilyProfilesOpen(false)}
        authUser={authUser}
        syncStatus={syncStatus}
        profiles={profiles}
        activeProfileId={activeProfile.id}
      />

      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={handleQuickAddSelection}
      />

      <WorkoutEditorModal
        isOpen={isWorkoutEditorOpen}
        onClose={() => {
          setIsWorkoutEditorOpen(false);
          setWorkoutToEdit(null);
          setTemplateToLoad(null);
        }}
        workoutToEdit={workoutToEdit}
        templateToLoad={templateToLoad}
        onSaved={loadData}
      />

      <ExerciseLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onExercisesUpdated={loadData}
      />

      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleStartTemplate}
      />

      <CardioEditorModal
        isOpen={isCardioEditorOpen}
        onClose={() => {
          setIsCardioEditorOpen(false);
          setCardioToEdit(null);
        }}
        sessionToEdit={cardioToEdit}
        onSaved={loadData}
      />

      <BodyEditorModal
        isOpen={isBodyEditorOpen}
        onClose={() => {
          setIsBodyEditorOpen(false);
          setBodyToEdit(null);
        }}
        entryToEdit={bodyToEdit}
        onSaved={loadData}
      />

      <HabitEditorModal
        isOpen={isHabitEditorOpen}
        onClose={() => {
          setIsHabitEditorOpen(false);
          setHabitToEdit(null);
          setHabitTargetDate(undefined);
        }}
        entryToEdit={habitToEdit}
        targetDate={habitTargetDate}
        onSaved={loadData}
      />

      <GoalEditorModal
        isOpen={isGoalEditorOpen}
        onClose={() => {
          setIsGoalEditorOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
        onSaved={loadData}
      />
    </div>
  );
}

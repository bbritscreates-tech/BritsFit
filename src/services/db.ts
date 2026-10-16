import {
  WorkoutSession,
  CardioSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
  GoalItem,
  ExerciseItem,
  WorkoutTemplate,
  UserSettings,
  FamilyProfile,
  CloudSyncStatus,
  AuthUserProfile,
} from '../types/fitness';
import {
  initialExercises,
  initialTemplates,
  initialWorkouts,
  initialCardio,
  initialMeasurements,
  initialHabits,
  initialGoals,
  defaultSettings,
} from './seedData';
import { formatDuration, formatPace } from './calculations';
import {
  firestore,
  auth,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';

const STORAGE_KEY_V2 = 'britsfit_app_data';
const STORAGE_KEY_V1 = 'apextrack_app_data';

export interface FullBackupPayload {
  version: string;
  exportedAt: string;
  settings: UserSettings;
  profiles: FamilyProfile[];
  activeProfileId: string;
  exercises: ExerciseItem[];
  templates: WorkoutTemplate[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  measurements: BodyMeasurementEntry[];
  habits: DailyHabitEntry[];
  goals: GoalItem[];
}

export const defaultPrimaryProfile: FamilyProfile = {
  id: 'primary',
  name: 'Primary Profile',
  relationship: 'Self',
  avatarColor: '#1677E8',
  avatarEmoji: '⚡',
  isPrimary: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface MemoryCacheStructure {
  settings: UserSettings;
  profiles: FamilyProfile[];
  activeProfileId: string;
  exercises: ExerciseItem[];
  templates: WorkoutTemplate[];
  workouts: WorkoutSession[];
  cardio: CardioSession[];
  measurements: BodyMeasurementEntry[];
  habits: DailyHabitEntry[];
  goals: GoalItem[];
}

class StorageService {
  private memoryCache: MemoryCacheStructure | null = null;
  private listeners: Set<() => void> = new Set();
  private syncListeners: Set<(status: CloudSyncStatus) => void> = new Set();
  private cloudStatus: CloudSyncStatus = 'local_only';
  private currentUser: AuthUserProfile | null = null;
  private unsubs: Unsubscribe[] = [];
  private isSyncingFromCloud = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      // Check current BritsFit storage first, then seamlessly migrate from ApexTrack if needed
      let stored = localStorage.getItem(STORAGE_KEY_V2);
      if (!stored) {
        const legacy = localStorage.getItem(STORAGE_KEY_V1);
        if (legacy) {
          stored = legacy;
        }
      }

      if (stored) {
        const parsed = JSON.parse(stored);
        const existingProfiles: FamilyProfile[] =
          Array.isArray(parsed.profiles) && parsed.profiles.length > 0
            ? parsed.profiles
            : [defaultPrimaryProfile];

        const activeId =
          parsed.activeProfileId ||
          existingProfiles[0]?.id ||
          defaultPrimaryProfile.id;

        this.memoryCache = {
          settings: { ...defaultSettings, ...(parsed.settings || {}) },
          profiles: existingProfiles,
          activeProfileId: activeId,
          exercises: parsed.exercises || initialExercises,
          templates: parsed.templates || initialTemplates,
          workouts: parsed.workouts || initialWorkouts,
          cardio: parsed.cardio || initialCardio,
          measurements: parsed.measurements || initialMeasurements,
          habits: parsed.habits || initialHabits,
          goals: parsed.goals || initialGoals,
        };
      } else {
        this.resetToDefaults();
      }
    } catch {
      this.resetToDefaults();
    }
  }

  private persist() {
    if (!this.memoryCache) return;
    try {
      localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(this.memoryCache));
    } catch (e) {
      console.warn('Could not persist to localStorage', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.error('Error in storage listener', err);
      }
    });
  }

  private notifySyncStatus(status: CloudSyncStatus) {
    this.cloudStatus = status;
    this.syncListeners.forEach((l) => {
      try {
        l(status);
      } catch (e) {
        console.error(e);
      }
    });
  }

  public subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  public subscribeSyncStatus(callback: (status: CloudSyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    callback(this.cloudStatus);
    return () => this.syncListeners.delete(callback);
  }

  public getCloudSyncStatus(): CloudSyncStatus {
    return this.cloudStatus;
  }

  public getCurrentAuthUser(): AuthUserProfile | null {
    return this.currentUser;
  }

  public resetToDefaults() {
    this.memoryCache = {
      settings: defaultSettings,
      profiles: [defaultPrimaryProfile],
      activeProfileId: defaultPrimaryProfile.id,
      exercises: initialExercises,
      templates: initialTemplates,
      workouts: initialWorkouts,
      cardio: initialCardio,
      measurements: initialMeasurements,
      habits: initialHabits,
      goals: initialGoals,
    };
    this.persist();
  }

  public clearAllData() {
    this.memoryCache = {
      settings: defaultSettings,
      profiles: [defaultPrimaryProfile],
      activeProfileId: defaultPrimaryProfile.id,
      exercises: initialExercises,
      templates: [],
      workouts: [],
      cardio: [],
      measurements: [],
      habits: [],
      goals: [],
    };
    this.persist();
  }

  // --- Family Profiles ---
  public getFamilyProfiles(): FamilyProfile[] {
    if (!this.memoryCache) this.init();
    return this.memoryCache?.profiles || [defaultPrimaryProfile];
  }

  public getActiveProfile(): FamilyProfile {
    if (!this.memoryCache) this.init();
    const profiles = this.getFamilyProfiles();
    const active = profiles.find((p) => p.id === this.memoryCache?.activeProfileId);
    return active || profiles[0] || defaultPrimaryProfile;
  }

  public getActiveProfileId(): string {
    return this.getActiveProfile().id;
  }

  public setActiveProfile(profileId: string) {
    if (!this.memoryCache) this.init();
    const found = this.memoryCache!.profiles.find((p) => p.id === profileId);
    if (found) {
      this.memoryCache!.activeProfileId = profileId;
      this.persist();
    }
  }

  public saveFamilyProfile(profile: FamilyProfile) {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.profiles.findIndex((p) => p.id === profile.id);
    if (idx >= 0) {
      this.memoryCache!.profiles[idx] = { ...profile, updatedAt: new Date().toISOString() };
    } else {
      this.memoryCache!.profiles.push({
        ...profile,
        createdAt: profile.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    this.persist();

    // Cloud sync
    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/familyProfiles/${profile.id}`;
      setDoc(doc(firestore, path), profile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteFamilyProfile(profileId: string) {
    if (!this.memoryCache) return;
    if (this.memoryCache.profiles.length <= 1) {
      // Must keep at least one profile
      return;
    }
    this.memoryCache.profiles = this.memoryCache.profiles.filter((p) => p.id !== profileId);
    if (this.memoryCache.activeProfileId === profileId) {
      this.memoryCache.activeProfileId = this.memoryCache.profiles[0].id;
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/familyProfiles/${profileId}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Settings ---
  public getSettings(): UserSettings {
    return this.memoryCache?.settings || defaultSettings;
  }

  public saveSettings(settings: Partial<UserSettings>) {
    if (!this.memoryCache) this.init();
    this.memoryCache!.settings = {
      ...this.memoryCache!.settings,
      ...settings,
    };
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}`;
      setDoc(doc(firestore, path), { settings: this.memoryCache!.settings }, { merge: true }).catch(
        (err) => handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  // --- Exercises ---
  public getExercises(): ExerciseItem[] {
    return this.memoryCache?.exercises || [];
  }

  public saveExercise(exercise: ExerciseItem) {
    if (!this.memoryCache) this.init();
    const index = this.memoryCache!.exercises.findIndex((e) => e.id === exercise.id);
    if (index >= 0) {
      this.memoryCache!.exercises[index] = exercise;
    } else {
      this.memoryCache!.exercises.push(exercise);
    }
    this.persist();

    if (this.currentUser && exercise.isCustom && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/exercises/${exercise.id}`;
      setDoc(doc(firestore, path), exercise, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteExercise(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.exercises = this.memoryCache.exercises.filter((e) => e.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/exercises/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Templates ---
  public getTemplates(): WorkoutTemplate[] {
    return this.memoryCache?.templates || [];
  }

  public saveTemplate(template: WorkoutTemplate) {
    if (!this.memoryCache) this.init();
    const idx = this.memoryCache!.templates.findIndex((t) => t.id === template.id);
    if (idx >= 0) {
      this.memoryCache!.templates[idx] = template;
    } else {
      this.memoryCache!.templates.push(template);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/templates/${template.id}`;
      setDoc(doc(firestore, path), template, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteTemplate(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.templates = this.memoryCache.templates.filter((t) => t.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/templates/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Workouts ---
  public getWorkouts(profileId?: string): WorkoutSession[] {
    const list = this.memoryCache?.workouts || [];
    const active = profileId || this.getActiveProfileId();
    const filtered = list.filter((w) => !w.profileId || w.profileId === active);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getAllWorkouts(): WorkoutSession[] {
    return [...(this.memoryCache?.workouts || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public saveWorkout(workout: WorkoutSession) {
    if (!this.memoryCache) this.init();
    const activeId = this.getActiveProfileId();
    const sessionWithProfile: WorkoutSession = {
      ...workout,
      profileId: workout.profileId || activeId,
    };

    const idx = this.memoryCache!.workouts.findIndex((w) => w.id === sessionWithProfile.id);
    if (idx >= 0) {
      this.memoryCache!.workouts[idx] = sessionWithProfile;
    } else {
      this.memoryCache!.workouts.unshift(sessionWithProfile);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/workouts/${sessionWithProfile.id}`;
      setDoc(doc(firestore, path), sessionWithProfile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteWorkout(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.workouts = this.memoryCache.workouts.filter((w) => w.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/workouts/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Cardio ---
  public getCardio(profileId?: string): CardioSession[] {
    const list = this.memoryCache?.cardio || [];
    const active = profileId || this.getActiveProfileId();
    const filtered = list.filter((c) => !c.profileId || c.profileId === active);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public getAllCardio(): CardioSession[] {
    return [...(this.memoryCache?.cardio || [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public saveCardio(session: CardioSession) {
    if (!this.memoryCache) this.init();
    const activeId = this.getActiveProfileId();
    const sessionWithProfile: CardioSession = {
      ...session,
      profileId: session.profileId || activeId,
    };

    const idx = this.memoryCache!.cardio.findIndex((c) => c.id === sessionWithProfile.id);
    if (idx >= 0) {
      this.memoryCache!.cardio[idx] = sessionWithProfile;
    } else {
      this.memoryCache!.cardio.unshift(sessionWithProfile);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/cardio/${sessionWithProfile.id}`;
      setDoc(doc(firestore, path), sessionWithProfile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteCardio(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.cardio = this.memoryCache.cardio.filter((c) => c.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/cardio/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Measurements ---
  public getMeasurements(profileId?: string): BodyMeasurementEntry[] {
    const list = this.memoryCache?.measurements || [];
    const active = profileId || this.getActiveProfileId();
    const filtered = list.filter((m) => !m.profileId || m.profileId === active);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public saveMeasurement(entry: BodyMeasurementEntry) {
    if (!this.memoryCache) this.init();
    const activeId = this.getActiveProfileId();
    const entryWithProfile: BodyMeasurementEntry = {
      ...entry,
      profileId: entry.profileId || activeId,
    };

    const idx = this.memoryCache!.measurements.findIndex((m) => m.id === entryWithProfile.id);
    if (idx >= 0) {
      this.memoryCache!.measurements[idx] = entryWithProfile;
    } else {
      this.memoryCache!.measurements.unshift(entryWithProfile);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/measurements/${entryWithProfile.id}`;
      setDoc(doc(firestore, path), entryWithProfile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteMeasurement(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.measurements = this.memoryCache.measurements.filter((m) => m.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/measurements/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Habits ---
  public getHabits(profileId?: string): DailyHabitEntry[] {
    const list = this.memoryCache?.habits || [];
    const active = profileId || this.getActiveProfileId();
    const filtered = list.filter((h) => !h.profileId || h.profileId === active);
    return [...filtered].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  public saveHabit(entry: DailyHabitEntry) {
    if (!this.memoryCache) this.init();
    const activeId = this.getActiveProfileId();
    const entryWithProfile: DailyHabitEntry = {
      ...entry,
      profileId: entry.profileId || activeId,
    };

    const idx = this.memoryCache!.habits.findIndex(
      (h) => h.id === entryWithProfile.id || (h.date === entryWithProfile.date && (!h.profileId || h.profileId === activeId))
    );
    if (idx >= 0) {
      this.memoryCache!.habits[idx] = { ...this.memoryCache!.habits[idx], ...entryWithProfile };
    } else {
      this.memoryCache!.habits.unshift(entryWithProfile);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/habits/${entryWithProfile.id}`;
      setDoc(doc(firestore, path), entryWithProfile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteHabit(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.habits = this.memoryCache.habits.filter((h) => h.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/habits/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Goals ---
  public getGoals(profileId?: string): GoalItem[] {
    const list = this.memoryCache?.goals || [];
    const active = profileId || this.getActiveProfileId();
    return list.filter((g) => !g.profileId || g.profileId === active);
  }

  public saveGoal(goal: GoalItem) {
    if (!this.memoryCache) this.init();
    const activeId = this.getActiveProfileId();
    const goalWithProfile: GoalItem = {
      ...goal,
      profileId: goal.profileId || activeId,
    };

    const idx = this.memoryCache!.goals.findIndex((g) => g.id === goalWithProfile.id);
    if (idx >= 0) {
      this.memoryCache!.goals[idx] = goalWithProfile;
    } else {
      this.memoryCache!.goals.unshift(goalWithProfile);
    }
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/goals/${goalWithProfile.id}`;
      setDoc(doc(firestore, path), goalWithProfile, { merge: true }).catch((err) =>
        handleFirestoreError(err, OperationType.WRITE, path)
      );
    }
  }

  public deleteGoal(id: string) {
    if (!this.memoryCache) return;
    this.memoryCache.goals = this.memoryCache.goals.filter((g) => g.id !== id);
    this.persist();

    if (this.currentUser && !this.isSyncingFromCloud) {
      const path = `users/${this.currentUser.uid}/goals/${id}`;
      deleteDoc(doc(firestore, path)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, path)
      );
    }
  }

  // --- Cloud Sync Integration ---
  public attachCloudUser(user: AuthUserProfile | null) {
    // Unsubscribe from previous user's snapshots
    this.unsubs.forEach((u) => u());
    this.unsubs = [];

    this.currentUser = user;

    if (!user) {
      this.notifySyncStatus('local_only');
      return;
    }

    this.notifySyncStatus('syncing');

    try {
      const uid = user.uid;

      // 1. Listen to Family Profiles
      const profilesPath = `users/${uid}/familyProfiles`;
      const unsubProfiles = onSnapshot(
        collection(firestore, profilesPath),
        (snap) => {
          if (!snap.empty) {
            const cloudProfiles: FamilyProfile[] = [];
            snap.forEach((d) => cloudProfiles.push(d.data() as FamilyProfile));
            if (cloudProfiles.length > 0 && this.memoryCache) {
              this.isSyncingFromCloud = true;
              this.memoryCache.profiles = cloudProfiles;
              if (!cloudProfiles.some((p) => p.id === this.memoryCache!.activeProfileId)) {
                this.memoryCache.activeProfileId = cloudProfiles[0].id;
              }
              this.persist();
              this.isSyncingFromCloud = false;
            }
          } else {
            // First time in cloud: push existing profiles
            this.pushLocalDataToCloud();
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, profilesPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubProfiles);

      // 2. Listen to Workouts
      const workoutsPath = `users/${uid}/workouts`;
      const unsubWorkouts = onSnapshot(
        collection(firestore, workoutsPath),
        (snap) => {
          if (!snap.empty && this.memoryCache) {
            const cloudWorkouts: WorkoutSession[] = [];
            snap.forEach((d) => cloudWorkouts.push(d.data() as WorkoutSession));
            this.isSyncingFromCloud = true;
            this.memoryCache.workouts = cloudWorkouts;
            this.persist();
            this.isSyncingFromCloud = false;
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, workoutsPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubWorkouts);

      // 3. Listen to Cardio
      const cardioPath = `users/${uid}/cardio`;
      const unsubCardio = onSnapshot(
        collection(firestore, cardioPath),
        (snap) => {
          if (!snap.empty && this.memoryCache) {
            const cloudCardio: CardioSession[] = [];
            snap.forEach((d) => cloudCardio.push(d.data() as CardioSession));
            this.isSyncingFromCloud = true;
            this.memoryCache.cardio = cloudCardio;
            this.persist();
            this.isSyncingFromCloud = false;
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, cardioPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubCardio);

      // 4. Listen to Measurements
      const measurementsPath = `users/${uid}/measurements`;
      const unsubMeasurements = onSnapshot(
        collection(firestore, measurementsPath),
        (snap) => {
          if (!snap.empty && this.memoryCache) {
            const cloudMeasurements: BodyMeasurementEntry[] = [];
            snap.forEach((d) => cloudMeasurements.push(d.data() as BodyMeasurementEntry));
            this.isSyncingFromCloud = true;
            this.memoryCache.measurements = cloudMeasurements;
            this.persist();
            this.isSyncingFromCloud = false;
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, measurementsPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubMeasurements);

      // 5. Listen to Habits
      const habitsPath = `users/${uid}/habits`;
      const unsubHabits = onSnapshot(
        collection(firestore, habitsPath),
        (snap) => {
          if (!snap.empty && this.memoryCache) {
            const cloudHabits: DailyHabitEntry[] = [];
            snap.forEach((d) => cloudHabits.push(d.data() as DailyHabitEntry));
            this.isSyncingFromCloud = true;
            this.memoryCache.habits = cloudHabits;
            this.persist();
            this.isSyncingFromCloud = false;
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, habitsPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubHabits);

      // 6. Listen to Goals
      const goalsPath = `users/${uid}/goals`;
      const unsubGoals = onSnapshot(
        collection(firestore, goalsPath),
        (snap) => {
          if (!snap.empty && this.memoryCache) {
            const cloudGoals: GoalItem[] = [];
            snap.forEach((d) => cloudGoals.push(d.data() as GoalItem));
            this.isSyncingFromCloud = true;
            this.memoryCache.goals = cloudGoals;
            this.persist();
            this.isSyncingFromCloud = false;
          }
          this.notifySyncStatus('synced');
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, goalsPath);
          this.notifySyncStatus('error');
        }
      );
      this.unsubs.push(unsubGoals);
    } catch (err) {
      console.error('Error attaching cloud sync:', err);
      this.notifySyncStatus('error');
    }
  }

  public async pushLocalDataToCloud(): Promise<boolean> {
    if (!this.currentUser || !this.memoryCache) return false;
    this.notifySyncStatus('syncing');
    const uid = this.currentUser.uid;

    try {
      // Push profiles
      for (const p of this.memoryCache.profiles) {
        await setDoc(doc(firestore, `users/${uid}/familyProfiles/${p.id}`), p, { merge: true });
      }

      // Push custom exercises
      for (const ex of this.memoryCache.exercises.filter((e) => e.isCustom)) {
        await setDoc(doc(firestore, `users/${uid}/exercises/${ex.id}`), ex, { merge: true });
      }

      // Push workouts
      for (const w of this.memoryCache.workouts) {
        await setDoc(doc(firestore, `users/${uid}/workouts/${w.id}`), w, { merge: true });
      }

      // Push cardio
      for (const c of this.memoryCache.cardio) {
        await setDoc(doc(firestore, `users/${uid}/cardio/${c.id}`), c, { merge: true });
      }

      // Push measurements
      for (const m of this.memoryCache.measurements) {
        await setDoc(doc(firestore, `users/${uid}/measurements/${m.id}`), m, { merge: true });
      }

      // Push habits
      for (const h of this.memoryCache.habits) {
        await setDoc(doc(firestore, `users/${uid}/habits/${h.id}`), h, { merge: true });
      }

      // Push goals
      for (const g of this.memoryCache.goals) {
        await setDoc(doc(firestore, `users/${uid}/goals/${g.id}`), g, { merge: true });
      }

      this.notifySyncStatus('synced');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      this.notifySyncStatus('error');
      return false;
    }
  }

  // --- Backup & Restore ---
  public exportBackup(): FullBackupPayload {
    if (!this.memoryCache) this.init();
    return {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      settings: this.memoryCache!.settings,
      profiles: this.memoryCache!.profiles,
      activeProfileId: this.memoryCache!.activeProfileId,
      exercises: this.memoryCache!.exercises,
      templates: this.memoryCache!.templates,
      workouts: this.memoryCache!.workouts,
      cardio: this.memoryCache!.cardio,
      measurements: this.memoryCache!.measurements,
      habits: this.memoryCache!.habits,
      goals: this.memoryCache!.goals,
    };
  }

  public importBackup(payload: Partial<FullBackupPayload>): boolean {
    try {
      if (!payload || typeof payload !== 'object') return false;
      const profiles =
        Array.isArray(payload.profiles) && payload.profiles.length > 0
          ? payload.profiles
          : [defaultPrimaryProfile];

      this.memoryCache = {
        settings: { ...defaultSettings, ...(payload.settings || {}) },
        profiles,
        activeProfileId: payload.activeProfileId || profiles[0].id,
        exercises: Array.isArray(payload.exercises) ? payload.exercises : initialExercises,
        templates: Array.isArray(payload.templates) ? payload.templates : [],
        workouts: Array.isArray(payload.workouts) ? payload.workouts : [],
        cardio: Array.isArray(payload.cardio) ? payload.cardio : [],
        measurements: Array.isArray(payload.measurements) ? payload.measurements : [],
        habits: Array.isArray(payload.habits) ? payload.habits : [],
        goals: Array.isArray(payload.goals) ? payload.goals : [],
      };
      this.persist();

      if (this.currentUser) {
        this.pushLocalDataToCloud();
      }

      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }

  // --- CSV Exports ---
  public exportWorkoutsCSV(): string {
    const workouts = this.getWorkouts();
    const rows: string[] = [
      'Workout ID,Profile,Date,Name,Type,Total Duration (s),Effort (1-10),Pain (0-10),Exercise Name,Category,Set Number,Reps,Weight (kg),Is Timed,Hold Duration (s),Set Duration (s),Avg Rep Duration (s),Rest Duration (s),Set Effort,Notes',
    ];

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          rows.push(
            [
              w.id,
              w.profileId || 'primary',
              w.date,
              `"${w.name.replace(/"/g, '""')}"`,
              w.workoutType,
              w.totalDurationSeconds,
              w.overallEffort,
              w.overallPainDiscomfort,
              `"${ex.exerciseName.replace(/"/g, '""')}"`,
              ex.category,
              set.setNumber,
              set.reps,
              set.weightKg ?? '',
              set.isTimed ? 'Yes' : 'No',
              set.holdDurationSeconds ?? '',
              set.totalSetDurationSeconds,
              set.averageRepDurationSeconds ?? '',
              set.restDurationSeconds,
              set.effort,
              `"${(set.notes || w.notes || '').replace(/"/g, '""')}"`,
            ].join(',')
          );
        });
      });
    });

    return rows.join('\n');
  }

  public exportCardioCSV(): string {
    const cardio = this.getCardio();
    const rows: string[] = [
      'ID,Profile,Date,Activity Type,Location,Distance (km),Duration (s),Duration (formatted),Pace (min/km),Pace (formatted),Speed (km/h),Elevation (m),Step Count,Heart Rate (bpm),Effort (1-10),Surface,Weather,Notes',
    ];

    cardio.forEach((c) => {
      rows.push(
        [
          c.id,
          c.profileId || 'primary',
          c.date,
          c.activityType,
          `"${(c.routeLocation || '').replace(/"/g, '""')}"`,
          c.distanceKm,
          c.durationSeconds,
          formatDuration(c.durationSeconds),
          c.paceMinPerKm.toFixed(3),
          `"${formatPace(c.paceMinPerKm)}"`,
          c.speedKmH.toFixed(2),
          c.elevationGainM ?? '',
          c.stepCount ?? '',
          c.avgHeartRate ?? '',
          c.effort,
          `"${(c.surfaceCondition || '').replace(/"/g, '""')}"`,
          `"${(c.weatherCondition || '').replace(/"/g, '""')}"`,
          `"${(c.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    });

    return rows.join('\n');
  }

  public exportMeasurementsCSV(): string {
    const measurements = this.getMeasurements();
    const rows: string[] = [
      'ID,Profile,Date,Weight (kg),Body Fat (%),Waist (cm),Hip (cm),Chest (cm),Left Arm (cm),Right Arm (cm),Left Thigh (cm),Right Thigh (cm),Neck (cm),Custom Measurements,Notes',
    ];

    measurements.forEach((m) => {
      const customStr = (m.customMeasurements || [])
        .map((c) => `${c.name}:${c.valueCm}cm`)
        .join('; ');
      rows.push(
        [
          m.id,
          m.profileId || 'primary',
          m.date,
          m.weightKg ?? '',
          m.bodyFatPercentage ?? '',
          m.waistCm ?? '',
          m.hipCm ?? '',
          m.chestCm ?? '',
          m.leftArmCm ?? '',
          m.rightArmCm ?? '',
          m.leftThighCm ?? '',
          m.rightThighCm ?? '',
          m.neckCm ?? '',
          `"${customStr.replace(/"/g, '""')}"`,
          `"${(m.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    });

    return rows.join('\n');
  }

  public exportHabitsCSV(): string {
    const habits = this.getHabits();
    const rows: string[] = [
      'ID,Profile,Date,Water (L),Sleep (hrs),Energy (1-5),Mood (1-5),Stress (1-5),Soreness (0-10),Pain (0-10),Steps,Rest Day,Vape Free,Notes',
    ];

    habits.forEach((h) => {
      rows.push(
        [
          h.id,
          h.profileId || 'primary',
          h.date,
          h.waterLitres ?? '',
          h.sleepHours ?? '',
          h.energyRating ?? '',
          h.moodRating ?? '',
          h.stressRating ?? '',
          h.muscleSoreness ?? '',
          h.painDiscomfort ?? '',
          h.stepCount ?? '',
          h.isRestDay ? 'Yes' : 'No',
          h.isVapeFree ? 'Yes' : 'No',
          `"${(h.notes || '').replace(/"/g, '""')}"`,
        ].join(',')
      );
    });

    return rows.join('\n');
  }
}

export const db = new StorageService();

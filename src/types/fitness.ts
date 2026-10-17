/**
 * Core domain types for BritsFit Personal & Family Fitness Tracker
 */

export type WorkoutType =
  | 'Strength'
  | 'Hypertrophy'
  | 'Calisthenics'
  | 'Circuit'
  | 'Mobility'
  | 'Full Body'
  | 'Cardio Conditioning'
  | 'Other';

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full_body'
  | 'mobility'
  | 'other';

export type EquipmentType =
  | 'bodyweight'
  | 'barbell'
  | 'dumbbell'
  | 'kettlebell'
  | 'cable'
  | 'machine'
  | 'resistance_bands'
  | 'pullup_bar'
  | 'other';

export type ExerciseType = 'reps' | 'timed' | 'distance';

export type MuscleGroupTarget =
  | 'Full Body'
  | 'Arms'
  | 'Chest'
  | 'Back'
  | 'Core'
  | 'Legs'
  | 'Other';

export interface ExerciseItem {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup: string;
  muscleGroupTarget?: MuscleGroupTarget;
  equipment: EquipmentType;
  exerciseType?: ExerciseType;
  isTimed: boolean; // e.g. planks, wall sits
  preferredTarget?: string; // e.g. "8-12 reps" or "45-60s hold"
  instructions?: string;
  modifications?: string;
  isCustom?: boolean;
  isArchived?: boolean;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number;
  weightKg?: number | null;
  isTimed: boolean;
  holdDurationSeconds?: number; // for timed exercises
  totalSetDurationSeconds: number; // recorded total set duration
  repSeconds?: number[]; // optional individual rep duration timings [2.8, 3.1, 3.0]
  averageRepDurationSeconds?: number; // computed or recorded
  restDurationSeconds: number; // rest after set
  effort: number; // 1-10 RPE
  painDiscomfort: number; // 0-10
  isWarmup?: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  muscleGroup: string;
  isTimed: boolean;
  notes?: string;
  modifications?: string;
  totalExerciseDurationSeconds?: number;
  sets: WorkoutSet[];
}

export interface FamilyProfile {
  id: string;
  name: string;
  relationship: string;
  avatarColor: string;
  avatarEmoji?: string;
  userHeightCm?: number;
  startingWeightKg?: number;
  createdAt: string;
  updatedAt: string;
  isPrimary?: boolean;
}

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'local_only' | 'error';

export interface AuthUserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface WorkoutSession {
  id: string;
  profileId?: string;
  date: string; // ISO string e.g. 2026-10-15T18:30
  name: string;
  workoutType: WorkoutType;
  totalDurationSeconds: number;
  overallEffort: number; // 1-10
  overallPainDiscomfort: number; // 0-10
  notes?: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  workoutType: WorkoutType;
  notes?: string;
  exercises: Array<{
    exerciseId: string;
    exerciseName: string;
    category: ExerciseCategory;
    muscleGroup: string;
    isTimed: boolean;
    defaultSets: number;
    defaultTarget: string;
  }>;
}

export type CardioActivityType =
  | 'walking'
  | 'running'
  | 'walk_run'
  | 'hiking'
  | 'trail_running'
  | 'treadmill'
  | 'other';

export interface CardioSession {
  id: string;
  profileId?: string;
  date: string; // ISO string
  activityType: CardioActivityType;
  routeLocation?: string;
  distanceKm: number;
  durationSeconds: number; // total elapsed time in seconds
  movingDurationSeconds?: number; // optional moving time
  paceMinPerKm: number; // calculated: (durationSeconds / 60) / distanceKm
  speedKmH: number; // calculated: distanceKm / (durationSeconds / 3600)
  elevationGainM?: number;
  stepCount?: number;
  avgHeartRate?: number;
  effort: number; // 1-10
  surfaceCondition?: string; // Road, Trail, Track, Treadmill, etc.
  weatherCondition?: string; // Sunny, Overcast, Rain, etc.
  notes?: string;
  createdAt: string;
}

export interface CustomMeasurement {
  name: string;
  valueCm: number;
}

export interface BodyMeasurementEntry {
  id: string;
  profileId?: string;
  date: string; // ISO string
  weightKg?: number | null;
  bodyFatPercentage?: number | null;
  waistCm?: number | null;
  hipCm?: number | null;
  chestCm?: number | null;
  leftArmCm?: number | null;
  rightArmCm?: number | null;
  leftThighCm?: number | null;
  rightThighCm?: number | null;
  neckCm?: number | null;
  customMeasurements?: CustomMeasurement[];
  notes?: string;
  createdAt: string;
}

export interface DailyHabitEntry {
  id: string;
  profileId?: string;
  date: string; // YYYY-MM-DD
  waterLitres?: number | null;
  sleepHours?: number | null;
  energyRating?: number | null; // 1-5
  moodRating?: number | null; // 1-5
  stressRating?: number | null; // 1-5
  muscleSoreness?: number | null; // 0-10
  painDiscomfort?: number | null; // 0-10
  stepCount?: number | null;
  isRestDay: boolean;
  isVapeFree: boolean;
  notes?: string;
  createdAt: string;
}

export type GoalCategory =
  | 'frequency'
  | 'reps_sets'
  | 'timed_exercise'
  | 'distance'
  | 'distance_time'
  | 'weight'
  | 'measurement'
  | 'water'
  | 'sleep'
  | 'custom';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface GoalItem {
  id: string;
  profileId?: string;
  title: string;
  category: GoalCategory;
  targetExerciseId?: string;
  targetDistanceKm?: number;
  measurementKey?: string; // e.g. 'weightKg', 'waistCm'
  unit: string;
  startingValue: number;
  targetValue: number;
  currentValue: number;
  isLowerBetter: boolean; // true for 5k time, body weight loss, waist
  targetDate?: string;
  status: GoalStatus;
  notes?: string;
  createdAt: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  userHeightCm?: number; // for BMI calculated estimate distinction
  startingDate?: string;
  startingWeightKg?: number;
  defaultRestSeconds: number;
  userName?: string;
  activeProfileId?: string;
  plannerPreferences?: PlannerPreferences;
}

export type DateRangePreset = '7d' | '30d' | '90d' | '6m' | '1y' | 'all';

export interface PersonalRecord {
  id: string;
  title: string;
  category: 'workout' | 'cardio';
  metric: string;
  value: string;
  numericValue: number;
  date: string;
  context?: string;
}

// ==========================================
// PLANNER & PERSONAL ORGANISATION TYPES
// ==========================================

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly' | 'custom';

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface TaskReminder {
  enabled: boolean;
  time?: string; // HH:MM or ISO
  advanceMinutes?: number; // 0, 10, 15, 30, 60
  notified?: boolean;
}

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  endDate?: string; // YYYY-MM-DD
  count?: number;
  completedDates?: string[]; // Specific occurrence dates marked complete (YYYY-MM-DD)
  skippedDates?: string[]; // Specific occurrence dates skipped
}

export interface PlannerTask {
  id: string;
  profileId?: string;
  title: string;
  description?: string;
  dueDate?: string; // YYYY-MM-DD (empty = inbox / unscheduled)
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  estimatedDurationMinutes?: number;
  actualDurationMinutes?: number;
  priority: TaskPriority;
  status: TaskStatus;
  category: string; // Personal, Household, Work, Shopping, Appointments, Fitness, Health, Other
  listId?: string; // Link to TaskList (Project / Named list)
  subtasks: TaskSubtask[];
  notes?: string;
  reminder?: TaskReminder;
  recurrence?: RecurrenceRule;
  completedAt?: string;
  linkedWorkoutTemplateId?: string;
  linkedCardioType?: CardioActivityType;
  completedWorkoutId?: string;
  completedCardioId?: string;
  orderIndex?: number;
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlannedActivityType =
  | 'workout_template'
  | 'workout'
  | 'walk'
  | 'run'
  | 'treadmill'
  | 'cardio'
  | 'rest_day'
  | 'appointment'
  | 'custom';

export interface PlannedActivity {
  id: string;
  profileId?: string;
  title: string;
  activityType: PlannedActivityType;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string; // HH:MM
  durationMinutes?: number;
  linkedTemplateId?: string;
  linkedTemplateName?: string;
  cardioActivityType?: CardioActivityType;
  targetDistanceKm?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
  completedWorkoutId?: string;
  completedCardioId?: string;
  reminder?: TaskReminder;
  recurrence?: RecurrenceRule;
  notes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskList {
  id: string;
  profileId?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isProject?: boolean;
  isArchived?: boolean;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalNote {
  id: string;
  profileId?: string;
  title: string;
  content: string;
  category?: string; // 'General' | 'Journal' | 'Ideas' | 'Workout Reflection' | 'Project'
  linkedDate?: string; // YYYY-MM-DD
  linkedTaskId?: string;
  linkedListId?: string;
  linkedWorkoutId?: string;
  tags?: string[];
  isPinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FocusSession {
  id: string;
  profileId?: string;
  taskId?: string;
  taskTitle?: string;
  durationMinutes: number;
  actualMinutes: number;
  completed: boolean;
  notes?: string;
  date: string; // ISO
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  profileId?: string;
  targetType: 'task' | 'workout' | 'cardio' | 'habit' | 'water' | 'sleep' | 'goal' | 'custom';
  targetId?: string;
  title: string;
  message?: string;
  triggerTime: string; // YYYY-MM-DDTHH:MM
  advanceMinutes?: number;
  isSnoozed?: boolean;
  snoozedUntil?: string;
  isCompleted?: boolean;
  isEnabled: boolean;
  recurrence?: RecurrenceRule;
  createdAt: string;
}

export interface MyDayCardConfig {
  plannedWorkouts: boolean;
  plannedCardio: boolean;
  tasks: boolean;
  appointments: boolean;
  water: boolean;
  habits: boolean;
  focusTimer: boolean;
  quickNotes: boolean;
}

export interface PlannerPreferences {
  startOfWeek: 'monday' | 'sunday';
  timeFormat: '12h' | '24h';
  defaultTaskDuration: number;
  notificationsEnabled: boolean;
  myDayCards: MyDayCardConfig;
  customCategories: string[];
}

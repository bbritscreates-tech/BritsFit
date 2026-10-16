import {
  CardioSession,
  WorkoutSession,
  BodyMeasurementEntry,
  DailyHabitEntry,
  PersonalRecord,
  DateRangePreset,
} from '../types/fitness';

/**
 * Format total seconds into human-readable HH:MM:SS or MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse string "H:MM:SS" or "MM:SS" or raw seconds into numeric seconds
 */
export function parseDurationToSeconds(input: string | number): number {
  if (typeof input === 'number') return isNaN(input) ? 0 : input;
  if (!input || typeof input !== 'string') return 0;
  const parts = input.trim().split(':').map((p) => Number(p));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

/**
 * Calculate pace in minutes per kilometre from elapsed seconds and distance in km
 */
export function calculatePaceMinPerKm(durationSeconds: number, distanceKm: number): number {
  if (!distanceKm || distanceKm <= 0 || !durationSeconds || durationSeconds <= 0) {
    return 0;
  }
  return durationSeconds / 60 / distanceKm;
}

/**
 * Format pace float (e.g. 5.5 min/km -> "5:30 /km")
 */
export function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm <= 0 || !isFinite(paceMinPerKm)) return '--:-- /km';
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  if (secs === 60) {
    return `${mins + 1}:00 /km`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

/**
 * Calculate speed in km/h
 */
export function calculateSpeedKmH(durationSeconds: number, distanceKm: number): number {
  if (!durationSeconds || durationSeconds <= 0 || !distanceKm || distanceKm <= 0) {
    return 0;
  }
  const hours = durationSeconds / 3600;
  return distanceKm / hours;
}

/**
 * Calculate average rep duration
 */
export function calculateAverageRepDuration(
  totalSetDurationSeconds: number,
  reps: number,
  repSeconds?: number[]
): number | undefined {
  if (repSeconds && repSeconds.length > 0) {
    const valid = repSeconds.filter((s) => s > 0);
    if (valid.length > 0) {
      const sum = valid.reduce((acc, curr) => acc + curr, 0);
      return Math.round((sum / valid.length) * 10) / 10;
    }
  }
  if (reps > 0 && totalSetDurationSeconds > 0) {
    return Math.round((totalSetDurationSeconds / reps) * 10) / 10;
  }
  return undefined;
}

/**
 * Check if a date string falls inside the given date range preset
 */
export function isWithinDateRange(dateStr: string, preset: DateRangePreset): boolean {
  if (preset === 'all') return true;
  const targetDate = new Date(dateStr).getTime();
  if (isNaN(targetDate)) return false;

  const now = new Date().getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  switch (preset) {
    case '7d':
      return now - targetDate <= 7 * oneDay;
    case '30d':
      return now - targetDate <= 30 * oneDay;
    case '90d':
      return now - targetDate <= 90 * oneDay;
    case '6m':
      return now - targetDate <= 182 * oneDay;
    case '1y':
      return now - targetDate <= 365 * oneDay;
    default:
      return true;
  }
}

/**
 * Extract Personal Records from workouts and cardio
 */
export function extractPersonalRecords(
  workouts: WorkoutSession[],
  cardio: CardioSession[]
): PersonalRecord[] {
  const records: PersonalRecord[] = [];

  // 1. Cardio best times for standard distances
  const standardDistances = [
    { label: '1 km', min: 0.95, max: 1.05, target: 1 },
    { label: '3 km', min: 2.9, max: 3.1, target: 3 },
    { label: '5 km', min: 4.85, max: 5.15, target: 5 },
    { label: '10 km', min: 9.8, max: 10.2, target: 10 },
  ];

  standardDistances.forEach((dist) => {
    const matching = cardio.filter(
      (c) =>
        (c.activityType === 'running' || c.activityType === 'trail_running') &&
        c.distanceKm >= dist.min &&
        c.distanceKm <= dist.max &&
        c.durationSeconds > 0
    );

    if (matching.length > 0) {
      // Best time (lowest duration)
      matching.sort((a, b) => a.durationSeconds - b.durationSeconds);
      const best = matching[0];
      records.push({
        id: `cardio-${dist.label}`,
        title: `Best ${dist.label} Run`,
        category: 'cardio',
        metric: 'Time',
        value: formatDuration(best.durationSeconds),
        numericValue: best.durationSeconds,
        date: best.date,
        context: `${best.distanceKm.toFixed(2)} km @ ${formatPace(best.paceMinPerKm)}`,
      });
    }
  });

  // Longest single walk or run
  if (cardio.length > 0) {
    const sortedByDist = [...cardio].sort((a, b) => b.distanceKm - a.distanceKm);
    const longest = sortedByDist[0];
    records.push({
      id: 'cardio-longest-distance',
      title: 'Longest Cardio Distance',
      category: 'cardio',
      metric: 'Distance',
      value: `${longest.distanceKm.toFixed(2)} km`,
      numericValue: longest.distanceKm,
      date: longest.date,
      context: `${longest.activityType} in ${formatDuration(longest.durationSeconds)}`,
    });
  }

  // 2. Workout PRs by exercise
  const exerciseStats: Record<
    string,
    {
      name: string;
      isTimed: boolean;
      maxReps: { reps: number; weight: number; date: string };
      longestHold: { hold: number; date: string };
      maxWeight: { weight: number; reps: number; date: string };
    }
  > = {};

  workouts.forEach((workout) => {
    workout.exercises.forEach((ex) => {
      if (!exerciseStats[ex.exerciseId]) {
        exerciseStats[ex.exerciseId] = {
          name: ex.exerciseName,
          isTimed: ex.isTimed,
          maxReps: { reps: 0, weight: 0, date: '' },
          longestHold: { hold: 0, date: '' },
          maxWeight: { weight: 0, reps: 0, date: '' },
        };
      }

      const stat = exerciseStats[ex.exerciseId];
      ex.sets.forEach((set) => {
        if (set.isTimed || ex.isTimed) {
          const hold = set.holdDurationSeconds || set.totalSetDurationSeconds || 0;
          if (hold > stat.longestHold.hold) {
            stat.longestHold = { hold, date: workout.date };
          }
        } else {
          if (set.reps > stat.maxReps.reps) {
            stat.maxReps = {
              reps: set.reps,
              weight: set.weightKg || 0,
              date: workout.date,
            };
          }
          if (set.weightKg && set.weightKg > stat.maxWeight.weight) {
            stat.maxWeight = {
              weight: set.weightKg,
              reps: set.reps,
              date: workout.date,
            };
          }
        }
      });
    });
  });

  Object.values(exerciseStats).forEach((stat) => {
    if (stat.isTimed && stat.longestHold.hold > 0) {
      records.push({
        id: `pr-timed-${stat.name}`,
        title: `${stat.name} Longest Hold`,
        category: 'workout',
        metric: 'Hold Time',
        value: `${stat.longestHold.hold}s`,
        numericValue: stat.longestHold.hold,
        date: stat.longestHold.date,
        context: 'Timed hold record',
      });
    } else {
      if (stat.maxReps.reps > 0) {
        records.push({
          id: `pr-reps-${stat.name}`,
          title: `${stat.name} Max Reps`,
          category: 'workout',
          metric: 'Reps in single set',
          value: `${stat.maxReps.reps} reps`,
          numericValue: stat.maxReps.reps,
          date: stat.maxReps.date,
          context: stat.maxReps.weight > 0 ? `@ ${stat.maxReps.weight} kg` : 'Bodyweight',
        });
      }
      if (stat.maxWeight.weight > 0) {
        records.push({
          id: `pr-weight-${stat.name}`,
          title: `${stat.name} Heaviest Set`,
          category: 'workout',
          metric: 'Load',
          value: `${stat.maxWeight.weight} kg`,
          numericValue: stat.maxWeight.weight,
          date: stat.maxWeight.date,
          context: `for ${stat.maxWeight.reps} reps`,
        });
      }
    }
  });

  return records;
}

/**
 * Calculated estimate: BMI (only if user provided height in cm)
 */
export function calculateBMI(
  weightKg?: number | null,
  heightCm?: number | null
): { value: number; label: string } | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  let label = 'Normal';
  if (bmi < 18.5) label = 'Underweight';
  else if (bmi < 25) label = 'Normal';
  else if (bmi < 30) label = 'Overweight';
  else label = 'Obese';

  return { value: Math.round(bmi * 10) / 10, label };
}

/**
 * Calculated estimate: Waist-to-Hip Ratio
 */
export function calculateWaistToHipRatio(
  waistCm?: number | null,
  hipCm?: number | null
): { value: number; risk: string } | null {
  if (!waistCm || !hipCm || waistCm <= 0 || hipCm <= 0) return null;
  const ratio = waistCm / hipCm;
  const rounded = Math.round(ratio * 100) / 100;
  let risk = 'Moderate';
  if (ratio < 0.85) risk = 'Low Risk';
  else if (ratio <= 0.9) risk = 'Moderate Risk';
  else risk = 'Higher Risk';

  return { value: rounded, risk };
}

/**
 * Find previous performance for a given exercise to compare against in workout logger
 */
export function getPreviousExercisePerformance(
  workouts: WorkoutSession[],
  exerciseId: string,
  currentWorkoutId?: string
) {
  // Sort descending by date
  const sorted = [...workouts]
    .filter((w) => w.id !== currentWorkoutId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  for (const session of sorted) {
    const foundEx = session.exercises.find((e) => e.exerciseId === exerciseId);
    if (foundEx && foundEx.sets.length > 0) {
      return {
        sessionDate: session.date,
        sessionName: session.name,
        sets: foundEx.sets,
      };
    }
  }
  return null;
}

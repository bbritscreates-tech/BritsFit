import React, { useState, useEffect } from 'react';
import { CardioSession, CardioActivityType } from '../../types/fitness';
import { Modal } from '../common/Modal';
import { db } from '../../services/db';
import {
  calculatePaceMinPerKm,
  calculateSpeedKmH,
  formatPace,
  formatDuration,
} from '../../services/calculations';

interface CardioEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionToEdit?: CardioSession | null;
  onSaved: () => void;
}

export const CardioEditorModal: React.FC<CardioEditorModalProps> = ({
  isOpen,
  onClose,
  sessionToEdit,
  onSaved,
}) => {
  const [id, setId] = useState('');
  const [date, setDate] = useState('');
  const [activityType, setActivityType] = useState<CardioActivityType>('running');
  const [routeLocation, setRouteLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState<string>('5.00');

  // Duration components: hours, minutes, seconds
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('25');
  const [seconds, setSeconds] = useState<string>('00');

  // Moving time
  const [hasSeparateMovingTime, setHasSeparateMovingTime] = useState(false);
  const [movingMinutes, setMovingMinutes] = useState<string>('24');
  const [movingSeconds, setMovingSeconds] = useState<string>('30');

  const [avgHeartRate, setAvgHeartRate] = useState<string>('');
  const [elevationGainM, setElevationGainM] = useState<string>('');
  const [stepCount, setStepCount] = useState<string>('');
  const [effort, setEffort] = useState<number>(7);
  const [surfaceCondition, setSurfaceCondition] = useState<string>('Road / Paved');
  const [weatherCondition, setWeatherCondition] = useState<string>('Clear, 16°C');
  const [notes, setNotes] = useState<string>('');

  useEffect(() => {
    if (sessionToEdit) {
      setId(sessionToEdit.id);
      setDate(sessionToEdit.date);
      setActivityType(sessionToEdit.activityType);
      setRouteLocation(sessionToEdit.routeLocation || '');
      setDistanceKm(sessionToEdit.distanceKm.toString());

      const totSec = sessionToEdit.durationSeconds;
      setHours(Math.floor(totSec / 3600).toString());
      setMinutes(Math.floor((totSec % 3600) / 60).toString());
      setSeconds((totSec % 60).toString().padStart(2, '0'));

      if (sessionToEdit.movingDurationSeconds && sessionToEdit.movingDurationSeconds !== totSec) {
        setHasSeparateMovingTime(true);
        const movSec = sessionToEdit.movingDurationSeconds;
        setMovingMinutes(Math.floor(movSec / 60).toString());
        setMovingSeconds((movSec % 60).toString().padStart(2, '0'));
      } else {
        setHasSeparateMovingTime(false);
      }

      setAvgHeartRate(sessionToEdit.avgHeartRate ? sessionToEdit.avgHeartRate.toString() : '');
      setElevationGainM(sessionToEdit.elevationGainM ? sessionToEdit.elevationGainM.toString() : '');
      setStepCount(sessionToEdit.stepCount ? sessionToEdit.stepCount.toString() : '');
      setEffort(sessionToEdit.effort);
      setSurfaceCondition(sessionToEdit.surfaceCondition || '');
      setWeatherCondition(sessionToEdit.weatherCondition || '');
      setNotes(sessionToEdit.notes || '');
    } else {
      setId('c-' + Date.now());
      setDate(new Date().toISOString().slice(0, 16));
      setActivityType('running');
      setRouteLocation('');
      setDistanceKm('5.00');
      setHours('0');
      setMinutes('25');
      setSeconds('00');
      setHasSeparateMovingTime(false);
      setAvgHeartRate('');
      setElevationGainM('');
      setStepCount('');
      setEffort(7);
      setSurfaceCondition('Road / Paved');
      setWeatherCondition('');
      setNotes('');
    }
  }, [sessionToEdit, isOpen]);

  // Live calculated metrics
  const numericDistance = Math.max(0, parseFloat(distanceKm) || 0);
  const totalElapsedSeconds =
    (parseInt(hours) || 0) * 3600 +
    (parseInt(minutes) || 0) * 60 +
    (parseInt(seconds) || 0);

  const calculatedPace = calculatePaceMinPerKm(totalElapsedSeconds, numericDistance);
  const calculatedSpeed = calculateSpeedKmH(totalElapsedSeconds, numericDistance);

  const handleSave = () => {
    if (numericDistance <= 0) {
      alert('Please enter a valid distance greater than 0 km.');
      return;
    }
    if (totalElapsedSeconds <= 0) {
      alert('Please enter a valid duration.');
      return;
    }

    let movingSecondsTotal: number | undefined = undefined;
    if (hasSeparateMovingTime) {
      movingSecondsTotal = (parseInt(movingMinutes) || 0) * 60 + (parseInt(movingSeconds) || 0);
    }

    const session: CardioSession = {
      id: id || 'c-' + Date.now(),
      date: date || new Date().toISOString(),
      activityType,
      routeLocation: routeLocation.trim() || undefined,
      distanceKm: numericDistance,
      durationSeconds: totalElapsedSeconds,
      movingDurationSeconds: movingSecondsTotal,
      paceMinPerKm: calculatedPace,
      speedKmH: calculatedSpeed,
      elevationGainM: elevationGainM ? parseFloat(elevationGainM) : undefined,
      stepCount: stepCount ? parseInt(stepCount) : undefined,
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      effort,
      surfaceCondition: surfaceCondition.trim() || undefined,
      weatherCondition: weatherCondition.trim() || undefined,
      notes: notes.trim() || undefined,
      createdAt: sessionToEdit?.createdAt || new Date().toISOString(),
    };

    db.saveCardio(session);
    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={sessionToEdit ? 'Edit Cardio Session' : 'Log Walking / Running Session'}
      subtitle="Manual entry from your tracking app (no GPS required)"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Top type & date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Activity Type
            </label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value as CardioActivityType)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="running">Running</option>
              <option value="walking">Walking</option>
              <option value="walk_run">Walk / Run Interval</option>
              <option value="trail_running">Trail Running</option>
              <option value="hiking">Hiking</option>
              <option value="treadmill">Treadmill</option>
              <option value="other">Other Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Distance & Route */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Distance (km) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={distanceKm}
              onChange={(e) => setDistanceKm(e.target.value)}
              className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white tabular-nums"
              placeholder="e.g. 5.00"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Route or Location (optional)
            </label>
            <input
              type="text"
              value={routeLocation}
              onChange={(e) => setRouteLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder="e.g. Park Perimeter Trail"
            />
          </div>
        </div>

        {/* Total Elapsed Duration Inputs */}
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Total Elapsed Duration *
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <span className="text-[10px] text-slate-400">Hours</span>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Minutes</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-semibold"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-400">Seconds</span>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full px-2 py-1.5 text-xs text-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums font-semibold"
              />
            </div>
          </div>

          {/* Live Calculated Pace & Speed Banner */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200 dark:border-slate-700/60">
            <div>
              <span className="text-slate-400">Calculated Pace: </span>
              <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatPace(calculatedPace)}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Average Speed: </span>
              <span className="font-bold font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                {calculatedSpeed.toFixed(2)} km/h
              </span>
            </div>
          </div>
        </div>

        {/* Moving Time Toggle */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={hasSeparateMovingTime}
              onChange={(e) => setHasSeparateMovingTime(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span>Record separate moving time (if your watch or app distinguishes it)</span>
          </label>

          {hasSeparateMovingTime && (
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/30">
              <div>
                <span className="text-[10px] text-slate-400">Moving Minutes</span>
                <input
                  type="number"
                  min="0"
                  value={movingMinutes}
                  onChange={(e) => setMovingMinutes(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Moving Seconds</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={movingSeconds}
                  onChange={(e) => setMovingSeconds(e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 tabular-nums"
                />
              </div>
            </div>
          )}
        </div>

        {/* Secondary Metrics: Heart Rate, Elevation, Steps, Effort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Avg Heart Rate
            </label>
            <input
              type="number"
              min="40"
              max="240"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
              placeholder="bpm"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Elevation Gain
            </label>
            <input
              type="number"
              min="0"
              value={elevationGainM}
              onChange={(e) => setElevationGainM(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
              placeholder="meters"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Step Count
            </label>
            <input
              type="number"
              min="0"
              value={stepCount}
              onChange={(e) => setStepCount(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
              placeholder="steps"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Effort (1-10)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={effort}
              onChange={(e) => setEffort(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 tabular-nums"
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Surface Condition
            </label>
            <input
              type="text"
              value={surfaceCondition}
              onChange={(e) => setSurfaceCondition(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              placeholder="e.g. Road, Trail, Treadmill, Track"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
              Weather Conditions
            </label>
            <input
              type="text"
              value={weatherCondition}
              onChange={(e) => setWeatherCondition(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              placeholder="e.g. Sunny 18°C, Overcast, Headwind"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
            Session Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Pacing strategy, footwear, breathing rhythm, hydration..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
          >
            Save Session
          </button>
        </div>
      </div>
    </Modal>
  );
};

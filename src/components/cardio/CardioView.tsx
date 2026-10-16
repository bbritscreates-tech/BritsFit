import React, { useState } from 'react';
import { CardioSession, CardioActivityType } from '../../types/fitness';
import { db } from '../../services/db';
import {
  formatDuration,
  formatPace,
  extractPersonalRecords,
} from '../../services/calculations';
import { LineChart, BarChart } from '../common/Charts';
import {
  Footprints,
  Plus,
  Search,
  Trophy,
  Edit2,
  Trash2,
  Copy,
  TrendingUp,
  MapPin,
  Heart,
  Mountain,
} from 'lucide-react';

interface CardioViewProps {
  cardio: CardioSession[];
  onOpenCardioEditor: (session?: CardioSession) => void;
  onRefresh: () => void;
}

export const CardioView: React.FC<CardioViewProps> = ({
  cardio,
  onOpenCardioEditor,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [distanceComparison, setDistanceComparison] = useState<string>('all');

  const filteredCardio = cardio.filter((c) => {
    const matchesSearch =
      c.activityType.toLowerCase().includes(search.toLowerCase()) ||
      (c.routeLocation && c.routeLocation.toLowerCase().includes(search.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesActivity = activityFilter === 'all' || c.activityType === activityFilter;

    let matchesDist = true;
    if (distanceComparison === '1km') {
      matchesDist = c.distanceKm >= 0.95 && c.distanceKm <= 1.05;
    } else if (distanceComparison === '3km') {
      matchesDist = c.distanceKm >= 2.9 && c.distanceKm <= 3.1;
    } else if (distanceComparison === '5km') {
      matchesDist = c.distanceKm >= 4.85 && c.distanceKm <= 5.15;
    } else if (distanceComparison === '10km') {
      matchesDist = c.distanceKm >= 9.8 && c.distanceKm <= 10.2;
    }

    return matchesSearch && matchesActivity && matchesDist;
  });

  const handleDelete = (id: string, date: string, dist: number) => {
    if (confirm(`Delete cardio log on ${new Date(date).toLocaleDateString()} (${dist.toFixed(2)} km)?`)) {
      db.deleteCardio(id);
      onRefresh();
    }
  };

  const handleDuplicate = (session: CardioSession) => {
    const copy: CardioSession = {
      ...JSON.parse(JSON.stringify(session)),
      id: 'c-' + Date.now(),
      date: new Date().toISOString().slice(0, 16),
      createdAt: new Date().toISOString(),
    };
    db.saveCardio(copy);
    onRefresh();
  };

  // Comparable Personal Bests extraction
  const personalRecords = extractPersonalRecords([], cardio);
  const pb1k = personalRecords.find((r) => r.id === 'cardio-1 km');
  const pb3k = personalRecords.find((r) => r.id === 'cardio-3 km');
  const pb5k = personalRecords.find((r) => r.id === 'cardio-5 km');
  const pb10k = personalRecords.find((r) => r.id === 'cardio-10 km');

  // Trend Charts Data
  const sortedSessions = [...cardio].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const paceChartData = sortedSessions
    .filter((c) => c.paceMinPerKm > 0 && c.paceMinPerKm < 20)
    .map((c) => ({
      label: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      value: Math.round(c.paceMinPerKm * 100) / 100,
      tooltipContext: `${formatPace(c.paceMinPerKm)} (${c.distanceKm.toFixed(1)} km)`,
    }));

  const distanceChartData = sortedSessions.map((c) => ({
    label: new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    value: c.distanceKm,
    tooltipContext: `${c.activityType} in ${formatDuration(c.durationSeconds)}`,
  }));

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 pt-4">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Walking & Running Tracking
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manual session entry, distance matching, pace and speed calculations
          </p>
        </div>

        <button
          onClick={() => onOpenCardioEditor()}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Log Cardio Session</span>
        </button>
      </div>

      {/* Comparable Distance Personal Bests Banner */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Comparable Personal Bests
          </h3>
          <span className="text-[10px] text-slate-400">
            (calculated strictly from comparable matching distances)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">1 km Record</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {pb1k ? pb1k.value : '--:--'}
            </span>
            <span className="text-[10px] text-slate-500 block">{pb1k ? pb1k.context : 'No comparable runs'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">3 km Record</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {pb3k ? pb3k.value : '--:--'}
            </span>
            <span className="text-[10px] text-slate-500 block">{pb3k ? pb3k.context : 'No comparable runs'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">5 km Record</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {pb5k ? pb5k.value : '--:--'}
            </span>
            <span className="text-[10px] text-slate-500 block">{pb5k ? pb5k.context : 'No comparable runs'}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 block font-medium">10 km Record</span>
            <span className="text-lg font-bold font-mono text-slate-900 dark:text-white block mt-0.5">
              {pb10k ? pb10k.value : '--:--'}
            </span>
            <span className="text-[10px] text-slate-500 block">{pb10k ? pb10k.context : 'No comparable runs'}</span>
          </div>
        </div>
      </div>

      {/* Interactive Charts: Pace improvements & Distance Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Average Pace Trend (min/km)
            </h3>
            <span className="text-[11px] text-slate-400">Lower line = faster pace</span>
          </div>
          <LineChart
            data={paceChartData}
            height={190}
            color="#10b981"
            fillColor="#10b981"
            unit="min/km"
            formatValue={(v) => formatPace(v)}
            emptyMessage="No recorded paces yet"
          />
        </div>

        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Session Mileage (km)
            </h3>
            <span className="text-[11px] text-slate-400">Distance per logged outing</span>
          </div>
          <LineChart
            data={distanceChartData}
            height={190}
            color="#06b6d4"
            fillColor="#06b6d4"
            unit="km"
            formatValue={(v) => v.toFixed(2)}
            emptyMessage="No recorded distances yet"
          />
        </div>
      </div>

      {/* Filters & Matching Distance Selector */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            placeholder="Search route, weather, surface, notes..."
          />
        </div>

        <select
          value={activityFilter}
          onChange={(e) => setActivityFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="all">All Activities</option>
          <option value="running">Running</option>
          <option value="walking">Walking</option>
          <option value="walk_run">Walk / Run</option>
          <option value="hiking">Hiking</option>
          <option value="trail_running">Trail Running</option>
          <option value="treadmill">Treadmill</option>
        </select>

        <select
          value={distanceComparison}
          onChange={(e) => setDistanceComparison(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
        >
          <option value="all">All Distances</option>
          <option value="1km">Match ~1 km (0.95 - 1.05 km)</option>
          <option value="3km">Match ~3 km (2.9 - 3.1 km)</option>
          <option value="5km">Match ~5 km (4.85 - 5.15 km)</option>
          <option value="10km">Match ~10 km (9.8 - 10.2 km)</option>
        </select>
      </div>

      {/* Cardio History List */}
      <div className="space-y-3">
        {filteredCardio.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <Footprints className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              No cardio logs found matching your filters.
            </p>
          </div>
        ) : (
          filteredCardio.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {session.activityType.replace('_', ' ')}
                    </span>
                    {session.routeLocation && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {session.routeLocation}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{new Date(session.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    <span>·</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono tabular-nums">
                      {session.distanceKm.toFixed(2)} km
                    </span>
                    <span>·</span>
                    <span className="font-mono tabular-nums">{formatDuration(session.durationSeconds)}</span>
                  </div>
                </div>

                {/* Pace & Speed Badges */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {formatPace(session.paceMinPerKm)}
                    </div>
                    <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold tabular-nums">
                      {session.speedKmH.toFixed(1)} km/h
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDuplicate(session)}
                      className="p-1.5 text-slate-400 hover:text-cyan-500 cursor-pointer"
                      title="Duplicate entry"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenCardioEditor(session)}
                      className="p-1.5 text-slate-400 hover:text-emerald-500 cursor-pointer"
                      title="Edit entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(session.id, session.date, session.distanceKm)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Telemetry Strip */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {session.movingDurationSeconds && session.movingDurationSeconds !== session.durationSeconds && (
                  <span>Moving Time: {formatDuration(session.movingDurationSeconds)}</span>
                )}
                {session.avgHeartRate && (
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-rose-500" />
                    {session.avgHeartRate} bpm
                  </span>
                )}
                {session.elevationGainM && (
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3 text-slate-400" />
                    +{session.elevationGainM}m elevation
                  </span>
                )}
                {session.stepCount && <span>{session.stepCount.toLocaleString()} steps</span>}
                {session.surfaceCondition && <span>Surface: {session.surfaceCondition}</span>}
                {session.weatherCondition && <span>Weather: {session.weatherCondition}</span>}
                <span>Effort: {session.effort}/10</span>
              </div>

              {session.notes && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 italic">
                  "{session.notes}"
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

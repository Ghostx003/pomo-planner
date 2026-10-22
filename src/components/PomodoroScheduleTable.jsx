import React from 'react';
import { Calendar, Clock, Sparkles } from 'lucide-react';
import { calculatePhasesSummary, formatDurationWords, formatDuration } from '../utils/pomodoroCalc';

export function PomodoroScheduleTable({
  phases = [],
  currentTime,
  onSyncDeadline,
}) {
  const summary = calculatePhasesSummary(phases);

  if (summary.phaseRows.length === 0) {
    return null;
  }

  const completionDate = currentTime
    ? new Date(currentTime.getTime() + summary.totalDurationMinutes * 60 * 1000)
    : null;

  return (
    <div className="complete-schedule-card glass-card animate-fade-in">
      <div className="complete-schedule-header">
        <div className="schedule-header-title-group">
          <div className="icon-wrapper icon-focus">
            <Calendar className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="complete-schedule-title">Your complete Pomodoro schedule</h3>
            <p className="complete-schedule-sub">
              Dynamic multi-phase breakdown tailored to your custom session & break durations
            </p>
          </div>
        </div>

        <div className="schedule-summary-badge font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>{summary.totalSessionsCount} Sessions • {formatDuration(summary.totalDurationMinutes)} Total</span>
        </div>
      </div>

      <div className="schedule-table-wrapper">
        <table className="complete-schedule-table">
          <thead>
            <tr>
              <th className="col-phase">Phase</th>
              <th className="col-session">Study session</th>
              <th className="col-break">Break</th>
              <th className="col-study-time">Study time</th>
              <th className="col-break-time">Break time</th>
            </tr>
          </thead>
          <tbody>
            {summary.phaseRows.map((row) => (
              <tr key={row.phaseNumber} className="schedule-table-row">
                <td className="cell-phase">
                  <span className="phase-pill-badge">
                    {row.phaseNumber}
                  </span>
                </td>
                <td className="cell-session font-mono">
                  {row.focusMinutes} min
                </td>
                <td className="cell-break font-mono text-amber-400">
                  {row.breakMinutes > 0 ? `${row.breakMinutes} min` : 'None'}
                </td>
                <td className="cell-study-time font-mono">
                  <div className="time-with-count">
                    <span className="time-primary text-emerald-400 font-semibold">
                      {formatDurationWords(row.studyMinutes)}
                    </span>
                    <span className="session-count-sub text-slate-400">
                      ({row.sessionsCount} {row.sessionsCount === 1 ? 'session' : 'sessions'})
                    </span>
                  </div>
                </td>
                <td className="cell-break-time font-mono text-slate-300">
                  {row.breakMinutesTotal > 0
                    ? formatDurationWords(row.breakMinutesTotal)
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="schedule-table-total-row">
              <td className="cell-total-label font-semibold">Total</td>
              <td className="cell-empty" />
              <td className="cell-empty" />
              <td className="cell-total-study font-mono text-emerald-400 font-bold">
                {formatDurationWords(summary.totalStudyMinutes)}
              </td>
              <td className="cell-total-break font-mono text-amber-400 font-bold">
                {formatDurationWords(summary.totalBreakMinutes)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Footer Bar */}
      <div className="schedule-table-footer">
        <div className="footer-stat-group">
          <span className="stat-pill">
            Pure Focus: <strong className="text-emerald-400 font-mono">{formatDuration(summary.totalStudyMinutes)}</strong>
          </span>
          <span className="stat-pill">
            Total Breaks: <strong className="text-amber-400 font-mono">{formatDuration(summary.totalBreakMinutes)}</strong>
          </span>
          <span className="stat-pill">
            Total Planned: <strong className="text-sky-400 font-mono">{formatDuration(summary.totalDurationMinutes)}</strong>
          </span>
        </div>

        {onSyncDeadline && completionDate && (
          <button
            type="button"
            className="sync-deadline-btn"
            onClick={() => onSyncDeadline(summary.totalDurationMinutes)}
            title="Set study finish deadline to exactly match this schedule"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Align Finish Time to Schedule</span>
          </button>
        )}
      </div>
    </div>
  );
}

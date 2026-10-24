import React from 'react';
import {
  CheckCircle2,
  BookOpen,
  Coffee,
  CheckCheck,
  Percent,
  Clock,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import {
  formatDuration,
  formatClockTime,
  formatSlipMinutes,
  formatHoursAndMinutes,
} from '../utils/pomodoroCalc';

export function StatsGrid({
  pomodorosPossible,
  completedPomodoros = 0,
  totalFocusMinutes,
  totalBreakMinutes,
  bufferMinutes,
  deadlineOverrunMinutes = 0,
  completionDate,
  efficiency,
  currentTime,
  is24Hour,
  deadlineDate,
  studySlipMinutes = 0,
  finalSlipMinutes = 0,
  actualDelayMinutes = 0,
}) {
  const isFinishedToday =
    completionDate && deadlineDate && currentTime
      ? completionDate.getDate() === currentTime.getDate()
      : true;

  const slipInfo = formatSlipMinutes(studySlipMinutes);

  return (
    <div className="stats-section">
      <div className="stats-grid">
        {/* Metric 1: Pomodoros (Total & Completed) */}
        <div className="stat-card glass-card stat-card-highlight">
          <div className="stat-header">
            <span className="stat-label">Pomodoro Progress</span>
            <div className="stat-icon-badge icon-badge-primary">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">
              {completedPomodoros}
              <span className="stat-total-divider">/{pomodorosPossible}</span>
            </span>
            <span className="stat-unit">
              {completedPomodoros === pomodorosPossible && pomodorosPossible > 0
                ? 'All Done!'
                : 'completed'}
            </span>
          </div>
          <p className="stat-description">
            {completedPomodoros > 0
              ? `${completedPomodoros} of ${pomodorosPossible} focus blocks completed`
              : `${pomodorosPossible} complete sessions planned before deadline`}
          </p>
        </div>

        {/* Metric 2: New Study Slip Metric */}
        <div className={`stat-card glass-card ${studySlipMinutes > 0 ? 'stat-card-slip-warn' : ''}`}>
          <div className="stat-header">
            <span className="stat-label">Study Slip</span>
            <div
              className={`stat-icon-badge ${
                studySlipMinutes > 0
                  ? 'icon-badge-break'
                  : studySlipMinutes < 0
                  ? 'icon-badge-buffer'
                  : 'icon-badge-focus'
              }`}
            >
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">{slipInfo.diff}</span>
            <span
              className={`badge text-[11px] ${
                slipInfo.status === 'behind'
                  ? 'badge-break'
                  : slipInfo.status === 'ahead'
                  ? 'badge-buffer'
                  : 'badge-focus'
              }`}
            >
              {slipInfo.text}
            </span>
          </div>
          <p className="stat-description">
            {actualDelayMinutes > 0
              ? `Current session started ${formatDuration(actualDelayMinutes)} late vs schedule`
              : studySlipMinutes > 0
              ? `Overall schedule shifted by +${formatDuration(studySlipMinutes)} (finish: +${formatDuration(finalSlipMinutes)})`
              : studySlipMinutes < 0
              ? `Ahead of original baseline plan by ${formatDuration(Math.abs(studySlipMinutes))}`
              : 'Perfect timing — exactly aligned with original baseline plan'}
          </p>
        </div>

        {/* Metric 3: Total Focused Study Time */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">Total Focus Time</span>
            <div className="stat-icon-badge icon-badge-focus">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">{formatDuration(totalFocusMinutes)}</span>
            <span className="stat-unit">({totalFocusMinutes}m)</span>
          </div>
          <p className="stat-description">
            Pure uninterrupted study time across all planned sessions
          </p>
        </div>

        {/* Metric 4: Total Break Time */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">Total Break Time</span>
            <div className="stat-icon-badge icon-badge-break">
              <Coffee className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">{formatDuration(totalBreakMinutes)}</span>
            <span className="stat-unit">
              ({pomodorosPossible > 1 ? `${pomodorosPossible - 1} breaks` : '0 breaks'})
            </span>
          </div>
          <p className="stat-description">
            Rest intervals scheduled strictly between sessions
          </p>
        </div>

        {/* Metric 5: Expected Completion Time */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">Expected Completion</span>
            <div className="stat-icon-badge icon-badge-complete">
              <CheckCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value-sub font-mono">
              {pomodorosPossible > 0
                ? formatClockTime(completionDate, is24Hour, false)
                : '--:--'}
            </span>
            {pomodorosPossible > 0 && (
              <span className="stat-day-tag">
                {isFinishedToday ? 'Today' : 'Tomorrow'}
              </span>
            )}
          </div>
          <p className="stat-description">
            {deadlineOverrunMinutes > 0 ? (
              <span className="text-amber-400 font-medium">
                Overruns target deadline by {formatHoursAndMinutes(deadlineOverrunMinutes)}
              </span>
            ) : pomodorosPossible > 0 ? (
              `When you will finish your ${pomodorosPossible}${
                pomodorosPossible === 1 ? 'st' : pomodorosPossible === 2 ? 'nd' : pomodorosPossible === 3 ? 'rd' : 'th'
              } session`
            ) : (
              'No sessions scheduled yet'
            )}
          </p>
        </div>

        {/* Metric 6: Study Efficiency */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">Study Efficiency</span>
            <div className="stat-icon-badge icon-badge-efficiency">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">{efficiency}%</span>
            <span className="stat-unit">focus ratio</span>
          </div>
          <p className="stat-description">
            Portion of total available time dedicated to study
          </p>
        </div>

        {/* Metric 7: Buffer Time / Deadline Overrun */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">
              {deadlineOverrunMinutes > 0 ? 'Deadline Overrun' : 'Buffer Time'}
            </span>
            <div
              className={`stat-icon-badge ${
                deadlineOverrunMinutes > 0 ? 'icon-badge-break' : 'icon-badge-buffer'
              }`}
            >
              {deadlineOverrunMinutes > 0 ? (
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
          </div>
          <div className="stat-main">
            {deadlineOverrunMinutes > 0 ? (
              <div className="stat-overrun-split">
                <span className="stat-value font-mono text-amber-400">
                  +{formatHoursAndMinutes(deadlineOverrunMinutes)}
                </span>
                <span className="stat-unit text-amber-400/80">overrun</span>
              </div>
            ) : (
              <>
                <span className="stat-value font-mono">{formatDuration(bufferMinutes)}</span>
                <span className="stat-unit">spare</span>
              </>
            )}
          </div>
          <p className="stat-description">
            {deadlineOverrunMinutes > 0
              ? `Schedule extends ${formatHoursAndMinutes(deadlineOverrunMinutes)} past your target deadline`
              : 'Free margin between final complete session and your deadline'}
          </p>
        </div>
      </div>
    </div>
  );
}

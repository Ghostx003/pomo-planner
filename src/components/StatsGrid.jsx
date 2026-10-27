import React from 'react';
import {
  CheckCircle2,
  BookOpen,
  Coffee,
  CheckCheck,
  Percent,
  Clock,
} from 'lucide-react';
import {
  formatDuration,
  formatClockTime,
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
}) {
  const isFinishedToday =
    completionDate && deadlineDate && currentTime
      ? completionDate.getDate() === currentTime.getDate()
      : true;

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

        {/* Metric 2: Study Ends */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">Study Ends</span>
            <div className="stat-icon-badge icon-badge-complete">
              <CheckCheck className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div className="stat-main">
            <span className="stat-value font-mono">
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
            {pomodorosPossible > 0
              ? `At ${formatClockTime(completionDate, is24Hour, false)} study ends`
              : 'No sessions scheduled yet'}
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
            <span className="stat-unit">({pomodorosPossible} {pomodorosPossible === 1 ? 'session' : 'sessions'})</span>
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

        {/* Metric 5: Study Efficiency */}
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

        {/* Metric 6: Buffer Time */}
        <div className="stat-card glass-card">
          <div className="stat-header">
            <span className="stat-label">
              {deadlineOverrunMinutes > 0 ? 'Margin' : 'Buffer Time'}
            </span>
            <div
              className={`stat-icon-badge ${
                deadlineOverrunMinutes > 0 ? 'icon-badge-break' : 'icon-badge-buffer'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="stat-main">
            {deadlineOverrunMinutes > 0 ? (
              <div className="stat-overrun-split">
                <span className="stat-value font-mono text-slate-200">
                  +{formatHoursAndMinutes(deadlineOverrunMinutes)}
                </span>
                <span className="stat-unit text-slate-400">margin</span>
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
              ? `Timeline extends ${formatHoursAndMinutes(deadlineOverrunMinutes)} beyond target window`
              : 'Free margin between final complete session and your deadline'}
          </p>
        </div>
      </div>
    </div>
  );
}

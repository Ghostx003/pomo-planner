import React from 'react';
import { Sparkles, Info, CheckCircle } from 'lucide-react';
import { getMotivationalMessage, formatDuration } from '../utils/pomodoroCalc';

export function EfficiencyBar({
  pomodorosPossible,
  totalFocusMinutes,
  totalBreakMinutes,
  bufferMinutes,
  remainingMinutes,
  efficiency,
}) {
  const motivation = getMotivationalMessage(pomodorosPossible, totalFocusMinutes);

  const safeTotal = Math.max(1, remainingMinutes);
  const focusPercent = Math.min(100, Math.round((totalFocusMinutes / safeTotal) * 100));
  const breakPercent = Math.min(100 - focusPercent, Math.round((totalBreakMinutes / safeTotal) * 100));
  const bufferPercent = Math.max(0, 100 - (focusPercent + breakPercent));

  return (
    <div className="efficiency-card glass-card">
      <div className="efficiency-header">
        <div className="efficiency-title-group">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3 className="efficiency-title">Time Allocation & Schedule Distribution</h3>
        </div>
        <div className="efficiency-badge font-mono">
          {efficiency}% Focus Workload
        </div>
      </div>

      {/* Visual Multi-Segment Bar */}
      <div className="segmented-bar-track">
        {focusPercent > 0 && (
          <div
            className="bar-segment segment-focus"
            style={{ width: `${focusPercent}%` }}
            title={`Focused Study: ${formatDuration(totalFocusMinutes)} (${focusPercent}%)`}
          />
        )}
        {breakPercent > 0 && (
          <div
            className="bar-segment segment-break"
            style={{ width: `${breakPercent}%` }}
            title={`Scheduled Breaks: ${formatDuration(totalBreakMinutes)} (${breakPercent}%)`}
          />
        )}
        {bufferPercent > 0 && (
          <div
            className="bar-segment segment-buffer"
            style={{ width: `${bufferPercent}%` }}
            title={`Buffer / Flex Time: ${formatDuration(bufferMinutes)} (${bufferPercent}%)`}
          />
        )}
      </div>

      {/* Bar Legend */}
      <div className="segmented-bar-legend">
        <div className="legend-item">
          <span className="legend-dot dot-focus" />
          <span className="legend-text">
            Focus: <strong className="font-mono">{formatDuration(totalFocusMinutes)}</strong> ({focusPercent}%)
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-break" />
          <span className="legend-text">
            Breaks: <strong className="font-mono">{formatDuration(totalBreakMinutes)}</strong> ({breakPercent}%)
          </span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-buffer" />
          <span className="legend-text">
            Buffer: <strong className="font-mono">{formatDuration(bufferMinutes)}</strong> ({bufferPercent}%)
          </span>
        </div>
      </div>

      {/* Motivational / Contextual Message */}
      <div className={`motivation-banner motivation-${motivation.type}`}>
        <div className="motivation-icon">
          {motivation.type === 'warning' ? (
            <Info className="w-4 h-4 text-amber-400" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="motivation-content">
          <div className="motivation-heading-row">
            <span className="motivation-title">{motivation.title}</span>
            <span className="badge badge-primary text-[10px]">{motivation.badge}</span>
          </div>
          <p className="motivation-text">{motivation.text}</p>
        </div>
      </div>
    </div>
  );
}

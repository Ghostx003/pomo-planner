import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  Clock,
  Flame,
  Coffee,
  Shuffle,
  Sliders,
  RotateCcw,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import {
  calculateInitialAutoSlice,
  adjustAutoSliceOnSlider,
  buildSessionsSequence,
  buildPhasesFromSequence,
} from '../utils/autoSliceCalc';
import { formatDuration, formatClockTime, triggerHaptic } from '../utils/pomodoroCalc';
import { fireConfetti } from '../utils/confetti';

export function AutoSliceModal({
  isOpen,
  onClose,
  onApplyAutoSlice,
  currentTime,
}) {
  // Target Study Hours (default 9 as highlighted by user)
  const [targetHours, setTargetHours] = useState(9);

  // Break duration per session (default 5 mins)
  const [breakMinutes, setBreakMinutes] = useState(5);

  // Auto-balance other tiers when moving a slider (default true)
  const [autoBalance, setAutoBalance] = useState(true);

  // Arrangement Mode: 'random' | 'balanced' | 'grouped' | 'ascending'
  const [arrangementMode, setArrangementMode] = useState('random');

  // Shuffle seed counter to trigger re-rolls for random mode
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Align finish deadline checkbox (default true)
  const [alignDeadline, setAlignDeadline] = useState(true);

  // Counts for each duration tier: 25, 35, 45
  const [counts, setCounts] = useState(() => calculateInitialAutoSlice(9));

  // When modal opens or target hours changes via input/presets, re-calculate initial distribution
  const handleHoursChange = (newHours) => {
    const val = Math.max(0.5, Math.min(24, parseFloat(newHours) || 1));
    setTargetHours(val);
    const newCounts = calculateInitialAutoSlice(val);
    setCounts(newCounts);
    triggerHaptic('light');
  };

  // Re-calculate initial equal distribution
  const handleResetToEqual = () => {
    triggerHaptic('light');
    setCounts(calculateInitialAutoSlice(targetHours));
  };

  // Slider change handler with live auto-balancing
  const handleSliderChange = (tier, newCount) => {
    const count = Math.max(0, parseInt(newCount, 10) || 0);
    triggerHaptic('light');

    if (autoBalance) {
      const adjusted = adjustAutoSliceOnSlider({
        targetHours,
        activeTier: tier,
        newCount: count,
        currentCounts: counts,
      });
      setCounts(adjusted);
    } else {
      setCounts((prev) => ({
        ...prev,
        [tier]: count,
      }));
    }
  };

  // Stepper increment / decrement
  const handleStepCount = (tier, delta) => {
    const current = counts[tier] || 0;
    const next = Math.max(0, current + delta);
    handleSliderChange(tier, next);
  };

  // Sequence of sessions generated based on counts, mode, and shuffle seed
  const sessionSequence = useMemo(() => {
    // shuffleSeed is passed to force recomputation on re-shuffle
    void shuffleSeed;
    return buildSessionsSequence(counts, arrangementMode);
  }, [counts, arrangementMode, shuffleSeed]);

  // Total Focus Minutes from current counts
  const totalFocusMinutes = useMemo(() => {
    return (counts[25] || 0) * 25 + (counts[35] || 0) * 35 + (counts[45] || 0) * 45;
  }, [counts]);

  const targetMinutes = Math.round(targetHours * 60);
  const excessMinutes = totalFocusMinutes - targetMinutes;

  const totalSessionsCount = (counts[25] || 0) + (counts[35] || 0) + (counts[45] || 0);
  const totalBreakMinutes = totalSessionsCount * breakMinutes;
  const totalPlanMinutes = totalFocusMinutes + totalBreakMinutes;

  // Estimated completion time
  const finishTimeStr = useMemo(() => {
    if (!currentTime) return null;
    const finishDate = new Date(currentTime.getTime() + totalPlanMinutes * 60 * 1000);
    return formatClockTime(finishDate, false, false);
  }, [currentTime, totalPlanMinutes]);

  // Handle Apply
  const handleApply = () => {
    if (totalSessionsCount === 0) return;

    triggerHaptic('success');
    fireConfetti();

    // Generate phase blocks from the chosen sequence
    const generatedPhases = buildPhasesFromSequence(sessionSequence, breakMinutes);

    onApplyAutoSlice({
      phases: generatedPhases,
      totalDurationMinutes: totalPlanMinutes,
      alignDeadline,
    });

    onClose();
  };

  // Re-shuffle order handler
  const handleReshuffle = () => {
    triggerHaptic('light');
    setArrangementMode('random');
    setShuffleSeed((prev) => prev + 1);
  };

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presetHours = [3, 4, 6, 8, 9, 10, 12];
  const breakPresets = [0, 5, 7, 10, 15];

  // Tier info array for rendering sliders
  const tiers = [
    {
      duration: 25,
      label: '25 min',
      sublabel: 'Sprint Focus',
      colorClass: 'tier-25',
      badgeColor: 'badge-emerald',
      barColor: '#10b981',
      maxSlider: 30,
    },
    {
      duration: 35,
      label: '35 min',
      sublabel: 'Standard Focus',
      colorClass: 'tier-35',
      badgeColor: 'badge-sky',
      barColor: '#0ea5e9',
      maxSlider: 25,
    },
    {
      duration: 45,
      label: '45 min',
      sublabel: 'Deep Work',
      colorClass: 'tier-45',
      badgeColor: 'badge-indigo',
      barColor: '#818cf8',
      maxSlider: 20,
    },
  ];

  return (
    <div
      className="auto-slice-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auto-slice-modal-title"
    >
      <div className="auto-slice-modal-container glass-card animate-scale-in">
        {/* Modal Header */}
        <div className="auto-slice-modal-header">
          <div className="auto-slice-header-info">
            <div className="auto-slice-icon-wrap">
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="auto-slice-modal-title" className="auto-slice-title">
                  Auto Slice Study Planner
                </h3>
                <span className="auto-slice-tag-smart">Smart Generator</span>
              </div>
              <p className="auto-slice-subtitle">
                Enter study hours. PomoPlan divides them across 25m, 35m & 45m sessions and auto-balances them with live sliders.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="auto-slice-close-btn"
            onClick={onClose}
            aria-label="Close Auto Slice dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="auto-slice-modal-body">
          {/* Section 1: Study Hours & Break Input */}
          <div className="auto-slice-input-card">
            <div className="auto-slice-row-between">
              <div>
                <label className="auto-slice-field-label">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span>Target Study Hours</span>
                </label>
                <p className="auto-slice-field-sub">
                  How many hours do you plan to study today?
                </p>
              </div>

              {/* Hours Stepper & Input */}
              <div className="auto-slice-hours-stepper">
                <button
                  type="button"
                  className="auto-slice-stepper-btn"
                  onClick={() => handleHoursChange(Math.max(1, targetHours - 1))}
                  disabled={targetHours <= 1}
                  aria-label="Decrease 1 hour"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="auto-slice-hours-val">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.5"
                    value={targetHours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    className="auto-slice-hours-input font-mono"
                    aria-label="Study hours"
                  />
                  <span className="auto-slice-hours-unit">hrs</span>
                </div>
                <button
                  type="button"
                  className="auto-slice-stepper-btn"
                  onClick={() => handleHoursChange(Math.min(24, targetHours + 1))}
                  disabled={targetHours >= 24}
                  aria-label="Increase 1 hour"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Hours Presets */}
            <div className="auto-slice-presets-row">
              <span className="text-[11px] text-slate-400 font-medium">Quick Pick:</span>
              <div className="auto-slice-presets-list">
                {presetHours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`auto-slice-preset-chip ${targetHours === h ? 'chip-active' : ''}`}
                    onClick={() => handleHoursChange(h)}
                  >
                    {h} hrs
                  </button>
                ))}
              </div>
            </div>

            {/* Break Duration Selector */}
            <div className="auto-slice-break-row">
              <div className="flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs text-slate-300 font-medium">Break per session:</span>
              </div>
              <div className="auto-slice-break-chips">
                {breakPresets.map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`auto-slice-break-chip ${breakMinutes === b ? 'break-active' : ''}`}
                    onClick={() => {
                      triggerHaptic('light');
                      setBreakMinutes(b);
                    }}
                  >
                    {b === 0 ? 'None' : `${b}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Interactive Sliders with Live Auto-Balancing */}
          <div className="auto-slice-sliders-card">
            <div className="auto-slice-sliders-header">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h4 className="auto-slice-section-title">
                  Session Balance Sliders ({targetHours}h split equally)
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <label className="auto-balance-toggle-label" title="When enabled, sliding one tier auto-adjusts the other two to maintain your study hours">
                  <input
                    type="checkbox"
                    checked={autoBalance}
                    onChange={(e) => setAutoBalance(e.target.checked)}
                    className="auto-balance-checkbox"
                  />
                  <span>Auto-balance other sections</span>
                </label>

                <button
                  type="button"
                  className="auto-slice-reset-equal-btn"
                  onClick={handleResetToEqual}
                  title="Reset sections to equal 1/3 division"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Equal 1/3</span>
                </button>
              </div>
            </div>

            <p className="auto-slice-section-hint">
              Slide any section to increase its Pomodoros. The other sections immediately recalculate to meet or exceed your {targetHours}-hour target!
            </p>

            <div className="auto-slice-tiers-list">
              {tiers.map((t) => {
                const count = counts[t.duration] || 0;
                const tierMinutes = count * t.duration;
                const sharePercent =
                  totalFocusMinutes > 0
                    ? Math.round((tierMinutes / totalFocusMinutes) * 100)
                    : 0;

                return (
                  <div key={t.duration} className={`auto-slice-tier-item ${t.colorClass}`}>
                    <div className="tier-top-row">
                      <div className="tier-badge-label-group">
                        <span className={`tier-duration-pill ${t.badgeColor}`}>
                          {t.label}
                        </span>
                        <div>
                          <span className="tier-sublabel">{t.sublabel}</span>
                          <span className="tier-share-text font-mono">
                            • {formatDuration(tierMinutes)} ({sharePercent}%)
                          </span>
                        </div>
                      </div>

                      {/* Stepper Count Controls */}
                      <div className="tier-count-stepper">
                        <button
                          type="button"
                          className="tier-btn-sm"
                          onClick={() => handleStepCount(t.duration, -1)}
                          disabled={count <= 0}
                          title={`Decrease 1 session of ${t.label}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="tier-count-display font-mono">
                          <strong>{count}</strong>
                          <span>{count === 1 ? 'session' : 'sessions'}</span>
                        </div>

                        <button
                          type="button"
                          className="tier-btn-sm"
                          onClick={() => handleStepCount(t.duration, 1)}
                          disabled={count >= t.maxSlider}
                          title={`Increase 1 session of ${t.label}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Smooth Range Slider */}
                    <div className="tier-slider-row">
                      <input
                        type="range"
                        min="0"
                        max={t.maxSlider}
                        value={count}
                        onChange={(e) => handleSliderChange(t.duration, e.target.value)}
                        className={`tier-range-slider slider-${t.duration}`}
                        aria-label={`Number of ${t.label} sessions`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Session Arrangement & Randomization */}
          <div className="auto-slice-arrangement-card">
            <div className="auto-slice-arr-header">
              <div className="flex items-center gap-2">
                <Shuffle className="w-4 h-4 text-sky-400" />
                <h4 className="auto-slice-section-title">Session Arrangement</h4>
              </div>
              {arrangementMode === 'random' && (
                <button
                  type="button"
                  className="reshuffle-btn"
                  onClick={handleReshuffle}
                  title="Randomize the sequence order again"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Re-shuffle Order</span>
                </button>
              )}
            </div>

            <div className="arrangement-tabs">
              <button
                type="button"
                className={`arr-tab ${arrangementMode === 'random' ? 'arr-tab-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setArrangementMode('random');
                }}
              >
                <span>🎲 Random Shuffle</span>
              </button>
              <button
                type="button"
                className={`arr-tab ${arrangementMode === 'balanced' ? 'arr-tab-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setArrangementMode('balanced');
                }}
              >
                <span>🌊 Balanced Wave</span>
              </button>
              <button
                type="button"
                className={`arr-tab ${arrangementMode === 'grouped' ? 'arr-tab-active' : ''}`}
                onClick={() => {
                  triggerHaptic('light');
                  setArrangementMode('grouped');
                }}
              >
                <span>📊 Grouped Phases</span>
              </button>
            </div>

            {/* Sequence Preview Pill Track */}
            <div className="sequence-preview-box">
              <span className="sequence-preview-label font-mono">
                Order Preview ({sessionSequence.length} sessions):
              </span>
              <div className="sequence-pills-track">
                {sessionSequence.map((dur, idx) => (
                  <span
                    key={idx}
                    className={`sequence-pill pill-${dur}`}
                    title={`Session #${idx + 1}: ${dur} minutes focus`}
                  >
                    {dur}m
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: Live Total Statistics Summary */}
          <div className="auto-slice-summary-bar">
            <div className="summary-stat-item">
              <span className="summary-stat-label">Total Pure Focus</span>
              <div className="summary-stat-val text-emerald-400 font-mono">
                {formatDuration(totalFocusMinutes)}
                {excessMinutes > 0 && (
                  <span className="summary-bonus-pill">
                    +{formatDuration(excessMinutes)} bonus
                  </span>
                )}
              </div>
            </div>

            <div className="summary-stat-item">
              <span className="summary-stat-label">Total Sessions</span>
              <div className="summary-stat-val text-indigo-300 font-mono">
                {totalSessionsCount} Pomodoros
              </div>
            </div>

            <div className="summary-stat-item">
              <span className="summary-stat-label">Total Breaks</span>
              <div className="summary-stat-val text-amber-300 font-mono">
                {formatDuration(totalBreakMinutes)}
              </div>
            </div>

            <div className="summary-stat-item">
              <span className="summary-stat-label">Total Plan Duration</span>
              <div className="summary-stat-val text-sky-400 font-mono">
                {formatDuration(totalPlanMinutes)}
              </div>
            </div>
          </div>

          {/* Align Deadline Option */}
          <div className="auto-slice-deadline-option">
            <label className="align-deadline-checkbox-label">
              <input
                type="checkbox"
                checked={alignDeadline}
                onChange={(e) => setAlignDeadline(e.target.checked)}
                className="auto-balance-checkbox"
              />
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>
                Align target finish deadline to this schedule ({formatDuration(totalPlanMinutes)} from now{finishTimeStr ? ` • finishes at ${finishTimeStr}` : ''})
              </span>
            </label>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="auto-slice-modal-footer">
          <button
            type="button"
            className="auto-slice-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="auto-slice-apply-btn"
            onClick={handleApply}
            disabled={totalSessionsCount === 0}
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Auto Slice to Schedule</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import {
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
  getTierLimits,
  buildSessionsSequence,
  buildPhasesFromSequence,
} from '../utils/autoSliceCalc';
import { formatDuration, formatClockTime, triggerHaptic } from '../utils/pomodoroCalc';
import { fireConfetti } from '../utils/confetti';

export function AutoSliceInlineView({
  onApplyAutoSlice,
  currentTime,
}) {
  // Target Study Hours (default 6 as requested, or user saved)
  const [targetHours, setTargetHours] = useState(() => {
    const saved = localStorage.getItem('pomoplan_auto_slice_hours');
    return saved ? Math.max(0.5, Math.min(24, parseFloat(saved) || 6)) : 6;
  });

  // Breaks depend on session duration:
  // 25m session -> 5m break
  // 35m session -> 7m break
  // 45m session -> 10m break
  const [tierBreaks, setTierBreaks] = useState({
    25: 5,
    35: 7,
    45: 10,
  });

  // Auto-balance other tiers when moving a slider (default true)
  const [autoBalance, setAutoBalance] = useState(true);

  // Arrangement Mode: 'random' | 'balanced' | 'grouped'
  const [arrangementMode, setArrangementMode] = useState('random');

  // Shuffle seed counter to trigger re-rolls for random mode
  const [shuffleSeed, setShuffleSeed] = useState(0);

  // Align finish deadline checkbox (default true)
  const [alignDeadline, setAlignDeadline] = useState(true);

  // Tight partition limits and valid counts based on target study duration
  const tierLimits = useMemo(() => {
    return getTierLimits(targetHours);
  }, [targetHours]);

  // Counts for each duration tier: 25, 35, 45 (calculated with exact integer partition math)
  const [counts, setCounts] = useState(() => calculateInitialAutoSlice(targetHours));

  // When target hours changes via input/presets, re-calculate initial distribution
  const handleHoursChange = (newHours) => {
    const val = Math.max(0.5, Math.min(24, parseFloat(newHours) || 1));
    setTargetHours(val);
    try {
      localStorage.setItem('pomoplan_auto_slice_hours', String(val));
    } catch {}
    const newCounts = calculateInitialAutoSlice(val);
    setCounts(newCounts);
    triggerHaptic('light');
  };

  // Re-calculate initial equal distribution
  const handleResetToEqual = () => {
    triggerHaptic('light');
    setCounts(calculateInitialAutoSlice(targetHours));
  };

  // Slider change handler with live mathematical auto-balancing
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
      const maxLimit = tierLimits.max[tier] || 60;
      setCounts((prev) => ({
        ...prev,
        [tier]: Math.min(maxLimit, count),
      }));
    }
  };

  // Stepper increment / decrement for sessions count using valid partition counts
  const handleStepCount = (tier, delta) => {
    triggerHaptic('light');

    if (autoBalance) {
      const current = counts[tier] || 0;
      const adjusted = adjustAutoSliceOnSlider({
        targetHours,
        activeTier: tier,
        newCount: current + delta,
        currentCounts: counts,
        stepDelta: delta,
      });
      setCounts(adjusted);
    } else {
      const current = counts[tier] || 0;
      const maxLimit = tierLimits.max[tier] || 60;
      const next = Math.max(0, Math.min(maxLimit, current + delta));
      setCounts((prev) => ({
        ...prev,
        [tier]: next,
      }));
    }
  };

  // Handler for individual tier break changes
  const handleTierBreakChange = (tier, newBreak) => {
    const bVal = Math.max(0, Math.min(60, parseInt(newBreak, 10) || 0));
    triggerHaptic('light');
    setTierBreaks((prev) => ({
      ...prev,
      [tier]: bVal,
    }));
  };

  // Sequence of sessions generated based on counts, mode, and shuffle seed
  const sessionSequence = useMemo(() => {
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

  // Total Break Minutes: breaks only occur between sessions (matching calculateStudyPlan timeline)
  const totalBreakMinutes = useMemo(() => {
    if (sessionSequence.length <= 1) return 0;
    let sum = 0;
    for (let i = 0; i < sessionSequence.length - 1; i++) {
      const dur = sessionSequence[i];
      sum += tierBreaks[dur] ?? 5;
    }
    return sum;
  }, [sessionSequence, tierBreaks]);

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

    // Generate phase blocks from the chosen sequence with tier-specific breaks
    const generatedPhases = buildPhasesFromSequence(sessionSequence, tierBreaks);

    onApplyAutoSlice({
      phases: generatedPhases,
      totalDurationMinutes: totalPlanMinutes,
      alignDeadline,
    });
  };

  // Re-shuffle order handler
  const handleReshuffle = () => {
    triggerHaptic('light');
    setArrangementMode('random');
    setShuffleSeed((prev) => prev + 1);
  };

  const presetHours = [3, 4, 6, 8, 9, 10, 12];

  // Tier info array for rendering sliders & tier-specific breaks with mathematically bounded ranges
  const tiers = useMemo(() => [
    {
      duration: 25,
      label: '25 min',
      sublabel: 'Sprint Focus',
      colorClass: 'tier-25',
      badgeColor: 'badge-emerald',
      maxSlider: tierLimits.max[25] || 15,
      minSlider: tierLimits.min[25] || 0,
      validCounts: tierLimits.validCounts[25] || [],
      breakPresets: [0, 3, 5, 7, 10],
      defaultBreak: 5,
    },
    {
      duration: 35,
      label: '35 min',
      sublabel: 'Standard Focus',
      colorClass: 'tier-35',
      badgeColor: 'badge-sky',
      maxSlider: tierLimits.max[35] || 15,
      minSlider: tierLimits.min[35] || 0,
      validCounts: tierLimits.validCounts[35] || [],
      breakPresets: [0, 5, 7, 10, 12],
      defaultBreak: 7,
    },
    {
      duration: 45,
      label: '45 min',
      sublabel: 'Deep Work',
      colorClass: 'tier-45',
      badgeColor: 'badge-indigo',
      maxSlider: tierLimits.max[45] || 15,
      minSlider: tierLimits.min[45] || 0,
      validCounts: tierLimits.validCounts[45] || [],
      breakPresets: [0, 7, 10, 15, 20],
      defaultBreak: 10,
    },
  ], [tierLimits]);

  return (
    <div className="auto-slice-inline-container animate-fade-in">
      {/* 1. Target Study Goal Card */}
      <div className="auto-slice-card glass-card">
        <div className="auto-slice-card-header">
          <div className="flex items-center gap-2">
            <div className="auto-slice-mini-icon bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h4 className="auto-slice-card-title">1. Target Study Goal</h4>
              <p className="auto-slice-card-subtitle">
                How many hours do you plan to study today?
              </p>
            </div>
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
      </div>

      {/* 2. Session Balancing Sliders Card (Vertical Stack) */}
      <div className="auto-slice-card glass-card">
        <div className="auto-slice-card-header">
          <div className="flex items-center gap-2">
            <div className="auto-slice-mini-icon bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h4 className="auto-slice-card-title">
                2. Pomodoro Tiers &amp; Breaks ({targetHours}h split)
              </h4>
              <p className="auto-slice-card-subtitle">
                Slide any tier or click + / - to adjust sessions. The other tiers dynamically balance to match your exact {targetHours}h study goal!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label
              className="auto-balance-toggle-label"
              title="When enabled, sliding one tier auto-adjusts the other two to maintain your study hours"
            >
              <input
                type="checkbox"
                checked={autoBalance}
                onChange={(e) => setAutoBalance(e.target.checked)}
                className="auto-balance-checkbox"
              />
              <span>Auto-balance</span>
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

        {/* The 3 Tiers (Vertical List) */}
        <div className="auto-slice-tiers-list">
          {tiers.map((t) => {
            const count = counts[t.duration] || 0;
            const tierMinutes = count * t.duration;
            const sharePercent =
              totalFocusMinutes > 0
                ? Math.round((tierMinutes / totalFocusMinutes) * 100)
                : 0;
            const currentBreak = tierBreaks[t.duration] ?? t.defaultBreak;

            return (
              <div key={t.duration} className={`auto-slice-tier-item ${t.colorClass}`}>
                {/* Row 1: Badge, Label, Count Stepper */}
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

                  {/* Sessions Count Stepper */}
                  <div className="tier-count-stepper">
                    <button
                      type="button"
                      className="tier-btn-sm"
                      onClick={() => handleStepCount(t.duration, -1)}
                      disabled={autoBalance ? count <= (t.minSlider ?? 0) : count <= 0}
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
                      disabled={autoBalance ? count >= (t.maxSlider ?? 60) : count >= (t.maxSlider ?? 60)}
                      title={`Increase 1 session of ${t.label}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Row 2: Range Slider */}
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

                {/* Row 3: Dedicated Break Duration for THIS Pomodoro Type */}
                <div className="tier-break-selector-row">
                  <div className="tier-break-label-box">
                    <Coffee className="w-3.5 h-3.5 text-amber-400" />
                    <span className="tier-break-label">Break for {t.duration}m sessions:</span>
                  </div>

                  <div className="tier-break-controls">
                    <div className="tier-break-chips-list">
                      {t.breakPresets.map((b) => (
                        <button
                          key={b}
                          type="button"
                          className={`tier-break-chip ${currentBreak === b ? 'break-chip-active' : ''}`}
                          onClick={() => handleTierBreakChange(t.duration, b)}
                        >
                          {b === 0 ? 'None' : `${b}m`}
                        </button>
                      ))}
                    </div>

                    {/* Break Fine Stepper */}
                    <div className="tier-break-stepper">
                      <button
                        type="button"
                        className="tier-break-step-btn"
                        onClick={() => handleTierBreakChange(t.duration, currentBreak - 1)}
                        disabled={currentBreak <= 0}
                        title="Decrease break 1m"
                      >
                        -
                      </button>
                      <span className="tier-break-step-val font-mono">
                        {currentBreak}m
                      </span>
                      <button
                        type="button"
                        className="tier-break-step-btn"
                        onClick={() => handleTierBreakChange(t.duration, currentBreak + 1)}
                        disabled={currentBreak >= 60}
                        title="Increase break 1m"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Session Arrangement & Vertical Wrapped Order Preview */}
      <div className="auto-slice-card glass-card">
        <div className="auto-slice-card-header">
          <div className="flex items-center gap-2">
            <div className="auto-slice-mini-icon bg-sky-500/20 text-sky-400 border border-sky-500/40">
              <Shuffle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="auto-slice-card-title">3. Session Arrangement &amp; Order</h4>
              <p className="auto-slice-card-subtitle">
                Choose how to sequence your sessions across the day
              </p>
            </div>
          </div>

          {arrangementMode === 'random' && (
            <button
              type="button"
              className="reshuffle-btn"
              onClick={handleReshuffle}
              title="Randomize the sequence order again"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Re-shuffle</span>
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

        {/* Sequence Preview Pill Track - ALL VERTICAL WRAPPED, NO HORIZONTAL SCROLL! */}
        <div className="sequence-preview-vertical-box">
          <span className="sequence-preview-label font-mono">
            Generated Day Sequence ({sessionSequence.length} sessions • all visible below):
          </span>
          <div className="sequence-pills-wrap-grid">
            {sessionSequence.map((dur, idx) => {
              const bDur = tierBreaks[dur] ?? 5;
              return (
                <span
                  key={idx}
                  className={`sequence-pill pill-${dur}`}
                  title={`Session #${idx + 1}: ${dur}m study + ${bDur}m break`}
                >
                  <span className="pill-dur-text">{dur}m</span>
                  <span className="pill-break-sub font-mono">+{bDur}m</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Total Plan Summary & Apply Bar */}
      <div className="auto-slice-card glass-card">
        <div className="summary-card-title-row">
          <span className="summary-heading">4. Total Plan Summary</span>
          {excessMinutes === 0 && totalFocusMinutes > 0 ? (
            <span className="summary-exact-pill">
              ✓ Exact {targetHours}h matched (0m variance)
            </span>
          ) : excessMinutes > 0 ? (
            <span className="summary-bonus-pill">
              +{formatDuration(excessMinutes)} over target
            </span>
          ) : (
            <span className="summary-under-pill">
              -{formatDuration(Math.abs(excessMinutes))} under target
            </span>
          )}
        </div>

        <div className="summary-grid-4cols">
          <div className="summary-stat-cell">
            <span className="summary-stat-label">Pure Study</span>
            <span className="summary-stat-val text-emerald-400 font-mono">
              {formatDuration(totalFocusMinutes)}
            </span>
          </div>

          <div className="summary-stat-cell">
            <span className="summary-stat-label">Total Sessions</span>
            <span className="summary-stat-val text-indigo-300 font-mono">
              {totalSessionsCount} Pomodoros
            </span>
          </div>

          <div className="summary-stat-cell">
            <span className="summary-stat-label">Total Breaks</span>
            <span className="summary-stat-val text-amber-300 font-mono">
              {formatDuration(totalBreakMinutes)}
            </span>
          </div>

          <div className="summary-stat-cell">
            <span className="summary-stat-label">Total Planned</span>
            <span className="summary-stat-val text-sky-400 font-mono">
              {formatDuration(totalPlanMinutes)}
            </span>
          </div>
        </div>

        {/* Align Deadline Checkbox */}
        <div className="auto-slice-deadline-box">
          <label className="align-deadline-checkbox-label">
            <input
              type="checkbox"
              checked={alignDeadline}
              onChange={(e) => setAlignDeadline(e.target.checked)}
              className="auto-balance-checkbox"
            />
            <Clock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm">
              Align finish deadline to this schedule ({formatDuration(totalPlanMinutes)} from now
              {finishTimeStr ? ` • finishes at ${finishTimeStr}` : ''})
            </span>
          </label>
        </div>

        {/* Action Button */}
        <div className="auto-slice-apply-action-row">
          <button
            type="button"
            className="auto-slice-inline-apply-btn"
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

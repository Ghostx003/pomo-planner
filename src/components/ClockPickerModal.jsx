import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Plus,
  Minus,
  Check,
  Play,
} from 'lucide-react';
import {
  getDeadlineToDate,
  formatDuration,
  formatClockTime,
} from '../utils/pomodoroCalc';

export function ClockPickerModal({
  isOpen,
  onClose,
  initialDeadlineStr,
  currentTime,
  is24Hour,
  onStartNow,
}) {
  // Parse initial deadline
  const [selectedHours, setSelectedHours] = useState(21);
  const [selectedMinutes, setSelectedMinutes] = useState(30);
  const [selectedPeriod, setSelectedPeriod] = useState('PM'); // 'AM' | 'PM'
  const [activeTab, setActiveTab] = useState('hours'); // 'hours' | 'minutes'

  useEffect(() => {
    if (initialDeadlineStr && /^\d{2}:\d{2}$/.test(initialDeadlineStr)) {
      const [hStr, mStr] = initialDeadlineStr.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      setSelectedHours(h);
      setSelectedMinutes(m);
      setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
    }
  }, [initialDeadlineStr, isOpen]);

  if (!isOpen) return null;

  // 12-hour display conversion
  const display12Hour = selectedHours % 12 || 12;

  // Format as HH:mm string for calculations
  const pad = (n) => String(n).padStart(2, '0');
  const deadlineStr = `${pad(selectedHours)}:${pad(selectedMinutes)}`;
  const targetDate = getDeadlineToDate(deadlineStr, currentTime);

  const remainingMs = targetDate ? Math.max(0, targetDate.getTime() - currentTime.getTime()) : 0;
  const remainingMins = Math.round(remainingMs / (60 * 1000));
  const isCrossMidnight = targetDate ? targetDate.getDate() !== currentTime.getDate() : false;

  // Change hour in 12h mode
  const setHour12 = (h12) => {
    let new24H = h12 % 12;
    if (selectedPeriod === 'PM') {
      new24H += 12;
    }
    setSelectedHours(new24H);
    setActiveTab('minutes'); // smooth auto-advance to minutes
  };

  // Change period (AM/PM)
  const setPeriod = (period) => {
    setSelectedPeriod(period);
    let h12 = selectedHours % 12;
    if (period === 'PM') {
      setSelectedHours(h12 + 12);
    } else {
      setSelectedHours(h12);
    }
  };

  // Quick preset from now
  const addFromNow = (mins) => {
    const d = new Date(currentTime.getTime() + mins * 60 * 1000);
    const h = d.getHours();
    const m = d.getMinutes();
    setSelectedHours(h);
    setSelectedMinutes(m);
    setSelectedPeriod(h >= 12 ? 'PM' : 'AM');
  };

  const hoursList = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutesList = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const handleStart = () => {
    onStartNow(deadlineStr);
    onClose();
  };

  return (
    <div className="clock-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="clock-modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar */}
        <div className="clock-modal-header">
          <div className="modal-title-group">
            <div className="icon-wrapper icon-target">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="modal-heading">Select Study Deadline</h3>
              <p className="modal-sub">Pick your target finish time and start your schedule</p>
            </div>
          </div>

          <button
            type="button"
            className="action-icon-btn"
            onClick={onClose}
            aria-label="Close clock picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Time Preview Card */}
        <div className="clock-time-display-hero">
          <div className="time-segmented-display font-mono">
            <button
              type="button"
              className={`time-segment-btn ${activeTab === 'hours' ? 'active-segment' : ''}`}
              onClick={() => setActiveTab('hours')}
            >
              {pad(display12Hour)}
            </button>
            <span className="time-colon">:</span>
            <button
              type="button"
              className={`time-segment-btn ${activeTab === 'minutes' ? 'active-segment' : ''}`}
              onClick={() => setActiveTab('minutes')}
            >
              {pad(selectedMinutes)}
            </button>

            {/* AM / PM Pills */}
            <div className="ampm-switch-col">
              <button
                type="button"
                className={`ampm-btn ${selectedPeriod === 'AM' ? 'ampm-active' : ''}`}
                onClick={() => setPeriod('AM')}
              >
                AM
              </button>
              <button
                type="button"
                className={`ampm-btn ${selectedPeriod === 'PM' ? 'ampm-active' : ''}`}
                onClick={() => setPeriod('PM')}
              >
                PM
              </button>
            </div>
          </div>

          {/* Target status & remaining time */}
          <div className="clock-status-tags">
            <span className="badge badge-primary font-mono text-xs">
              {formatDuration(remainingMins)} remaining
            </span>
            {isCrossMidnight ? (
              <span className="badge badge-midnight text-xs">
                <Moon className="w-3 h-3 text-indigo-300" />
                Tomorrow (+1 Day)
              </span>
            ) : (
              <span className="badge badge-sameday text-xs">
                <Sun className="w-3 h-3 text-amber-400" />
                Finishing Today
              </span>
            )}
          </div>
        </div>

        {/* Circular Clock Dial Picker */}
        <div className="clock-dial-container">
          <div className="clock-tab-toggles">
            <button
              type="button"
              className={`dial-tab-btn ${activeTab === 'hours' ? 'dial-tab-active' : ''}`}
              onClick={() => setActiveTab('hours')}
            >
              Select Hours
            </button>
            <button
              type="button"
              className={`dial-tab-btn ${activeTab === 'minutes' ? 'dial-tab-active' : ''}`}
              onClick={() => setActiveTab('minutes')}
            >
              Select Minutes
            </button>
          </div>

          {/* Interactive Clock Face */}
          <div className="circular-clock-face">
            <div className="clock-center-pin" />

            {activeTab === 'hours'
              ? hoursList.map((h, i) => {
                  // Angle in degrees: 12 is top (0 deg), 1 is 30 deg, etc.
                  const angle = i * 30 * (Math.PI / 180);
                  const radius = 105; // radius in px
                  const x = Math.round(130 + radius * Math.sin(angle));
                  const y = Math.round(130 - radius * Math.cos(angle));
                  const isSelected = display12Hour === h;

                  return (
                    <button
                      key={h}
                      type="button"
                      className={`clock-dial-number ${isSelected ? 'dial-number-selected' : ''}`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => setHour12(h)}
                    >
                      {h}
                    </button>
                  );
                })
              : minutesList.map((m, i) => {
                  const angle = i * 30 * (Math.PI / 180);
                  const radius = 105;
                  const x = Math.round(130 + radius * Math.sin(angle));
                  const y = Math.round(130 - radius * Math.cos(angle));
                  const isSelected = selectedMinutes === m;

                  return (
                    <button
                      key={m}
                      type="button"
                      className={`clock-dial-number ${isSelected ? 'dial-number-selected' : ''}`}
                      style={{ left: `${x}px`, top: `${y}px` }}
                      onClick={() => setSelectedMinutes(m)}
                    >
                      {pad(m)}
                    </button>
                  );
                })}
          </div>

          {/* Fine Tuning Minutes Stepper */}
          <div className="clock-stepper-row">
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setSelectedMinutes((prev) => (prev - 1 + 60) % 60)}
              title="Minus 1 minute"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="stepper-val font-mono text-sm">
              Fine-tune minute: <strong>{pad(selectedMinutes)}m</strong>
            </span>
            <button
              type="button"
              className="stepper-btn"
              onClick={() => setSelectedMinutes((prev) => (prev + 1) % 60)}
              title="Plus 1 minute"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Extensions from current moment */}
        <div className="clock-quick-presets">
          <span className="input-label text-xs">Quick Extensions from now:</span>
          <div className="preset-buttons-row">
            <button type="button" className="preset-pill text-xs" onClick={() => addFromNow(30)}>
              +30m
            </button>
            <button type="button" className="preset-pill text-xs" onClick={() => addFromNow(60)}>
              +1h
            </button>
            <button type="button" className="preset-pill text-xs" onClick={() => addFromNow(120)}>
              +2h
            </button>
            <button type="button" className="preset-pill text-xs" onClick={() => addFromNow(180)}>
              +3h
            </button>
            <button type="button" className="preset-pill text-xs" onClick={() => addFromNow(240)}>
              +4h
            </button>
          </div>
        </div>

        {/* Footer: Start Now Button */}
        <div className="clock-modal-footer">
          <button
            type="button"
            className="action-btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="start-plan-now-btn"
            onClick={handleStart}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
            <span>Start Now</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

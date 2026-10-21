import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  ArrowRight,
  Sun,
  Moon,
  Plus,
  Minus,
  Play,
} from 'lucide-react';
import {
  getDeadlineToDate,
  formatDuration,
} from '../utils/pomodoroCalc';

export function ClockPickerModal({
  isOpen,
  onClose,
  initialDeadlineStr,
  currentTime,
  is24Hour,
  onStartNow,
}) {
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

  const display12Hour = selectedHours % 12 || 12;
  const pad = (n) => String(n).padStart(2, '0');
  const deadlineStr = `${pad(selectedHours)}:${pad(selectedMinutes)}`;
  const targetDate = getDeadlineToDate(deadlineStr, currentTime);

  const remainingMs = targetDate ? Math.max(0, targetDate.getTime() - currentTime.getTime()) : 0;
  const remainingMins = Math.round(remainingMs / (60 * 1000));
  const isCrossMidnight = targetDate ? targetDate.getDate() !== currentTime.getDate() : false;

  const setHour12 = (h12) => {
    let new24H = h12 % 12;
    if (selectedPeriod === 'PM') {
      new24H += 12;
    }
    setSelectedHours(new24H);
    setActiveTab('minutes'); // smooth auto-advance to pick minutes
  };

  const setPeriod = (period) => {
    setSelectedPeriod(period);
    let h12 = selectedHours % 12;
    if (period === 'PM') {
      setSelectedHours(h12 + 12);
    } else {
      setSelectedHours(h12);
    }
  };

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

  // Mathematical angle & position for active clock hand in SVG:
  // 12 o'clock is 0 rad, 3 o'clock is pi/2, 6 is pi, 9 is 3pi/2
  const activeAngleRad =
    activeTab === 'hours'
      ? ((display12Hour % 12) / 12) * 2 * Math.PI
      : (selectedMinutes / 60) * 2 * Math.PI;

  const dialRadius = 96;
  const activeX = Math.round(130 + dialRadius * Math.sin(activeAngleRad));
  const activeY = Math.round(130 - dialRadius * Math.cos(activeAngleRad));

  // Allow clicking anywhere on clock circle face to set hour or minute
  const handleDialClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - 130;
    const clickY = e.clientY - rect.top - 130;
    let angle = Math.atan2(clickX, -clickY);
    if (angle < 0) angle += 2 * Math.PI;

    if (activeTab === 'hours') {
      let hour = Math.round(angle / (Math.PI / 6)) % 12;
      if (hour === 0) hour = 12;
      setHour12(hour);
    } else {
      let min = Math.round((angle / (2 * Math.PI)) * 60) % 60;
      setSelectedMinutes(min);
    }
  };

  const handleStart = () => {
    onStartNow(deadlineStr);
    onClose();
  };

  return (
    <div className="clock-modal-overlay" onClick={onClose}>
      <div className="clock-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="clock-modal-header">
          <div className="clock-header-left">
            <div className="clock-header-icon">
              <Clock className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="clock-modal-title">Select Study Deadline</h3>
              <p className="clock-modal-subtitle">Pick ending time & create your Pomodoro schedule</p>
            </div>
          </div>
          <button
            type="button"
            className="clock-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="clock-modal-body">
          {/* Digital Time Preview Box */}
          <div className="clock-digital-box">
            <div className="clock-digital-time">
              <button
                type="button"
                className={`clock-segment-btn ${activeTab === 'hours' ? 'active' : ''}`}
                onClick={() => setActiveTab('hours')}
                title="Click to edit hour"
              >
                {pad(display12Hour)}
              </button>
              <span className="clock-colon">:</span>
              <button
                type="button"
                className={`clock-segment-btn ${activeTab === 'minutes' ? 'active' : ''}`}
                onClick={() => setActiveTab('minutes')}
                title="Click to edit minute"
              >
                {pad(selectedMinutes)}
              </button>
            </div>

            {/* AM / PM Selector */}
            <div className="clock-ampm-group">
              <button
                type="button"
                className={`clock-ampm-pill ${selectedPeriod === 'AM' ? 'active' : ''}`}
                onClick={() => setPeriod('AM')}
              >
                AM
              </button>
              <button
                type="button"
                className={`clock-ampm-pill ${selectedPeriod === 'PM' ? 'active' : ''}`}
                onClick={() => setPeriod('PM')}
              >
                PM
              </button>
            </div>
          </div>

          {/* Time Remaining Badge Row */}
          <div className="clock-badge-row">
            <span className="clock-time-badge font-mono">
              {formatDuration(remainingMins)} remaining
            </span>
            {isCrossMidnight ? (
              <span className="clock-day-badge midnight">
                <Moon className="w-3.5 h-3.5 text-indigo-300" />
                Tomorrow (+1 Day)
              </span>
            ) : (
              <span className="clock-day-badge today">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Finishing Today
              </span>
            )}
          </div>

          {/* Mode Switcher Tabs: Hours / Minutes */}
          <div className="clock-tabs-row">
            <button
              type="button"
              className={`clock-tab-btn ${activeTab === 'hours' ? 'active' : ''}`}
              onClick={() => setActiveTab('hours')}
            >
              Select Hours
            </button>
            <button
              type="button"
              className={`clock-tab-btn ${activeTab === 'minutes' ? 'active' : ''}`}
              onClick={() => setActiveTab('minutes')}
            >
              Select Minutes
            </button>
          </div>

          {/* Circular Clock Face */}
          <div className="clock-dial-wrapper">
            <div
              className="clock-circle-face"
              onClick={handleDialClick}
              title="Click anywhere on dial to set time"
            >
              {/* SVG Layer for needle and highlighted circle */}
              <svg
                viewBox="0 0 260 260"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              >
                {/* Needle from center (130, 130) to active target */}
                <line
                  x1="130"
                  y1="130"
                  x2={activeX}
                  y2={activeY}
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Circular indicator highlight right behind selected number */}
                <circle
                  cx={activeX}
                  cy={activeY}
                  r="19"
                  fill="#6366f1"
                />
                {/* Center pivot point */}
                <circle
                  cx="130"
                  cy="130"
                  r="5.5"
                  fill="#818cf8"
                />
              </svg>

              {/* Numbers on the dial */}
              {activeTab === 'hours'
                ? hoursList.map((h, i) => {
                    const angleRad = (i * 30 * Math.PI) / 180;
                    const x = Math.round(130 + dialRadius * Math.sin(angleRad));
                    const y = Math.round(130 - dialRadius * Math.cos(angleRad));
                    const isSelected = display12Hour === h;

                    return (
                      <button
                        key={h}
                        type="button"
                        className={`clock-dial-digit ${isSelected ? 'selected' : ''}`}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setHour12(h);
                        }}
                      >
                        {h}
                      </button>
                    );
                  })
                : minutesList.map((m, i) => {
                    const angleRad = (i * 30 * Math.PI) / 180;
                    const x = Math.round(130 + dialRadius * Math.sin(angleRad));
                    const y = Math.round(130 - dialRadius * Math.cos(angleRad));
                    const isSelected = selectedMinutes === m;

                    return (
                      <button
                        key={m}
                        type="button"
                        className={`clock-dial-digit ${isSelected ? 'selected' : ''}`}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMinutes(m);
                        }}
                      >
                        {pad(m)}
                      </button>
                    );
                  })}
            </div>
          </div>

          {/* Stepper Minute Adjustment */}
          <div className="clock-minute-stepper">
            <button
              type="button"
              className="clock-stepper-btn"
              onClick={() => setSelectedMinutes((prev) => (prev - 1 + 60) % 60)}
              title="Minus 1 minute"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="clock-stepper-text font-mono">
              Fine-tune minute: <strong>{pad(selectedMinutes)}m</strong>
            </span>
            <button
              type="button"
              className="clock-stepper-btn"
              onClick={() => setSelectedMinutes((prev) => (prev + 1) % 60)}
              title="Plus 1 minute"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Extensions Chips */}
          <div className="clock-presets-section">
            <span className="clock-presets-label">Quick extensions from now:</span>
            <div className="clock-chips-grid">
              <button type="button" className="clock-chip-btn" onClick={() => addFromNow(30)}>
                +30m
              </button>
              <button type="button" className="clock-chip-btn" onClick={() => addFromNow(60)}>
                +1h
              </button>
              <button type="button" className="clock-chip-btn" onClick={() => addFromNow(120)}>
                +2h
              </button>
              <button type="button" className="clock-chip-btn" onClick={() => addFromNow(180)}>
                +3h
              </button>
              <button type="button" className="clock-chip-btn" onClick={() => addFromNow(240)}>
                +4h
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="clock-modal-footer">
          <button
            type="button"
            className="clock-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="clock-start-btn"
            onClick={handleStart}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Maximize2,
  Minimize2,
  Flame,
  Coffee,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatCountdown, playChimeSound, triggerHaptic } from '../utils/pomodoroCalc';

export function FocusTimerModal({
  isOpen,
  onClose,
  timeline,
  soundEnabled,
  setSoundEnabled,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    return timeline && timeline.length > 0 ? timeline[0].durationMinutes * 60 : 1500;
  });

  const containerRef = useRef(null);
  const currentItem = timeline[currentIndex] || null;

  // Handle switching sessions explicitly
  const selectSession = (index) => {
    if (index >= 0 && index < timeline.length) {
      triggerHaptic('light');
      setCurrentIndex(index);
      setSecondsRemaining(timeline[index].durationMinutes * 60);
      setIsRunning(false);
    }
  };

  // Timer interval countdown
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          // Play chime sound
          if (soundEnabled) {
            playChimeSound();
          }

          // Move to next session if available
          if (currentIndex + 1 < timeline.length) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            return timeline[nextIdx].durationMinutes * 60;
          } else {
            setIsRunning(false);
            return 0;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isRunning, currentIndex, timeline, soundEnabled]);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  if (!isOpen || !currentItem) return null;

  const totalItemSeconds = currentItem.durationMinutes * 60;
  const progressRatio = totalItemSeconds > 0 ? (totalItemSeconds - secondsRemaining) / totalItemSeconds : 0;
  const strokeDashoffset = 283 * (1 - progressRatio); // 2 * PI * 45 ≈ 283

  const isFocus = currentItem.type === 'focus';
  const totalSessions = timeline.filter((t) => t.type === 'focus').length;

  return (
    <div className="focus-modal-overlay animate-fade-in" ref={containerRef}>
      <div className="focus-modal-container">
        {/* Modal Top Bar */}
        <div className="focus-modal-topbar">
          <div className="focus-mode-indicator">
            <span className={`live-dot ${isFocus ? 'live-dot-focus' : 'live-dot-break'}`} />
            <span className="font-semibold tracking-wide">
              {isFocus ? `FOCUS SESSION (${currentItem.sessionNumber} OF ${totalSessions})` : 'REST & RECHARGE BREAK'}
            </span>
          </div>

          <div className="focus-modal-actions">
            <button
              type="button"
              className="action-icon-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Chime' : 'Enable Chime'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            <button
              type="button"
              className="action-icon-btn"
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              type="button"
              className="action-icon-btn"
              onClick={onClose}
              title="Close Focus Mode"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Circular Timer */}
        <div className="focus-timer-body">
          <div className="circular-timer-wrapper">
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle
                className="timer-track"
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="5"
              />
              <circle
                className={`timer-progress ${isFocus ? 'stroke-focus' : 'stroke-break'}`}
                cx="50"
                cy="50"
                r="45"
                fill="none"
                strokeWidth="5"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
              />
            </svg>

            <div className="timer-inner-content">
              <div className="timer-badge">
                {isFocus ? (
                  <>
                    <Flame className="w-4 h-4 text-emerald-400" />
                    <span>Pomodoro #{currentItem.sessionNumber}</span>
                  </>
                ) : (
                  <>
                    <Coffee className="w-4 h-4 text-amber-400" />
                    <span>Break Interval</span>
                  </>
                )}
              </div>

              <div className="timer-countdown font-mono">
                {formatCountdown(secondsRemaining)}
              </div>

              <div className="timer-sublabel">
                {isRunning ? (isFocus ? 'Stay in the zone' : 'Take deep breaths') : 'Paused'}
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="focus-controls-row">
            <button
              type="button"
              className="timer-btn timer-btn-secondary"
              onClick={() => {
                triggerHaptic('light');
                setSecondsRemaining(totalItemSeconds);
                setIsRunning(false);
              }}
              title="Reset current interval"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              className={`timer-btn timer-btn-primary ${isFocus ? 'btn-focus-primary' : 'btn-break-primary'}`}
              onClick={() => {
                triggerHaptic('medium');
                setIsRunning(!isRunning);
              }}
              title={isRunning ? 'Pause Timer' : 'Start Timer'}
            >
              {isRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </button>

            {currentIndex + 1 < timeline.length && (
              <button
                type="button"
                className="timer-btn timer-btn-secondary"
                onClick={() => {
                  triggerHaptic('light');
                  selectSession(currentIndex + 1);
                }}
                title="Skip to next session/break"
              >
                <span>Skip</span>
                <SkipForward className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Timeline dots indicator */}
        <div className="focus-timeline-dots">
          {timeline.map((step, idx) => (
            <button
              key={step.id}
              type="button"
              className={`timeline-dot-btn ${idx === currentIndex ? 'dot-active' : idx < currentIndex ? 'dot-completed' : ''}`}
              onClick={() => selectSession(idx)}
              title={`${step.title} (${step.durationMinutes}m)`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Globe, Calendar } from 'lucide-react';
import { formatFriendlyDate, getTimezoneInfo } from '../utils/pomodoroCalc';

export function CurrentClock({ currentTime, is24Hour }) {
  const timezone = getTimezoneInfo();
  const dateStr = formatFriendlyDate(currentTime);

  // Time components
  const hours = currentTime.getHours();
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');

  let displayHours = hours;
  let ampm = '';

  if (!is24Hour) {
    ampm = hours >= 12 ? 'PM' : 'AM';
    displayHours = hours % 12 || 12;
  }
  const displayHoursStr = String(displayHours).padStart(2, '0');

  return (
    <div className="current-clock-card glass-card">
      <div className="clock-header">
        <span className="live-indicator">
          <span className="live-dot" />
          SYSTEM CLOCK
        </span>
        <div className="timezone-badge" title={`Timezone: ${timezone.name}`}>
          <Globe className="w-3.5 h-3.5" />
          <span>{timezone.display}</span>
        </div>
      </div>

      <div className="clock-digits-wrapper">
        <div className="digital-clock font-mono">
          <span className="digit-group">{displayHoursStr}</span>
          <span className="colon-blink">:</span>
          <span className="digit-group">{minutes}</span>
          <span className="colon-blink">:</span>
          <span className="digit-group digit-seconds">{seconds}</span>
          {!is24Hour && <span className="ampm-label">{ampm}</span>}
        </div>
      </div>

      <div className="clock-footer">
        <div className="date-badge">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{dateStr}</span>
        </div>
      </div>
    </div>
  );
}

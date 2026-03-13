import { minutesToTime } from '../models/booking.js';

export function TimeSlider({ value, onChange }) {
  const handleInput = (e) => {
    onChange(Number(e.target.value));
  };

  return (
    <div class="time-slider">
      <span class="time-slider-label">08:00</span>
      <input
        type="range"
        min={480}
        max={1320}
        step={15}
        value={value}
        onInput={handleInput}
        class="time-slider-input"
      />
      <span class="time-slider-label">22:00</span>
      <span class="time-slider-current">{minutesToTime(value)}</span>
    </div>
  );
}

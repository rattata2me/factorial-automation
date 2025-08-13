import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import DatePicker from 'react-datepicker';
import { Notification } from './Notification';
import 'react-datepicker/dist/react-datepicker.css';
import './ShiftForm.css';
import { 
  WeekDay, 
  TimeRange, 
  FormData, 
  initialWeekDays,
  DEFAULT_START_TIME,
  DEFAULT_END_TIME
} from '../types/shift';
import { 
  CREATE_ATTENDANCE_SHIFT, 
  CreateAttendanceShiftResponse, 
  CreateAttendanceShiftVariables 
} from '../graphql/mutations';
import { Settings, STORAGE_KEY, DEFAULT_UTC_OFFSET } from '../types';
import { getDatesBetween } from '../utils/dateUtils';

interface ShiftFormProps {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
}

export const ShiftForm: React.FC<ShiftFormProps> = ({
  onClose,
  onSubmit,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [weekDays, setWeekDays] = useState<WeekDay[]>(initialWeekDays);
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{
    id: '1',
    startTime: DEFAULT_START_TIME,
    endTime: DEFAULT_END_TIME,
    isBreak: false
  }]);

  const addTimeRange = useCallback(() => {
    setTimeRanges(currentRanges => {
      const newId = (currentRanges.length + 1).toString();
      return [...currentRanges, {
        id: newId,
        startTime: DEFAULT_START_TIME,
        endTime: DEFAULT_END_TIME,
        isBreak: false
      }];
    });
  }, []);

  const deleteTimeRange = useCallback((id: string) => {
    setTimeRanges(currentRanges => {
      // Prevent deleting the last time range
      if (currentRanges.length <= 1) return currentRanges;
      return currentRanges.filter(range => range.id !== id);
    });
  }, []);

  const updateTimeRange = useCallback((
    id: string, 
    field: keyof Pick<TimeRange, 'startTime' | 'endTime' | 'isBreak'>, 
    value: TimeRange[typeof field]
  ) => {
    setTimeRanges(currentRanges => 
      currentRanges.map(range =>
        range.id === id ? { ...range, [field]: value } : range
      )
    );
  }, []);

  const handleDateChange = useCallback((date: Date | null, field: 'start' | 'end') => {
    if (field === 'start') {
      setStartDate(date);
      // Automatically adjust end date if it becomes invalid
      if (date && endDate && date > endDate) {
        setEndDate(date);
      }
    } else {
      setEndDate(date);
    }
  }, [endDate]);

  const handleWeekDayToggle = useCallback((value: number) => {
    setWeekDays(prevDays => prevDays.map(day => 
      day.value === value ? { ...day, selected: !day.selected } : day
    ));
  }, []);

  const validateTimeRanges = useCallback((ranges: TimeRange[]): boolean => {
    return ranges.every(range => {
      const start = new Date(`1970-01-01T${range.startTime}`);
      const end = new Date(`1970-01-01T${range.endTime}`);
      return start < end;
    });
  }, []);

  const [showSuccess, setShowSuccess] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [createShift, { loading }] = useMutation<
    CreateAttendanceShiftResponse,
    CreateAttendanceShiftVariables
  >(CREATE_ATTENDANCE_SHIFT);

  const submitForm = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    if (!weekDays.some(day => day.selected)) {
      alert('Please select at least one weekday');
      return;
    }

    if (!validateTimeRanges(timeRanges)) {
      alert('Please ensure all time ranges have valid start and end times');
      return;
    }

    const settingsJson = localStorage.getItem(STORAGE_KEY);
    if (!settingsJson) {
      alert('Please configure your settings first');
      return;
    }

    const settings: Settings = JSON.parse(settingsJson);
    const employeeId = parseInt(settings.employeeId, 10);
    const utcOffset = settings.utcOffset || DEFAULT_UTC_OFFSET;
    
    try {
      // We need to create shifts for each selected day and time range
      const selectedDates = getDatesBetween(startDate, endDate).filter(date => 
        weekDays.find(day => day.selected && day.value === date.getDay())
      );
      
      const totalShifts = selectedDates.length * timeRanges.length;
      setProgress({ current: 0, total: totalShifts });

      for (const date of selectedDates) {
        for (const timeRange of timeRanges) {
          const dateStr = date.toISOString().split('T')[0];
          const clockInTime = `${dateStr}T${timeRange.startTime}:00${utcOffset}`;
          const clockOutTime = `${dateStr}T${timeRange.endTime}:00${utcOffset}`;

          const { data } = await createShift({
            variables: {
              date: dateStr,
              employeeId,
              clockIn: clockInTime,
              clockOut: clockOutTime,
              referenceDate: dateStr,
              source: 'desktop',
              timeSettingsBreakConfigurationId: 16944,
              workable: !timeRange.isBreak, // true for normal shifts, false for breaks
              fetchDependencies: true
            }
          });

          if (data?.attendanceMutations.createAttendanceShift.errors?.length) {
            const error = data.attendanceMutations.createAttendanceShift.errors[0];
            throw new Error(error.message || error.messages?.[0] || 'Unknown error');
          }
          setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
      }

      // If we get here, all shifts were created successfully
      setShowSuccess(true);
      setTimeout(() => {
        onSubmit({
          startDate,
          endDate,
          selectedDays: weekDays.filter(day => day.selected).map(day => day.value),
          timeRanges
        });
      }, 1500); // Give time for the success message to be seen
    } catch (error) {
      console.error('Error submitting shifts:', error,
        'Full error object:', JSON.stringify(error, null, 2));
      alert(error instanceof Error ? error.message : 'Failed to submit shifts. Please check your settings and try again.');
    }
  }, [startDate, endDate, weekDays, timeRanges, onSubmit, validateTimeRanges, createShift]);

  return (
    <div className="shift-form">
      {showSuccess && (
        <Notification
          type="success"
          message="Shifts created successfully!"
          onClose={() => setShowSuccess(false)}
        />
      )}
      <h2>Shift Completion</h2>
      <form onSubmit={submitForm}>
        <div className="form-section">
          <h3>Period</h3>
          <div className="date-pickers">
            <div className="date-picker-group">
              <label htmlFor="startDate">Start Date</label>
              <DatePicker
                id="startDate"
                selected={startDate}
                onChange={(date: Date | null) => handleDateChange(date, 'start')}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="MMMM d, yyyy"
                className="date-input"
                placeholderText="Select start date"
                popperPlacement="top"
                popperClassName="datepicker-popper"
              />
            </div>
            <div className="date-picker-group">
              <label htmlFor="endDate">End Date</label>
              <DatePicker
                id="endDate"
                selected={endDate}
                onChange={(date: Date | null) => handleDateChange(date, 'end')}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate || undefined}
                dateFormat="MMMM d, yyyy"
                className="date-input"
                placeholderText="Select end date"
                popperPlacement="top"
                popperClassName="datepicker-popper"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Shifts</h3>
          <div className="time-ranges">
            {timeRanges.map(range => (
              <div key={range.id} className="time-range">
                <div className="time-inputs">
                  <div className="time-input-group">
                    <label htmlFor={"start-time-" + range.id}>Start Time</label>
                    <input
                      type="time"
                      id={"start-time-" + range.id}
                      value={range.startTime}
                      onChange={(e) => updateTimeRange(range.id, 'startTime', e.target.value)}
                      className="time-input"
                    />
                  </div>
                  <div className="time-input-group">
                    <label htmlFor={"end-time-" + range.id}>End Time</label>
                    <input
                      type="time"
                      id={"end-time-" + range.id}
                      value={range.endTime}
                      onChange={(e) => updateTimeRange(range.id, 'endTime', e.target.value)}
                      className="time-input"
                    />
                  </div>
                  <label className="break-toggle">
                    <input
                      type="checkbox"
                      checked={range.isBreak}
                      onChange={(e) => updateTimeRange(range.id, 'isBreak', e.target.checked)}
                      className="break-checkbox"
                    />
                    <span className="break-icon" title="Lunch break">☕</span>
                  </label>
                  <button
                    type="button"
                    className="delete-time-button"
                    onClick={() => deleteTimeRange(range.id)}
                    title="Delete shift"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="add-time-button"
              onClick={addTimeRange}
            >
              + Add Shift
            </button>
          </div>
        </div>

        <div className="form-section">
          <h3>Week Days</h3>
          <div className="weekday-toggles">
            {weekDays.map(day => (
              <button
                key={day.value}
                type="button"
                className={"weekday-toggle" + (day.selected ? " selected" : "")}
                onClick={() => handleWeekDayToggle(day.value)}
              >
                {day.name.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onClose} className="cancel-button">
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading || !startDate || !endDate || !weekDays.some(day => day.selected)}
          >
            {loading 
              ? `Submitting... (${progress.current}/${progress.total})`
              : 'Apply'}
          </button>
        </div>
      </form>
    </div>
  );
};

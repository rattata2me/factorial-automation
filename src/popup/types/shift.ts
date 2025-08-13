export interface WeekDay {
  name: string;
  value: number;
  selected: boolean;
}

export interface TimeRange {
  id: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
}

export interface FormData {
  startDate: Date;
  endDate: Date;
  selectedDays: number[];
  timeRanges: TimeRange[];
}

export const initialWeekDays: WeekDay[] = [
  { name: 'Monday', value: 1, selected: true },
  { name: 'Tuesday', value: 2, selected: true },
  { name: 'Wednesday', value: 3, selected: true },
  { name: 'Thursday', value: 4, selected: true },
  { name: 'Friday', value: 5, selected: true },
  { name: 'Saturday', value: 6, selected: false },
  { name: 'Sunday', value: 0, selected: false },
];

export const DEFAULT_START_TIME = '09:00';
export const DEFAULT_END_TIME = '17:00';

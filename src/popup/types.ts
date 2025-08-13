export interface Settings {
  employeeId: string;
  cookies: string;
  utcOffset: string;
}

export const STORAGE_KEY = 'factorial_automation_settings';
export const DEFAULT_UTC_OFFSET = '+02:00';

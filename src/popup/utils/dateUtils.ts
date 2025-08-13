export function getDatesBetween(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);

  // Strip time component for accurate day comparisons
  currentDate.setHours(12, 0, 0, 0);
  const endDateNoTime = new Date(endDate);
  endDateNoTime.setHours(12, 0, 0, 0);

  while (currentDate <= endDateNoTime) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

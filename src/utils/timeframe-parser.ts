import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  addWeeks,
  startOfQuarter,
  endOfQuarter,
  addQuarters,
  startOfMonth,
  endOfMonth,
  addMonths,
  addDays,
  endOfDay,
  parseISO,
  isValid
} from 'date-fns';

export interface TimeframeResult {
  start: Date;
  end: Date;
  label: string;
}

export function parseTimeframe(input?: string): TimeframeResult {
  const now = new Date();
  const normalized = input?.toLowerCase().trim() || 'today';

  // Handle "today"
  if (normalized === 'today' || normalized === '') {
    return {
      start: startOfToday(),
      end: endOfToday(),
      label: 'Today'
    };
  }

  // Handle "tomorrow"
  if (normalized === 'tomorrow') {
    const tomorrow = addDays(now, 1);
    return {
      start: addDays(startOfToday(), 1),
      end: endOfDay(tomorrow),
      label: 'Tomorrow'
    };
  }

  // Handle "this week"
  if (normalized === 'this week') {
    return {
      start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
      end: endOfWeek(now, { weekStartsOn: 1 }),
      label: 'This Week'
    };
  }

  // Handle "next week"
  if (normalized === 'next week') {
    const nextWeek = addWeeks(now, 1);
    return {
      start: startOfWeek(nextWeek, { weekStartsOn: 1 }),
      end: endOfWeek(nextWeek, { weekStartsOn: 1 }),
      label: 'Next Week'
    };
  }

  // Handle "this quarter"
  if (normalized === 'this quarter') {
    return {
      start: startOfQuarter(now),
      end: endOfQuarter(now),
      label: 'This Quarter'
    };
  }

  // Handle "next quarter"
  if (normalized === 'next quarter') {
    const nextQuarter = addQuarters(now, 1);
    return {
      start: startOfQuarter(nextQuarter),
      end: endOfQuarter(nextQuarter),
      label: 'Next Quarter'
    };
  }

  // Handle "YYYY QN" format (e.g., "2026 Q1", "2025 Q3")
  const quarterMatch = normalized.match(/^(\d{4})\s*q([1-4])$/i);
  if (quarterMatch) {
    const year = parseInt(quarterMatch[1], 10);
    const quarter = parseInt(quarterMatch[2], 10);
    const quarterStart = new Date(year, (quarter - 1) * 3, 1);
    return {
      start: startOfQuarter(quarterStart),
      end: endOfQuarter(quarterStart),
      label: `${year} Q${quarter}`
    };
  }

  // Handle "this month"
  if (normalized === 'this month') {
    return {
      start: startOfMonth(now),
      end: endOfMonth(now),
      label: 'This Month'
    };
  }

  // Handle "next month"
  if (normalized === 'next month') {
    const nextMonth = addMonths(now, 1);
    return {
      start: startOfMonth(nextMonth),
      end: endOfMonth(nextMonth),
      label: 'Next Month'
    };
  }

  // Handle "Month YYYY" format (e.g., "November 2025", "March 2026")
  const monthYearMatch = normalized.match(/^([a-z]+)\s+(\d{4})$/i);
  if (monthYearMatch) {
    const monthName = monthYearMatch[1];
    const year = parseInt(monthYearMatch[2], 10);
    const monthIndex = getMonthIndex(monthName);
    if (monthIndex !== -1) {
      const date = new Date(year, monthIndex, 1);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        label: `${capitalize(monthName)} ${year}`
      };
    }
  }

  // Handle "next N days" format (e.g., "next 3 days", "next 7 days")
  const nextDaysMatch = normalized.match(/^next\s+(\d+)\s+days?$/i);
  if (nextDaysMatch) {
    const days = parseInt(nextDaysMatch[1], 10);
    return {
      start: startOfToday(),
      end: endOfDay(addDays(now, days)),
      label: `Next ${days} Days`
    };
  }

  // Handle ISO date format as fallback (YYYY-MM-DD)
  const isoDate = parseISO(normalized);
  if (isValid(isoDate)) {
    return {
      start: isoDate,
      end: endOfDay(isoDate),
      label: normalized
    };
  }

  // Invalid timeframe - throw error with examples
  throw new Error(
    `Invalid timeframe: "${input}"\n\n` +
    'Supported formats:\n' +
    '  - today, tomorrow\n' +
    '  - this week, next week\n' +
    '  - this quarter, next quarter\n' +
    '  - this month, next month\n' +
    '  - YYYY QN (e.g., "2026 Q1")\n' +
    '  - Month YYYY (e.g., "November 2025")\n' +
    '  - next N days (e.g., "next 7 days")\n' +
    '  - YYYY-MM-DD (ISO date)'
  );
}

function getMonthIndex(monthName: string): number {
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const normalized = monthName.toLowerCase();
  return months.findIndex(m => m.startsWith(normalized.slice(0, 3)));
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

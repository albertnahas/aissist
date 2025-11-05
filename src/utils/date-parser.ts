import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  subDays,
  parseISO,
  isValid,
  format,
} from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
  description: string;
}

/**
 * Parse natural language date expressions into date ranges
 */
export function parseNaturalDate(input: string): DateRange | null {
  const normalized = input.toLowerCase().trim();
  const now = new Date();

  switch (normalized) {
    case 'today':
      return {
        from: startOfDay(now),
        to: endOfDay(now),
        description: 'today',
      };

    case 'yesterday':
      return {
        from: startOfDay(subDays(now, 1)),
        to: endOfDay(subDays(now, 1)),
        description: 'yesterday',
      };

    case 'this week':
      return {
        from: startOfWeek(now, { weekStartsOn: 1 }), // Monday
        to: endOfDay(now),
        description: 'this week',
      };

    case 'last week':
      return {
        from: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        to: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
        description: 'last week',
      };

    case 'this month':
      return {
        from: startOfMonth(now),
        to: endOfDay(now),
        description: 'this month',
      };

    case 'last month':
      return {
        from: startOfMonth(subMonths(now, 1)),
        to: endOfMonth(subMonths(now, 1)),
        description: 'last month',
      };

    default:
      // Try parsing as ISO date
      try {
        const date = parseISO(normalized);
        if (isValid(date)) {
          return {
            from: startOfDay(date),
            to: endOfDay(now),
            description: `from ${format(date, 'yyyy-MM-dd')}`,
          };
        }
      } catch {
        // Not a valid ISO date
      }

      return null;
  }
}

/**
 * Format a date range for display
 */
export function formatDateRange(range: DateRange): string {
  const fromStr = format(range.from, 'yyyy-MM-dd');
  const toStr = format(range.to, 'yyyy-MM-dd');

  if (fromStr === toStr) {
    return fromStr;
  }

  return `${fromStr} to ${toStr}`;
}

/**
 * Get common date examples for help text
 */
export function getDateExamples(): string[] {
  return [
    'today',
    'yesterday',
    'this week',
    'last week',
    'this month',
    'last month',
    '2024-01-15',
  ];
}

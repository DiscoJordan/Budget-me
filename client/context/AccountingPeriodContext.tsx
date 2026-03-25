import React, { createContext, useState, useMemo } from 'react';

export type PeriodType = 'week' | 'month' | 'quarter' | 'half-year' | 'year' | 'all' | 'custom';

export interface AccountingPeriodContextType {
  periodType: PeriodType;
  setPeriodType: (type: PeriodType) => void;
  dateFrom: Date | null;
  dateTo: Date | null;
  customFrom: Date | null;
  customTo: Date | null;
  setCustomRange: (from: Date, to: Date) => void;
  headerLabel: string;
}

export const AccountingPeriodContext = createContext<AccountingPeriodContextType>(
  {} as AccountingPeriodContextType
);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function fmt(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = SHORT_MONTHS[date.getMonth()];
  return `${d} ${m}`;
}

function computeRange(type: PeriodType, now: Date): { from: Date | null; to: Date | null } {
  const y = now.getFullYear();
  const mo = now.getMonth();

  switch (type) {
    case 'week': {
      const from = new Date(now);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      const to = new Date(now);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'month': {
      return {
        from: new Date(y, mo, 1, 0, 0, 0, 0),
        to: new Date(y, mo + 1, 0, 23, 59, 59, 999),
      };
    }
    case 'quarter': {
      const q = Math.floor(mo / 3);
      return {
        from: new Date(y, q * 3, 1, 0, 0, 0, 0),
        to: new Date(y, q * 3 + 3, 0, 23, 59, 59, 999),
      };
    }
    case 'half-year': {
      const half = mo < 6 ? 0 : 6;
      return {
        from: new Date(y, half, 1, 0, 0, 0, 0),
        to: new Date(y, half + 6, 0, 23, 59, 59, 999),
      };
    }
    case 'year': {
      return {
        from: new Date(y, 0, 1, 0, 0, 0, 0),
        to: new Date(y, 12, 0, 23, 59, 59, 999),
      };
    }
    default:
      return { from: null, to: null };
  }
}

function computeLabel(
  type: PeriodType,
  from: Date | null,
  to: Date | null,
  now: Date
): string {
  switch (type) {
    case 'month': return MONTHS[now.getMonth()];
    case 'year': return now.getFullYear().toString();
    case 'all': return 'All period';
    case 'custom':
      return from && to ? `${fmt(from)} – ${fmt(to)}` : 'Custom';
    default:
      return from && to ? `${fmt(from)} – ${fmt(to)}` : '';
  }
}

export function AccountingPeriodProvider({ children }: { children: React.ReactNode }) {
  const [periodType, setPeriodTypeState] = useState<PeriodType>('month');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);

  const now = useMemo(() => new Date(), []);

  const { from, to } = useMemo(() => {
    if (periodType === 'custom') return { from: customFrom, to: customTo };
    return computeRange(periodType, now);
  }, [periodType, customFrom, customTo, now]);

  const headerLabel = useMemo(
    () => computeLabel(periodType, from, to, now),
    [periodType, from, to, now]
  );

  const setPeriodType = (type: PeriodType) => setPeriodTypeState(type);

  const setCustomRange = (f: Date, t: Date) => {
    setCustomFrom(f);
    setCustomTo(t);
    setPeriodTypeState('custom');
  };

  return (
    <AccountingPeriodContext.Provider
      value={{
        periodType,
        setPeriodType,
        dateFrom: from,
        dateTo: to,
        customFrom,
        customTo,
        setCustomRange,
        headerLabel,
      }}
    >
      {children}
    </AccountingPeriodContext.Provider>
  );
}

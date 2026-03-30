import React, { createContext, useState, useMemo, useEffect } from 'react';
import i18n from '../i18n';
import { getLocale, formatDayMonth, formatMonthYear } from '../utils/formatDate';

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
  shiftPeriod: (direction: -1 | 1) => void;
  canShift: boolean;
  setOffset: (offset: number) => void;
  offset: number;
}

export const AccountingPeriodContext = createContext<AccountingPeriodContextType>(
  {} as AccountingPeriodContextType
);

export function computeRange(type: PeriodType, now: Date, offset: number = 0): { from: Date | null; to: Date | null } {
  const y = now.getFullYear();
  const mo = now.getMonth();

  switch (type) {
    case 'week': {
      const base = new Date(now);
      base.setDate(base.getDate() + offset * 7);
      const from = new Date(base);
      from.setDate(from.getDate() - 6);
      from.setHours(0, 0, 0, 0);
      const to = new Date(base);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    case 'month': {
      const m = mo + offset;
      return {
        from: new Date(y, m, 1, 0, 0, 0, 0),
        to: new Date(y, m + 1, 0, 23, 59, 59, 999),
      };
    }
    case 'quarter': {
      const q = Math.floor(mo / 3) + offset;
      return {
        from: new Date(y, q * 3, 1, 0, 0, 0, 0),
        to: new Date(y, q * 3 + 3, 0, 23, 59, 59, 999),
      };
    }
    case 'half-year': {
      const half = (mo < 6 ? 0 : 1) + offset;
      return {
        from: new Date(y, half * 6, 1, 0, 0, 0, 0),
        to: new Date(y, half * 6 + 6, 0, 23, 59, 59, 999),
      };
    }
    case 'year': {
      const yr = y + offset;
      return {
        from: new Date(yr, 0, 1, 0, 0, 0, 0),
        to: new Date(yr, 12, 0, 23, 59, 59, 999),
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
): string {
  switch (type) {
    case 'month': return from ? formatMonthYear(from) : '';
    case 'year': return from ? from.getFullYear().toString() : '';
    case 'all': return i18n.t('period.allPeriod');
    case 'custom':
      return from && to ? `${formatDayMonth(from)} – ${formatDayMonth(to)}` : i18n.t('period.selectPeriod');
    default:
      return from && to ? `${formatDayMonth(from)} – ${formatDayMonth(to)}` : '';
  }
}

export function AccountingPeriodProvider({ children }: { children: React.ReactNode }) {
  const [periodType, setPeriodTypeState] = useState<PeriodType>('month');
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [offset, setOffset] = useState(0);
  const [, setLang] = useState(i18n.language);

  useEffect(() => {
    const handler = (lng: string) => setLang(lng);
    i18n.on('languageChanged', handler);
    return () => i18n.off('languageChanged', handler);
  }, []);

  const now = useMemo(() => new Date(), []);

  const canShift = periodType !== 'all' && periodType !== 'custom';

  const { from, to } = useMemo(() => {
    if (periodType === 'custom') return { from: customFrom, to: customTo };
    return computeRange(periodType, now, offset);
  }, [periodType, customFrom, customTo, now, offset]);

  const headerLabel = useMemo(
    () => computeLabel(periodType, from, to),
    [periodType, from, to]
  );

  const setPeriodType = (type: PeriodType) => {
    setPeriodTypeState(type);
    setOffset(0);
  };

  const shiftPeriod = (direction: -1 | 1) => {
    if (canShift) setOffset((prev) => prev + direction);
  };

  const setCustomRange = (f: Date, t: Date) => {
    setCustomFrom(f);
    setCustomTo(t);
    setPeriodTypeState('custom');
    setOffset(0);
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
        shiftPeriod,
        canShift,
        setOffset,
        offset,
      }}
    >
      {children}
    </AccountingPeriodContext.Provider>
  );
}

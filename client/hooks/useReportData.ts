import { useMemo } from "react";
import { Account, Transaction } from "../src/types";
import { toMainCurrency } from "../utils/convertCurrency";
import { computeRange, PeriodType } from "../context/AccountingPeriodContext";

export interface AccountBreakdown {
  account: Account;
  amount: number;
  percentage: number;
  color: string;
}

export interface SubPeriodBar {
  label: string;
  income: number;
  expense: number;
}

export interface DayStat {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface BalancePoint {
  date: string;
  value: number;
}

export interface Insights {
  biggestExpense: { name: string; amount: number } | null;
  topIncome: { name: string; amount: number } | null;
  dailyAvgExpense: number;
  dailyAvgIncome: number;
  savingsRate: number;
  expenseChange: number | null;
  incomeChange: number | null;
  bestDay: { date: string; net: number } | null;
  worstDay: { date: string; net: number } | null;
  highestSpendDay: { date: string; amount: number } | null;
  totalTransactions: number;
  biggestTransaction: { name: string; amount: number; date: string } | null;
  avgTransactionSize: number;
  daysWithTransactions: number;
  mostActiveCategory: { name: string; count: number } | null;
}

export interface ReportData {
  expenseBreakdown: AccountBreakdown[];
  totalExpense: number;
  incomeBreakdown: AccountBreakdown[];
  totalIncome: number;
  subPeriodBars: SubPeriodBar[];
  dayStats: DayStat[];
  balanceLine: BalancePoint[];
  accountBalances: { account: Account; balance: number; periodChange: number }[];
  inflows: number;
  outflows: number;
  insights: Insights;
}

function getDaysBetween(from: Date, to: Date): number {
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)));
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getSubPeriodConfig(periodType: PeriodType): {
  type: "day" | "week" | "month";
  labelFn: (d: Date) => string;
} {
  const shortMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  switch (periodType) {
    case "week":
      return { type: "day", labelFn: (d) => shortDays[d.getDay()] };
    case "month":
      return { type: "week", labelFn: (d) => `W${Math.ceil(d.getDate() / 7)}` };
    case "quarter":
    case "half-year":
    case "year":
      return { type: "month", labelFn: (d) => shortMonths[d.getMonth()] };
    default:
      return { type: "month", labelFn: (d) => shortMonths[d.getMonth()] };
  }
}

function generateSubPeriods(
  from: Date,
  to: Date,
  config: { type: "day" | "week" | "month"; labelFn: (d: Date) => string },
): { label: string; from: Date; to: Date }[] {
  const periods: { label: string; from: Date; to: Date }[] = [];
  const current = new Date(from);

  while (current <= to) {
    let periodEnd: Date;
    switch (config.type) {
      case "day":
        periodEnd = new Date(current);
        periodEnd.setHours(23, 59, 59, 999);
        periods.push({ label: config.labelFn(current), from: new Date(current), to: periodEnd });
        current.setDate(current.getDate() + 1);
        break;
      case "week": {
        periodEnd = new Date(current);
        periodEnd.setDate(periodEnd.getDate() + 6);
        if (periodEnd > to) periodEnd = new Date(to);
        periodEnd.setHours(23, 59, 59, 999);
        periods.push({ label: config.labelFn(current), from: new Date(current), to: periodEnd });
        current.setDate(current.getDate() + 7);
        break;
      }
      case "month":
        periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0, 23, 59, 59, 999);
        if (periodEnd > to) periodEnd = new Date(to);
        periods.push({ label: config.labelFn(current), from: new Date(current), to: periodEnd });
        current.setMonth(current.getMonth() + 1);
        current.setDate(1);
        break;
    }
  }
  return periods;
}

export function useReportData(
  transactions: Transaction[],
  accounts: Account[],
  dateFrom: Date | null,
  dateTo: Date | null,
  excludedIds: Set<string>,
  rates: Record<string, number>,
  mainCurrency: string,
  periodType: PeriodType,
  offset: number,
  includeDebtInBalance: boolean = false,
): ReportData {
  return useMemo(() => {
    const accMap = new Map<string, Account>();
    accounts.forEach((a) => accMap.set(a._id, a));

    // Filter transactions by period
    const filtered = transactions.filter((t) => {
      const time = new Date(t.time).getTime();
      if (dateFrom && time < dateFrom.getTime()) return false;
      if (dateTo && time > dateTo.getTime()) return false;
      return true;
    });

    // Filter by excluded accounts
    const included = filtered.filter((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      return !excludedIds.has(sid) && !excludedIds.has(rid);
    });

    // Build expense breakdown
    const expenseMap = new Map<string, number>();
    const incomeMap = new Map<string, number>();

    included.forEach((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      const sender = accMap.get(sid);
      const recipient = accMap.get(rid);
      if (!sender || !recipient) return;

      const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);

      // personal → expense = expense
      if (sender.type === "personal" && recipient.type === "expense") {
        expenseMap.set(rid, (expenseMap.get(rid) ?? 0) + converted);
      }
      // income → personal = income
      if (sender.type === "income" && recipient.type === "personal") {
        incomeMap.set(sid, (incomeMap.get(sid) ?? 0) + converted);
      }
    });

    const totalExpense = Array.from(expenseMap.values()).reduce((a, b) => a + b, 0);
    const totalIncome = Array.from(incomeMap.values()).reduce((a, b) => a + b, 0);

    const expenseBreakdown: AccountBreakdown[] = Array.from(expenseMap.entries())
      .map(([id, amount]) => {
        const account = accMap.get(id)!;
        return {
          account,
          amount,
          percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
          color: account.icon?.color ?? "#009F9C",
        };
      })
      .sort((a, b) => b.amount - a.amount);

    const incomeBreakdown: AccountBreakdown[] = Array.from(incomeMap.entries())
      .map(([id, amount]) => {
        const account = accMap.get(id)!;
        return {
          account,
          amount,
          percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
          color: account.icon?.color ?? "#009F9C",
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Sub-period bars for overview
    let subPeriodBars: SubPeriodBar[] = [];
    if (dateFrom && dateTo) {
      const config = getSubPeriodConfig(periodType);
      const subPeriods = generateSubPeriods(dateFrom, dateTo, config);
      subPeriodBars = subPeriods.map((sp) => {
        let inc = 0;
        let exp = 0;
        included.forEach((t) => {
          const time = new Date(t.time).getTime();
          if (time < sp.from.getTime() || time > sp.to.getTime()) return;
          const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
          const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
          const sender = accMap.get(sid);
          const recipient = accMap.get(rid);
          if (!sender || !recipient) return;
          const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
          if (sender.type === "personal" && recipient.type === "expense") exp += converted;
          if (sender.type === "income" && recipient.type === "personal") inc += converted;
        });
        return { label: sp.label, income: inc, expense: exp };
      });
    }

    // Day stats for insights
    const dayMap = new Map<string, DayStat>();
    included.forEach((t) => {
      const date = formatDate(new Date(t.time));
      if (!dayMap.has(date)) dayMap.set(date, { date, income: 0, expense: 0, net: 0 });
      const ds = dayMap.get(date)!;
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      const sender = accMap.get(sid);
      const recipient = accMap.get(rid);
      if (!sender || !recipient) return;
      const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
      if (sender.type === "personal" && recipient.type === "expense") {
        ds.expense += converted;
        ds.net -= converted;
      }
      if (sender.type === "income" && recipient.type === "personal") {
        ds.income += converted;
        ds.net += converted;
      }
    });
    const dayStats = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Balance line (cumulative personal balance by day)
    // Strategy: start from current known balances and work backwards using transactions
    const personalAccounts = accounts.filter((a) =>
      (a.type === "personal" || (a.type === "debt" && includeDebtInBalance)) && !excludedIds.has(a._id),
    );
    let balanceLine: BalancePoint[] = [];
    if (dateFrom && dateTo) {
      const personalIds = new Set(personalAccounts.map((a) => a._id));

      // Current total balance (in main currency)
      const nowTotal = personalAccounts.reduce(
        (s, a) => s + toMainCurrency(a.balance, a.currency, rates, mainCurrency), 0,
      );

      // Get all transactions affecting personal accounts, sorted newest first
      const allTrans = transactions
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

      // Build daily net changes for personal accounts within and after the period
      // We'll walk backwards from current balance
      const dailyChanges = new Map<string, number>();
      allTrans.forEach((t) => {
        const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
        const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
        const date = formatDate(new Date(t.time));

        let delta = 0;
        // Money INTO a personal account — recipient receives amount*rate in recipient's currency
        if (personalIds.has(rid)) {
          const recipientAcc = accMap.get(rid);
          const recipientCurrency = recipientAcc?.currency ?? mainCurrency;
          delta += toMainCurrency(t.amount * t.rate, recipientCurrency, rates, mainCurrency);
        }
        // Money OUT of a personal account — sender loses amount in sender's currency (t.currency)
        if (personalIds.has(sid)) {
          delta -= toMainCurrency(t.amount, t.currency, rates, mainCurrency);
        }
        if (delta !== 0) {
          dailyChanges.set(date, (dailyChanges.get(date) ?? 0) + delta);
        }
      });

      // Get sorted unique dates from today backwards
      const today = formatDate(new Date());
      const periodStart = formatDate(dateFrom);
      const periodEnd = formatDate(dateTo);

      // Calculate balance at end of each day by walking backwards from now
      const dayBalances = new Map<string, number>();
      let runningBalance = nowTotal;
      dayBalances.set(today, runningBalance);

      // Walk backwards from today through all days
      const allDates = Array.from(dailyChanges.keys()).sort((a, b) => b.localeCompare(a));
      // Also include today if not present
      const cursor = new Date();
      while (formatDate(cursor) >= periodStart) {
        const key = formatDate(cursor);
        dayBalances.set(key, runningBalance);
        // The change on this day was added, so to get balance BEFORE this day,
        // we subtract this day's change
        if (dailyChanges.has(key)) {
          runningBalance -= dailyChanges.get(key)!;
        }
        cursor.setDate(cursor.getDate() - 1);
      }

      // Build the balance line for the period
      const d = new Date(dateFrom);
      while (d <= dateTo) {
        const key = formatDate(d);
        const val = dayBalances.get(key);
        if (val !== undefined) {
          balanceLine.push({ date: key, value: Math.round(val * 100) / 100 });
        }
        d.setDate(d.getDate() + 1);
      }

      // If we have no points, flat line at current balance
      if (balanceLine.length === 0) {
        balanceLine = [
          { date: periodStart, value: Math.round(nowTotal * 100) / 100 },
          { date: periodEnd, value: Math.round(nowTotal * 100) / 100 },
        ];
      }
    }

    // Account balances + period change per account
    // Use period-filtered transactions (not excluded-filtered) for accurate per-account deltas
    const accountPeriodDeltas = new Map<string, number>();
    const balanceAccountIds = new Set(personalAccounts.map((a) => a._id));
    filtered.forEach((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      if (balanceAccountIds.has(rid)) {
        const recipientAcc = accMap.get(rid);
        const recipientCurrency = recipientAcc?.currency ?? mainCurrency;
        const val = toMainCurrency(t.amount * t.rate, recipientCurrency, rates, mainCurrency);
        accountPeriodDeltas.set(rid, (accountPeriodDeltas.get(rid) ?? 0) + val);
      }
      if (balanceAccountIds.has(sid)) {
        const val = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
        accountPeriodDeltas.set(sid, (accountPeriodDeltas.get(sid) ?? 0) - val);
      }
    });

    const accountBalances = personalAccounts.map((a) => ({
      account: a,
      balance: toMainCurrency(a.balance, a.currency, rates, mainCurrency),
      periodChange: Math.round((accountPeriodDeltas.get(a._id) ?? 0) * 100) / 100,
    })).sort((a, b) => b.balance - a.balance);

    // Previous period for comparison
    const now = new Date();
    const prev = computeRange(periodType, now, offset - 1);
    let prevExpense = 0;
    let prevIncome = 0;
    if (prev.from && prev.to) {
      transactions.forEach((t) => {
        const time = new Date(t.time).getTime();
        if (time < prev.from!.getTime() || time > prev.to!.getTime()) return;
        const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
        const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
        if (excludedIds.has(sid) || excludedIds.has(rid)) return;
        const sender = accMap.get(sid);
        const recipient = accMap.get(rid);
        if (!sender || !recipient) return;
        const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
        if (sender.type === "personal" && recipient.type === "expense") prevExpense += converted;
        if (sender.type === "income" && recipient.type === "personal") prevIncome += converted;
      });
    }

    const expenseChange = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense) * 100 : null;
    const incomeChange = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome) * 100 : null;

    const days = dateFrom && dateTo ? getDaysBetween(dateFrom, dateTo) : 1;

    // Biggest single transaction
    let biggestTransaction: Insights["biggestTransaction"] = null;
    included.forEach((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      const sender = accMap.get(sid);
      const recipient = accMap.get(rid);
      if (!sender || !recipient) return;
      if (sender.type !== "personal" || recipient.type !== "expense") return;
      const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
      if (!biggestTransaction || converted > biggestTransaction.amount) {
        biggestTransaction = { name: recipient.name, amount: converted, date: new Date(t.time).toLocaleDateString() };
      }
    });

    // Only consider days that actually have transactions for best/worst
    const activeDays = dayStats.filter((d) => d.income > 0 || d.expense > 0);
    const bestDay = activeDays.length > 0 ? activeDays.reduce((best, d) => d.net > best.net ? d : best, activeDays[0]) : null;
    const worstDay = activeDays.length > 0 ? activeDays.reduce((worst, d) => d.net < worst.net ? d : worst, activeDays[0]) : null;
    // Day with highest spending
    const expenseDays = activeDays.filter((d) => d.expense > 0);
    const highestSpendDay = expenseDays.length > 0
      ? expenseDays.reduce((h, d) => d.expense > h.expense ? d : h, expenseDays[0])
      : null;

    // Most active expense category by transaction count
    const catCountMap = new Map<string, { name: string; count: number }>();
    included.forEach((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      const sender = accMap.get(sid);
      const recipient = accMap.get(rid);
      if (!sender || !recipient) return;
      if (sender.type === "personal" && recipient.type === "expense") {
        const entry = catCountMap.get(rid) ?? { name: recipient.name, count: 0 };
        entry.count++;
        catCountMap.set(rid, entry);
      }
    });
    const mostActiveCategory = catCountMap.size > 0
      ? Array.from(catCountMap.values()).sort((a, b) => b.count - a.count)[0]
      : null;

    // Average transaction size (expenses only)
    const expenseTransactions = included.filter((t) => {
      const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
      const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
      const sender = accMap.get(sid);
      const recipient = accMap.get(rid);
      return sender?.type === "personal" && recipient?.type === "expense";
    });
    const avgTransactionSize = expenseTransactions.length > 0
      ? Math.round(totalExpense / expenseTransactions.length * 100) / 100
      : 0;

    const insights: Insights = {
      biggestExpense: expenseBreakdown.length > 0
        ? { name: expenseBreakdown[0].account.name, amount: expenseBreakdown[0].amount }
        : null,
      topIncome: incomeBreakdown.length > 0
        ? { name: incomeBreakdown[0].account.name, amount: incomeBreakdown[0].amount }
        : null,
      dailyAvgExpense: Math.round((totalExpense / days) * 100) / 100,
      dailyAvgIncome: Math.round((totalIncome / days) * 100) / 100,
      savingsRate: totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 1000) / 10 : 0,
      expenseChange,
      incomeChange,
      bestDay,
      worstDay,
      highestSpendDay: highestSpendDay ? { date: highestSpendDay.date, amount: highestSpendDay.expense } : null,
      totalTransactions: included.length,
      biggestTransaction,
      avgTransactionSize,
      daysWithTransactions: activeDays.length,
      mostActiveCategory,
    };

    return {
      expenseBreakdown,
      totalExpense,
      incomeBreakdown,
      totalIncome,
      subPeriodBars,
      dayStats,
      balanceLine,
      accountBalances,
      inflows: totalIncome,
      outflows: totalExpense,
      insights,
    };
  }, [transactions, accounts, dateFrom, dateTo, excludedIds, rates, mainCurrency, periodType, offset, includeDebtInBalance]);
}

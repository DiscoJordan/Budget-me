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
  accountBalances: { account: Account; balance: number }[];
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
    const personalAccounts = accounts.filter((a) => a.type === "personal" && !excludedIds.has(a._id));
    let balanceLine: BalancePoint[] = [];
    if (dateFrom && dateTo) {
      // Get all personal transactions sorted by date
      const personalTrans = transactions
        .filter((t) => {
          const time = new Date(t.time).getTime();
          return time <= dateTo.getTime();
        })
        .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

      // Start from initial balances
      const balances = new Map<string, number>();
      personalAccounts.forEach((a) => balances.set(a._id, a.initialBalance ?? 0));

      // Process all transactions up to period end, snapshot daily within period
      const dailyTotals = new Map<string, number>();
      let currentTotal = personalAccounts.reduce((s, a) => s + toMainCurrency(a.initialBalance ?? 0, a.currency, rates, mainCurrency), 0);

      personalTrans.forEach((t) => {
        const sid = typeof t.senderId === "string" ? t.senderId : t.senderId._id;
        const rid = typeof t.recipientId === "string" ? t.recipientId : t.recipientId._id;
        const converted = toMainCurrency(t.amount, t.currency, rates, mainCurrency);
        const convertedRate = toMainCurrency(t.amount * t.rate, t.currency, rates, mainCurrency);

        if (balances.has(rid)) currentTotal += convertedRate;
        if (balances.has(sid)) currentTotal -= converted;

        const date = formatDate(new Date(t.time));
        if (new Date(t.time) >= dateFrom) {
          dailyTotals.set(date, currentTotal);
        }
      });

      // Fill in days
      const d = new Date(dateFrom);
      let lastVal = currentTotal;
      const firstEntry = Array.from(dailyTotals.entries()).sort((a, b) => a[0].localeCompare(b[0]))[0];
      if (!firstEntry) {
        // No transactions in period, flat line
        balanceLine = [
          { date: formatDate(dateFrom), value: Math.round(currentTotal * 100) / 100 },
          { date: formatDate(dateTo), value: Math.round(currentTotal * 100) / 100 },
        ];
      } else {
        while (d <= dateTo) {
          const key = formatDate(d);
          if (dailyTotals.has(key)) lastVal = dailyTotals.get(key)!;
          balanceLine.push({ date: key, value: Math.round(lastVal * 100) / 100 });
          d.setDate(d.getDate() + 1);
        }
      }
    }

    // Account balances
    const accountBalances = personalAccounts.map((a) => ({
      account: a,
      balance: toMainCurrency(a.balance, a.currency, rates, mainCurrency),
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
  }, [transactions, accounts, dateFrom, dateTo, excludedIds, rates, mainCurrency, periodType, offset]);
}

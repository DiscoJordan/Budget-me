import { Request, Response } from "express";

interface RatesCache {
  rates: Record<string, number>;
  base: string;
  fetchedAt: number;
}

let cache: RatesCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    if (cache && now - cache.fetchedAt < CACHE_TTL_MS) {
      res.json({ ok: true, base: cache.base, rates: cache.rates });
      return;
    }

    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      res
        .status(502)
        .json({ ok: false, message: "Failed to fetch exchange rates" });
      return;
    }

    const data = (await response.json()) as {
      base_code: string;
      rates: Record<string, number>;
    };
    cache = { rates: data.rates, base: data.base_code, fetchedAt: now };

    res.json({ ok: true, base: cache.base, rates: cache.rates });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error fetching currencies" });
  }
};

export { getCurrencies };

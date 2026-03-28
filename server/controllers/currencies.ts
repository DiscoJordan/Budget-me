import { Request, Response } from "express";

interface RatesCache {
  rates: Record<string, number>;
  base: string;
  fetchedAt: number;
}

let cache: RatesCache | null = null;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  XRP: "ripple",
  USDC: "usd-coin",
  SOL: "solana",
  TRX: "tron",
  DOGE: "dogecoin",
  ADA: "cardano",
  LINK: "chainlink",
  XLM: "stellar",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  HYPE: "hyperliquid",
  XMR: "monero",
  LEO: "leo-token",
  TON: "the-open-network",
  XAUT: "tether-gold",
  DOT: "polkadot",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
};

async function fetchCryptoRates(): Promise<Record<string, number>> {
  try {
    const ids = Object.values(CRYPTO_IDS).join(",");
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    );
    if (!response.ok) return {};

    const data = (await response.json()) as Record<string, { usd: number }>;
    const rates: Record<string, number> = {};

    for (const [symbol, coinId] of Object.entries(CRYPTO_IDS)) {
      const priceUsd = data[coinId]?.usd;
      if (priceUsd && priceUsd > 0) {
        // Our rates are "how many X per 1 USD", so invert the price
        rates[symbol] = 1 / priceUsd;
      }
    }
    return rates;
  } catch {
    return {};
  }
}

const getCurrencies = async (req: Request, res: Response): Promise<void> => {
  try {
    const now = Date.now();
    const force = req.query.force === "1";
    if (!force && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
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

    const cryptoRates = await fetchCryptoRates();

    cache = {
      rates: { ...data.rates, ...cryptoRates },
      base: data.base_code,
      fetchedAt: now,
    };

    res.json({ ok: true, base: cache.base, rates: cache.rates });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Error fetching currencies" });
  }
};

export { getCurrencies };

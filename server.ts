import 'dotenv/config';
import express from 'express';
import type {Request, Response} from 'express';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Tether Gold (XAUT) ERC-20 Contract on Ethereum Mainnet
const XAUT_CONTRACT_ADDRESS = '0x68749665FF8D2d112Fa859AA293F07A622782F38';
const XAUT_DECIMALS = 6;
const XAUT_SCALE = 10n ** BigInt(XAUT_DECIMALS);
const ERC20_BALANCE_OF_SELECTOR = '0x70a08231';

// Physical gold conversion constants
const GRAMS_PER_TROY_OUNCE = 31.1034768;
const GRAMS_PER_TAIWAN_QIAN = 3.75;

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

const PUBLIC_ETH_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://1rpc.io/eth',
  'https://eth.drpc.org',
];

const MAICOIN_MAX_TICKER_V3 = 'https://max-api.maicoin.com/api/v3/ticker?market=xauttwd';
const MAICOIN_MAX_TICKER_V2 = 'https://max-api.maicoin.com/api/v2/tickers/xauttwd';
const MAICOIN_MARKET_PAGE_URL = 'https://www.maicoin.com/market/XAUT';

interface PriceQuotePayload {
  sellPriceTwd: number;
  buyPriceTwd: number | null;
  lastPriceTwd: number | null;
  high24hTwd: number | null;
  low24hTwd: number | null;
  market: string;
  sourceName: string;
  sourceDetail: string;
  maicoinMarketUrl: string;
  updatedAt: string;
  exchangeTimestamp: number;
}

interface CachedPrice {
  data: PriceQuotePayload;
  fetchedAtMs: number;
}

const PRICE_CACHE_TTL_MS = 15_000;
const MIN_REFRESH_INTERVAL_MS = 3_000;
let priceCache: CachedPrice | null = null;

function getConfiguredRpcPool(): string[] {
  const customRpc = process.env.ETH_RPC_URL?.trim();
  if (customRpc) {
    try {
      const parsed = new URL(customRpc);
      if (parsed.protocol === 'https:') {
        return [customRpc, ...PUBLIC_ETH_RPCS];
      }
    } catch {
      // Ignore malformed custom RPC URL and fall back to public pool
    }
  }
  return PUBLIC_ETH_RPCS;
}

function parsePositiveNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

async function fetchMaiCoinXautPrice(forceRefresh = false): Promise<PriceQuotePayload> {
  const now = Date.now();
  if (priceCache) {
    const age = now - priceCache.fetchedAtMs;
    if (!forceRefresh && age < PRICE_CACHE_TTL_MS) {
      return priceCache.data;
    }
    if (forceRefresh && age < MIN_REFRESH_INTERVAL_MS) {
      return priceCache.data;
    }
  }

  const endpoints = [MAICOIN_MAX_TICKER_V3, MAICOIN_MAX_TICKER_V2];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'AureumVaultXAUTValuation/1.0',
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const raw = (await response.json()) as Record<string, unknown>;
      // MAX API v3 returns flat fields; v2 may wrap inside ticker or return flat fields
      const ticker =
        raw.ticker && typeof raw.ticker === 'object'
          ? (raw.ticker as Record<string, unknown>)
          : raw;

      // On the exchange orderbook, `buy` (highest bid) is the immediate Sell Price NT$ a holder receives.
      const sellPriceTwd =
        parsePositiveNumber(ticker.buy) ?? parsePositiveNumber(ticker.last);
      const buyPriceTwd = parsePositiveNumber(ticker.sell);
      const lastPriceTwd = parsePositiveNumber(ticker.last);
      const high24hTwd = parsePositiveNumber(ticker.high);
      const low24hTwd = parsePositiveNumber(ticker.low);

      if (sellPriceTwd === null) {
        throw new Error('Missing valid XAUT/TWD price field');
      }

      const rawAt = Number(raw.at);
      const exchangeTimestamp =
        Number.isFinite(rawAt) && rawAt > 0 ? rawAt : Math.floor(now / 1000);

      const quote: PriceQuotePayload = {
        sellPriceTwd,
        buyPriceTwd,
        lastPriceTwd,
        high24hTwd,
        low24hTwd,
        market: 'XAUT/TWD',
        sourceName: 'MaiCoin 集團官方報價（MAX XAUT/TWD 即時賣出參考價）',
        sourceDetail:
          '因 maicoin.com/market/XAUT 頁面啟用 Cloudflare 防護，本服務即時串接 MaiCoin 集團官方 MAX XAUT/TWD 買盤最高出價（Best Bid）作為即時賣出報價，並提供手動微調以對齊零售報價。',
        maicoinMarketUrl: MAICOIN_MARKET_PAGE_URL,
        updatedAt: new Date(now).toISOString(),
        exchangeTimestamp,
      };

      priceCache = {data: quote, fetchedAtMs: now};
      return quote;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown price fetch error');
    }
  }

  if (priceCache) {
    return priceCache.data;
  }

  console.error('[XAUT Price] All upstream endpoints failed:', lastError?.message);
  throw new Error('無法取得 MaiCoin 集團 XAUT/TWD 即時報價，請稍後再試。');
}

function formatBigIntTokenAmount(rawBalance: bigint, decimals: number): string {
  const divisor = 10n ** BigInt(decimals);
  const whole = rawBalance / divisor;
  const fraction = rawBalance % divisor;
  if (fraction === 0n) {
    return `${whole.toString()}.000000`;
  }
  const fractionStr = fraction.toString().padStart(decimals, '0');
  return `${whole.toString()}.${fractionStr}`;
}

async function fetchXautBalanceOnChain(address: string): Promise<{
  rawBalance: string;
  balanceExactString: string;
  xautBalance: number;
  rpcLabel: string;
}> {
  const normalizedHex = address.slice(2).toLowerCase().padStart(64, '0');
  const callData = `${ERC20_BALANCE_OF_SELECTOR}${normalizedHex}`;

  const rpcPool = getConfiguredRpcPool();
  let lastError: Error | null = null;

  for (const rpcUrl of rpcPool) {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: XAUT_CONTRACT_ADDRESS,
              data: callData,
            },
            'latest',
          ],
          id: 1,
        }),
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        throw new Error(`RPC HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        result?: string;
        error?: {code?: number; message?: string};
      };

      if (payload.error || typeof payload.result !== 'string' || !payload.result.startsWith('0x')) {
        throw new Error(payload.error?.message ?? 'Invalid JSON-RPC response');
      }

      const hexResult = payload.result === '0x' ? '0x0' : payload.result;
      const rawBigInt = BigInt(hexResult);
      const balanceExactString = formatBigIntTokenAmount(rawBigInt, XAUT_DECIMALS);

      // Compute high-precision number safely via BigInt integer + fractional parts
      const wholePart = Number(rawBigInt / XAUT_SCALE);
      const fracPart = Number(rawBigInt % XAUT_SCALE) / 10 ** XAUT_DECIMALS;
      const xautBalance = wholePart + fracPart;

      const hostLabel = new URL(rpcUrl).hostname;

      return {
        rawBalance: rawBigInt.toString(),
        balanceExactString,
        xautBalance,
        rpcLabel: hostLabel,
      };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown RPC error');
    }
  }

  console.error('[ETH RPC] All RPC endpoints failed:', lastError?.message);
  throw new Error('以太坊主網節點暫時無法回應，請稍後再試。');
}

function computeGoldWeights(xautBalance: number) {
  const troyOunces = xautBalance;
  const grams = troyOunces * GRAMS_PER_TROY_OUNCE;
  const taiwanQian = grams / GRAMS_PER_TAIWAN_QIAN;
  const taiwanLiang = taiwanQian / 10;

  return {
    troyOunces,
    grams,
    taiwanQian,
    taiwanLiang,
  };
}

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({limit: '16kb'}));

  app.get('/api/xaut/price', async (req: Request, res: Response) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const quote = await fetchMaiCoinXautPrice(forceRefresh);
      res.setHeader('Cache-Control', 'no-store');
      res.json(quote);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '無法取得即時 XAUT 新台幣報價，請稍後再試。';
      res.status(502).json({error: message});
    }
  });

  app.get('/api/xaut/valuation', async (req: Request, res: Response) => {
    const rawAddress = typeof req.query.address === 'string' ? req.query.address.trim() : '';

    if (!ETH_ADDRESS_REGEX.test(rawAddress)) {
      res.status(400).json({
        error: '請輸入有效的以太坊錢包地址（須以 0x 開頭並包含 40 位十六進位字元）。',
      });
      return;
    }

    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    try {
      const [balanceData, priceQuote] = await Promise.all([
        fetchXautBalanceOnChain(rawAddress),
        fetchMaiCoinXautPrice(forceRefresh),
      ]);

      const twdValue = balanceData.xautBalance * priceQuote.sellPriceTwd;
      const goldWeights = computeGoldWeights(balanceData.xautBalance);

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        address: rawAddress,
        contractAddress: XAUT_CONTRACT_ADDRESS,
        tokenSymbol: 'XAUT',
        tokenName: 'Tether Gold',
        decimals: XAUT_DECIMALS,
        rawBalance: balanceData.rawBalance,
        balanceExactString: balanceData.balanceExactString,
        xautBalance: balanceData.xautBalance,
        twdValue,
        goldWeights,
        priceQuote,
        rpcSource: balanceData.rpcLabel,
        queriedAt: new Date().toISOString(),
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '查詢鏈上資料或即時報價時發生錯誤，請稍後再試。';
      res.status(502).json({error: message});
    }
  });

  // Catch-all 404 for unknown /api routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({error: '找不到請求的 API 端點。'});
  });

  if (!IS_PRODUCTION) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Aureum Vault server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

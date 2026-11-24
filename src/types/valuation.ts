export interface XautPriceQuote {
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

export interface GoldWeights {
  troyOunces: number;
  grams: number;
  taiwanQian: number;
  taiwanLiang: number;
}

export interface XautValuationResult {
  address: string;
  contractAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: number;
  rawBalance: string;
  balanceExactString: string;
  xautBalance: number;
  twdValue: number;
  goldWeights: GoldWeights;
  priceQuote: XautPriceQuote;
  rpcSource: string;
  queriedAt: string;
}

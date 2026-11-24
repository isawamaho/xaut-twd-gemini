import {useCallback, useEffect, useState} from 'react';
import {AlertCircle, ExternalLink, RefreshCw} from 'lucide-react';
import {motion} from 'motion/react';
import {TopBar} from './components/TopBar.tsx';
import {AddressLookupForm} from './components/AddressLookupForm.tsx';
import {ValuationCertificate} from './components/ValuationCertificate.tsx';
import {MethodologySection} from './components/MethodologySection.tsx';
import type {XautPriceQuote, XautValuationResult} from './types/valuation.ts';
import {
  MAICOIN_XAUT_MARKET_URL,
  XAUT_CONTRACT_ADDRESS,
  formatTaipeiTimestamp,
  formatTwd,
  isValidEthAddress,
} from './lib/formatters.ts';

export default function App() {
  const [priceQuote, setPriceQuote] = useState<XautPriceQuote | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [addressInput, setAddressInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [valuationResult, setValuationResult] = useState<XautValuationResult | null>(null);

  const [customSellPriceInput, setCustomSellPriceInput] = useState('');

  const loadPriceQuote = useCallback(async (forceRefresh = false) => {
    setIsLoadingPrice(true);
    setPriceError(null);
    try {
      const url = forceRefresh ? '/api/xaut/price?refresh=1' : '/api/xaut/price';
      const response = await fetch(url);
      const data = (await response.json()) as XautPriceQuote & {error?: string};
      if (!response.ok) {
        throw new Error(data.error || '無法取得即時 XAUT 新台幣報價。');
      }
      setPriceQuote(data);
      // Sync live price into active valuation result if one is displayed
      setValuationResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          priceQuote: data,
          twdValue: prev.xautBalance * data.sellPriceTwd,
        };
      });
    } catch (err) {
      setPriceError(
        err instanceof Error ? err.message : '無法連線至報價服務，請稍後再試。',
      );
    } finally {
      setIsLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    void loadPriceQuote(false);
  }, [loadPriceQuote]);

  const handleLookup = useCallback(async (rawAddress: string) => {
    const trimmed = rawAddress.trim();
    if (!isValidEthAddress(trimmed)) {
      setValidationError('請輸入正確的 42 字元以太坊錢包地址（以 0x 開頭並包含 40 位十六進位字元）。');
      return;
    }

    setValidationError(null);
    setQueryError(null);
    setIsQuerying(true);

    try {
      const response = await fetch(
        `/api/xaut/valuation?address=${encodeURIComponent(trimmed)}`,
      );
      const data = (await response.json()) as XautValuationResult & {error?: string};
      if (!response.ok) {
        throw new Error(data.error || '查詢 XAUT 餘額與現值失敗，請稍後再試。');
      }
      setValuationResult(data);
      setPriceQuote(data.priceQuote);
    } catch (err) {
      setQueryError(
        err instanceof Error ? err.message : '無法完成鏈上餘額查詢，請稍後重試。',
      );
    } finally {
      setIsQuerying(false);
    }
  }, []);

  const handleClear = () => {
    setAddressInput('');
    setValidationError(null);
    setQueryError(null);
    setValuationResult(null);
    setCustomSellPriceInput('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F0] text-[#18201B]">
      <TopBar
        isRefreshingPrice={isLoadingPrice}
        onRefreshPrice={() => void loadPriceQuote(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 lg:px-10 py-10 lg:py-14 space-y-12">
        {/* Hero: Private Bank Lookup Desk */}
        <section
          id="lookup"
          className="scroll-mt-24 bg-[#FFFFFF] border border-[#E4DCCB] p-6 sm:p-8 lg:p-10 space-y-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-8 border-b border-[#E4DCCB]">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#5B645E]">
                <span className="font-medium text-[#A68238]">Tether Gold 鏈上資產估值</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Ethereum ERC-20</span>
                <span aria-hidden="true">·</span>
                <span>無紀錄單次查詢</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-[#18201B] leading-[1.15] text-balance">
                以太坊 XAUT 黃金持倉與新台幣現值查詢
              </h1>

              <p className="text-sm sm:text-[15px] text-[#5B645E] leading-relaxed max-w-2xl">
                輸入任意以太坊地址，即時讀取主網合約{' '}
                <span className="font-mono text-xs text-[#18201B]">{XAUT_CONTRACT_ADDRESS}</span>{' '}
                的 XAUT 持倉量，並以 MaiCoin 體系即時賣出報價換算為新台幣現值與實體黃金重量。
              </p>
            </div>

            {/* Live Reference Price Readout */}
            <div className="lg:col-span-5 lg:text-right pt-6 lg:pt-0 border-t lg:border-t-0 border-[#E4DCCB] space-y-2">
              <p className="text-xs text-[#5B645E]">
                即時參考賣出價（MaiCoin 集團 XAUT/TWD Sell Price）
              </p>
              {isLoadingPrice && !priceQuote ? (
                <div className="h-9 w-48 lg:ml-auto bg-[#F3EFE6] animate-pulse rounded-sm" />
              ) : priceQuote ? (
                <p className="font-mono tabular-nums text-3xl sm:text-4xl font-semibold text-[#143627]">
                  {formatTwd(priceQuote.sellPriceTwd, 0)}
                  <span className="text-xs font-sans font-normal text-[#5B645E] ml-2">
                    / 1 XAUT
                  </span>
                </p>
              ) : (
                <p className="text-sm text-[#991B1B]">
                  {priceError || '暫時無法讀取即時報價'}
                </p>
              )}

              <div className="flex flex-wrap lg:justify-end items-center gap-x-3 gap-y-1 text-xs text-[#5B645E]">
                {priceQuote ? (
                  <>
                    <span className="font-mono tabular-nums">
                      更新：{formatTaipeiTimestamp(priceQuote.updatedAt)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <a
                      href={MAICOIN_XAUT_MARKET_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#143627] hover:text-[#A68238] underline underline-offset-4 decoration-[#D5CCB8] transition-colors"
                    >
                      <span>MaiCoin 市場頁面</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => void loadPriceQuote(true)}
                    className="inline-flex items-center gap-1.5 text-[#143627] underline underline-offset-4 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" aria-hidden="true" />
                    <span>重新載入報價</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <AddressLookupForm
            addressInput={addressInput}
            onAddressChange={(val) => {
              setAddressInput(val);
              if (validationError) setValidationError(null);
            }}
            onSubmit={(addr) => void handleLookup(addr)}
            onClear={handleClear}
            isLoading={isQuerying}
            validationError={validationError}
            hasResult={valuationResult !== null}
          />
        </section>

        {/* Query Loading Skeleton */}
        {isQuerying && (
          <section
            aria-live="polite"
            aria-busy="true"
            className="bg-[#FFFFFF] border border-[#E4DCCB] p-6 sm:p-8 lg:p-10 space-y-6"
          >
            <div className="flex items-center justify-between border-b border-[#E4DCCB] pb-4">
              <div className="h-4 w-48 bg-[#F3EFE6] animate-pulse rounded-sm" />
              <div className="h-4 w-36 bg-[#F3EFE6] animate-pulse rounded-sm" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-4">
                <div className="h-4 w-40 bg-[#F3EFE6] animate-pulse rounded-sm" />
                <div className="h-12 w-72 bg-[#F3EFE6] animate-pulse rounded-sm" />
                <div className="grid grid-cols-2 gap-6 pt-4">
                  <div className="h-14 bg-[#F3EFE6] animate-pulse rounded-sm" />
                  <div className="h-14 bg-[#F3EFE6] animate-pulse rounded-sm" />
                </div>
              </div>
              <div className="lg:col-span-5 space-y-4">
                <div className="h-6 w-36 bg-[#F3EFE6] animate-pulse rounded-sm" />
                <div className="h-12 bg-[#F3EFE6] animate-pulse rounded-sm" />
                <div className="h-12 bg-[#F3EFE6] animate-pulse rounded-sm" />
                <div className="h-12 bg-[#F3EFE6] animate-pulse rounded-sm" />
              </div>
            </div>
          </section>
        )}

        {/* Query Error State */}
        {!isQuerying && queryError && (
          <section
            role="alert"
            className="bg-[#FFFFFF] border border-[#E4DCCB] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertCircle
                className="w-5 h-5 text-[#991B1B] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-sm font-semibold text-[#18201B]">無法完成鏈上估值查詢</h2>
                <p className="text-sm text-[#5B645E] mt-1">{queryError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleLookup(addressInput)}
              className="px-4 py-2 text-xs font-medium text-[#FAF7F0] bg-[#143627] hover:bg-[#0E281C] rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              重新嘗試查詢
            </button>
          </section>
        )}

        {/* Active Valuation Certificate */}
        {!isQuerying && valuationResult && (
          <motion.div
            key={valuationResult.address + valuationResult.queriedAt}
            initial={{opacity: 0, y: 10}}
            animate={{opacity: 1, y: 0}}
            transition={{duration: 0.2, ease: [0.16, 1, 0.3, 1]}}
          >
            <ValuationCertificate
              result={valuationResult}
              customSellPriceInput={customSellPriceInput}
              onCustomSellPriceChange={setCustomSellPriceInput}
              onResetCustomSellPrice={() => setCustomSellPriceInput('')}
            />
          </motion.div>
        )}

        {/* Reference Methodology & Contract Specs */}
        <MethodologySection />
      </main>

      <footer className="border-t border-[#E4DCCB] bg-[#FAF7F0] mt-16">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#5B645E]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-serif text-sm font-semibold text-[#143627]">Aureum Vault</span>
            <span aria-hidden="true">·</span>
            <span>以太坊 XAUT 鏈上黃金估值工具</span>
          </div>
          <p>
            本工具僅供鏈上資產與市場參考報價試算，實際成交價格以交易平台當下掛單與手續費為準。
          </p>
        </div>
      </footer>
    </div>
  );
}

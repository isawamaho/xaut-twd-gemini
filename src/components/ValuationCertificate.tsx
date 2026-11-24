import {useState} from 'react';
import {Check, Copy, ExternalLink, RotateCcw, SlidersHorizontal} from 'lucide-react';
import type {XautValuationResult} from '../types/valuation.ts';
import {
  MAICOIN_XAUT_MARKET_URL,
  XAUT_CONTRACT_ADDRESS,
  formatTaipeiTimestamp,
  formatTwd,
  formatTwdExact,
  formatWeight,
  formatXautAmount,
} from '../lib/formatters.ts';

interface ValuationCertificateProps {
  result: XautValuationResult;
  customSellPriceInput: string;
  onCustomSellPriceChange: (value: string) => void;
  onResetCustomSellPrice: () => void;
}

export function ValuationCertificate({
  result,
  customSellPriceInput,
  onCustomSellPriceChange,
  onResetCustomSellPrice,
}: ValuationCertificateProps) {
  const [copied, setCopied] = useState(false);
  const [showCustomPriceEditor, setShowCustomPriceEditor] = useState(
    customSellPriceInput.trim() !== '',
  );

  const parsedCustomPrice = Number(customSellPriceInput.replace(/,/g, '').trim());
  const isCustomPriceActive =
    customSellPriceInput.trim() !== '' &&
    Number.isFinite(parsedCustomPrice) &&
    parsedCustomPrice > 0;

  const effectiveSellPrice = isCustomPriceActive
    ? parsedCustomPrice
    : result.priceQuote.sellPriceTwd;

  const effectiveTwdValue = result.xautBalance * effectiveSellPrice;
  const isZeroBalance = result.rawBalance === '0';

  const etherscanHoldingUrl = `https://etherscan.io/token/${XAUT_CONTRACT_ADDRESS}?a=${result.address}`;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(result.address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable in restricted iframe contexts
    }
  };

  const handleToggleEditor = () => {
    if (showCustomPriceEditor && !isCustomPriceActive) {
      setShowCustomPriceEditor(false);
      return;
    }
    setShowCustomPriceEditor((prev) => !prev);
  };

  const handleReset = () => {
    onResetCustomSellPrice();
    setShowCustomPriceEditor(false);
  };

  return (
    <section
      aria-label="XAUT 資產估值證書"
      className="bg-[#FFFFFF] border border-[#E4DCCB] transition-opacity duration-200"
    >
      {/* Top Archival Certificate Strip */}
      <div className="px-6 sm:px-8 lg:px-10 py-4 bg-[#F3EFE6]/70 border-b border-[#E4DCCB] flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-[#5B645E]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="font-medium text-[#143627]">以太坊主網資產估值證書</span>
          <span aria-hidden="true">·</span>
          <span>Tether Gold (XAUT)</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono tabular-nums">6 Decimals</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono tabular-nums">
          <span>查詢時間 {formatTaipeiTimestamp(result.queriedAt)}</span>
          <span aria-hidden="true">·</span>
          <span>節點 {result.rpcSource}</span>
        </div>
      </div>

      {/* Main 2-Column Asymmetric Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-[#E4DCCB]">
        {/* Left Column: Primary Valuation Focal Anchor */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-xs font-medium text-[#5B645E] mb-2">
                {isCustomPriceActive
                  ? '新台幣預估變現現值（依自訂賣出價試算）'
                  : '新台幣預估變現現值（依 MaiCoin 集團即時賣出參考價）'}
              </p>
              <div className="font-mono tabular-nums text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight text-[#143627] leading-none">
                {formatTwdExact(effectiveTwdValue)}
              </div>
              {isZeroBalance && (
                <p className="mt-3 text-sm text-[#5B645E]">
                  此地址目前於以太坊主網未持有 XAUT 代幣（餘額為 0.000000 XAUT）。
                </p>
              )}
            </div>

            {/* Clean Calculation Breakdown Row */}
            <div className="pt-6 border-t border-[#E4DCCB] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-[#5B645E] mb-1.5">鏈上 XAUT 持倉數量</p>
                <p className="font-mono tabular-nums text-2xl font-semibold text-[#18201B]">
                  {formatXautAmount(result.balanceExactString)}{' '}
                  <span className="text-sm font-medium text-[#A68238]">XAUT</span>
                </p>
                <p className="text-xs text-[#5B645E] font-mono tabular-nums mt-1">
                  原始最小單位：{result.rawBalance}
                </p>
              </div>

              <div>
                <p className="text-xs text-[#5B645E] mb-1.5">
                  {isCustomPriceActive ? '自訂試算賣出價（NT$ / XAUT）' : '賣出參考價 Sell Price（NT$ / XAUT）'}
                </p>
                <p className="font-mono tabular-nums text-2xl font-semibold text-[#18201B]">
                  {formatTwd(effectiveSellPrice, 0)}
                </p>
                <p className="text-xs text-[#5B645E] mt-1">
                  {isCustomPriceActive
                    ? `即時報價基準為 ${formatTwd(result.priceQuote.sellPriceTwd, 0)}`
                    : `最新成交參考：${
                        result.priceQuote.lastPriceTwd !== null
                          ? formatTwd(result.priceQuote.lastPriceTwd, 0)
                          : '—'
                      }`}
                </p>
              </div>
            </div>

            {/* Inline Retail Sell Price Override Controls */}
            <div className="pt-5 border-t border-[#E4DCCB] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleToggleEditor}
                  className="inline-flex items-center gap-2 text-xs font-medium text-[#143627] hover:text-[#A68238] transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>
                    {showCustomPriceEditor
                      ? '收合 MaiCoin 零售賣出價微調'
                      : '手動輸入 MaiCoin 頁面零售賣出價試算'}
                  </span>
                </button>

                <a
                  href={MAICOIN_XAUT_MARKET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#5B645E] hover:text-[#143627] underline underline-offset-4 decoration-[#D5CCB8] transition-colors whitespace-nowrap"
                >
                  <span>前往 MaiCoin XAUT 頁面核對</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </div>

              {showCustomPriceEditor && (
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                  <label htmlFor="custom-sell-price" className="sr-only">
                    自訂賣出單價（新台幣）
                  </label>
                  <div className="relative flex-1 max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#5B645E]">
                      NT$
                    </span>
                    <input
                      id="custom-sell-price"
                      type="text"
                      inputMode="decimal"
                      value={customSellPriceInput}
                      onChange={(e) => onCustomSellPriceChange(e.target.value)}
                      placeholder={String(result.priceQuote.sellPriceTwd)}
                      className="w-full h-10 pl-12 pr-3 bg-[#FAF7F0] border border-[#D5CCB8] focus:border-[#143627] rounded text-sm font-mono tabular-nums text-[#18201B] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#143627]"
                    />
                  </div>
                  {isCustomPriceActive && (
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#143627] border border-[#D5CCB8] hover:border-[#143627] rounded transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>還原即時報價</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Queried Wallet Footer */}
          <div className="pt-5 border-t border-[#E4DCCB] flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs text-[#5B645E] mb-1">查詢錢包地址</p>
              <p className="font-mono text-xs sm:text-sm text-[#18201B] break-all">
                {result.address}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleCopyAddress}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#18201B] border border-[#D5CCB8] hover:border-[#143627] rounded transition-colors whitespace-nowrap cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#143627]" aria-hidden="true" />
                    <span>已複製</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#5B645E]" aria-hidden="true" />
                    <span>複製地址</span>
                  </>
                )}
              </button>
              <a
                href={etherscanHoldingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#143627] border border-[#D5CCB8] hover:border-[#143627] rounded transition-colors whitespace-nowrap"
              >
                <span>Etherscan 查驗</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Gold Weight Equivalency Ledger */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 bg-[#FAF7F0]/60 flex flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-medium text-[#A68238] mb-1">實體黃金重量對照</p>
            <h2 className="font-serif text-2xl font-semibold text-[#18201B] mb-2">
              實體儲備等值換算
            </h2>
            <p className="text-xs text-[#5B645E] leading-relaxed">
              每 1 枚 XAUT 代表 1 金衡盎司（Fine Troy Ounce）存放於瑞士金庫之 LBMA 合格交割實體黃金所有權。
            </p>

            <dl className="mt-6 divide-y divide-[#E4DCCB] border-y border-[#E4DCCB]">
              <div className="py-4 flex items-baseline justify-between gap-4">
                <div>
                  <dt className="text-sm font-medium text-[#18201B]">金衡盎司</dt>
                  <dd className="text-xs text-[#5B645E] mt-0.5">國際黃金計價標準（oz t）</dd>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xl font-semibold text-[#143627]">
                    {formatWeight(result.goldWeights.troyOunces, 6)}
                  </span>
                  <span className="text-xs text-[#5B645E] ml-1.5">oz t</span>
                </div>
              </div>

              <div className="py-4 flex items-baseline justify-between gap-4">
                <div>
                  <dt className="text-sm font-medium text-[#18201B]">公克重</dt>
                  <dd className="text-xs text-[#5B645E] mt-0.5">1 oz t = 31.1034768 g</dd>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xl font-semibold text-[#18201B]">
                    {formatWeight(result.goldWeights.grams, 4)}
                  </span>
                  <span className="text-xs text-[#5B645E] ml-1.5">g</span>
                </div>
              </div>

              <div className="py-4 flex items-baseline justify-between gap-4">
                <div>
                  <dt className="text-sm font-medium text-[#18201B]">台灣台錢</dt>
                  <dd className="text-xs text-[#5B645E] mt-0.5">
                    1 台錢 = 3.75 g · 折合{' '}
                    <span className="font-mono tabular-nums text-[#18201B]">
                      {formatWeight(result.goldWeights.taiwanLiang, 3)}
                    </span>{' '}
                    台兩
                  </dd>
                </div>
                <div className="text-right font-mono tabular-nums">
                  <span className="text-xl font-semibold text-[#A68238]">
                    {formatWeight(result.goldWeights.taiwanQian, 4)}
                  </span>
                  <span className="text-xs text-[#5B645E] ml-1.5">台錢</span>
                </div>
              </div>
            </dl>
          </div>

          <div className="text-xs text-[#5B645E] space-y-2 leading-relaxed">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#18201B]">
              <span className="font-medium">報價來源</span>
              <span className="font-mono tabular-nums">
                {formatTaipeiTimestamp(result.priceQuote.exchangeTimestamp)}
              </span>
            </div>
            <p>{result.priceQuote.sourceName}</p>
            <p className="text-[11px] leading-relaxed">{result.priceQuote.sourceDetail}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

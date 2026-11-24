import {ExternalLink} from 'lucide-react';
import {
  GRAMS_PER_TAIWAN_QIAN,
  GRAMS_PER_TROY_OUNCE,
  MAICOIN_XAUT_MARKET_URL,
  XAUT_CONTRACT_ADDRESS,
} from '../lib/formatters.ts';

export function MethodologySection() {
  const qianPerOunce = (GRAMS_PER_TROY_OUNCE / GRAMS_PER_TAIWAN_QIAN).toFixed(5);

  return (
    <div className="space-y-16 pt-8">
      {/* Section 1: Physical Gold Conversion Standard */}
      <section
        id="gold-conversion"
        className="scroll-mt-24 pt-12 border-t border-[#E4DCCB] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
      >
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-medium text-[#A68238]">01. 貴金屬計量基準</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18201B] text-balance">
            實體黃金重量換算公式
          </h2>
          <p className="text-sm text-[#5B645E] leading-relaxed">
            所有重量換算皆採國際金衡制與台灣傳統銀樓度量標準，於鏈上精確讀取 6 位小數後直接運算，避免多次四捨五入造成的累積誤差。
          </p>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-[#FFFFFF] border border-[#E4DCCB] divide-y divide-[#E4DCCB]">
            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                金衡盎司（oz t）
              </div>
              <div className="sm:col-span-4 font-mono tabular-nums text-sm text-[#143627]">
                1 XAUT = 1.000000 oz t
              </div>
              <div className="sm:col-span-4 text-xs text-[#5B645E]">
                與倫敦金銀市場協會（LBMA）交割標準 1:1 對應
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                公克（Grams）
              </div>
              <div className="sm:col-span-4 font-mono tabular-nums text-sm text-[#143627]">
                1 oz t = {GRAMS_PER_TROY_OUNCE} g
              </div>
              <div className="sm:col-span-4 text-xs text-[#5B645E]">
                公制法定金衡盎司精確換算常數
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-3 items-baseline">
              <div className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                台灣台錢與台兩
              </div>
              <div className="sm:col-span-4 font-mono tabular-nums text-sm text-[#A68238]">
                1 台錢 = {GRAMS_PER_TAIWAN_QIAN} g（1 oz t ≈ {qianPerOunce} 台錢）
              </div>
              <div className="sm:col-span-4 text-xs text-[#5B645E]">
                台灣銀樓通行標準，10 台錢為 1 台兩（37.5 g）
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Smart Contract & MaiCoin Pricing Specification */}
      <section
        id="contract-info"
        className="scroll-mt-24 pt-12 border-t border-[#E4DCCB] grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
      >
        <div className="lg:col-span-4 space-y-3">
          <p className="text-xs font-medium text-[#A68238]">02. 技術與資料來源</p>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#18201B] text-balance">
            合約查驗與 MaiCoin 報價說明
          </h2>
          <p className="text-sm text-[#5B645E] leading-relaxed">
            所有鏈上查詢與報價存取皆透過伺服器端代理完成，確保跨網域穩定連線與標準化格式驗證。
          </p>
        </div>

        <div className="lg:col-span-8">
          <dl className="bg-[#FFFFFF] border border-[#E4DCCB] divide-y divide-[#E4DCCB]">
            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-2">
              <dt className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                XAUT ERC-20 合約地址
              </dt>
              <dd className="sm:col-span-8 space-y-1.5">
                <p className="font-mono text-xs sm:text-sm text-[#143627] break-all">
                  {XAUT_CONTRACT_ADDRESS}
                </p>
                <a
                  href={`https://etherscan.io/token/${XAUT_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[#5B645E] hover:text-[#143627] underline underline-offset-4 decoration-[#D5CCB8]"
                >
                  <span>於 Etherscan 檢視官方合約</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </dd>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-2">
              <dt className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                鏈上讀取方式
              </dt>
              <dd className="sm:col-span-8 text-sm text-[#5B645E] leading-relaxed">
                透過以太坊主網公開 JSON-RPC 備援節點池直接執行{' '}
                <code className="font-mono text-xs text-[#18201B]">balanceOf(address)</code>{' '}
                讀取 256-bit 原始餘額，並以 6 位小數精度（<code className="font-mono text-xs text-[#18201B]">10^6</code>）換算為精確持倉量。
              </dd>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-12 gap-2">
              <dt className="sm:col-span-4 text-sm font-medium text-[#18201B]">
                MaiCoin Sell Price NT$ 來源
              </dt>
              <dd className="sm:col-span-8 text-sm text-[#5B645E] leading-relaxed space-y-2">
                <p>
                  由於{' '}
                  <a
                    href={MAICOIN_XAUT_MARKET_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#143627] underline underline-offset-4 decoration-[#C4A259]"
                  >
                    maicoin.com/market/XAUT
                  </a>{' '}
                  前端頁面設有 Cloudflare 防護，後端自動串接 MaiCoin 集團官方公開即時報價 API（MAX{' '}
                  <code className="font-mono text-xs text-[#18201B]">xauttwd</code> 市場最高買單出價{' '}
                  <code className="font-mono text-xs text-[#18201B]">buy</code>，即持有人即時賣出變現價格）。
                </p>
                <p className="text-xs">
                  若您需與 MaiCoin 零售介面當下顯示的買賣價差完全對齊，可於估值證書中直接輸入頁面上的零售賣出價進行即時試算。
                </p>
              </dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}

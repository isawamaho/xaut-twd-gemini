import {RefreshCw} from 'lucide-react';

interface TopBarProps {
  isRefreshingPrice: boolean;
  onRefreshPrice: () => void;
}

export function TopBar({isRefreshingPrice, onRefreshPrice}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F0]/95 backdrop-blur-sm border-b border-[#E4DCCB]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 h-16 flex items-center justify-between gap-8">
        <a
          href="#lookup"
          className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-[#143627] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#143627]"
        >
          Aureum Vault
        </a>

        <nav
          aria-label="主要導覽"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#5B645E]"
        >
          <a
            href="#lookup"
            className="hover:text-[#143627] hover:underline underline-offset-4 decoration-[#A68238] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            估值查詢
          </a>
          <a
            href="#gold-conversion"
            className="hover:text-[#143627] hover:underline underline-offset-4 decoration-[#A68238] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            黃金換算基準
          </a>
          <a
            href="#contract-info"
            className="hover:text-[#143627] hover:underline underline-offset-4 decoration-[#A68238] transition-colors duration-150 whitespace-nowrap shrink-0"
          >
            合約與報價說明
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onRefreshPrice}
            disabled={isRefreshingPrice}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-[#FAF7F0] bg-[#143627] hover:bg-[#0E281C] disabled:opacity-60 rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143627]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshingPrice ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshingPrice ? '更新報價中' : '重新整理報價'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

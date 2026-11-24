import type {FormEvent} from 'react';
import {ArrowRight, Search, X} from 'lucide-react';
import {SAMPLE_XAUT_HOLDER_ADDRESS, isValidEthAddress} from '../lib/formatters.ts';

interface AddressLookupFormProps {
  addressInput: string;
  onAddressChange: (value: string) => void;
  onSubmit: (address: string) => void;
  onClear: () => void;
  isLoading: boolean;
  validationError: string | null;
  hasResult: boolean;
}

export function AddressLookupForm({
  addressInput,
  onAddressChange,
  onSubmit,
  onClear,
  isLoading,
  validationError,
  hasResult,
}: AddressLookupFormProps) {
  const trimmed = addressInput.trim();
  const showInlineFormatWarning = trimmed.length > 0 && !isValidEthAddress(trimmed);

  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(trimmed);
  };

  const handleUseSample = () => {
    onAddressChange(SAMPLE_XAUT_HOLDER_ADDRESS);
    onSubmit(SAMPLE_XAUT_HOLDER_ADDRESS);
  };

  return (
    <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
      <div>
        <label
          htmlFor="eth-address-input"
          className="block text-sm font-medium text-[#18201B] mb-2"
        >
          以太坊錢包地址（Ethereum Mainnet）
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="w-4 h-4 text-[#5B645E] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="eth-address-input"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              value={addressInput}
              onChange={(e) => onAddressChange(e.target.value)}
              placeholder="請輸入 0x 開頭的 42 字元以太坊地址"
              aria-invalid={Boolean(validationError || showInlineFormatWarning)}
              aria-describedby="eth-address-helper"
              className={`w-full h-12 pl-11 pr-10 bg-[#FFFFFF] border rounded text-sm font-mono text-[#18201B] placeholder:font-sans placeholder:text-[#8A918C] transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#143627] ${
                validationError || showInlineFormatWarning
                  ? 'border-[#991B1B]'
                  : 'border-[#D5CCB8] hover:border-[#A68238] focus:border-[#143627]'
              }`}
            />
            {addressInput.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                aria-label="清除輸入地址"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#5B645E] hover:text-[#18201B] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || trimmed.length === 0}
            className="h-12 px-6 inline-flex items-center justify-center gap-2 bg-[#143627] hover:bg-[#0E281C] disabled:opacity-50 text-[#FAF7F0] text-sm font-medium rounded transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#143627]"
          >
            <span>{isLoading ? '鏈上查詢中…' : '查詢資產現值'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="eth-address-helper"
        className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs"
      >
        {validationError ? (
          <p role="alert" className="text-[#991B1B] font-medium">
            {validationError}
          </p>
        ) : showInlineFormatWarning ? (
          <p className="text-[#9A5B13]">
            格式提醒：標準以太坊地址須以 0x 開頭並包含 40 位十六進位字元（目前 {trimmed.length} 字元）
          </p>
        ) : (
          <p className="text-[#5B645E]">
            純單次即時查詢，系統不會於瀏覽器或伺服器保存您的錢包地址。
          </p>
        )}

        <div className="flex items-center gap-4 shrink-0">
          <button
            type="button"
            onClick={handleUseSample}
            disabled={isLoading}
            className="text-[#143627] hover:text-[#A68238] underline underline-offset-4 decoration-[#C4A259] font-medium transition-colors duration-150 whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            帶入公開範例地址
          </button>
          {hasResult && (
            <>
              <span className="text-[#D5CCB8]" aria-hidden="true">
                ·
              </span>
              <button
                type="button"
                onClick={onClear}
                className="text-[#5B645E] hover:text-[#18201B] transition-colors duration-150 whitespace-nowrap cursor-pointer"
              >
                清除查詢
              </button>
            </>
          )}
        </div>
      </div>
    </form>
  );
}

export const XAUT_CONTRACT_ADDRESS = '0x68749665FF8D2d112Fa859AA293F07A622782F38';
export const MAICOIN_XAUT_MARKET_URL = 'https://www.maicoin.com/market/XAUT';
export const SAMPLE_XAUT_HOLDER_ADDRESS = '0x77134cbc06cb00b66f4c7e623d5fdbf6777635ec';

export const GRAMS_PER_TROY_OUNCE = 31.1034768;
export const GRAMS_PER_TAIWAN_QIAN = 3.75;

const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export function isValidEthAddress(input: string): boolean {
  return ETH_ADDRESS_REGEX.test(input.trim());
}

export function formatTwd(value: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(value)) return 'NT$ —';
  return `NT$ ${new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: maximumFractionDigits > 0 ? 2 : 0,
    maximumFractionDigits,
  }).format(value)}`;
}

export function formatTwdExact(value: number): string {
  if (!Number.isFinite(value)) return 'NT$ —';
  const decimals = value > 0 && value < 100 ? 2 : 0;
  return `NT$ ${new Intl.NumberFormat('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)}`;
}

export function formatXautAmount(exactString: string): string {
  const parts = exactString.split('.');
  const integerFormatted = new Intl.NumberFormat('en-US').format(BigInt(parts[0] || '0'));
  if (!parts[1]) {
    return `${integerFormatted}.000000`;
  }
  return `${integerFormatted}.${parts[1].padEnd(6, '0').slice(0, 6)}`;
}

export function formatWeight(value: number, fractionDigits = 4): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return (0).toFixed(fractionDigits);
  const digits = value >= 1000 ? 2 : value >= 10 ? 3 : fractionDigits;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatTaipeiTimestamp(isoOrEpoch: string | number): string {
  const date = typeof isoOrEpoch === 'number' ? new Date(isoOrEpoch * 1000) : new Date(isoOrEpoch);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function shortenAddress(address: string): string {
  if (address.length < 14) return address;
  return `${address.slice(0, 8)}…${address.slice(-6)}`;
}

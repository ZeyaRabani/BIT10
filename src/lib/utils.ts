import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Metadata } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
};

export function constructMetadata({
  title = 'BIT10',
  description = 'Diversified crypto index funds. On-chain. Auto-rebalanced. Built for the next wave of investing.',
  // image = '/assets/thumbnails/thumbnail.png',
  icons = '/favicon.ico',
  noIndex = false
}: {
  title?: string
  description?: string
  image?: string
  icons?: string
  noIndex?: boolean
} = {}): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      // images: [
      //   {
      //     url: image
      //   }
      // ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      // images: [image],
      creator: '@bit10startup'
    },
    icons,
    metadataBase: new URL('https://www.bit10.app'),
    ...(noIndex && {
      robots: {
        index: false,
        follow: false
      }
    })
  }
};

export const formatAddress = (id: string) => {
  if (!id) return '';
  if (id.length <= 7) return id;
  return `${id.slice(0, 9)}.....${id.slice(-9)}`;
};

export const formatAmount = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value)) return '0';
  if (value === 0) return '0';
  const strValue = value.toFixed(10).replace(/\.?0+$/, '');
  const [integerPart, decimalPart = ''] = strValue.split('.');
  const formattedInteger = Number(integerPart).toLocaleString();

  if (!decimalPart) return formattedInteger || '0';

  const firstNonZeroIndex = decimalPart.search(/[1-9]/);

  if (firstNonZeroIndex === -1) return formattedInteger || '0';

  const trimmedDecimal = decimalPart.slice(0, firstNonZeroIndex + 4);

  return `${formattedInteger}.${trimmedDecimal}`;
};

export const getTokenName = (tokenAddress: string): string => {
  if (!tokenAddress) {
    return 'Unknown Token';
  }

  const normalizedAddress = tokenAddress.toLowerCase();

  switch (normalizedAddress) {
    case 'eegan-kqaaa-aaaap-qhmgq-cai'.toLocaleLowerCase():
      return 'ckUSDC (on ICP)';
    case 'wbckh-zqaaa-aaaap-qpuza-cai'.toLocaleLowerCase():
      return 'Test BIT10.TOP (on ICP)';
    case '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'.toLocaleLowerCase():
      return 'USDC (on Ethereum)';
    case '0x0000000000000000000000000000000000000000e'.toLocaleLowerCase():
      return 'ETH (on Ethereum)';
    case '0x0000000000000000000000000000000000000000'.toLocaleLowerCase():
      return 'ETH (on Ethereum)';
    case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
      return 'tBNB (on Binance Smart Chain)';
    case '0x64544969ed7ebf5f083679233325356ebe738930'.toLocaleLowerCase():
      return 'USDC (on Binance Smart Chain)';
    case '0x6Ce8da28e2f864420840cf74474eff5fd80e65b8'.toLocaleLowerCase():
      return 'BTCB (on Binance Smart Chain)';
    default:
      return tokenAddress;
  }
};

export const getTokenExplorer = (tokenAddress: string): string => {
  const normalizedAddress = tokenAddress.toLowerCase();
  switch (normalizedAddress) {
      case '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238'.toLocaleLowerCase():
          return 'https://sepolia.etherscan.io/tx';
      case '0x0000000000000000000000000000000000000000e'.toLocaleLowerCase():
          return 'https://sepolia.etherscan.io/tx';
      case '0x0000000000000000000000000000000000000000'.toLocaleLowerCase():
          return 'https://sepolia.etherscan.io/tx';
      case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
          return 'https://testnet.bscscan.com/tx/'
      case '0x64544969ed7ebf5f083679233325356ebe738930'.toLocaleLowerCase():
          return 'https://testnet.bscscan.com/tx/'
      case '0x6ce8da28e2f864420840cf74474eff5fd80e65b8'.toLocaleLowerCase():
          return 'https://testnet.bscscan.com/tx/'
      default:
          return 'https://sepolia.etherscan.io/tx';
  }
};

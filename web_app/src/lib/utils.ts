import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Metadata } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
}

export const formatAddress = (id: string) => {
  if (!id) return '';
  if (id.length <= 7) return id;
  return `${id.slice(0, 9)}.....${id.slice(-9)}`;
};

export const formatAmount = (value: number | string | null | undefined): string => {
  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else {
    // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
    numValue = value as number;
  }

  if (numValue === null || numValue === undefined || isNaN(numValue)) return '0';
  if (numValue === 0) return '0';

  const strValue = numValue.toFixed(10).replace(/\.?0+$/, '');
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
    case 'bin4j-cyaaa-aaaap-qh7tq-cai'.toLocaleLowerCase():
      return 'BIT10.DEFI';
    case 'g37b3-lqaaa-aaaap-qp4hq-cai'.toLocaleLowerCase():
    case '0x2d309c7c5fbbf74372edfc25b10842a7237b92de'.toLocaleLowerCase():
    case 'bity2anuhsbqiklyb7pziepjw2aywiizm287xqxuxe1'.toLocaleLowerCase():
    case '0x2ab6998575efcde422d0a7dbc63e0105bbcaa7c9'.toLocaleLowerCase():
      return 'BIT10.TOP';
    case 'ryjl3-tyaaa-aaaaa-aaaba-cai'.toLocaleLowerCase():
      return 'ICP';
    case 'mxzaz-hqaaa-aaaar-qaada-cai'.toLocaleLowerCase():
      return 'ckBTC';
    case 'ss2fx-dyaaa-aaaar-qacoq-cai'.toLocaleLowerCase():
      return 'ckETH';
    case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
      return 'ETH';
    case 'so11111111111111111111111111111111111111111'.toLocaleLowerCase():
      return 'SOL';
    case 'epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v'.toLocaleLowerCase():
    case '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'.toLocaleLowerCase():
      return 'USDC';
    case '0x0000000000000000000000000000000000000000bnb'.toLocaleLowerCase():
      return 'BNB';
    default:
      return tokenAddress;
  }
};

export const getTokenExplorer = (tokenAddress: string): string => {
  const normalizedAddress = tokenAddress.toLowerCase();

  switch (normalizedAddress) {
    case 'ryjl3-tyaaa-aaaaa-aaaba-cai'.toLocaleLowerCase():
    case 'mxzaz-hqaaa-aaaar-qaada-cai'.toLocaleLowerCase():
    case 'ss2fx-dyaaa-aaaar-qacoq-cai'.toLocaleLowerCase():
    case 'bin4j-cyaaa-aaaap-qh7tq-cai'.toLocaleLowerCase():
    case 'g37b3-lqaaa-aaaap-qp4hq-cai'.toLocaleLowerCase():
      return '/explorer/';

    case '0x0000000000000000000000000000000000000000b'.toLocaleLowerCase():
    case '0x2d309c7c5fbbf74372edfc25b10842a7237b92de'.toLocaleLowerCase():
      return 'https://basescan.org/tx/';

    case 'so11111111111111111111111111111111111111111'.toLocaleLowerCase():
    case 'epjfwdd5aufqssqem2qn1xzybapc8g4weggkzwytdt1v'.toLocaleLowerCase():
    case 'bity2anuhsbqiklyb7pziepjw2aywiizm287xqxuxe1'.toLocaleLowerCase():
      return 'https://explorer.solana.com/tx/';

    case '0x0000000000000000000000000000000000000000bnb'.toLocaleLowerCase():
    case '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d'.toLocaleLowerCase():
    case '0x2ab6998575efcde422d0a7dbc63e0105bbcaa7c9'.toLocaleLowerCase():
      return 'https://bscscan.com/tx/';

    default:
      return '/explorer/';
  }
};

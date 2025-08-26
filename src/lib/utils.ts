import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { type Metadata } from 'next'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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

import { type StaticImageData } from 'next/image';
import USDCImg from '@/assets/tokens/usdc.svg'
import BIT10Img from '@/assets/tokens/bit10.svg';

export const BASE_RPC_URL = 'https://mainnet.base.org';
export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = ' 5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', tokenType: 'ERC20', gasFee: 0, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0xcb9696f280e93764c73d7b83f432de8dadf4b2fa', tokenType: 'ERC20', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0xcb9696f280e93764c73d7b83f432de8dadf4b2fa', tokenType: 'ERC20', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'USDC', value: 'USD Coin', img: USDCImg as StaticImageData, address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913', tokenType: 'ERC20', gasFee: 0, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] }
]

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

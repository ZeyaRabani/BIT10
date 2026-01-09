import { type StaticImageData } from 'next/image';
import ETHImg from '@/assets/tokens/eth.svg';
import BIT10Img from '@/assets/tokens/bit10.svg';

export const BASE_RPC_URL = 'https://mainnet.base.org';
export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = ' 5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'ETH', value: 'Ethereum', img: ETHImg as StaticImageData, address: '0x0000000000000000000000000000000000000000b', tokenType: 'ERC20', gasFee: 0.0001, slug: ['ethereum'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de', tokenType: 'ERC20', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: '0x2d309c7c5fbbf74372edfc25b10842a7237b92de', tokenType: 'ERC20', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'ETH', value: 'Ethereum', img: ETHImg as StaticImageData, address: '0x0000000000000000000000000000000000000000b', tokenType: 'ERC20', gasFee: 0.0001, slug: ['ethereum'] }
]

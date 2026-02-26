import { type StaticImageData } from 'next/image';
import CkUSDCImg from '@/assets/tokens/ckusdc.svg'
import BIT10Img from '@/assets/tokens/bit10.svg';

export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = '5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'ckUSDC', value: 'ckUSDC', img: CkUSDCImg as StaticImageData, address: 'xevnm-gaaaa-aaaar-qafnq-cai', tokenType: 'ICRC', gasFee: 0.01, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] },
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.DEFI', value: 'BIT10.DEFI', img: BIT10Img as StaticImageData, address: 'bin4j-cyaaa-aaaap-qh7tq-cai', tokenType: 'ICRC', gasFee: 0.03, slug: ['defi'] },
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'ckUSDC', value: 'ckUSDC', img: CkUSDCImg as StaticImageData, address: 'xevnm-gaaaa-aaaar-qafnq-cai', tokenType: 'ICRC', gasFee: 0.01, slug: ['usdc', 'stable', 'stable-coin', 'stable coin', 'stablecoin'] },
]

import { type StaticImageData } from 'next/image';
import ICPImg from '@/assets/tokens/icp.svg';
import CkBTCImg from '@/assets/tokens/ckbtc.svg';
import CkETHImg from '@/assets/tokens/cketh.svg';
import BIT10Img from '@/assets/tokens/bit10.svg';

export const ICP_HOST = 'https://icp-api.io';
export const BIT10_EXCHANGE_CANISTER_ID = '6phs7-6yaaa-aaaap-qpvoq-cai';
export const BIT10_REWARDS_CANISTER_ID = '5fll2-liaaa-aaaap-qqlwa-cai';

export const buyPayTokens = [
    { label: 'ICP', value: 'ICP', img: ICPImg as StaticImageData, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', tokenType: 'ICRC', gasFee: 0.0001, slug: ['internet computer'] },
    { label: 'ckBTC', value: 'ckBTC', img: CkBTCImg as StaticImageData, address: 'mxzaz-hqaaa-aaaar-qaada-cai', tokenType: 'ICRC', gasFee: 0.00000001, slug: ['bitcoin'] },
    { label: 'ckETH', value: 'ckETH', img: CkETHImg as StaticImageData, address: 'ss2fx-dyaaa-aaaar-qacoq-cai', tokenType: 'ICRC', gasFee: 0.000002, slug: ['ethereum'] }
]

export const buyReceiveTokens = [
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellTokens = [
    { label: 'BIT10.DEFI', value: 'BIT10.DEFI', img: BIT10Img as StaticImageData, address: 'bin4j-cyaaa-aaaap-qh7tq-cai', tokenType: 'ICRC', gasFee: 0.03, slug: ['defi'] },
    { label: 'BIT10.TOP', value: 'BIT10.TOP', img: BIT10Img as StaticImageData, address: 'g37b3-lqaaa-aaaap-qp4hq-cai', tokenType: 'ICRC', gasFee: 0.001, slug: ['top crypto'] }
]

export const sellReceiveTokens = [
    { label: 'ICP', value: 'ICP', img: ICPImg as StaticImageData, address: 'ryjl3-tyaaa-aaaaa-aaaba-cai', tokenType: 'ICRC', gasFee: 0.0001, slug: ['internet computer'] }
]

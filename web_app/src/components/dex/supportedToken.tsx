import { type StaticImageData } from 'next/image'
import ICPImg from '@/assets/tokens/icp.svg'
import CkUSDCImg from '@/assets/tokens/ckusdc.svg'
import USDCImg from '@/assets/tokens/usdc.svg'
import ETHImg from '@/assets/tokens/eth.svg'
import SOLImg from '@/assets/tokens/sol.svg'
import BNBImg from '@/assets/tokens/bnb.svg'

export const supportedToken = [
    // ICP tokens (ICRC)
    {
        label: 'ICP',
        value: 'ICP',
        img: ICPImg as StaticImageData,
        address: 'ryjl3-tyaaa-aaaaa-aaaba-cai',
        token_id: '8916',
        chain: 'ICP',
        token_type: 'ICRC',
        slug: ['icp']
    },
    {
        label: 'ckUSDC',
        value: 'ckUSDC',
        img: CkUSDCImg as StaticImageData,
        address: 'xevnm-gaaaa-aaaar-qafnq-cai',
        token_id: '3408_8916',
        chain: 'ICP',
        token_type: 'ICRC',
        slug: ['icp', 'usdc']
    },
    // ETH tokens (ERC20)
    {
        token_id: '1027',
        label: 'ETH',
        value: 'Ethereum',
        img: ETHImg as StaticImageData,
        address: '0x0000000000000000000000000000000000000000base',
        chain: 'Base',
        token_type: 'ERC20',
        slug: ['eth', 'base', 'erc20']
    },
    {
        label: 'USDC',
        value: 'USD Coin',
        img: USDCImg as StaticImageData,
        address: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
        token_id: '3408_1027',
        chain: 'Base',
        token_type: 'ERC20',
        slug: ['base', 'usdc', 'stablecoin']
    },
    // SOL tokens (SPL)
    {
        label: 'SOL',
        value: 'Solana',
        img: SOLImg as StaticImageData,
        address: 'So11111111111111111111111111111111111111111',
        token_id: '5426',
        chain: 'Solana',
        token_type: 'SPL',
        slug: ['sol', 'solana']
    },
    {
        label: 'USDC',
        value: 'USD Coin',
        img: USDCImg as StaticImageData,
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        token_id: '3408_5426',
        chain: 'Solana',
        token_type: 'SPL',
        slug: ['solana', 'usdc']
    },
    // BSC tokens (BEP20)
    {
        label: 'BNB',
        value: 'BNB',
        img: BNBImg as StaticImageData,
        address: '0x0000000000000000000000000000000000000000bnb',
        token_id: '1839',
        chain: 'Binance Smart Chain',
        token_type: 'BEP20',
        slug: ['bnb', 'binance']
    },
    {
        label: 'USDC',
        value: 'USD Coin',
        img: USDCImg as StaticImageData,
        address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d ',
        token_id: '3408_1839',
        chain: 'Binance Smart Chain',
        token_type: 'BEP20',
        slug: ['bnb', 'usdc']
    }
]

export const supportedPools = [
    // ICP <-> ICP
    {
        pool_id: '2998n9dml3',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'ckUSDC',
        token_b_chain: 'ICP',
        token_b_token_id: '3408_8916',
        pair_type: 'Same Chain',
    },
    {
        pool_id: 'wq1ntmadx4',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'ETH',
        token_b_chain: 'Base',
        token_b_token_id: '1027',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '8kusm7wsxp',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Base',
        token_b_token_id: '3408_1027',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '3606lhoz4x',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'SOL',
        token_b_chain: 'Solana',
        token_b_token_id: '5426',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: 'jsrp07jpta',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Solana',
        token_b_token_id: '3408_5426',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '32nd91gfq4',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'BNB',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '1839',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: 'yomp1nefsj',
        token_a_symbol: 'ICP',
        token_a_chain: 'ICP',
        token_a_token_id: '8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '3408_1839',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '037cntksm7',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'ETH',
        token_b_chain: 'Base',
        token_b_token_id: '1027',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '7kfye2or11',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Base',
        token_b_token_id: '3408_1027',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: 'uftn6j4djt',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'SOL',
        token_b_chain: 'Solana',
        token_b_token_id: '5426',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '422o3xsuzx',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Solana',
        token_b_token_id: '3408_5426',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: 'ccuhrdww3k',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'BNB',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '1839',
        pair_type: 'Cross Chain',
    },
    {
        pool_id: '4irjsvtjke',
        token_a_symbol: 'ckUSDC',
        token_a_chain: 'ICP',
        token_a_token_id: '3408_8916',
        token_b_symbol: 'USDC',
        token_b_chain: 'Binance Smart Chain',
        token_b_token_id: '3408_1839',
        pair_type: 'Cross Chain',
    }
]

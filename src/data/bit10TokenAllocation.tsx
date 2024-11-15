interface AllocationDataType {
    name: string;
    value: number;
    fill: string;
    address: string;
    totalCollateral: string;
    walletAddress: string;
}

export const bit10Allocation: AllocationDataType[] = [
    { name: 'ICP', value: 16.66, fill: '#ff0066', address: '60a182a......547cc70480', totalCollateral: '13', walletAddress: 'https://dashboard.internetcomputer.org/account/60a182a30efd8324fea20cdc0e97527c07894d68967423b7d1caaf547cc70480' },
    { name: 'STX', value: 16.66, fill: '#ff8c1a', address: '60a182a......547cc70480', totalCollateral: '13', walletAddress: 'https://explorer.hiro.so/address/SP1P4R2AE3DHCFZ46ESYKG1KPDB340ZKMG4WN3E55?chain=mainnet' },
    { name: 'CFX', value: 16.66, fill: '#1a1aff', address: '0x9f9........dbc3fac035', totalCollateral: '13', walletAddress: 'https://evm.confluxscan.io/address/0x9f9019bb3f15f48e93a9dcef56dd56dbc3fac035' },
    { name: 'MAPO', value: 16.66, fill: '#ff1aff', address: '0x0D15.......2735133E79', totalCollateral: '13', walletAddress: 'https://etherscan.io/address/0x0D15F7cad6f5e0AC652FF97aB5e0d92735133E79' },
    { name: 'RIF', value: 16.66, fill: '#3385ff', address: '0x0D15.......2735133E79', totalCollateral: '13', walletAddress: 'https://explorer.rootstock.io/address/0x0d15f7cad6f5e0ac652ff97ab5e0d92735133e79?__tab=tokens' },
    { name: 'SOV', value: 16.66, fill: '#ffa366', address: '0x0D15.......2735133E79', totalCollateral: '13', walletAddress: 'https://etherscan.io/address/0x0D15F7cad6f5e0AC652FF97aB5e0d92735133E79' },
];

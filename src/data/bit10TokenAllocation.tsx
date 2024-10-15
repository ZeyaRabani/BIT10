interface AllocationDataType {
    name: string;
    value: number;
    fill: string;
    address: string;
    totalCollateral: string;
}

export const bit10Allocation: AllocationDataType[] = [
    { name: 'ICP', value: 16.66, fill: '#ff0066', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
    { name: 'STX', value: 16.66, fill: '#ff8c1a', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
    { name: 'CFX', value: 16.66, fill: '#1a1aff', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
    { name: 'MAPO', value: 16.66, fill: '#ff1aff', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
    { name: 'RIF', value: 16.66, fill: '#3385ff', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
    { name: 'SOV', value: 16.66, fill: '#ffa366', address: 'ee4145f960....88978d33d91', totalCollateral: '3.33' },
];

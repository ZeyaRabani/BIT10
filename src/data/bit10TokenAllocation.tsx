interface AllocationDataType {
    name: string;
    value: number;
    fill: string;
    address: string;
    totalCollateral: string;
}

export const bit10Allocation: AllocationDataType[] = [
    { name: 'ICP', value: 16.66, fill: '#ff0066', address: '60a182a......547cc70480', totalCollateral: '33.33' },
    { name: 'STX', value: 16.66, fill: '#ff8c1a', address: '60a182a......547cc70480', totalCollateral: '33.33' },
    { name: 'CFX', value: 16.66, fill: '#1a1aff', address: '60a182a......547cc70480', totalCollateral: '33.33' },
    { name: 'MAPO', value: 16.66, fill: '#ff1aff', address: '60a182a......547cc70480', totalCollateral: '33.33' },
    { name: 'RIF', value: 16.66, fill: '#3385ff', address: '60a182a......547cc70480', totalCollateral: '33.33' },
    { name: 'SOV', value: 16.66, fill: '#ffa366', address: '60a182a......547cc70480', totalCollateral: '33.33' },
];

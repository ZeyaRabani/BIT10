interface VolumeDataType {
    week: string;
    bit10DeFi: number;
}

interface RevenueDataType {
    week: string;
    total: string;
    platformFee: string;
    transferFee: string;
}

export const volume: VolumeDataType[] = [
    {
        week: 'Jun 17, 2024',
        bit10DeFi: 7,
    },
    {
        week: 'Jun 24, 2024',
        bit10DeFi: 9,
    },
    {
        week: 'Jul 01, 2024',
        bit10DeFi: 5,
    },
    {
        week: 'Jul 08, 2024',
        bit10DeFi: 4,
    },
    {
        week: 'Jul 15, 2024',
        bit10DeFi: 5,
    },
    {
        week: 'Jul 22, 2024',
        bit10DeFi: 6,
    },
    {
        week: 'Aug 05, 2024',
        bit10DeFi: 11,
    },
]

export const revenue: RevenueDataType[] = [
    {
        week: 'Jun 17, 2024',
        total: '0.00001017',
        platformFee: '0.00000567',
        transferFee: '0.0000045',
    },
    {
        week: 'Jun 24, 2024',
        total: '0.00001359',
        platformFee: '0.00000729',
        transferFee: '0.0000063',
    },
    {
        week: 'Jul 01, 2024',
        total: '0.00000675',
        platformFee: '0.00000405',
        transferFee: '0.0000027',
    },
    {
        week: 'Jul 08, 2024',
        total: '0.00000504',
        platformFee: '0.00000324',
        transferFee: '0.0000018',
    },
    {
        week: 'Jul 15, 2024',
        total: '0.00000675',
        platformFee: '0.00000405',
        transferFee: '0.0000027',
    },
    {
        week: 'Jul 22, 2024',
        total: '0.00000846',
        platformFee: '0.00000486',
        transferFee: '0.0000036',
    },
    {
        week: 'Aug 05, 2024',
        total: '0.00001701',
        platformFee: '0.00000891',
        transferFee: '0.0000081',
    },
]

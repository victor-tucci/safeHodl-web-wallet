export const coinList: Record<string, { name: string; symbol: string; type: string; decimals: number; address: string }[]> = {
    Sepolia: [
        {
            name: 'Sepolia',
            symbol: 'ETH',
            type: 'COIN',
            decimals: 18,
            address: ''
        },
        {
            name: 'Shibua',
            symbol: 'SHIB',
            type: 'TOKEN',
            decimals: 8,
            address: '0x6dbA02d1A9f8248aCe5fFE63a0d75e98C157a430'
        },
        {
            name: 'Toretto',
            symbol: 'TT',
            type: 'TOKEN',
            decimals: 18,
            address: '0x6aFFb4A3a6cbb5C3c35fabEc497C81ca842b17D6'
        }
    ],
    Amoy: [
        {
            name: 'Amoy',
            symbol: 'MATIC',
            type: 'COIN',
            decimals: 18,
            address: ''
        },
        {
            name: 'Sarvy',
            symbol: 'SAR',
            type: 'TOKEN',
            decimals: 9,
            address: '0xF757Dd3123b69795d43cB6b58556b3c6786eAc13'
        },
        {
            name: 'Ronin',
            symbol: 'RON',
            type: 'TOKEN',
            decimals: 9,
            address: '0x3Fcc9E5f80325dc425C6bB5252B0A9E336d19e61'
        }
    ]
};

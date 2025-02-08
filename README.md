# BIT10

BIT10 is pioneering the concept of the "S&P500 of Bitcoin DeFi assets." It offers users a simplified way to diversify their exposure to DeFi assets by tracking the biggest crypto tokens, ordinals, BRC-20s, and ERC-20s in the DeFi ecosystem.

## 🚀 The Problem

Investing in DeFi requires extensive research, and buying individual tokens often incurs high fees. Many users end up with an unbalanced portfolio, increasing risk and exposing them to poor-performing assets.

## 💡 The Solution

BIT10 provides a pre-selected basket of assets, reducing research time and cost. By buying one token, users invest in a diversified set of assets. With an auto-rebalancing mechanism, BIT10 optimizes portfolio performance by replacing poorly performing tokens with better ones.

## 🌐 Features

- **Diversified Exposure**: Gain exposure to multiple DeFi assets with a single token.
- **Auto-Rebalancing**: Regularly updates asset allocations to optimize performance.
- **Decentralized ETF**: Fully decentralized structure powered by the Internet Computer (ICP).

## 🛠 Tech Stack

- **Frontend**: Next.js, Shadcn/ui, Aceternity UI, motion-primitives
- **Backend**: tRPC, Drizzle, Nodemailer, Dfinity
- **Auth**: NextAuth
- **Data Visualization**: Recharts

## 🔗 ICP Canisters

- Oracle: [fg5vt-paaaa-aaaap-qhhra-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fg5vt-paaaa-aaaap-qhhra-cai)
- BIT10.BTC Faucet: [5wxtf-uqaaa-aaaap-qpvha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5wxtf-uqaaa-aaaap-qpvha-cai)
- BIT10.BTC: [eegan-kqaaa-aaaap-qhmgq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=eegan-kqaaa-aaaap-qhmgq-cai)
- Test BIT10.DEFI: [hbs3g-xyaaa-aaaap-qhmna-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=hbs3g-xyaaa-aaaap-qhmna-cai)
- Test BIT10.BRC20: [uv4pt-4qaaa-aaaap-qpuxa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=uv4pt-4qaaa-aaaap-qpuxa-cai)
- Test BIT10.TOP: [wbckh-zqaaa-aaaap-qpuza-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=wbckh-zqaaa-aaaap-qpuza-cai)
- BIT10.DEFI: [bin4j-cyaaa-aaaap-qh7tq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bin4j-cyaaa-aaaap-qh7tq-cai)
- BIT10.BRC20: [7bi3r-piaaa-aaaap-qpnrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=7bi3r-piaaa-aaaap-qpnrq-cai)
- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)
<!-- - ICP Asset Storage: [yymp3-uaaaa-aaaap-qklqa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yymp3-uaaaa-aaaap-qklqa-cai) -->
<!-- - ERC20 Asset Storage Sepolia Testnet: [zkrig-uqaaa-aaaap-qkmiq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=zkrig-uqaaa-aaaap-qkmiq-cai) -->
<!-- - ERC20 Asset Storage: [2bh6f-siaaa-aaaap-qkmca-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2bh6f-siaaa-aaaap-qkmca-cai) -->
<!-- - BRC20 Asset Storage: [2tbj4-6yaaa-aaaap-qkmba-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2tbj4-6yaaa-aaaap-qkmba-cai) -->
<!-- - OLD ERROR BRC20 Asset Storage: [2xxwk-lyaaa-aaaap-qkl4q-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2xxwk-lyaaa-aaaap-qkl4q-cai) -->

## 🏁 Getting Started

To start using BIT10, follow these steps:

1. **Install Dependencies**:
    ```bash
    npm install
    ```

2. **Run the App**:
    ```bash
    npm run dev
    ```

3. **Access** the app at [http://localhost:3000](http://localhost:3000).

## 📐 Architecture Overview

BIT10 is structured using:

- **Next.js** for the frontend framework.
- **Node.js** for the backend framework.
- **Dfinity** for decentralized canister management.
- **Drizzle ORM** for efficient database interaction.
- **tRPC** for type-safe API routing.

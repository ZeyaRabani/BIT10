# BIT10

BIT10 is pioneering the concept of the "S&P500 of Crypto assets". It offers users a simplified way to diversify their exposure to DeFi assets by tracking the biggest crypto tokens, BRC-20s, and ERC-20s in the DeFi ecosystem.

## 🚀 The Problem

Investing in DeFi requires extensive research, and buying individual tokens often incurs high fees. Many users end up with an unbalanced portfolio, increasing risk and exposing them to poor-performing assets.

## 💡 The Solution

BIT10 provides a pre-selected basket of assets, reducing research time and cost. By buying one token, users invest in a diversified set of assets. With an auto-rebalancing mechanism, BIT10 optimizes portfolio performance by replacing poorly performing tokens with better ones.

## 🌐 Features

- **Diversified Exposure**: Gain exposure to multiple DeFi assets with a single token.
- **Auto-Rebalancing**: Regularly updates asset allocations to optimize performance.
- **Decentralized ETF**: Fully decentralized structure powered by the Internet Computer (ICP).

## 📂 Code Structure

### 🪴 Branches

* **`main`**: Contains code for Mainnet, including Smart Contracts/Canisters.
* **`testnet`**: Contains code for the Testnet version of the website.

### 🌲 Main Branch Folder Structure

* **`asset_storage/`** - Contains canister code for storing different token types:

  * `bsc_asset_storage/` - Stores BNB and BEP20 tokens.
  * `erc20_asset_storage/` - Stores ETH and ERC-20 tokens.
  * `icp_asset_storage/` - Stores ICP tokens.
  * `sui_asset_storage/` - Stores SUI tokens.
  * `trx_asset_storage/` - Stores TRX tokens.

* **`swap/`**

  * `sol_dev/` - Swap logic (buying BIT10 tokens with SOL) on Solana Devnet.

* **`liquidity_hub/`**

  * `icp/`

    * `testnet_liquidity_hub/` - Canister code for the Liquidity Hub on ICP testnet.

* **`oracle/`** - Canister code for price oracle functionality.

* **`server/`** - Lightweight Node.js server for serving data to the web app.

* **`web_app/`** - Contains frontend code for the BIT10 application.


## 🛠 Tech Stack

- **Frontend**: Next.js, Shadcn/ui, Aceternity UI, motion-primitives
- **Backend**: tRPC, Drizzle, Nodemailer, Dfinity
- **Auth**: NextAuth
- **Data Visualization**: Recharts

## 🔗 ICP Canisters

- Oracle: [egcpt-yyaaa-aaaap-qp4ia-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=egcpt-yyaaa-aaaap-qp4ia-cai)
- BIT10.BTC Faucet: [5wxtf-uqaaa-aaaap-qpvha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5wxtf-uqaaa-aaaap-qpvha-cai)
- BIT10 Exchange Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)
- BIT10 Testnet Liquidity Hub: [jskxc-iiaaa-aaaap-qpwrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=jskxc-iiaaa-aaaap-qpwrq-cai)
- BIT10.BTC: [eegan-kqaaa-aaaap-qhmgq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=eegan-kqaaa-aaaap-qhmgq-cai)
- Test BIT10.DEFI: [hbs3g-xyaaa-aaaap-qhmna-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=hbs3g-xyaaa-aaaap-qhmna-cai)
- Test BIT10.BRC20: [uv4pt-4qaaa-aaaap-qpuxa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=uv4pt-4qaaa-aaaap-qpuxa-cai)
- Test BIT10.TOP: [wbckh-zqaaa-aaaap-qpuza-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=wbckh-zqaaa-aaaap-qpuza-cai)
- Test BIT10.MEME: [yeoei-eiaaa-aaaap-qpvzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yeoei-eiaaa-aaaap-qpvzq-cai)
- BIT10.DEFI: [bin4j-cyaaa-aaaap-qh7tq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bin4j-cyaaa-aaaap-qh7tq-cai)
- BIT10.TOP: [g37b3-lqaaa-aaaap-qp4hq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g37b3-lqaaa-aaaap-qp4hq-cai)

- BIT10.TOP Asset storage canister:
  - ETH Asset Storage: [g46hp-giaaa-aaaap-qp4ha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g46hp-giaaa-aaaap-qp4ha-cai)

<!-- - Old Oracle: [fg5vt-paaaa-aaaap-qhhra-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=fg5vt-paaaa-aaaap-qhhra-cai) -->
<!-- - BIT10.BRC20: [7bi3r-piaaa-aaaap-qpnrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=7bi3r-piaaa-aaaap-qpnrq-cai) -->
<!-- - ICP Asset Storage: [yymp3-uaaaa-aaaap-qklqa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yymp3-uaaaa-aaaap-qklqa-cai) -->
<!-- - ERC20 Asset Storage Sepolia Testnet: [zkrig-uqaaa-aaaap-qkmiq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=zkrig-uqaaa-aaaap-qkmiq-cai) -->
<!-- - ERC20 Asset Storage: [2bh6f-siaaa-aaaap-qkmca-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2bh6f-siaaa-aaaap-qkmca-cai) -->
<!-- - BRC20 Asset Storage: [2tbj4-6yaaa-aaaap-qkmba-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2tbj4-6yaaa-aaaap-qkmba-cai) -->
<!-- - OLD ERROR BRC20 Asset Storage: [2xxwk-lyaaa-aaaap-qkl4q-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=2xxwk-lyaaa-aaaap-qkl4q-cai) -->

## 🔗 Solana Programs & SPL Tokens

### Devnet

- BIT10 Exchange Canister: [DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s](https://solana.fm/address/DKEKk7aLibx28g6DVMZXk3MinED489KRHfoM3wnnrd2s?cluster=devnet-solana)
- Test BIT10.DEFI: [5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K](https://solana.fm/address/5bzHsBmXwX3U6yqKH8uoFgHrUNyoNJvMuAajsBbsHt5K?cluster=devnet-solana)

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

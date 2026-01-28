## BIT10 

BIT10 pioneers the concept of an "S&P 500 for crypto assets." It provides users with a streamlined way to diversify their exposure to DeFi assets by tracking major crypto tokens. BIT10 is an All-In-One Decentralized Cross-Chain Asset Manager. Starting with index funds, then to DEX's and then lending. All Cross-Chain!!!

## 🖥️ Presentation 

Presentation
We created a playlist for all the videos created since the beginning of the World Computer Hacker League. All of the Videos are labelled "WCHL" then the round that video applies to E.g Regional or National and then what that video shows. These videos give a great overview of everything we did in this 4 month long hackathon.

https://www.youtube.com/playlist?list=PL7T2qlbuVFZ4I4APrZC15sbAUvQv65fIQ

### Extra instructions on how to use the entire system and FAQ's are in the Part 3 of the Gitbook.

- [gitbook.bit10.app](https://gitbook.bit10.app)

## 🚀 The Problem

Investing in DeFi is often complex, requiring extensive research. Buying individual tokens can be costly and inefficient, and most users end up with unbalanced portfolios that increase risk and expose them to underperforming assets.

## 💡 The Solution

BIT10 offers a pre-selected, diversified basket of assets, significantly reducing research time and transaction costs. Users can gain diversified exposure by purchasing a single token. With auto-rebalancing, BIT10 continuously optimizes portfolio performance by replacing underperforming assets with stronger performers.

## 🌐 Features

- **Diversified Exposure**: Gain exposure to multiple DeFi assets with a single token.
- **Auto-Rebalancing**: Regularly updates asset allocations to optimize performance.
- **Decentralized ETF**: Fully decentralized structure powered by the Internet Computer (ICP).

<!-- ## Code Rules

- The Line Charts should have these `tickMargin={8}` and for YAxis `tickCount={6}`
- Image size: **110 × 110**, gap size: **80 × 80**.
- While optimizing, rename functions with relevant and meaningful names.
- All addresses (token address, token name, or user wallet address) must be in lowercase.
- For **framer-motion** animations, always add:
  `viewport={{ once: true }}`
- Types and interfaces must:

  - End with a semicolon (`;`)
  - Be defined for all cases (including the last one)
  - Use commas (`,`) to separate variables
- Use double quotes (`"`) **only** for `"use client"` or `"use server"`, and always end them with a semicolon.
- Use single quotes (`'`) for imports and all other strings.
- End all import statements with semicolons.
- If an `if` statement contains more than two lines, return directly without wrapping it in parentheses.
- For `div`, `span`, or similar elements, if props or content are long, move them to the next line.
- Use `rounded-2xl` consistently for border radius.
- When using icons from `lucide-react`, import them as `X as XIcon` (always append `Icon`).
- Use `cn` from `@/lib/utils` wherever required.
- For form submission, use:

  ```ts
  async function onSubmit(data: z.infer<typeof FormSchema>) {
  ```
- If a `div` has no content, self-close it: `<div />`.
- Use `useCallback` for query functions.
- Use `useMemo` with `UseQueryOptions` for queries, and also use `useMemo` for query responses.

## Project Structure

- Folder names must use **kebab-case**.
- File names must use **PascalCase**.

### Folder Responsibilities

- **assets**: Images and icons (SVG/TSX format).
- **components**: Generic and reusable UI components.
- **config**: Configuration files and ABIs.
- **context**: Global application context.
- **hooks**: Generic reusable hooks.
- **layouts**: Layouts for different pages.
- **locales**: Translation-related files (JSON or JS).
- **types**: Types, models, interfaces, DTOs, etc.
- **utils**: Generic utility functions.

## Naming Conventions

- **Chains**: Contains all chain-specific logic, including transactions and balances.
- **Components**: Use PascalCase for component names and filenames.
- **Hooks**: Use camelCase for hooks and their filenames.
- **Files**: Use camelCase for filenames.
- **Variables**: Use camelCase.
- **Types & Interfaces**: Use PascalCase. -->

## 📂 Code Structure

### 🪴 Branches

* **`main`**: Contains code for Mainnet, including Smart Contracts/Canisters.
* **`testnet`**: Contains code for the Testnet version of the website.

### 🌲 Main Branch Folder Structure

⚠️ Steps to run the canister and the related architecture diagrams are present in their respective folders.

- **`icp_canisters/`** - Contains all the canisters on the ICP canister.

  - **`asset_storage/`** - Contains canister code for storing different token types:
    - `bsc_asset_storage/` - Stores BNB and BEP20 tokens.
    - `eth_asset_storage/` - Stores ETH and ERC-20 tokens.
    - `icp_asset_storage/` - Stores ICP tokens.
    - `sui_asset_storage/` - Stores SUI tokens.
    - `trx_asset_storage/` - Stores TRX tokens.

  - **`buy_bit10/`** - Swap logic for buying and selling BIT10 tokens on the ICP canister.
    - `testnet_buy_bit10/` - Canister code for buying Test BIT10 across different chains on the ICP canister.
    - `mainnet_buy_bit10/` - Canister code for buying BIT10 across different chains on the ICP canister.
  
  - **`ai_portfolio_manager/`** - AI Portfolio Manager canister running on the ICP canister.
  
  - **`dex/`** - DEX swap logic for same-chain and cross-chain token swaps on the ICP canister.
    - `dex/` - Canister code for the DEX Mainnet.0
    - `testnet_dex_router/` - Canister code for the DEX router.
    - `testnet_dex_eth_asset_storage/` - Canister code for swapping tokens on Ethereum.
    - `testnet_dex_bsc_asset_storage/` - Canister code for swapping token on BSC.
    - `testnet_dex_bsc_eth_asset_storage/` - Canister code for swapping token between BSC and Ethereum.

  - **`lending_and_borrowing/`**
    - `testnet_lending_and_borrowing/` - Canister code for the Cross-Chain Lending and Borrowing on the ICP canister.

  - **`liquidity_hub/`**
    - `testnet_liquidity_hub/` - Canister code for the Liquidity Hub on ICP testnet.

- **`sol_smart_contracts/`**
  - `buy_bit10/` - Swap logic (buying BIT10 tokens with SOL) on Solana Devnet.

- **`server/`** - Lightweight Node.js server for serving data to the web app.

- **`web_app/`** - Contains frontend code for the BIT10 application.

## 🛠 Tech Stack

- **Frontend**: Next.js, Shadcn/ui, Aceternity UI, motion-primitives
- **Backend**: tRPC, Drizzle, Nodemailer, Dfinity
- **Auth**: NextAuth
- **Data Visualization**: Recharts

## 🔗 ICP Canisters

<!-- - BIT10 Mainnet Frontend: [https://xutyq-wyaaa-aaaap-qqgca-cai.icp0.io](https://xutyq-wyaaa-aaaap-qqgca-cai.icp0.io) -->
<!-- - BIT10 Testnet Frontend: [https://hyti5-7iaaa-aaaap-qp4ba-cai.icp0.io](https://hyti5-7iaaa-aaaap-qp4ba-cai.icp0.io) -->
- Oracle: [egcpt-yyaaa-aaaap-qp4ia-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=egcpt-yyaaa-aaaap-qp4ia-cai)
- AI Portfolio Manager: [anic3-viaaa-aaaap-qqcaq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=anic3-viaaa-aaaap-qqcaq-cai)
- BIT10.BTC Faucet: [5wxtf-uqaaa-aaaap-qpvha-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5wxtf-uqaaa-aaaap-qpvha-cai)
- BIT10 Buy Canister: [6phs7-6yaaa-aaaap-qpvoq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=6phs7-6yaaa-aaaap-qpvoq-cai)
- BIT10 DEX Canister: [bwwo2-dqaaa-aaaap-qqfzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bwwo2-dqaaa-aaaap-qqfzq-cai)
- BIT10 Rewards Canister: [5fll2-liaaa-aaaap-qqlwa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=5fll2-liaaa-aaaap-qqlwa-cai)
- BIT10 Testnet Buy Canister: [feujt-7iaaa-aaaap-qqc4q-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=feujt-7iaaa-aaaap-qqc4q-cai)
- BIT10 Testnet Liquidity Hub: [jskxc-iiaaa-aaaap-qpwrq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=jskxc-iiaaa-aaaap-qpwrq-cai)
- BIT10 Testnet DEX: [t2vfi-5aaaa-aaaap-qqbfa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=t2vfi-5aaaa-aaaap-qqbfa-cai)
- BIT10 Testnet Cross-Chain Lending and Borrowing: [dp57e-fyaaa-aaaap-qqclq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=dp57e-fyaaa-aaaap-qqclq-cai)
- BIT10.BTC: [eegan-kqaaa-aaaap-qhmgq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=eegan-kqaaa-aaaap-qhmgq-cai)
- Test BIT10.DEFI: [hbs3g-xyaaa-aaaap-qhmna-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=hbs3g-xyaaa-aaaap-qhmna-cai)
- Test BIT10.BRC20: [uv4pt-4qaaa-aaaap-qpuxa-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=uv4pt-4qaaa-aaaap-qpuxa-cai)
- Test BIT10.TOP (ICP): [wbckh-zqaaa-aaaap-qpuza-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=wbckh-zqaaa-aaaap-qpuza-cai)
- Test BIT10.TOP (Ethereum): [0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D](https://sepolia.etherscan.io/token/0x00Cb097146a5D2b1C0dFeff3A5E3b2c21Fb2864D)
- Test BIT10.TOP (Base): [0xc909eb26f417e24033497b1eca64a0f301d0a76f](https://sepolia.basescan.org/token/0xc909eb26f417e24033497b1eca64a0f301d0a76f)
- Test BIT10.TOP (Solana): [tbitwRkPcYmgaVZHBJKR5R1wNTTUuY13Az7DfS45GLW](https://explorer.solana.com/address/tbitwRkPcYmgaVZHBJKR5R1wNTTUuY13Az7DfS45GLW?cluster=devnet)
- Test BIT10.TOP (BSC): [0x9bc53ffdf8eec85e213fddc380b67c1bcea2b0d9](https://testnet.bscscan.com/address/0x9bc53ffdf8eec85e213fddc380b67c1bcea2b0d9)
- Test BIT10.MEME: [yeoei-eiaaa-aaaap-qpvzq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=yeoei-eiaaa-aaaap-qpvzq-cai)
- BIT10.DEFI: [bin4j-cyaaa-aaaap-qh7tq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=bin4j-cyaaa-aaaap-qh7tq-cai)
- BIT10.TOP: [g37b3-lqaaa-aaaap-qp4hq-cai](https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=g37b3-lqaaa-aaaap-qp4hq-cai)
- BIT10.TOP (Base): [0x2d309c7c5fbbf74372edfc25b10842a7237b92de](https://basescan.org/token/0x2d309c7c5fbbf74372edfc25b10842a7237b92de)
- BIT10.TOP (Solana): [bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1](https://explorer.solana.com/address/bity2aNuHSbQiKLYB7PziepJw2aYwiiZM287XQxuXE1)
- BIT10.TOP (Binance Smart Chain): [0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9](https://bscscan.com/token/0x2ab6998575EFcDe422D0A7dbc63e0105BbcAA7c9)

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

1. **Navigate to web_app**:
    ```bash
    cd web_app
    ```

2. **Install Dependencies**:
    ```bash
    npm install
    ```

3. **Run the App**:
    ```bash
    npm run dev
    ```

3. **Access** the app at [http://localhost:3000](http://localhost:3000).

## 📐 Architecture Overview

BIT10 is structured using:

- **Next.js** for the frontend framework.
- **Node.js** for the backend framework.
- **Rust** for the ICP Canisters
- **Dfinity** for decentralized canister management.
- **Drizzle ORM** for efficient database interaction.
- **tRPC** for type-safe API routing .

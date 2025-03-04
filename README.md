# Hyperliquid NFT Mint UI

A simple user interface for minting NFTs on Hyperliquid EVM.

## Features

- Web3 wallet integration (MetaMask, etc.)
- NFT minting operations
- View contract information
- Responsive design

## Getting Started

### Requirements

- Node.js
- npm or yarn
- Web3 compatible browser and wallet (MetaMask recommended)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

or for production:

```bash
npm start
```

3. Navigate to `http://localhost:3000` in your browser.

## Big Blocks Mode

For deploying large contracts or performing complex operations, you may need to enable Big Blocks (Slow Blocks) mode:

```bash
# Enable Big Blocks mode with Python:
npm run enable-big-blocks-py

# Disable Big Blocks mode with Python:
npm run disable-big-blocks-py

# Enable Big Blocks mode with JavaScript:
npm run enable-big-blocks
```

## Contract Deployment

To deploy a new SingleImageNFT contract:

```bash
npm run deploy
```

## NFT Contract Address

Current deployed NFT contract address: `0x91E8910B710aE0f4C82B0DDEda8DB87B5600cA63`

## Hyperliquid EVM Information

- Chain ID: 999
- RPC URL: https://rpc.hyperliquid.xyz/evm
- Explorer: https://hyperliquid.cloud.blockscout.com
- Native Token: HYPE

## License

MIT

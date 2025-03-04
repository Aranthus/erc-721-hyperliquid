# Hyperliquid NFT Mint UI

Hyperliquid EVM'de NFT mint etmek için basit bir kullanıcı arayüzü.

## Özellikler

- Web3 cüzdan entegrasyonu (MetaMask, vb.)
- NFT mint etme işlemleri
- Kontrat bilgilerini görüntüleme
- Responsive tasarım

## Başlarken

### Gereksinimler

- Node.js
- npm veya yarn
- Web3 uyumlu tarayıcı ve cüzdan (MetaMask önerilir)

### Kurulum

1. Bağımlılıkları yükleyin:

```bash
npm install
```

2. Development sunucusunu başlatın:

```bash
npm run dev
```

veya production için:

```bash
npm start
```

3. Tarayıcınızda `http://localhost:3000` adresine gidin.

## Big Blocks Modu

Büyük kontratları deploy etmek veya kompleks işlemler yapmak için Big Blocks (Slow Blocks) modunu etkinleştirmeniz gerekebilir:

```bash
# Python ile Big Blocks modunu etkinleştirmek için:
npm run enable-big-blocks-py

# Python ile Big Blocks modunu devre dışı bırakmak için:
npm run disable-big-blocks-py

# JavaScript ile Big Blocks modunu etkinleştirmek için:
npm run enable-big-blocks
```

## Kontrat Deployment

Yeni bir SingleImageNFT kontratı deploy etmek için:

```bash
npm run deploy
```

## NFT Kontrat Adresi

Mevcut deploy edilen NFT kontrat adresi: `0x91E8910B710aE0f4C82B0DDEda8DB87B5600cA63`

## Hyperliquid EVM Bilgileri

- Chain ID: 999
- RPC URL: https://rpc.hyperliquid.xyz/evm
- Explorer: https://explorer.hyperliquid.xyz/evm
- Native Token: HYPE

## Lisans

MIT

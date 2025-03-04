const fetch = require('node-fetch');
const { createHash } = require('crypto');
const ethers = require('ethers');
const dotenv = require('dotenv');

// .env.nft dosyasını yükle
dotenv.config({ path: '.env.nft' });

// Hyperliquid API URL
const apiUrl = process.env.API_URL || 'https://api.hyperliquid.xyz';
const apiWalletName = process.env.API_WALLET_NAME || 'app.hyperliquid.xyz';
const apiWalletAddress = process.env.API_WALLET_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const eip1193URL = process.env.RPC_URL || 'https://rpc.hyperliquid.xyz/evm';

// Private key ile bir wallet oluştur
const wallet = new ethers.Wallet(`0x${privateKey}`);

/**
 * Slow Blocks modunu etkinleştir
 */
async function enableBigBlocks() {
  try {
    console.log('Slow Blocks (Big Blocks) modu etkinleştiriliyor...');
    
    // Doğrudan RPC isteği deneyelim
    const response = await fetch(eip1193URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_sendTransaction',
        params: [{
          from: wallet.address,
          to: "0x0000000000000000000000000000000000000001", // Precompile address for L1Actions
          data: ethers.AbiCoder.defaultAbiCoder().encode(
            ["tuple(string, bool)"],
            [["evmUserModify", true]]
          )
        }]
      }),
    });
    
    const result = await response.json();
    console.log('RPC yanıtı:', result);
    
    if (result.error) {
      console.error('Hata:', result.error.message);
    } else {
      console.log('Slow Blocks modu etkinleştirme işlemi gönderildi!');
      console.log('İşlem Hash:', result.result);
    }
    
  } catch (error) {
    console.error('Hata:', error.message);
    
    // Alternatif yöntem deniyoruz
    try {
      console.log('\nAlternatif yöntem deneniyor...');
      
      // Web3 kullanarak
      const Web3 = require('web3');
      const web3 = new Web3(eip1193URL);
      
      // Private key ile hesap oluştur
      const account = web3.eth.accounts.privateKeyToAccount(`0x${privateKey}`);
      web3.eth.accounts.wallet.add(account);
      
      // L1 eylemi için özel data
      const data = web3.eth.abi.encodeParameters(
        ['string', 'bool'],
        ['evmUserModify', true]
      );
      
      // İşlem gönder
      const tx = await web3.eth.sendTransaction({
        from: account.address,
        to: "0x0000000000000000000000000000000000000001", // L1Action precompile address
        data: data,
        gas: 500000
      });
      
      console.log('İşlem başarılı!', tx.transactionHash);
      
    } catch (altError) {
      console.error('Alternatif yöntem hatası:', altError.message);
      console.log('\nLütfen Hyperliquid UI\'dan Big Blocks modunu manuel olarak etkinleştirin:');
      console.log('1. https://app.hyperliquid.xyz/ adresine gidin');
      console.log('2. Cüzdanınızı bağlayın');
      console.log('3. Ayarlar bölümünden "Enable Big Blocks" seçeneğini bulun');
    }
  }
}

// Slow Blocks modunu etkinleştir
enableBigBlocks();

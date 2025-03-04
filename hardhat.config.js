require("@nomicfoundation/hardhat-ethers");
const { HyperliquidSDK } = require("@ambitlabs/hyperliquid-sdk");
const { ethers } = require("ethers");
const dotenv = require("dotenv");

// .env.nft dosyasından çevre değişkenlerini yükle
dotenv.config({ path: '.env.nft' });

const privateKey = process.env.PRIVATE_KEY || '';

/**
npx hardhat changeBigBlocks --network hyperliquid_mainnet
*/

task("changeBigBlocks", "Changes usingBigBlocks value of your account")
  .setAction(async (taskArgs) => {

    const provider = new ethers.JsonRpcProvider("https://api.hyperliquid.xyz/evm", 999, {
      staticNetwork: true,
      batchMaxCount: 1,
    });
    
    const wallet = new ethers.Wallet(privateKey, provider);
    console.log('Address: '+wallet.address)
    
    const sdk = new HyperliquidSDK("mainnet", { signer: wallet, signatureChainId: 999 });
    
    // Doğru metod adını bulalım
    console.log('SDK metotları:');
    for (const method in sdk) {
      if (typeof sdk[method] === 'function') {
        console.log(` - ${method}`);
      }
    }
    
    // Daha sonra bu bölümü doğru metod adıyla güncelleyeceğiz
    try {
      // await sdk.evmUserModify(true);
      console.log('Metodu bulduktan sonra bu satırı güncelleyeceğiz.');
    } catch (error) {
      console.error('Hata:', error.message);
    }
    
  });


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.20",
  networks: {
    hyperliquid_testnet: {
      chainId: 998,
      url: `https://api.hyperliquid-testnet.xyz/evm`,
      accounts: [privateKey],
    },
    hyperliquid_mainnet: {
      chainId: 999,
      url: `https://api.hyperliquid.xyz/evm`,
      accounts: [privateKey],
    },
  },
};

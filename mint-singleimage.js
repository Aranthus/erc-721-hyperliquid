const Web3 = require('web3').Web3;
const fs = require('fs');
require('dotenv').config({ path: '.env.nft' });

// Configuration
const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
const privateKey = process.env.PRIVATE_KEY;
const mintAmount = process.argv[2] || 1; // Default mint 1 NFT

async function mintNFT() {
  try {
    // Load contract info
    const deploymentInfoFile = 'deployment-info.json';
    if (!fs.existsSync(deploymentInfoFile)) {
      console.error('Contract deployment info not found. Please deploy the contract first.');
      process.exit(1);
    }
    
    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentInfoFile, 'utf8'));
    const contractAddress = deploymentInfo.address;
    const abi = deploymentInfo.abi;
    
    // Web3 connection
    const web3 = new Web3(rpcUrl);
    
    // Create wallet
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    web3.eth.accounts.wallet.add(account);
    web3.eth.defaultAccount = account.address;
    
    console.log(`Wallet address: ${account.address}`);
    
    // Contract instance
    const nftContract = new web3.eth.Contract(abi, contractAddress);
    
    // Check if sales are open
    const isPublicSaleOpen = await nftContract.methods.isPublicSaleOpen().call();
    if (!isPublicSaleOpen) {
      console.log('Public sale is not open. Opening public sale...');
      await nftContract.methods.setPublicSaleOpen(true).send({
        from: account.address,
        gas: 200000
      });
      console.log('Public sale opened!');
    }
    
    // Check available supply
    const availableSupply = await nftContract.methods.availableSupply().call();
    console.log(`Available supply: ${availableSupply}`);
    
    if (parseInt(availableSupply) < parseInt(mintAmount)) {
      console.error(`Not enough tokens available. Only ${availableSupply} tokens left.`);
      process.exit(1);
    }
    
    // Get token price
    const pricePerToken = await nftContract.methods.PRICE_IN_WEI_PUBLIC().call();
    const totalCost = BigInt(pricePerToken) * BigInt(mintAmount);
    
    console.log(`Minting ${mintAmount} tokens for ${web3.utils.fromWei(totalCost.toString(), 'ether')} ETH...`);
    
    // Mint tokens
    const gasEstimate = await nftContract.methods.publicMint(mintAmount).estimateGas({
      from: account.address,
      value: totalCost.toString()
    });
    
    const mintTx = await nftContract.methods.publicMint(mintAmount).send({
      from: account.address,
      gas: Math.round(gasEstimate * 1.2),
      value: totalCost.toString()
    });
    
    console.log(`Minted ${mintAmount} tokens successfully!`);
    console.log(`Transaction hash: ${mintTx.transactionHash}`);
    
    // Get current balance
    const balance = await nftContract.methods.balanceOf(account.address).call();
    console.log(`You now own ${balance} tokens.`);
    
    // Get token URIs
    console.log('Token URI:', await nftContract.methods.tokenURI(0).call());
  } catch (error) {
    console.error('Minting error:', error);
  }
}

// Start minting process
mintNFT()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

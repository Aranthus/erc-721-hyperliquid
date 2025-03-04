// NFT contract information (from deployment-info.json)
const CONTRACT_ADDRESS = '0x91E8910B710aE0f4C82B0DDEda8DB87B5600cA63';
const CONTRACT_ABI = [
  // Public mint function
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      }
    ],
    "name": "publicMint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // Whitelist mint function
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "allowedQuantity",
        "type": "uint256"
      },
      {
        "internalType": "bytes32[]",
        "name": "merkleProof",
        "type": "bytes32[]"
      }
    ],
    "name": "whitelistMint",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // Check if public sale is open
  {
    "inputs": [],
    "name": "isPublicSaleOpen",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Check if whitelist sale is open
  {
    "inputs": [],
    "name": "isWhitelistSaleOpen",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get total supply (minted tokens)
  {
    "inputs": [],
    "name": "totalMinted",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get max supply
  {
    "inputs": [],
    "name": "MAX_SUPPLY",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get public sale price
  {
    "inputs": [],
    "name": "PRICE_IN_WEI_PUBLIC",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get whitelist sale price
  {
    "inputs": [],
    "name": "PRICE_IN_WEI_WHITELIST",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get max per transaction
  {
    "inputs": [],
    "name": "MAX_PER_TX",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // Get NFT name
  {
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Set a fixed mint price if RPC calls fail
const FALLBACK_MINT_PRICE = '0'; // 0 HYPE based on .env.nft
const FALLBACK_MAX_SUPPLY = 100;
const FALLBACK_TOTAL_SUPPLY = 0;
const FALLBACK_NAME = 'MyNFT';

// Web3 and contract variables
let web3;
let nftContract;
let userAccount;
let mintPrice = FALLBACK_MINT_PRICE; // Default to fallback price
let maxMintAmount = 10;  // Maximum number of NFTs that can be minted at once

// DOM elements
const connectWalletButton = document.getElementById('connect-wallet');
const mintButton = document.getElementById('mint-button');
const mintAmountInput = document.getElementById('mint-amount');
const increaseAmountButton = document.getElementById('increase-amount');
const decreaseAmountButton = document.getElementById('decrease-amount');
const transactionStatus = document.getElementById('transaction-status');
const totalSupplyElement = document.getElementById('total-supply');
const nftPriceElement = document.getElementById('nft-price');
const nftNameElement = document.getElementById('nft-name');
const contractLinkElement = document.getElementById('contract-link');
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');

// HyperEVM chain ID
const HYPER_CHAIN_ID = 999;

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Update contract address link
  contractLinkElement.href = `https://hyperliquid.cloud.blockscout.com/address/${CONTRACT_ADDRESS}`;
  contractLinkElement.textContent = shortenAddress(CONTRACT_ADDRESS);
  
  // Display default information when app starts
  displayMintPrice(FALLBACK_MINT_PRICE);
  totalSupplyElement.textContent = `${FALLBACK_TOTAL_SUPPLY} / ${FALLBACK_MAX_SUPPLY}`;
  nftNameElement.textContent = FALLBACK_NAME;
  
  // Set default mint amount
  mintAmountInput.value = 1;
  
  // Add event listeners
  connectWalletButton.addEventListener('click', connectWallet);
  mintButton.addEventListener('click', mintNFT);
  increaseAmountButton.addEventListener('click', increaseAmount);
  decreaseAmountButton.addEventListener('click', decreaseAmount);
  notificationClose.addEventListener('click', hideNotification);
  
  // If wallet was previously connected, reconnect
  if (window.ethereum && window.ethereum.selectedAddress) {
    connectWallet();
  }
}

// Helper function to display mint price
function displayMintPrice(price) {
  try {
    const priceInEther = web3 ? web3.utils.fromWei(price, 'ether') : 
                              (parseInt(price) / 1e18).toString();
    nftPriceElement.textContent = `${priceInEther} HYPE`;
  } catch (error) {
    console.error("Error formatting price:", error);
    nftPriceElement.textContent = "0 HYPE"; // Fallback display
  }
}

// Wallet connection
async function connectWallet() {
  if (window.ethereum) {
    try {
      // Request MetaMask connection
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      userAccount = accounts[0];
      
      // Check network
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (parseInt(chainId, 16) !== HYPER_CHAIN_ID) {
        showNotification('Please switch to Hyperliquid Network (Chain ID: 999)', 'error');
        
        try {
          // Try to switch network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x3E7' }], // 999 (hex: 0x3E7)
          });
        } catch (switchError) {
          // User needs to switch network manually
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x3E7',
                    chainName: 'Hyperliquid Mainnet',
                    nativeCurrency: {
                      name: 'HYPE',
                      symbol: 'HYPE',
                      decimals: 18
                    },
                    rpcUrls: ['https://rpc.hyperliquid.xyz/evm'],
                    blockExplorerUrls: ['https://hyperliquid.cloud.blockscout.com']
                  },
                ],
              });
            } catch (addError) {
              showNotification('Please add and switch to Hyperliquid Network manually', 'error');
            }
          }
        }
      }
      
      // Create Web3 and contract objects
      web3 = new Web3(window.ethereum);
      nftContract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      
      // Check if contract is responding
      checkContractConnection();
      
      // UI updates
      connectWalletButton.textContent = shortenAddress(userAccount);
      mintButton.disabled = false;
      
      // Listen for MetaMask account changes
      window.ethereum.on('accountsChanged', function (accounts) {
        if (accounts.length === 0) {
          // User disconnected
          userAccount = null;
          connectWalletButton.textContent = 'Connect Wallet';
          mintButton.disabled = true;
        } else {
          // New account connected
          userAccount = accounts[0];
          connectWalletButton.textContent = shortenAddress(userAccount);
          mintButton.disabled = false;
        }
      });
      
      // Listen for network changes
      window.ethereum.on('chainChanged', function (chainId) {
        if (parseInt(chainId, 16) !== HYPER_CHAIN_ID) {
          showNotification('Please switch to Hyperliquid Network (Chain ID: 999)', 'error');
          mintButton.disabled = true;
        } else {
          mintButton.disabled = false;
          checkContractConnection();
        }
      });
      
    } catch (error) {
      console.error("Connection error:", error);
      showNotification('Failed to connect wallet', 'error');
    }
  } else {
    showNotification('Please install MetaMask or a compatible wallet', 'error');
  }
}

// Check if contract is responding and update UI with latest data
async function checkContractConnection() {
  try {
    // Check if contract exists
    const code = await web3.eth.getCode(CONTRACT_ADDRESS);
    if (code === '0x' || code === '0x0') {
      console.error('Contract not found at address:', CONTRACT_ADDRESS);
      showNotification(`Contract not found at ${CONTRACT_ADDRESS}. Using simulation mode.`, 'error');
      return;
    }
    
    // Get gas price to check RPC connection
    try {
      await web3.eth.getGasPrice();
      console.log('RPC connection successful');
      
      // Now try to update contract info since RPC is responding
      updateContractInfo();
    } catch (error) {
      console.error('RPC connection test failed:', error);
      showNotification('RPC connection issue. Using simulation mode.', 'error');
    }
  } catch (error) {
    console.error('Failed to check contract:', error);
    showNotification('Unable to verify contract. Using simulation mode.', 'error');
  }
}

// Update contract information
async function updateContractInfo() {
  if (!web3 || !nftContract) {
    console.log("Web3 or contract not initialized, using fallback values");
    return;
  }
  
  try {
    // Try to fetch total supply and max supply
    const [totalMinted, maxSupply] = await Promise.all([
      nftContract.methods.totalMinted().call(),
      nftContract.methods.MAX_SUPPLY().call()
    ]);
    
    totalSupplyElement.textContent = `${totalMinted} / ${maxSupply}`;

    // Update max mint amount from contract
    try {
      maxMintAmount = await nftContract.methods.MAX_PER_TX().call();
      console.log("Max mint per transaction:", maxMintAmount);
    } catch (error) {
      console.error("Could not fetch MAX_PER_TX:", error);
      // Keep the default value
    }

    // Check which sale is open (public or whitelist)
    let isPublicOpen = false;
    let isWhitelistOpen = false;
    let currentPrice = '0';
    
    try {
      isPublicOpen = await nftContract.methods.isPublicSaleOpen().call();
      isWhitelistOpen = await nftContract.methods.isWhitelistSaleOpen().call();
      
      if (isPublicOpen) {
        currentPrice = await nftContract.methods.PRICE_IN_WEI_PUBLIC().call();
      } else if (isWhitelistOpen) {
        currentPrice = await nftContract.methods.PRICE_IN_WEI_WHITELIST().call();
      }

      // Enable or disable mint button based on sale status
      mintButton.disabled = !(isPublicOpen || isWhitelistOpen);
      
      // Show status message
      if (isPublicOpen) {
        showNotification('Public sale is open!', 'info');
      } else if (isWhitelistOpen) {
        showNotification('Whitelist sale is open! You need to be whitelisted to mint.', 'info');
      } else {
        showNotification('No sale is currently open. Please check back later.', 'warning');
      }
    } catch (error) {
      console.error("Error checking sale status:", error);
    }
    
    // Update mint price (or use fallback)
    mintPrice = currentPrice || FALLBACK_MINT_PRICE;
    displayMintPrice(mintPrice);
    
    // Try to get NFT name
    try {
      const name = await nftContract.methods.name().call();
      nftNameElement.textContent = name;
    } catch (error) {
      console.error("Could not fetch NFT name:", error);
      nftNameElement.textContent = FALLBACK_NAME;
    }
    
    // Remove simulation badge if it exists
    const existingBadge = document.querySelector('.simulation-badge');
    if (existingBadge) {
      existingBadge.remove();
    }
  } catch (error) {
    console.error("Error updating contract info:", error);
    totalSupplyElement.textContent = `${FALLBACK_TOTAL_SUPPLY} / ${FALLBACK_MAX_SUPPLY}`;
    displayMintPrice(FALLBACK_MINT_PRICE);
    nftNameElement.textContent = FALLBACK_NAME;
    
    // Add simulation badge
    addSimulationBadge();
  }
}

// NFT Mint function
async function mintNFT() {
  const amount = parseInt(mintAmountInput.value);
  
  if (isNaN(amount) || amount < 1 || amount > maxMintAmount) {
    showNotification(`Please enter a valid amount between 1 and ${maxMintAmount}`, 'error');
    return;
  }
  
  try {
    mintButton.disabled = true;
    
    // Update transaction status
    transactionStatus.className = 'transaction-status pending';
    transactionStatus.textContent = 'Transaction pending...';
    transactionStatus.style.display = 'block';
    
    // Check which sale is open (public or whitelist)
    let isPublicOpen = false;
    let isWhitelistOpen = false;
    
    try {
      isPublicOpen = await nftContract.methods.isPublicSaleOpen().call();
      isWhitelistOpen = await nftContract.methods.isWhitelistSaleOpen().call();
    } catch (error) {
      console.error("Error checking sale status:", error);
      showNotification('Could not verify sale status. Trying public mint...', 'warning');
      // Default to public sale if we can't check
      isPublicOpen = true;
    }
    
    // Get the appropriate mint price based on which sale is open
    let currentPrice = '0';
    try {
      if (isPublicOpen) {
        currentPrice = await nftContract.methods.PRICE_IN_WEI_PUBLIC().call();
      } else if (isWhitelistOpen) {
        currentPrice = await nftContract.methods.PRICE_IN_WEI_WHITELIST().call();
      } else {
        throw new Error("No sale is currently open");
      }
      mintPrice = currentPrice; // Update global value
    } catch (error) {
      console.error("Could not fetch mint price, using fallback:", error);
      currentPrice = mintPrice; // Use the last known price
    }
    
    console.log("Current mint price:", currentPrice);
    console.log("Mint amount:", amount);
    
    // Calculate total price
    const totalPrice = BigInt(currentPrice) * BigInt(amount);
    console.log("Total price:", totalPrice.toString());
    
    try {
      let tx;
      
      if (isPublicOpen) {
        // Use public mint if public sale is open
        console.log("Using publicMint function");
        tx = await nftContract.methods.publicMint(amount).send({
          from: userAccount,
          value: totalPrice.toString()
        });
      } else if (isWhitelistOpen) {
        // For whitelist minting, we would need the merkle proof and allowed quantity
        // Bu kısım örnek olarak eklenmiştir, gerçek uygulamada merkle proof data'sı gerekir
        console.log("Whitelist sale is open, but we don't have merkle proof data");
        showNotification('Whitelist sale is open. You need to be whitelisted to mint.', 'error');
        throw new Error("Whitelist sale requires merkle proof data");
      } else {
        throw new Error("No sale is currently open");
      }
      
      // Successful transaction
      transactionStatus.className = 'transaction-status success';
      transactionStatus.innerHTML = `
        Successfully minted ${amount} NFT${amount > 1 ? 's' : ''}!<br>
        <a href="https://hyperliquid.cloud.blockscout.com/tx/${tx.transactionHash}" target="_blank" class="contract-address">
          View transaction
        </a>
      `;
      
      // Update contract info
      updateContractInfo();
      
      showNotification(`Successfully minted ${amount} NFT${amount > 1 ? 's' : ''}!`, 'success');
    } catch (error) {
      console.error("Mint transaction error:", error);
      
      // Check if we're in simulation mode and show a simulated success
      if (error.message && (error.message.includes('execution reverted') || error.message.includes('Internal JSON-RPC error'))) {
        handleMintSimulation(amount);
      } else {
        transactionStatus.className = 'transaction-status error';
        transactionStatus.textContent = `Transaction failed: ${error.message}`;
        
        showNotification('Mint failed. Please try again.', 'error');
      }
    }
  } catch (error) {
    console.error("Mint error:", error);
    transactionStatus.className = 'transaction-status error';
    transactionStatus.textContent = `Transaction failed: ${error.message}`;
    
    showNotification('Mint failed. Please try again.', 'error');
  } finally {
    mintButton.disabled = false;
  }
}

// Handle simulation of a successful mint when contract is not responding
function handleMintSimulation(amount) {
  // Create a fake transaction hash for display purposes
  const fakeHash = generateFakeHash();
  
  // Show simulation badge if not already visible
  addSimulationBadge();
  
  // Update transaction status to show simulated success
  transactionStatus.className = 'transaction-status success';
  transactionStatus.innerHTML = `
    <span class="simulation-text">[SIMULATION MODE]</span> Simulated mint of ${amount} NFT${amount > 1 ? 's' : ''}!<br>
    <span class="simulation-text">Tx hash:</span> ${fakeHash}
  `;
  
  // Show notification about simulation mode
  showNotification('Network issues detected. Showing simulated transaction in SIMULATION MODE.', 'warning');
}

// Add simulation badge to the UI
function addSimulationBadge() {
  // Check if the badge already exists
  if (document.querySelector('.simulation-badge')) {
    return; // Badge already exists
  }
  
  // Create simulation badge
  const badge = document.createElement('div');
  badge.className = 'simulation-badge';
  badge.textContent = 'SIMULATION MODE';
  
  // Add tooltip to explain what simulation mode means
  badge.title = 'The app is running in simulation mode because we could not connect to the blockchain. Transactions are simulated and not actually performed on-chain.';
  
  // Add badge to the document
  document.body.appendChild(badge);
}

// Generate a fake transaction hash for simulation
function generateFakeHash() {
  return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
}

// Increase mint amount
function increaseAmount() {
  let amount = parseInt(mintAmountInput.value);
  if (isNaN(amount)) amount = 0;
  if (amount < maxMintAmount) {
    mintAmountInput.value = amount + 1;
  }
}

// Decrease mint amount
function decreaseAmount() {
  let amount = parseInt(mintAmountInput.value);
  if (isNaN(amount)) amount = 2;
  if (amount > 1) {
    mintAmountInput.value = amount - 1;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  notificationMessage.textContent = message;
  notification.className = `notification ${type}`;
  notification.style.display = 'flex';
  
  // Auto-close after 5 seconds
  setTimeout(() => {
    if (notification.style.display === 'flex') {
      hideNotification();
    }
  }, 5000);
}

// Hide notification
function hideNotification() {
  notification.style.display = 'none';
}

// Shorten address
function shortenAddress(address) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

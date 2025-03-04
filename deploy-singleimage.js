const { Web3 } = require('web3');
const solc = require('solc');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

// HyperEVM ağına özel yapılandırma
// HyperEVM Mainnet: Chain ID 999, RPC: https://rpc.hyperliquid.xyz/evm
// HyperEVM Testnet: Chain ID 998, RPC: https://rpc.hyperliquid-testnet.xyz/evm
// HyperEVM, gas ücretlerini ETH değil HYPE tokeni ile öder

// .env.nft dosyasından çevre değişkenlerini yükle
dotenv.config({ path: '.env.nft' });

// HyperEVM node RPC URL
const rpcUrl = process.env.RPC_URL || 'https://rpc.hyperliquid-testnet.xyz/evm';

// Private key
const privateKey = process.env.PRIVATE_KEY;

// NFT Settings from .env
const tokenName = process.env.TOKEN_NAME || 'SingleImageNFT';
const tokenSymbol = process.env.TOKEN_SYMBOL || 'SINFT';
const baseTokenURI = process.env.BASE_TOKEN_URI || 'https://ipfs.io/ipfs/QmYourIPFSHash';

// Compile contracts
async function compileContracts() {
  console.log('Compiling contracts...');
  
  // Check if node_modules exists
  const nodeModulesPath = path.resolve(__dirname, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    throw new Error('node_modules folder not found. Please run npm install.');
  }
  
  // Function to handle imports from anywhere
  function findImports(importPath) {
    try {
      let filePath;
      
      // Handle OpenZeppelin imports
      if (importPath.startsWith('./openzeppelin-contracts/')) {
        filePath = path.resolve(__dirname, importPath.substring(2));
      } else if (importPath.startsWith('@openzeppelin/')) {
        filePath = path.resolve(__dirname, 'node_modules', importPath);
      } else if (importPath.startsWith('./')) {
        filePath = path.resolve(__dirname, importPath.substring(2));
      } else {
        filePath = path.resolve(__dirname, importPath);
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return { error: `File not found: ${importPath}` };
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      return { contents: content };
    } catch (error) {
      console.error(`Error reading file: ${importPath}`, error);
      return { error: `Error reading file: ${importPath}` };
    }
  }
  
  // Read main contract
  const mainContractPath = path.resolve(__dirname, 'SingleImageNFT.sol');
  const mainContractSource = fs.readFileSync(mainContractPath, 'utf8');
  
  // Solc compile
  const input = {
    language: 'Solidity',
    sources: {
      'SingleImageNFT.sol': { content: mainContractSource }
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['*']
        }
      },
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  };
  
  try {
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    
    if (output.errors) {
      // Check for serious errors
      const hasError = output.errors.some(error => error.severity === 'error');
      
      // Display errors/warnings
      output.errors.forEach(error => {
        console.error(error.formattedMessage || error);
      });
      
      if (hasError) {
        throw new Error('Compilation error');
      }
    }
    
    const compiledContract = output.contracts['SingleImageNFT.sol']['SingleImageNFT'];
    const bytecode = compiledContract.evm.bytecode.object;
    const abi = compiledContract.abi;
    
    return { bytecode, abi };
  } catch (error) {
    console.error('Compilation error:', error);
    throw new Error('Compilation error');
  }
}

// Deploy contract
async function deployContract() {
  try {
    // Compile contracts
    const { bytecode, abi } = await compileContracts();
    
    console.log('Bytecode ve ABI oluşturuldu.');
    
    // Web3 bağlantısı ve hesap kurulumu
    console.log('Web3 bağlantısı kuruluyor ve hesap oluşturuluyor...');
    const web3 = new Web3(rpcUrl);
    
    // Özel anahtar doğrudan kullanılıyor, eth_accounts metodu desteklenmiyor
    const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : '0x' + privateKey;
    const account = web3.eth.accounts.privateKeyToAccount(privateKeyWithPrefix);
    web3.eth.accounts.wallet.add(account);
    const deployer = account.address;
    
    console.log(`Hesap adresi: ${deployer}`);
    
    try {
      // Bakiye kontrolü
      const balance = await web3.eth.getBalance(deployer);
      console.log(`Bakiye: ${web3.utils.fromWei(balance, 'ether')} HYPE`);
    } catch (error) {
      console.log('Bakiye kontrol edilemedi:', error.message);
    }
    
    // Kontrat oluşturma
    const contract = new web3.eth.Contract(abi);
    const deployTransaction = contract.deploy({
      data: '0x' + bytecode,
      arguments: [tokenName, tokenSymbol, baseTokenURI]
    });
    
    try {
      // Gas fiyatını alıyoruz
      console.log('Gas fiyatı tahmin ediliyor...');
      const gasPrice = await web3.eth.getGasPrice();
      console.log(`Gas fiyatı: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);
      
      // HyperEVM'in dual-block yapısı için büyük kontratlar için yüksek gas limit
      const gasLimit = 30000000; // 30M gas (max 30M)
      console.log(`Gas limiti: ${gasLimit}`);
      
      // Kontratı deploy etme
      console.log('SingleImageNFT kontratı deploy ediliyor...');
      
      console.log('\n***** ÖNEMLİ UYARI *****');
      console.log('Hyperliquid\'de büyük bir kontrat deploy etmek istiyorsunuz.');
      console.log('Kontrat boyutu, normal bloklarda deploy edilmek için çok büyük olabilir.');
      console.log('Deployment işlemini yapmadan önce big blocks modunu etkinleştirmeniz önerilir.');
      console.log('Bunun için Hyperliquid web arayüzünü kullanmalısınız:');
      console.log('1. https://app.hyperliquid.xyz adresine gidin');
      console.log('2. Cüzdanınızı bağlayın');
      console.log('3. Advanced Settings veya similar bölümünde "Enable Big Blocks" opsiyonunu bulun ve etkinleştirin');
      console.log('**************************\n');
      
      console.log('5 saniye içinde deployment işlemi başlayacak. İptal etmek için CTRL+C tuşlarına basın...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const deployedContract = await deployTransaction.send({
        from: deployer,
        gas: gasLimit,
        gasPrice: gasPrice
      });
      
      console.log(`SingleImageNFT kontratı şu adrese deploy edildi: ${deployedContract.options.address}`);
      
      // Deployment bilgilerini kaydetme
      const deploymentInfo = {
        address: deployedContract.options.address,
        abi: abi,
        deployer: deployer,
        deploymentTime: new Date().toISOString()
      };
      
      fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
      console.log('Deployment bilgileri deployment-info.json dosyasına kaydedildi.');
      
      // NFT kontratına erişim
      const deployedNFT = new web3.eth.Contract(abi, deployedContract.options.address);
      
      // Reserve NFT'leri mint etme
      console.log('Reserve NFT\'ler mint ediliyor...');
      await deployedNFT.methods.mintReserve(10, deployer).send({
        from: deployer,
        gas: 3000000
      });
      console.log('10 reserve NFT mint edildi!');
      
      // Herkese açık satışı başlatma
      console.log('Herkese açık satış başlatılıyor...');
      await deployedNFT.methods.setPublicSaleOpen(true).send({
        from: deployer,
        gas: 200000
      });
      console.log('Herkese açık satış başlatıldı.');
      
    } catch (error) {
      console.error('Deployment hatası:', error);
      if (error.message.includes('gas limit')) {
        console.log('\n***** HATA: GAS LİMİTİ AŞILDI *****');
        console.log('Kontratınız normal blokların gas limitini aşıyor!');
        console.log('Big Blocks modunu etkinleştirmeniz gerekiyor:');
        console.log('1. https://app.hyperliquid.xyz adresine gidin');
        console.log('2. Cüzdanınızı bağlayın');
        console.log('3. Advanced Settings veya similar bölümünde "Enable Big Blocks" opsiyonunu bulun ve etkinleştirin');
        console.log('4. Sonra tekrar deployment işlemini çalıştırın');
        console.log('*********************************');
      }
    }
  } catch (error) {
    console.error('Deployment hatası:', error);
  }
}

// Deploy the contract
deployContract();

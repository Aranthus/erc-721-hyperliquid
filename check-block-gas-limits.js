const { Web3 } = require('web3');

async function checkBlockGasLimits() {
  // RPC URL
  const rpcUrl = 'https://rpc.hyperliquid.xyz/evm';
  const web3 = new Web3(rpcUrl);
  
  try {
    // Big block (Örnek: 6130)
    console.log('Big Block (Slow Block) inceleniyor...');
    const bigBlock = await web3.eth.getBlock(6130);
    console.log(`Block Number: ${bigBlock.number}`);
    console.log(`Gas Limit: ${bigBlock.gasLimit.toString()}`);
    console.log(`Timestamp: ${new Date(Number(bigBlock.timestamp) * 1000).toISOString()}`);
    console.log('------------------------------');
    
    // Small block (Örnek: 6131)
    console.log('Small Block (Fast Block) inceleniyor...');
    const smallBlock = await web3.eth.getBlock(6131);
    console.log(`Block Number: ${smallBlock.number}`);
    console.log(`Gas Limit: ${smallBlock.gasLimit.toString()}`);
    console.log(`Timestamp: ${new Date(Number(smallBlock.timestamp) * 1000).toISOString()}`);
    console.log('------------------------------');
    
    // Büyük bir block bulalım
    console.log('Son 100 blok içinde bir Big Block (Slow Block) arıyoruz...');
    let foundBigBlock = false;
    const currentBlock = await web3.eth.getBlockNumber();
    
    for (let i = 0; i < 100; i++) {
      if (currentBlock - i > 0) {
        const block = await web3.eth.getBlock(currentBlock - i);
        const isBigBlock = Number(block.gasLimit) > 2000000;
        
        if (isBigBlock) {
          console.log(`Big Block bulundu! Block ${block.number}: Gas Limit ${block.gasLimit.toString()}`);
          console.log(`Timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
          foundBigBlock = true;
          break;
        }
      }
    }
    
    if (!foundBigBlock) {
      console.log('Son 100 blok içinde big block bulunamadı.');
    }
    
    console.log('------------------------------');
    
    // En son blok
    console.log('En son bloğu inceliyoruz...');
    const latestBlock = await web3.eth.getBlock('latest');
    console.log(`Block Number: ${latestBlock.number}`);
    console.log(`Gas Limit: ${latestBlock.gasLimit.toString()}`);
    console.log(`Timestamp: ${new Date(Number(latestBlock.timestamp) * 1000).toISOString()}`);
    
    // En son big block mu small block mu
    const isLatestBigBlock = Number(latestBlock.gasLimit) > 2000000;
    console.log(`Bu blok bir ${isLatestBigBlock ? 'BIG (Slow) Block' : 'SMALL (Fast) Block'}`);
    
    // Block sayılarını karşılaştıralım (big vs small)
    console.log('\nSon 30 bloğu analiz ediyoruz...');
    const lastBlockNum = Number(latestBlock.number);
    let bigBlockCount = 0;
    let smallBlockCount = 0;
    
    for (let i = 0; i < 30; i++) {
      if (lastBlockNum - i > 0) {
        const block = await web3.eth.getBlock(lastBlockNum - i);
        const isBigBlock = Number(block.gasLimit) > 2000000;
        
        if (isBigBlock) {
          bigBlockCount++;
        } else {
          smallBlockCount++;
        }
        
        console.log(`Block ${block.number}: Gas Limit ${block.gasLimit.toString()} - ${isBigBlock ? 'BIG (Slow) Block' : 'SMALL (Fast) Block'}`);
      }
    }
    
    console.log(`\nSon 30 blok içinde: ${bigBlockCount} Big Block, ${smallBlockCount} Small Block`);
    console.log(`Oran: ${(bigBlockCount / (bigBlockCount + smallBlockCount) * 100).toFixed(2)}% Big Block`);
    
    const bigBlockTimeIntervalSec = 60; // 1 dakika
    const smallBlockTimeIntervalSec = 2; // 2 saniye
    
    const totalTimeWithTwoPools = (bigBlockCount * bigBlockTimeIntervalSec) + (smallBlockCount * smallBlockTimeIntervalSec);
    const totalTimeWithOnePool = (bigBlockCount + smallBlockCount) * ((bigBlockTimeIntervalSec + smallBlockTimeIntervalSec) / 2);
    
    console.log(`\nDual-block sisteminde toplam zaman: ${totalTimeWithTwoPools} saniye`);
    console.log(`Tek-block sisteminde tahmini toplam zaman: ${totalTimeWithOnePool} saniye`);
    console.log(`Zaman avantajı: ${((totalTimeWithOnePool - totalTimeWithTwoPools) / totalTimeWithOnePool * 100).toFixed(2)}%`);
    
  } catch (error) {
    console.error('Hata:', error.message);
  }
}

checkBlockGasLimits();

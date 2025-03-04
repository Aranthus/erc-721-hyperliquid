const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Get contract information from deployment-info.json
const deploymentInfoPath = path.join(__dirname, 'deployment-info.json');
let contractData = {};

try {
  const deploymentInfo = fs.readFileSync(deploymentInfoPath, 'utf8');
  contractData = JSON.parse(deploymentInfo);
  console.log(`Contract address: ${contractData.address}`);
} catch (error) {
  console.error('Failed to read deployment-info.json:', error.message);
}

// Use public folder to serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to serve contract information
app.get('/api/contract-info', (req, res) => {
  res.json({
    address: contractData.address,
    abi: contractData.abi
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Open this address in your browser to access the NFT Mint UI`);
});

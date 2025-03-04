// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// NOT EVM! HyperEVM kullanıyor bu ağ
// UYARI: HyperEVM, ETH yerine HYPE tokeni ile gas ücretlerini öder!
// Deployment için dutch auction kullanılır ve maliyet çok yüksek olabilir

import "./openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "./openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "./openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "./openzeppelin-contracts/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "./openzeppelin-contracts/contracts/access/Ownable.sol";
import "./openzeppelin-contracts/contracts/utils/cryptography/MerkleProof.sol";
import "./openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract SingleImageNFT is
    ERC721,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable,
    ERC721Royalty,
    ReentrancyGuard,
    Ownable
{
    //////////////////////////////////////////////////////////////////
    // CONFIGURATION                                                //
    //////////////////////////////////////////////////////////////////

    uint256 public constant RESERVES = 10; // Takım ve promosyon için ayrılan NFT'ler
    uint256 public constant PRICE_IN_WEI_WHITELIST = 0 ether; // Whitelist satışı fiyatı - ÜCRETSİZ
    uint256 public constant PRICE_IN_WEI_PUBLIC = 0 ether; // Genel satış fiyatı - ÜCRETSİZ
    uint96 public constant ROYALTIES_IN_BASIS_POINTS = 500; // %5 royalty
    uint256 public constant MAX_PER_TX = 10; // İşlem başına maksimum mint
    uint256 public constant MAX_SUPPLY = 1000; // Toplam 1000 NFT

    //////////////////////////////////////////////////////////////////
    // STATE VARIABLES                                              //
    //////////////////////////////////////////////////////////////////

    string private _baseTokenURI;
    string private _contractURI;
    
    bool private _publicSaleOpen;
    bool private _whitelistSaleOpen;
    bool private _mintingPaused;
    
    uint256 private _nextTokenId;
    
    bytes32 private _whitelistMerkleRoot;

    //////////////////////////////////////////////////////////////////
    // CONSTRUCTOR                                                  //
    //////////////////////////////////////////////////////////////////
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
        
        // Royalty ayarla (%5)
        _setDefaultRoyalty(msg.sender, ROYALTIES_IN_BASIS_POINTS);
    }
    
    //////////////////////////////////////////////////////////////////
    // REQUIRED OVERRIDES                                           //
    //////////////////////////////////////////////////////////////////
    
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    //////////////////////////////////////////////////////////////////
    // TOKEN URI FUNCTIONS                                          //
    //////////////////////////////////////////////////////////////////
    
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // Token ID'nin geçerli olup olmadığını kontrol et
        if (!_exists(tokenId)) revert("SingleImageNFT: URI query for nonexistent token");
        
        // Tüm NFT'ler için aynı URI döndür - tek görsel kullanımı
        return _baseURI();
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setContractURI(string memory uri) external onlyOwner {
        _contractURI = uri;
    }
    
    function contractURI() external view returns (string memory) {
        return _contractURI;
    }
    
    // Token ID'nin var olup olmadığını kontrol et
    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _nextTokenId && tokenId > 0;
    }
    
    //////////////////////////////////////////////////////////////////
    // MINT & SALES FUNCTIONS                                       //
    //////////////////////////////////////////////////////////////////
    
    // Mint paused check
    modifier whenMintNotPaused() {
        require(!_mintingPaused, "Minting is paused");
        _;
    }
    
    function pauseMinting(bool paused) external onlyOwner {
        _mintingPaused = paused;
    }
    
    function mintReserve(uint256 quantity, address to) external onlyOwner {
        require(_nextTokenId + quantity <= RESERVES, "Reserve limit");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(to, tokenId);
        }
    }
    
    function whitelistMint(uint256 quantity, uint256 allowedQuantity, bytes32[] calldata merkleProof)
        public
        payable
        nonReentrant
        whenMintNotPaused
    {
        require(_whitelistSaleOpen, "Whitelist sale not open");
        require(quantity > 0, "Must mint at least 1");
        require(tx.origin == msg.sender, "Only EOA");
        require(quantity <= allowedQuantity, "Quantity exceeds allowed");
        require(_nextTokenId + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= PRICE_IN_WEI_WHITELIST * quantity, "Not enough ETH");
        
        // Whitelist doğrulama
        verifyWhitelist(msg.sender, allowedQuantity, merkleProof);
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }
    }
    
    function publicMint(uint256 quantity)
        public
        payable
        nonReentrant
        whenMintNotPaused
    {
        require(_publicSaleOpen, "Public sale not open");
        require(quantity > 0, "Must mint at least 1");
        require(quantity <= MAX_PER_TX, "Exceeds max per tx");
        require(tx.origin == msg.sender, "Only EOA");
        require(_nextTokenId + quantity <= MAX_SUPPLY, "Exceeds max supply");
        require(msg.value >= PRICE_IN_WEI_PUBLIC * quantity, "Not enough ETH");
        
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = _nextTokenId++;
            _safeMint(msg.sender, tokenId);
        }
    }

    // Whitelist'i kontrol etme fonksiyonu
    function verifyWhitelist(address account, uint256 allowedQuantity, bytes32[] calldata merkleProof) internal view {
        bytes32 leaf = keccak256(abi.encode(account, allowedQuantity));
        require(MerkleProof.verify(merkleProof, _whitelistMerkleRoot, leaf), "Invalid merkle proof");
    }
    
    // Merkle root ayarlama fonksiyonu
    function setMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        _whitelistMerkleRoot = merkleRoot;
    }
    
    //////////////////////////////////////////////////////////////////
    // ADMIN FUNCTIONS                                              //
    //////////////////////////////////////////////////////////////////
    
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    function setWhitelistSaleOpen(bool isOpen) public onlyOwner {
        _whitelistSaleOpen = isOpen;
    }
    
    function isWhitelistSaleOpen() public view returns (bool) {
        return _whitelistSaleOpen;
    }
    
    function setPublicSaleOpen(bool isOpen) public onlyOwner {
        _publicSaleOpen = isOpen;
    }

    function isPublicSaleOpen() public view returns (bool) {
        return _publicSaleOpen;
    }
    
    function totalMinted() public view returns (uint256) {
        return _nextTokenId;
    }
    
    function availableSupply() public view returns (uint256) {
        return MAX_SUPPLY - _nextTokenId;
    }
}

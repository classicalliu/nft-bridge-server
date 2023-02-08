// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

contract NFTUpgradeable is ERC721EnumerableUpgradeable, OwnableUpgradeable {
    string public baseURI;
    address public miner;

    // map tokenId => token name
    mapping(uint256 => string) tokenIdToName;
    // map tokenId => token symbol
    mapping(uint256 => string) tokenIdToSymbol;
    // map tokenId => token uri
    mapping(uint256 => string) tokenIdToUri;
    // map tokenId => token extra_data(factory extra_data)
    mapping(uint256 => string) tokenIdToExtraData;
    // map tokenId => token data(nft cell data)
    mapping(uint256 => string) tokenIdToData;

    modifier onlyMiner() {
        require(msg.sender == miner, "Not miner");
        _;
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        address miner_
    ) public initializer {
        __Ownable_init();
        __ERC721_init(name_, symbol_);
        miner = miner_;
    }

    function setMiner(address miner_) external onlyOwner {
        miner = miner_;
    }

    function mint(address to, uint256 tokenId, string memory name, string memory symbol, string memory uri, string memory extraData, string memory data) external onlyMiner {
        tokenIdToName[tokenId] = name;
        tokenIdToSymbol[tokenId] = symbol;
        tokenIdToUri[tokenId] = uri;
        tokenIdToExtraData[tokenId] = extraData;
        tokenIdToData[tokenId] = data;
        _safeMint(to, tokenId);
    }

    function exists(uint256 tokenId) external view returns (bool) {
        return _exists(tokenId);
    }

    function tokenName(uint256 tokenId) public view returns (string memory) {
        return tokenIdToName[tokenId];
    }

    function tokenSymbol(uint256 tokenId) public view returns (string memory) {
        return tokenIdToSymbol[tokenId];
    }

    function tokenUri(uint256 tokenId) public view returns (string memory) {
        return tokenIdToUri[tokenId];
    }

    function tokenExtraData(uint256 tokenId) public view returns (string memory) {
        return tokenIdToExtraData[tokenId];
    }

    function tokenData(uint256 tokenId) public view returns (string memory) {
        return tokenIdToData[tokenId];
    }

    function setTokenName(uint256 tokenId, string memory newName) external onlyMiner {
        tokenIdToName[tokenId] = newName;
    }

    function setTokenSymbol(uint256 tokenId, string memory newSymbol) external onlyMiner {
        tokenIdToSymbol[tokenId] = newSymbol;
    }

    function setTokenUri(uint256 tokenId, string memory newUri) external onlyMiner {
        tokenIdToUri[tokenId] = newUri;
    }

    function setTokenExtraData(uint256 tokenId, string memory newExtraData) external onlyMiner {
        tokenIdToUri[tokenId] = newExtraData;
    }

    function setTokenData(uint256 tokenId, string memory newData) external onlyMiner {
        tokenIdToUri[tokenId] = newData;
    }
}

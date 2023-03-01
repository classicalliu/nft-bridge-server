// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "./NFTUpgradeable.sol";

// Uncomment this line to use console.log
// import "hardhat/console.sol";

// NOTE: only for upgradable test
contract NFTUpgradeableVersion2ForTest is NFTUpgradeable {
    function newAdded() external pure returns (string memory) {
        return "new added function";
    }
}

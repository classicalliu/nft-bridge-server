import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("nft:upgrade", "Deploy NFT contract")
  .addParam("contractAddress", "NFT contract address")
  .setAction(async (args: TaskArguments, { ethers, upgrades }) => {
    const contractAddress = args.contractAddress;

    // TODO: Update to new version of contract
    const NewNFTContract = await ethers.getContractFactory("NFTUpgradeable");
    const newContract = await upgrades.upgradeProxy(
      contractAddress,
      NewNFTContract
    );
    await newContract.deployed();

    console.log(`NFT deployed to ${newContract.address}`);
  });

import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("nft:upgrade", "Deploy NFT contract")
  .addParam("contractAddress", "NFT contract address")
  .setAction(async (args: TaskArguments, { ethers, upgrades }) => {
    const contractAddress = args.contractAddress;

    // TODO: Update to new version of contract
    const NftContractVersion2 = await ethers.getContractFactory(
      "NFTUpgradeableVersion2ForTest"
    );
    const newContract = await upgrades.upgradeProxy(
      contractAddress,
      NftContractVersion2
    );
    await newContract.deployed();

    console.log(`NFT deployed to ${newContract.address}`);
  });

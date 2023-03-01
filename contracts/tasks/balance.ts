import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("nft:balance", "Deploy NFT contract")
  .addParam("contractAddress", "NFT contract address, 0x...")
  .addParam("address", "Address, 0x...")
  .setAction(async (args: TaskArguments, { ethers }) => {
    const contractAddress = args.contractAddress;
    const address = args.address;

    const NftContract = await ethers.getContractFactory("NFTUpgradeable");
    const nftContract = NftContract.attach(contractAddress);

    // balance
    const balance = await nftContract.balanceOf(address);
    console.log("balance:", balance.toString());
  });

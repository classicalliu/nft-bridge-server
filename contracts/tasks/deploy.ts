import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

task("nft:deploy", "Deploy NFT contract")
  .addParam("name", "NFT contract name")
  .addParam("symbol", "NFT contract symbol")
  .setAction(async (args: TaskArguments, { ethers, upgrades }) => {
    const [owner, miner] = await ethers.getSigners();
    console.log("owner:", owner.address);
    console.log("miner:", miner.address);

    const nftName = args.name;
    const nftSymbol = args.symbol;
    console.log(`nft name: ${nftName}, symbol: ${nftSymbol}`);

    const NftContract = await ethers.getContractFactory("NFTUpgradeable");
    const nftContract = await upgrades.deployProxy(NftContract, [
      nftName,
      nftSymbol,
      miner.address,
    ]);

    await nftContract.deployed();

    console.log(`NFT deployed to ${nftContract.address}`);
  });

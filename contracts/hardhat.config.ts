import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";

import "./tasks"

const OWNER_PK = process.env.OWNER_PK;
const MINER_PK = process.env.MINER_PK

const accounts = [];
if (OWNER_PK && MINER_PK) {
  accounts.push(OWNER_PK)
  accounts.push(MINER_PK)
}

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    gw_dev_v1: {
      url: `http://localhost:8024`,
      accounts: accounts,
    },
    gw_testnet_v1: {
      url: `https://v1.testnet.godwoken.io/rpc/instant-finality-hack`,
      accounts: accounts,
      chainId: 71401,
    },
    hardhat_node: {
      url: `http://127.0.0.1:8545/`,
    }
  },
};

export default config;

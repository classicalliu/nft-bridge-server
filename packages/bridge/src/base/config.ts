import { env } from "process";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

export const Config = {
  ckbRpc: getRequired("CKB_RPC"),
  ckbIndexerRpc: getRequired("CKB_INDEXER_RPC"),
  minerLayer1Address: getRequired("MINER_LAYER1_ADDRESS"),
  nftContractAddress: getRequired("NFT_CONTRACT_ADDRESS"),
  layer2MinerAddress: getRequired("LAYER2_MINER_ADDRESS"),
  pgPoolMax: getOptional("PG_POOL_MAX"),
  databaseUrl: getRequired("DATABASE_URL"),
  minerPrivateKey: getRequired("MINER_PRIVATE_KEY"),
  godwokenRpc: getRequired("GODWOKEN_RPC"),
  isMainnet: getOptional("IS_MAINNET") === "true" ? true : false,
};

function getRequired(name: string): string {
  const value = env[name];
  if (value == null) {
    throw new Error(`no env ${name} provided`);
  }

  return value;
}

function getOptional(name: string): string | undefined {
  return env[name];
}

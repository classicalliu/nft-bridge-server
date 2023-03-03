import { ethers, Wallet } from "ethers";
import { Config } from "../src/base/config";
import { GLOBAL_KNEX } from "../src/db";
import { NRC721 } from "../src/db/types";
import { logger } from "../src/base/logger";

const knex = GLOBAL_KNEX;

const abi = [
  "function tokenURI(uint256 tokenId) public view override returns (string memory)",
  "function setTokenURI(uint256 tokenId, string memory newUri) external",
];

const LOAD_LIMIT = 1000;

async function run() {
  const provider = new ethers.providers.JsonRpcProvider(Config.godwokenRpc);
  const signer = new Wallet(Config.minerPrivateKey, provider);
  const nftContract = new ethers.Contract(
    Config.nftContractAddress,
    abi,
    signer
  );

  let startId = "0";
  while (true) {
    const tokens = await load(startId);
    console.log(tokens.map((t) => t.id));

    for (const token of tokens) {
      const layer2TokenId = token.layer2_token_id;
      const oldTokenURI = await nftContract.tokenURI(layer2TokenId);
      const newTokenURI = updateTokenURI(oldTokenURI);
      if (newTokenURI === oldTokenURI) {
        logger.info(
          `token_id: ${layer2TokenId}'s URI ${oldTokenURI} no need to update!`
        );
      } else {
        await nftContract.setTokenURI(layer2TokenId, newTokenURI);
        logger.info(
          `token_id: ${layer2TokenId}'s URI updated, ${oldTokenURI} -> ${newTokenURI}`
        );
      }
    }

    if (tokens.length < LOAD_LIMIT) {
      break;
    }

    startId = tokens[tokens.length - 1].id!;
  }

  process.exit(0);
}
run();

function updateTokenURI(oldTokenURI: string): string {
  const arr = oldTokenURI.split("/");
  const layer1TokenId: string = arr[arr.length - 1];
  if (layer1TokenId.startsWith("0x")) {
    arr[arr.length - 1] = layer1TokenId.slice(2);
    return arr.join("/");
  }
  return oldTokenURI;
}

async function load(id: string) {
  const tokens = await knex<NRC721.Token.DBStruct>(NRC721.Token.DB_TABLE_NAME)
    .where({
      layer2_has_mined: true,
    })
    .andWhere("id", ">", id)
    .orderBy("id")
    .limit(LOAD_LIMIT);

  return tokens;
}

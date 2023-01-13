import { Contract, ethers, Signer, Wallet } from "ethers";
import { BaseRunner } from "./base_runner";
import { Config } from "../base/config";
import { NRC721Query } from "../db";
import { NRC721 } from "../db/types";
import { logger } from "../base/logger";

const abi = [
  "function mint(address to, uint256 tokenId, string memory name, string memory symbol, string memory uri) external",
  "function exists(uint256 tokenId) external view returns (bool)",
];

export class Miner extends BaseRunner {
  private nftContractAddress: string;
  private nftContract: Contract;
  private query: NRC721Query;

  private signer: Signer;

  constructor({ livenessCheckIntervalSeconds = 5 } = {}) {
    super({ livenessCheckIntervalSeconds });
    this.nftContractAddress = Config.nftContractAddress;

    const provider = new ethers.providers.JsonRpcProvider(Config.godwokenRpc);
    this.signer = new Wallet(Config.minerPrivateKey, provider);

    this.nftContract = new ethers.Contract(
      this.nftContractAddress,
      abi,
      this.signer
    );

    this.query = new NRC721Query();
  }

  public async poll() {
    for await (const {
      token,
      factory_script: factoryScript,
    } of this.query.collectNonMinedTokens()) {
      const isMinted = await this.isMinted(token.layer2_token_id);
      if (isMinted) {
        logger.warn(
          `layer2 token already minted before: ${token.layer2_token_id}, updated status.`
        );
        await this.query.updateToMined(token.layer2_token_id);
        continue;
      }
      try {
        const uri: string = NRC721.Funcs.getTokenUri(
          factoryScript.base_uri,
          token.layer1_token_id
        );
        await this.mint(
          token.layer2_to_address,
          token.layer2_token_id,
          factoryScript.name,
          factoryScript.symbol,
          uri
        );
        logger.info(`layer2 token minted: ${token.layer2_token_id}`);
        await this.query.updateToMined(token.layer2_token_id);
      } catch (err) {
        logger.error(`layer2 token mint failed: ${token.layer2_token_id}`);
        throw err;
      }
    }
    return 1000;
  }

  private async isMinted(tokenId: bigint): Promise<boolean> {
    return await this.nftContract.exists(tokenId.toString());
  }

  private async mint(
    toAddress: string,
    tokenId: bigint,
    name: string,
    symbol: string,
    uri: string
  ) {
    const tx = await this.nftContract
      .connect(this.signer)
      .mint(toAddress, tokenId.toString(), name, symbol, uri);

    const result = await tx.wait();
    return result;
  }
}

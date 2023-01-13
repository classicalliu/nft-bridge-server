import { Contract, ethers, Signer, Wallet } from "ethers";
import { BaseRunner } from "./base_runner";
import { Config } from "../base/config";
import { NRC721Query } from "../db";
import { NRC721 } from "../db/types";

const abi = [
  "function mint(address to, uint256 tokenId, string memory name, string memory symbol, string memory uri) external",
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
    for await (const { token, factory_script: factoryScript } of this.query.collectNonMinedTokens()) {
      try {
        const uri: string = NRC721.Funcs.getTokenUri(factoryScript.base_uri, token.layer1_token_id)
        //TODO: check mined firstly
        await this.mine(
          token.layer2_to_address,
          token.layer2_token_id,
          factoryScript.name,
          factoryScript.symbol,
          uri,
        );
        console.log(`layer2 token mined: ${token.layer2_token_id}`);
        await this.query.updateToMined(token.layer2_token_id);
      } catch (err) {
        console.error(`layer2 token mine failed: ${token.layer2_token_id}`);
        throw err;
      }
    }
    return 1000;
  }

  private async mine(
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

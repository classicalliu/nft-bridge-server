import { initializeConfig, predefined } from "@ckb-lumos/config-manager/lib";
import { parseAddress } from "@ckb-lumos/helpers";
import { Config } from "../base/config";
import { CkbIndexerRpc } from "../rpc";
import { HexString } from "@ckb-lumos/base";
import { NRC721Query } from "../db";
import { NRC721FactoryScript, NRC721Token, NRC721TokenWithFactoryScript, toFactoryScriptAndTokenId } from "../db/types";
import { parseFactoryData } from "../base/utils";
import { Blake2bHasher } from "../base/blake2b";
import { OutPoint, CellResult, SearchKey, Script } from "../types";
import { BaseRunner } from "./base_runner";

const NRC721_TOKEN_OUTPUT_DATA_HEADER = "0x0ddeff3e8ee03cbf6a2c6920d05c381e";

export class NftCellCollector extends BaseRunner {
  private query: NRC721Query;
  private lastIndexerTip: bigint;
  private indexerRPC: CkbIndexerRpc;
  private minerLockScript: Script;

  constructor({ livenessCheckIntervalSeconds = 5 } = {}) {
    super({ livenessCheckIntervalSeconds });
    this.query = new NRC721Query();

    this.lastIndexerTip = 0n;

    this.indexerRPC = new CkbIndexerRpc(Config.ckbIndexerRpc);

    // TODO: check is mainnet ? or others
    initializeConfig(predefined.AGGRON4);
    const script = parseAddress(Config.minerLayer1Address);

    this.minerLockScript = {
      code_hash: script.codeHash,
      hash_type: script.hashType,
      args: script.args,
    };
  }

  private async getIndexerTipNumber(): Promise<bigint> {
    const tip = await this.indexerRPC.get_tip();
    return BigInt(tip.block_number);
  }

  public isNrc721Cell(data: HexString): boolean {
    return data.startsWith(NRC721_TOKEN_OUTPUT_DATA_HEADER);
  }

  public async poll() {
    const currentIndexerTip: bigint = await this.getIndexerTipNumber();
    const blockRangeMax = currentIndexerTip + 1n;

    if (blockRangeMax <= this.lastIndexerTip) {
      return 500;
    }

    const searchKey: SearchKey = {
      script: this.minerLockScript,
      script_type: "lock",
      filter: {
        block_range: [
          "0x" + this.lastIndexerTip.toString(16),
          "0x" + blockRangeMax.toString(16),
        ],
      },
    };
    const order = "asc";
    const count = "0x64"; // 100

    while (true) {
      let afterCursor = undefined;
      const cells = await this.indexerRPC.get_cells(
        searchKey,
        order,
        count,
        afterCursor
      );
      afterCursor = cells.last_cursor;

      for (let i = 0; i < cells.objects.length; i++) {
        const cell: CellResult = cells.objects[i];
        if (this.isNrc721Cell(cell.output_data)) {
          const tokenWithFactoryScript: NRC721TokenWithFactoryScript = await this.generateNRC721Token(cell);
          let isSaved;
          try {
            isSaved = await this.query.saveIfNotExists(tokenWithFactoryScript);
          } catch (err) {
            console.error(
              `NRC721 token ${this.printOutPoint(cell.out_point)} save failed!`
            );
            throw err;
          }
          if (isSaved) {
            console.log(
              `NRC721 token ${this.printOutPoint(cell.out_point)} saved!`
            );
          } else {
            console.warn(
              `NRC721 token ${this.printOutPoint(cell.out_point)} already exists!`
            );
          }
        }
      }

      if (cells.objects.length < +count) {
        break;
      }
    }

    // update last indexer tip
    this.lastIndexerTip = blockRangeMax;
    return 1000;
  }

  private printOutPoint(outPoint: OutPoint): string {
    return `{tx_hash: ${outPoint.tx_hash}, index: ${outPoint.index}}`;
  }

  private async generateNRC721Token(cell: CellResult): Promise<NRC721TokenWithFactoryScript> {
    const { factoryScript, layer1TokenId } = toFactoryScriptAndTokenId(
      cell.output.type!.args
    );
    const factoryCell = await this.indexerRPC.get_factory_cell(factoryScript);
    const tokenInfo = parseFactoryData(factoryCell.output_data);

    const factory: NRC721FactoryScript = {
      out_point: factoryCell.out_point,

      script: factoryScript,

      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      base_uri: tokenInfo.baseUri,

      extra_data: tokenInfo.extraData,
    }

    // TODO: parse layer2 to_address from cell data
    const layer2ToAddress = "0x" + "11".repeat(20);

    const token: NRC721Token = {
      out_point: {
        tx_hash: cell.out_point.tx_hash,
        index: cell.out_point.index,
      },
      lock_script: cell.output.lock,
      type_script: cell.output.type!,
      layer1_token_id: layer1TokenId,

      output_data: cell.output_data,

      layer2_has_mined: false,
      layer2_token_id: this.getLayer2TokenId(cell.output.type!.args),
      layer2_to_address: layer2ToAddress,
    };

    return {
      token,
      factory_script: factory,
    };
  }

  // using layer1 type script args blake2b hash 0-20 bytes as layer2 token id
  // layer1 type script args includes factory_script and layer1_token_id
  private getLayer2TokenId(nftTypeScriptArgs: HexString): bigint {
    const digest = new Blake2bHasher().updateHex(nftTypeScriptArgs).digestHex();
    return BigInt(digest.slice(0, 42));
  }
}

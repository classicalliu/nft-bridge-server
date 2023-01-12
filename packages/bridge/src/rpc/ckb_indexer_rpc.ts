import { HexNumber } from "@ckb-lumos/base";
import { SearchKey, CellResult, GetCellsResult, TipResult, Script } from "../types"
import { RPC } from "./base";

export class CkbIndexerRpc {
  private uri: string;
  private rpc: any;

  constructor(uri: string) {
    this.uri = uri;
    this.rpc = new RPC(this.uri);
  }

  public async get_tip(): Promise<TipResult> {
    return await this.rpc.get_indexer_tip();
  }

  public async get_cells(
    search_key: SearchKey,
    order: "asc" | "desc",
    limit: HexNumber,
    after_cursor?: string
  ): Promise<GetCellsResult> {
    return await this.rpc.get_cells(search_key, order, limit, after_cursor);
  }

  public async get_factory_cell(factoryScript: Script): Promise<CellResult> {
    const searchKey: SearchKey = {
      script: factoryScript,
      script_type: "type",
    };

    const cells = await this.get_cells(searchKey, "desc", "0x2");
    if (cells.objects.length > 1) {
      throw new Error("duplicated factory cell !");
    }

    return cells.objects[0];
  }
}

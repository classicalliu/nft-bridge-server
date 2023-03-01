import { Hash, HexNumber, HexString } from "@ckb-lumos/base";
import { OutPoint, Output, Script } from "./base";

export interface TipResult {
  block_hash: Hash;
  block_number: HexNumber;
}

export interface SearchKey {
  script: Script;
  script_type: "lock" | "type";
  filter?: {
    script?: Script;
    script_len_range?: HexNumber[];
    output_data_len_range?: HexNumber[];
    output_capacity_range?: HexNumber[];
    block_range?: HexNumber[];
  };
  with_data?: boolean;
}

export interface CellResult {
  output: Output;
  output_data: HexString;
  out_point: OutPoint;
  block_number: HexNumber;
  tx_index: HexNumber;
}

export interface GetCellsResult {
  objects: CellResult[];
  last_cursor: string;
}

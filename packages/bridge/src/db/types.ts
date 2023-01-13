import { HexString } from "@ckb-lumos/base";
import { bufferToHex, fromHashType, hexToBuffer, OutPoint, Script, toBigInt, toBigIntOpt, toHashType } from "../types";

export namespace NRC721 {
  export interface TokenWithFactoryScript {
    token: Token.Struct
    factory_script: FactoryScript.Struct
  }

  export namespace FactoryScript {
    export interface Struct {
      id?: bigint
    
      out_point: OutPoint;
      block_number: bigint;
    
      script: Script
    
      name: string
      symbol: string
      base_uri: string
      extra_data?: string
    
      created_at?: Date
      updated_at?: Date
    }

    export const DB_TABLE_NAME = "nrc721_factory_scripts";

    export interface DBStruct {
      id?: string
    
      out_point_tx_hash: Buffer;
      out_point_index: number;
      block_number: string
    
      code_hash: Buffer;
      hash_type: number;
      args: Buffer;
    
      name: string
      symbol: string
      base_uri: string
      extra_data?: string
    
      created_at?: Date
      updated_at?: Date
    }

    export function fromDB(dbFactoryScript: DBStruct): Struct {
      const t = dbFactoryScript;
    
      return {
        id: toBigIntOpt(t.id),
        out_point: {
          tx_hash: bufferToHex(t.out_point_tx_hash),
          index: "0x" + t.out_point_index.toString(16),
        },
        block_number: toBigInt(t.block_number),
        script: {
          code_hash: bufferToHex(t.code_hash),
          hash_type: toHashType(t.hash_type),
          args: bufferToHex(t.args),
        },
        name: t.name,
        symbol: t.symbol,
        base_uri: t.base_uri,
        extra_data: t.extra_data,
    
        created_at: t.created_at,
        updated_at: t.updated_at,
      }
    }

    export function toDB(factoryScript: Struct): DBStruct {
      const t = factoryScript;
    
      return {
        id: t.id?.toString(),
    
        out_point_tx_hash: hexToBuffer(t.out_point.tx_hash),
        out_point_index: +t.out_point.index,
        block_number: t.block_number.toString(),
    
        code_hash: hexToBuffer(t.script.code_hash),
        hash_type: fromHashType(t.script.hash_type),
        args: hexToBuffer(t.script.args),
    
        name: t.name,
        symbol: t.symbol,
        base_uri: t.base_uri,
        extra_data: t.extra_data,
    
        created_at: t.created_at,
        updated_at: t.updated_at,
      }
    }
  }

  export namespace Token {
    export interface Struct {
      id?: bigint;
      out_point: OutPoint;
      block_number: bigint;
    
      lock_script: Script;
      type_script: Script;
    
      layer1_token_id: HexString;
    
      output_data: HexString;
    
      factory_id?: bigint
    
      layer2_has_mined: boolean;
      layer2_token_id: bigint;
      layer2_to_address: HexString;
    
      created_at?: Date;
      updated_at?: Date;
    }

    export const DB_TABLE_NAME = "nrc721_tokens";

    export interface DBStruct {
      id?: string;
      out_point_tx_hash: Buffer;
      out_point_index: number;
      block_number: string;
    
      lock_script_code_hash: Buffer;
      lock_script_hash_type: number;
      lock_script_args: Buffer;
    
      type_script_code_hash: Buffer;
      type_script_hash_type: number;
    
      layer1_token_id: Buffer;
      output_data: Buffer;
    
      layer2_has_mined: boolean;
      layer2_token_id: string;
      layer2_to_address: Buffer;
    
      factory_id?: string;
    
      created_at?: Date;
      updated_at?: Date;
    }

    export function fromDB(dbToken: DBStruct, factoryScript: Script): Struct {
      const t = dbToken;
    
      const tokenId: HexString = bufferToHex(t.layer1_token_id);
    
      return {
        id: toBigIntOpt(t.id),
        out_point: {
          tx_hash: bufferToHex(t.out_point_tx_hash),
          index: "0x" + t.out_point_index.toString(16),
        },
        block_number: toBigInt(t.block_number),
        lock_script: {
          code_hash: bufferToHex(t.lock_script_code_hash),
          hash_type: toHashType(t.lock_script_hash_type),
          args: bufferToHex(t.lock_script_args),
        },
        type_script: {
          code_hash: bufferToHex(t.type_script_code_hash),
          hash_type: toHashType(t.type_script_hash_type),
          args: NRC721.Funcs.toTypeScriptArgs(factoryScript, tokenId),
        },
        layer1_token_id: tokenId,
        output_data: bufferToHex(t.output_data),
    
        layer2_has_mined: t.layer2_has_mined,
        layer2_token_id: toBigInt(t.layer2_token_id),
        layer2_to_address: bufferToHex(t.layer2_to_address),
    
        created_at: t.created_at,
        updated_at: t.updated_at,
      };
    }

    export function toDB(token: Struct): DBStruct {
      const t = token;
    
      return {
        id: t.id?.toString(),
        out_point_tx_hash: hexToBuffer(t.out_point.tx_hash),
        out_point_index: +t.out_point.index,
        block_number: t.block_number.toString(),
    
        lock_script_code_hash: hexToBuffer(t.lock_script.code_hash),
        lock_script_hash_type: fromHashType(t.lock_script.hash_type),
        lock_script_args: hexToBuffer(t.lock_script.args),
    
        type_script_code_hash: hexToBuffer(t.type_script.code_hash),
        type_script_hash_type: fromHashType(t.type_script.hash_type),
    
        layer1_token_id: hexToBuffer(t.layer1_token_id),
        output_data: hexToBuffer(t.output_data),
    
        layer2_has_mined: t.layer2_has_mined,
        layer2_token_id: t.layer2_token_id.toString(),
        layer2_to_address: hexToBuffer(t.layer2_to_address),
    
        created_at: t.created_at,
        updated_at: t.updated_at,
      };
    }
    
  }

  export namespace Funcs {
    export function getTokenUri(baseUri: string, layer1TokenId: string): string {
      return baseUri + "/" + layer1TokenId
    }

    export function toTypeScriptArgs(
      factoryScript: Script,
      tokenId: HexString
    ): HexString {
      const codeHash = factoryScript.code_hash.slice(2);
      const hashType = fromHashType(factoryScript.hash_type)
        .toString(16)
        .padStart(2, "0");
      const args = factoryScript.args.slice(2);
    
      return "0x" + codeHash + hashType + args + tokenId.slice(2);
    }
    
    export function toFactoryScriptAndTokenId(
      args: HexString
    ): {
      factoryScript: Script;
      layer1TokenId: HexString;
    } {
      const codeHash = args.slice(0, 66);
      const hashType = toHashType(+("0x" + args.slice(66, 68)));
      const scriptArgs = "0x" + args.slice(68, 132);
      const tokenId = "0x" + args.slice(132);
    
      return {
        factoryScript: {
          code_hash: codeHash,
          hash_type: hashType,
          args: scriptArgs,
        },
        layer1TokenId: tokenId,
      };
    }
  }
}

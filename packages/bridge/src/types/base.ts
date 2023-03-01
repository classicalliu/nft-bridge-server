import { HexNumber, HexString } from "@ckb-lumos/base";

export type HashType = "data" | "type" | "data1";

export interface Script {
  code_hash: HexString;
  hash_type: HashType;
  args: HexString;
}

export interface OutPoint {
  tx_hash: HexString;
  index: HexNumber;
}

export interface Output {
  capacity: HexString;
  lock: Script;
  type?: Script;
}

export function hexToBuffer(hex: HexString): Buffer {
  return Buffer.from(hex.slice(2), "hex");
}

export function bufferToHex(buf: Buffer): HexString {
  return "0x" + buf.toString("hex");
}

export function toBigInt(num: string): bigint {
  return BigInt(num);
}

export function toBigIntOpt(num?: string): bigint | undefined {
  if (num == null) {
    return undefined;
  }
  return toBigInt(num);
}

export function toHashType(num: number): HashType {
  if (num === 0) {
    return "data";
  } else if (num === 1) {
    return "type";
  } else if (num === 2) {
    return "data1";
  }
  throw new Error(`Error hash type ${num}`);
}

export function fromHashType(t: HashType): number {
  if (t === "data") {
    return 0;
  } else if (t === "type") {
    return 1;
  } else if (t === "data1") {
    return 2;
  }
  throw new Error(`Error hash type ${t}`);
}

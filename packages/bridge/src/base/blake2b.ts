import { HexString } from "@ckb-lumos/base";
import blake2b, { Blake2b } from "blake2b";

export class Blake2bHasher {
  private hasher: Blake2b;
  private outLength: number;

  // default to ckb hash
  constructor(
    outLength: number = 32,
    personal: string | null = "ckb-default-hash"
  ) {
    this.outLength = outLength;

    this.hasher = blake2b(
      outLength,
      undefined,
      undefined,
      personal == null ? undefined : Buffer.from(personal, "utf-8")
    );
  }

  update(data: Buffer): this {
    this.hasher.update(data);
    return this;
  }

  updateHex(data: HexString): this {
    const buf = Buffer.from(data.slice(2), "hex");
    return this.update(buf);
  }

  digest(): Buffer {
    const result = Buffer.alloc(this.outLength);
    this.hasher.digest(result);
    return result;
  }

  digestHex(): HexString {
    const buf = this.digest();
    return "0x" + buf.toString("hex");
  }
}

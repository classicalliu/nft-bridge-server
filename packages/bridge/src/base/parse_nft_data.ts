import { HexString } from "@ckb-lumos/base";
import { Blake2bHasher } from "./blake2b";
import { logger } from "./logger";

const headerHash: HexString = (() => {
  const blake2b16 = new Blake2bHasher(16, null);
  blake2b16.update(Buffer.from("NRC-721T"));
  return blake2b16.digestHex();
})();

logger.info("token header hash:", headerHash);

function isNrc721Cell(data: HexString): boolean {
  if (data.length < headerHash.length) {
    return false;
  }
  return data.startsWith(headerHash);
}

export function parseNFTData(data: HexString): string {
  if (!isNrc721Cell(data)) {
    throw new Error("Invalid NRC721 NFT cell data");
  }

  const buf = Buffer.from(data.slice(headerHash.length), "hex");

  const stringSize = buf.readUint16BE();
  if (isNaN(stringSize)) {
    throw new Error(`Invalid size`);
  }

  return buf.toString("utf-8", 2, 2 + stringSize);
}

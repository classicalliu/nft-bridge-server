import { HexString } from "@ckb-lumos/base";
import { Blake2bHasher } from "./blake2b";
import { logger } from "./logger";

const headerHash: HexString = (() => {
  const blake2b16 = new Blake2bHasher(16, null);
  blake2b16.update(Buffer.from("NRC-721F"));
  return blake2b16.digestHex();
})();

logger.info("factory header hash:", headerHash);

function isNrc721Cell(data: HexString): boolean {
  if (data.length < headerHash.length) {
    return false;
  }
  return data.startsWith(headerHash);
}

export function parseFactoryData(data: HexString) {
  if (!isNrc721Cell(data)) {
    throw new Error("Invalid NRC721 factory cell data");
  }
  const buf = Buffer.from(data.slice(headerHash.length), "hex");

  const fieldSize = 2;
  let offset = 0;

  const readNext = (filedName: string): string => {
    const size = buf.readUint16BE(offset);
    if (isNaN(size)) {
      throw new Error(`Invalid ${filedName} size`);
    }
    offset += fieldSize;
    const field = buf.toString("utf-8", offset, offset + size);
    offset += size;
    return field;
  };

  const name = readNext("name");
  const symbol = readNext("symbol");
  const baseUri = readNext("baseUri");

  let extraData = undefined;
  if (buf.length > offset) {
    extraData = buf.toString("utf-8", offset);
  }

  return {
    name,
    symbol,
    baseUri,
    extraData,
  };
}

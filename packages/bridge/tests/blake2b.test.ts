import test from "node:test";
import assert from "node:assert/strict";

import { Blake2bHasher } from "../src/blake2b";

test("empty message", () => {
  const message = "0x";
  const digest =
    "0x44f4c69744d5f8c55d642062949dcae49bc4e7ef43d388c5a12f42b5633d163e";

  const result = new Blake2bHasher().updateHex(message).digestHex();

  assert.strictEqual(result, digest);
});

test("nrc721 header", () => {
  const message = Buffer.from("NRC-721F");
  const digest = "0x24ff5a9ab8c38d195ce2b4ea75ca8987";

  const result = new Blake2bHasher(16, null).update(message).digestHex();

  assert.strictEqual(result, digest);
});

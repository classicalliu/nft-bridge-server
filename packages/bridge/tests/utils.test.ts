import { assert } from "chai";

import { parseFactoryData } from "../src/base/utils";

describe("utils", () => {
  it("parseFactoryData", () => {
    const data =
      "0x24ff5a9ab8c38d195ce2b4ea75ca8987000854657374204e46540002544e0014687474703a2f2f74657374746f6b656e2e636f6d";
    const expectedResult = {
      name: "Test NFT",
      symbol: "TN",
      baseUri: "http://testtoken.com",
      extraData: undefined,
    };

    const result = parseFactoryData(data);

    assert.deepStrictEqual(result, expectedResult);
  });
});

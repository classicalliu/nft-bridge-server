import { assert } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";

async function deploy(minerAddress: string): Promise<Contract> {
  const NftContract = await ethers.getContractFactory("NFTUpgradeable");
  const nftContract = await upgrades.deployProxy(NftContract, [
    "nft",
    "nft symbol",
    minerAddress,
  ]);
  await nftContract.deployed();
  return nftContract;
}

const tokenId = 1;
const tokenName = "1 name";
const tokenSymbol = "1 symbol";
const tokenUri = "https://test.com/one";
const extraData = "";
const data = "";

describe("NFTUpgradeable", () => {
  it("mint by miner", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    // mint
    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const tokenNameResult = await contract.tokenName(tokenId);
    const tokenSymbolResult = await contract.tokenSymbol(tokenId);
    assert.strictEqual(tokenNameResult, tokenName);
    assert.strictEqual(tokenSymbolResult, tokenSymbol);
  });

  it("mint by owner", async () => {
    const [owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    // mint by owner, should raise error
    await assert.isRejected(
      contract
        .connect(owner)
        .mint(
          to.address,
          tokenId,
          tokenName,
          tokenSymbol,
          tokenUri,
          extraData,
          data
        ),
      "Not miner"
    );
  });

  it("mint by another user", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await assert.isRejected(
      contract
        .connect(anotherUser)
        .mint(
          to.address,
          tokenId,
          tokenName,
          tokenSymbol,
          tokenUri,
          extraData,
          data
        ),
      "Not miner"
    );
  });

  it("balance of", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );
    assert.strictEqual(await contract.connect(to).balanceOf(to.address), 1);
    assert.strictEqual(
      await contract.connect(to).balanceOf(anotherUser.address),
      0
    );
  });

  it("should failed if mint same token id", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenName = "new token name";
    const newTokenSymbol = "new token symbol";
    const newTokenUri = "https://test.com/two";
    const newExtraData = "1";
    const newData = "2";

    await assert.isRejected(
      contract
        .connect(miner)
        .mint(
          to.address,
          tokenId,
          newTokenName,
          newTokenSymbol,
          newTokenUri,
          newExtraData,
          newData
        )
    );

    assert.strictEqual(
      await contract.connect(anotherUser.address).tokenName(tokenId),
      tokenName
    );
    assert.strictEqual(
      await contract.connect(anotherUser.address).tokenSymbol(tokenId),
      tokenSymbol
    );
    assert.strictEqual(
      await contract.connect(anotherUser.address).tokenUri(tokenId),
      tokenUri
    );
    assert.strictEqual(
      await contract.connect(anotherUser.address).tokenExtraData(tokenId),
      extraData
    );
    assert.strictEqual(
      await contract.connect(anotherUser.address).tokenData(tokenId),
      data
    );
  });

  it("transfer to another user", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    assert.strictEqual(await contract.connect(to).ownerOf(tokenId), to.address);
    assert.strictEqual(await contract.connect(to).balanceOf(to.address), 1);
    assert.strictEqual(
      await contract.connect(to).balanceOf(anotherUser.address),
      0
    );

    await contract
      .connect(to)
      .transferFrom(to.address, anotherUser.address, tokenId);

    assert.strictEqual(
      await contract.connect(to).ownerOf(tokenId),
      anotherUser.address
    );
    assert.strictEqual(await contract.connect(to).balanceOf(to.address), 0);
    assert.strictEqual(
      await contract.connect(to).balanceOf(anotherUser.address),
      1
    );
  });

  it("transfer should failed if transfer by miner", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    await assert.isRejected(
      contract
        .connect(miner)
        .transferFrom(to.address, anotherUser.address, tokenId)
    );
  });

  it("transfer should failed if transfer by another user", async () => {
    const [_owner, miner, to, anotherUser] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    await assert.isRejected(
      contract
        .connect(anotherUser)
        .transferFrom(to.address, anotherUser.address, tokenId)
    );
  });

  it("upgrade contract", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const NftContractVersion2 = await ethers.getContractFactory(
      "NFTUpgradeableVersion2ForTest"
    );
    const newContract = await upgrades.upgradeProxy(
      contract.address,
      NftContractVersion2
    );
    await newContract.deployed();

    const message = await newContract.newAdded();
    assert.strictEqual(message, "new added function");

    // check token already exists
    assert.strictEqual(
      await newContract.connect(to).ownerOf(tokenId),
      to.address
    );
  });

  it("set token name", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenName = "2 name";
    await contract.connect(miner).setTokenName(tokenId, newTokenName);

    const result = await contract.tokenName(tokenId);

    assert.strictEqual(result, newTokenName);
  });

  it("set token name by user", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenName = "2 name";

    await assert.isRejected(
      contract.connect(to).setTokenName(tokenId, newTokenName)
    );
  });

  it("set token symbol", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenSymbol = "2 symbol";
    await contract.connect(miner).setTokenSymbol(tokenId, newTokenSymbol);

    const result = await contract.tokenSymbol(tokenId);

    assert.strictEqual(result, newTokenSymbol);
  });

  it("set token symbol by user", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenSymbol = "2 symbol";

    await assert.isRejected(
      contract.connect(to).setTokenSymbol(tokenId, newTokenSymbol)
    );
  });

  it("set token uri", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenUri = "http://test.com/2";
    await contract.connect(miner).setTokenUri(tokenId, newTokenUri);

    const result = await contract.tokenUri(tokenId);

    assert.strictEqual(result, newTokenUri);
  });

  it("set token uri by user", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    const newTokenUri = "http://test.com/2";

    await assert.isRejected(
      contract.connect(to).setTokenUri(tokenId, newTokenUri)
    );
  });

  it("burn", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    assert.isTrue(await contract.exists(tokenId));

    await contract.connect(miner).burn(tokenId);

    assert.isFalse(await contract.exists(tokenId));
  });

  it("burn not exists token", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    assert.isFalse(await contract.exists(tokenId));

    await assert.isRejected(
      contract.connect(miner).burn(tokenId),
      "invalid token ID"
    );
  });

  it("burn by not miner", async () => {
    const [_owner, miner, to] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    assert.isFalse(await contract.exists(tokenId));

    await assert.isRejected(contract.connect(to).burn(tokenId), "Not miner");
  });

  it("burn & remint", async () => {
    const [_owner, miner, to, anotherTo] = await ethers.getSigners();
    const contract = await deploy(miner.address);

    await contract
      .connect(miner)
      .mint(
        to.address,
        tokenId,
        tokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    assert.isTrue(await contract.exists(tokenId));

    await contract.connect(miner).burn(tokenId);

    assert.isFalse(await contract.exists(tokenId));

    const newTokenName = "2 name";
    await contract
      .connect(miner)
      .mint(
        anotherTo.address,
        tokenId,
        newTokenName,
        tokenSymbol,
        tokenUri,
        extraData,
        data
      );

    assert.isTrue(await contract.exists(tokenId));
    const ownerOfToken = await contract.ownerOf(tokenId);
    assert.strictEqual(ownerOfToken, anotherTo.address);
    assert.strictEqual(await contract.tokenName(tokenId), newTokenName);
  });
});

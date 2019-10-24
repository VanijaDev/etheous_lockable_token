const EtheousToken = artifacts.require("EtheousToken.sol");

const {
  BN,
  time,
  constants,
  balance,
  ether,
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');

contract("UpdatePublicVariables", (_accounts) => {
  const OWNER = _accounts[0];

  const USER_0_ADDRESS = _accounts[1];
  const USER_1_ADDRESS = _accounts[2];
  const USER_2_ADDRESS = _accounts[3];
  const USER_3_ADDRESS = _accounts[4];

  let etheousToken;

  beforeEach("setup", async () => {
    await time.advanceBlock();
    etheousToken = await EtheousToken.new();
  });

  describe("updateMaxUnlockIterationCount", async () => {
    it("should update maxUnlockIterationCount with correct value", async () => {
      await etheousToken.updateMaxUnlockIterationCount(10);
      assert.equal((await etheousToken.maxUnlockIterationCount.call()).toNumber(), 10, "wrong maxUnlockIterationCount after update");
    });

    it("should revert if not owner", async () => {
      await expectRevert(etheousToken.updateMaxUnlockIterationCount(10, {
        from: USER_0_ADDRESS
      }), "Ownable: caller is not the owner");
    });
  });

});
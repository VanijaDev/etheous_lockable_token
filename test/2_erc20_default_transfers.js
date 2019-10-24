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

contract("ERC20 default transfer functions", (_accounts) => {
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

  describe("should be disabled", async () => {
    it("should fail on transfer", async () => {
      await expectRevert(etheousToken.transfer(USER_0_ADDRESS, 10, {
        from: OWNER
      }), "Disabled");
    });

    it("should fail on transferFrom", async () => {
      await expectRevert(etheousToken.transferFrom(USER_0_ADDRESS, USER_1_ADDRESS, 10, {
        from: OWNER
      }), "Disabled");
    });
  });

});
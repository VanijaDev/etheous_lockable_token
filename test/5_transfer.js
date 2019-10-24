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

contract("Transfer", (_accounts) => {
  const OWNER = _accounts[0];

  const USER_0_ADDRESS = _accounts[1];
  const USER_1_ADDRESS = _accounts[2];
  const USER_2_ADDRESS = _accounts[3];
  const USER_3_ADDRESS = _accounts[4];

  const USER_0_TOKENS_RECEIVED = ether("1");
  const USER_0_LOCK_DURATION = time.duration.minutes(1);
  const USER_0_LOOP_ITERATIONS = 10;

  let etheousToken;
  let user0ReleaseTimestamp_0;

  beforeEach("setup", async () => {
    await time.advanceBlock();
    etheousToken = await EtheousToken.new();

    user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION);
    await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED, USER_0_LOCK_DURATION, USER_0_LOOP_ITERATIONS);
    await time.increase(10);
  });

  //  function transfer(address recipient, uint256 amount, uint256 lockDuration, uint256 loopIteractions)
  describe("transfer", async () => {
    it("should fail if no free tokens", async () => {
      await expectRevert(etheousToken.transferLocked(USER_1_ADDRESS, ether("0.1"), USER_0_LOCK_DURATION, USER_0_LOOP_ITERATIONS, {
        from: USER_0_ADDRESS
      }), "Not enough tokens.");
    });

    it("should transfer if tokens are being released", async () => {
      await time.increase(USER_0_LOCK_DURATION);

      //  0
      await etheousToken.transferLocked(USER_1_ADDRESS, ether("0.1"), USER_0_LOCK_DURATION, USER_0_LOOP_ITERATIONS, {
        from: USER_0_ADDRESS
      });
      assert.equal(0, (await etheousToken.balanceOf(USER_0_ADDRESS)).cmp(ether("0.9")), "wrong USER_0_ADDRESS balance after transfer");
      assert.equal(0, (await etheousToken.balanceOf(USER_1_ADDRESS)).cmp(ether("0.1")), "wrong USER_1_ADDRESS balance after transfer");

      //  1
      await etheousToken.transferLocked(USER_2_ADDRESS, ether("0.2"), USER_0_LOCK_DURATION, USER_0_LOOP_ITERATIONS, {
        from: USER_0_ADDRESS
      });
      assert.equal(0, (await etheousToken.balanceOf(USER_0_ADDRESS)).cmp(ether("0.7")), "wrong USER_0_ADDRESS balance after transfer 1");
      assert.equal(0, (await etheousToken.balanceOf(USER_2_ADDRESS)).cmp(ether("0.2")), "wrong USER_2_ADDRESS balance after transfer 1");
    });
  });

  describe("transferFrom", async () => {
    it("should fail if no free tokens", async () => {
      etheousToken.approve(OWNER, ether("0.1"), {
        from: USER_0_ADDRESS
      });
      await expectRevert(etheousToken.transferLockedFrom(USER_0_ADDRESS, USER_1_ADDRESS, ether("0.1"), USER_0_LOCK_DURATION, {
        from: OWNER
      }), "Not enough tokens.");
    });

    it("should fail if tokens can being released - transferFrom does not unlock tokens", async () => {
      etheousToken.approve(OWNER, ether("0.5"), {
        from: USER_0_ADDRESS
      });
      await time.increase(USER_0_LOCK_DURATION);

      await expectRevert(etheousToken.transferLockedFrom(USER_0_ADDRESS, USER_1_ADDRESS, ether("0.1"), USER_0_LOCK_DURATION, {
        from: OWNER
      }), "Not enough tokens.");
    });
  });
});
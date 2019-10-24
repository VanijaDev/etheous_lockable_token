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

contract("Unlock Expired functional", (_accounts) => {
  const OWNER = _accounts[0];

  const USER_0_ADDRESS = _accounts[1];
  const USER_1_ADDRESS = _accounts[2];
  const USER_2_ADDRESS = _accounts[3];
  const USER_3_ADDRESS = _accounts[4];

  const USER_0_LOOP_ITERATIONS = 10;

  let etheousToken;

  beforeEach("setup", async () => {
    await time.advanceBlock();
    etheousToken = await EtheousToken.new();
  });

  describe("unlockExpired", () => {
    it("should fail if provided loop iteration amount exeeds maxUnlockIterationCount", async () => {
      const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);

      await expectRevert(etheousToken.unlockExpired(101, {
        from: USER_0_ADDRESS
      }), "Wrong amount");
    });
  });

  describe("do not unlock if release time is in future", () => {
    const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
    let user0ReleaseTimestamp_0;

    beforeEach("transfer", async () => {
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_0 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);
    });

    it("should not update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_0), "wrong lockedBalances");
    });

    it("should not update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");
    });

    it("should not update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(USER_0_TOKENS_RECEIVED_0), "wrong lockedTokensForReleaseTime after 0");
    });
  });

  describe("do not unlock if release time is in future for multiple transfers", () => {
    const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
    const USER_0_TOKENS_RECEIVED_1 = ether("0.3");
    const USER_0_TOKENS_RECEIVED_2 = ether("0.4");
    let user0ReleaseTimestamp_0;
    let user0ReleaseTimestamp_1;
    let user0ReleaseTimestamp_2;

    beforeEach("transfer", async () => {
      //  0
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_0 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);

      //  1
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(3);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);
      await time.increase(20);

      //  2
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(4);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);
      await time.increase(30);
    });

    it("should not update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_0.add(USER_0_TOKENS_RECEIVED_1).add(USER_0_TOKENS_RECEIVED_2)), "wrong lockedBalances");
    });

    it("should not update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 3, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[1].toNumber(), user0ReleaseTimestamp_1.toNumber(), "wrong release timestamps[1] after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[2].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[2] after 0");
    });

    it("should not update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(USER_0_TOKENS_RECEIVED_0), "wrong lockedTokensForReleaseTime[0] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(USER_0_TOKENS_RECEIVED_1), "wrong lockedTokensForReleaseTime[1] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedTokensForReleaseTime[2] after 0");
    });
  });
});
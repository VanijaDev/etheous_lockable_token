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
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);

      await expectRevert(etheousToken.unlockExpired(101, {
        from: USER_0_ADDRESS
      }), "Wrong amount");
    });
  });


  //  UNLOCK - FAIL
  describe("do not unlock if release time is in future", () => {
    const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
    let user0ReleaseTimestamp_0;

    beforeEach("transfer", async () => {
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_0 = time.duration.minutes(2);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
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
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);

      //  1
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(3);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);
      await time.increase(20);

      //  2
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(4);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
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


  //  UNLOCK - SUCCESS
  describe("unlock if release time is in past", () => {
    const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
    let user0ReleaseTimestamp_0;

    beforeEach("transfer", async () => {
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_0 = time.duration.minutes(2);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);

      await time.increase(time.duration.minutes(3));
    });

    it("should update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(new BN("0")), "wrong lockedBalances");
    });

    it("should update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 0, "wrong release timestamps count after 0");
    });

    it("should update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime after 0");
    });
  });

  describe("unlock if release time is in future for multiple transfers - after all release times", () => {
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
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);

      //  1
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(3);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);
      await time.increase(20);

      //  2
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(4);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);

      await time.increase(300);
    });

    it("should update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(new BN("0")), "wrong lockedBalances");
    });

    it("should update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 0, "wrong release timestamps count after 0");
    });

    it("should update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[0] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[1] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[2] after 0");
    });
  });

  describe("unlock if release time is in future for multiple transfers - after second release times", () => {
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
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);

      //  1
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(3);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);
      await time.increase(20);

      //  2
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(4);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);

      await time.increase(200); //  after second release time
    });

    it("should update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedBalances after 0");
    });

    it("should update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[0] after 0");
    });

    it("should update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[0] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[1] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedTokensForReleaseTime[2] after 0");
    });
  });

  describe("unlock if release time is in future for multiple transfers, 3 transfers - 2 unlock = 1 locked + 2 new transfers", () => {
    const USER_0_TOKENS_RECEIVED_0 = ether("0.2");
    const USER_0_TOKENS_RECEIVED_1 = ether("0.3");
    const USER_0_TOKENS_RECEIVED_2 = ether("0.4");
    const USER_0_TOKENS_RECEIVED_3 = ether("0.5");
    const USER_0_TOKENS_RECEIVED_4 = ether("0.6");
    let user0ReleaseTimestamp_0;
    let user0ReleaseTimestamp_1;
    let user0ReleaseTimestamp_2;
    let user0ReleaseTimestamp_3;
    let user0ReleaseTimestamp_4;

    beforeEach("transfer", async () => {
      //  0
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_0 = time.duration.minutes(2);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_0, USER_0_LOCK_DURATION_0, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_0 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_0);
      await time.increase(10);

      //  1
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(3);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);
      await time.increase(20);

      //  2
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(4);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);

      await time.increase(200); //  after second release time
    });

    it("should update lockedBalances", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedBalances after 0");

      //  2 transfers
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_3 = time.duration.minutes(5);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_3, USER_0_LOCK_DURATION_3, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_3 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_3);
      await time.increase(10);

      await time.advanceBlock();
      const USER_0_LOCK_DURATION_4 = time.duration.minutes(16);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_4, USER_0_LOCK_DURATION_4, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_4 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_4);

      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_2.add(USER_0_TOKENS_RECEIVED_3).add(USER_0_TOKENS_RECEIVED_4)), "wrong lockedBalances after 1");


      await time.increase(time.duration.minutes(1));
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });
      assert.equal(0, (await etheousToken.lockedBalances.call(USER_0_ADDRESS)).cmp(USER_0_TOKENS_RECEIVED_3.add(USER_0_TOKENS_RECEIVED_4)), "wrong lockedBalances after 1");
    });

    it("should update releaseTimestamps", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[0] after 0");

      //  2 transfers
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_3 = time.duration.minutes(5);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_3, USER_0_LOCK_DURATION_3, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_3 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_3);
      await time.increase(10);

      await time.advanceBlock();
      const USER_0_LOCK_DURATION_4 = time.duration.minutes(16);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_4, USER_0_LOCK_DURATION_4, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_4 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_4);

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 3, "wrong release timestamps count after 1");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[0] after 1");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[1].toNumber(), user0ReleaseTimestamp_3.toNumber(), "wrong release timestamps[1] after 1");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[2].toNumber(), user0ReleaseTimestamp_4.toNumber(), "wrong release timestamps[2] after 1");

      await time.increase(time.duration.minutes(1));
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 2, "wrong release timestamps count after 2");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_4.toNumber(), "wrong release timestamps[0] after 2");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[1].toNumber(), user0ReleaseTimestamp_3.toNumber(), "wrong release timestamps[1] after 2");
    });

    it("should update lockedTokensForReleaseTime", async () => {
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[0] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[1] after 0");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedTokensForReleaseTime[2] after 0");

      //  2 transfers
      await time.advanceBlock();
      const USER_0_LOCK_DURATION_3 = time.duration.minutes(5);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_3, USER_0_LOCK_DURATION_3, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_3 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_3);
      await time.increase(10);

      await time.advanceBlock();
      const USER_0_LOCK_DURATION_4 = time.duration.minutes(16);
      await etheousToken.transferLocked(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_4, USER_0_LOCK_DURATION_4, USER_0_LOOP_ITERATIONS);
      user0ReleaseTimestamp_4 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_4);

      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[0] after 1");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[1] after 1");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(USER_0_TOKENS_RECEIVED_2), "wrong lockedTokensForReleaseTime[2] after 1");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_3)).cmp(USER_0_TOKENS_RECEIVED_3), "wrong lockedTokensForReleaseTime[3] after 1");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_4)).cmp(USER_0_TOKENS_RECEIVED_4), "wrong lockedTokensForReleaseTime[4] after 1");

      await time.increase(time.duration.minutes(1));
      await etheousToken.unlockExpired(10, {
        from: USER_0_ADDRESS
      });
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_0)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[0] after 2");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_1)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[1] after 2");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_2)).cmp(new BN("0")), "wrong lockedTokensForReleaseTime[2] after 2");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_3)).cmp(USER_0_TOKENS_RECEIVED_3), "wrong lockedTokensForReleaseTime[3] after 2");
      assert.equal(0, (await etheousToken.lockedTokensForReleaseTime.call(USER_0_ADDRESS, user0ReleaseTimestamp_4)).cmp(USER_0_TOKENS_RECEIVED_4), "wrong lockedTokensForReleaseTime[4] after 2");
    });
  });
});
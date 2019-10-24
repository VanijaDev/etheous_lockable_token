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

contract("Locked data after transfer", (_accounts) => {
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
    await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED, USER_0_LOCK_DURATION, USER_0_LOOP_ITERATIONS);
  });

  describe("getReleaseTimestamps", async () => {
    it("should update releaseTimestamps after initial transfer", async () => {
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");
    });

    it("should update releaseTimestamps after multiple transfers", async () => {
      //  0
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");

      //  1
      const USER_0_TOKENS_RECEIVED_1 = ether("0.2");
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      let user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 2, "wrong release timestamps count after 1");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 1");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[1].toNumber(), user0ReleaseTimestamp_1.toNumber(), "wrong release timestamps[1] after 1");

      //  2
      const USER_0_TOKENS_RECEIVED_2 = ether("0.3");
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(3);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      let user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);

      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS)).length, 3, "wrong release timestamps count after 2");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 2");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[1].toNumber(), user0ReleaseTimestamp_1.toNumber(), "wrong release timestamps[1] after 2");
      assert.equal((await etheousToken.getReleaseTimestamps.call(USER_0_ADDRESS))[2].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[2] after 2");
    });
  });

  describe("getMyReleaseTimestamps", async () => {
    it("should update getMyReleaseTimestamps after initial transfer", async () => {
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      })).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");
    });

    it("should update getMyReleaseTimestamps after multiple transfers", async () => {
      //  0
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      })).length, 1, "wrong release timestamps count after 0");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 0");

      //  1
      const USER_0_TOKENS_RECEIVED_1 = ether("0.2");
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      let user0ReleaseTimestamp_1 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_1);

      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      })).length, 2, "wrong release timestamps count after 1");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 1");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[1].toNumber(), user0ReleaseTimestamp_1.toNumber(), "wrong release timestamps[1] after 1");

      //  2
      const USER_0_TOKENS_RECEIVED_2 = ether("0.3");
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(3);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      let user0ReleaseTimestamp_2 = new BN(await time.latest()).add(USER_0_LOCK_DURATION_2);

      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      })).length, 3, "wrong release timestamps count after 2");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[0].toNumber(), user0ReleaseTimestamp_0.toNumber(), "wrong release timestamps[0] after 2");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[1].toNumber(), user0ReleaseTimestamp_1.toNumber(), "wrong release timestamps[1] after 2");
      assert.equal((await etheousToken.getMyReleaseTimestamps.call({
        from: USER_0_ADDRESS
      }))[2].toNumber(), user0ReleaseTimestamp_2.toNumber(), "wrong release timestamps[2] after 2");
    });
  });

  describe("lockedTransferAmount", async () => {
    it("should update lockedTransferAmount after initial transfer", async () => {
      assert.equal((await etheousToken.lockedTransferAmount.call(USER_0_ADDRESS)), 1, "wrong lockedTransferAmount count after 0");
    });

    it("should update lockedTransferAmount after multiple transfers", async () => {
      //  0
      assert.equal((await etheousToken.lockedTransferAmount.call(USER_0_ADDRESS)), 1, "wrong lockedTransferAmount count after 0");

      //  1
      const USER_0_TOKENS_RECEIVED_1 = ether("0.2");
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);

      assert.equal((await etheousToken.lockedTransferAmount.call(USER_0_ADDRESS)), 2, "wrong lockedTransferAmount count after 1");

      //  2
      const USER_0_TOKENS_RECEIVED_2 = ether("0.3");
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(3);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);

      assert.equal((await etheousToken.lockedTransferAmount.call(USER_0_ADDRESS)), 3, "wrong lockedTransferAmount count after 2");
    });
  });

  describe("myLockedTransferAmount", async () => {
    it("should update lockedTransferAmount after initial transfer", async () => {
      assert.equal((await etheousToken.myLockedTransferAmount.call({
        from: USER_0_ADDRESS
      })), 1, "wrong myLockedTransferAmount count after 0");
    });

    it("should update myLockedTransferAmount after multiple transfers", async () => {
      //  0
      assert.equal((await etheousToken.myLockedTransferAmount.call({
        from: USER_0_ADDRESS
      })), 1, "wrong myLockedTransferAmount count after 0");

      //  1
      const USER_0_TOKENS_RECEIVED_1 = ether("0.2");
      const USER_0_LOCK_DURATION_1 = time.duration.minutes(2);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_1, USER_0_LOCK_DURATION_1, USER_0_LOOP_ITERATIONS);
      assert.equal((await etheousToken.myLockedTransferAmount.call({
        from: USER_0_ADDRESS
      })), 2, "wrong myLockedTransferAmount count after 1");

      //  2
      const USER_0_TOKENS_RECEIVED_2 = ether("0.3");
      const USER_0_LOCK_DURATION_2 = time.duration.minutes(3);
      await etheousToken.transfer(USER_0_ADDRESS, USER_0_TOKENS_RECEIVED_2, USER_0_LOCK_DURATION_2, USER_0_LOOP_ITERATIONS);
      assert.equal((await etheousToken.myLockedTransferAmount.call({
        from: USER_0_ADDRESS
      })), 3, "wrong myLockedTransferAmount count after 2");
    });
  });
});
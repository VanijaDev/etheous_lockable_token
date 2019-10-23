pragma solidity ^0.5.12;

import "@openzeppelin/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";


contract EtheousToken is Ownable, ERC20, ERC20Detailed("Etheous", "EHS", 18) {
  uint256 maxUnlockIterationCount = 100;    //  cycle limit for unlockExpired()
    
  mapping (address => uint256) public lockedBalances;   //  (address => amount).
  mapping (address => uint256[]) public releaseTimestamps; //  release timestamps for locked transfers, (address => timestamp[]).
  mapping (address => mapping(uint256 => uint256)) public lockedTokensForReleaseTime; //  address => (releaseTimestamp => releaseAmount)

  constructor() public {
    uint256 tokensAmount = 630720000 * 10 ** 18;
    _mint(msg.sender, tokensAmount);
  }
  
  /**
    @dev Gets release timestamp amount.
    @param _address Address to get release timestamp amount.
    @return Release timestamp amount.
   */
  function getReleaseTimestamps(address _address) public view returns(uint256[] memory) {
    return releaseTimestamps[_address];
  }
  
  /**
    @dev Gets release timestamp amount for sender.
    @return Release timestamp amount.
   */
  function getMyReleaseTimestamps() public view returns(uint256[] memory) {
    return releaseTimestamps[msg.sender];
  }
  
  /**
    @dev Updates maximum cycle iterations.
    @param _amount  Amountof iterations.
   */
  function updateMaxUnlockIterationCount(uint256 _amount) public onlyOwner {
    require(_amount > 0, "Wrong amount");
    maxUnlockIterationCount = _amount;
  }
  
  /**
    @dev Returns amount of locked transaction.
    @param _address Address to return amount of locked transaction.
    @return Amount of locked transaction.
   */
  function lockedTransferAmount(address _address) public view returns(uint256) {
    return releaseTimestamps[_address].length;
  }
  
  /**
    @dev Returns amount of locked transaction for sender.
    @return Amount of locked transaction.
   */
  function myLockedTransferAmount() public view returns(uint256) {
    return releaseTimestamps[msg.sender].length;
  }

  /**
    @dev Unlocks tokens for sender with expired lock period.
    @param _amount Amount of maximum loop iteractions.
    @notice Amount of maximum loop iteractions is required in case there will be too many transactions for loop cycle to handle.
   */
  function unlockExpired(uint256 _amount) public {
    require(_amount <= maxUnlockIterationCount, "Wrong amount");
    
    uint256 length = releaseTimestamps[msg.sender].length;
    for(uint256 i = 0; i < length; i ++) {
      if(i > maxUnlockIterationCount) {
          return;
      }
      if(releaseTimestamps[msg.sender][i] <= now) {
        uint256 tokens = lockedTokensForReleaseTime[msg.sender][releaseTimestamps[msg.sender][i]];
        lockedBalances[msg.sender] = lockedBalances[msg.sender].sub(tokens);
        delete lockedTokensForReleaseTime[msg.sender][releaseTimestamps[msg.sender][i]];

        length = length.sub(1);
        if(length > 0) {
          releaseTimestamps[msg.sender][i] = releaseTimestamps[msg.sender][length];
          delete releaseTimestamps[msg.sender][length];
          releaseTimestamps[msg.sender].length = releaseTimestamps[msg.sender].length.sub(1);
          i --;
        } else {
          releaseTimestamps[msg.sender].length = 0;
        }
      }
    }
  }

  /**
    @dev Transfers tokens to recipient address.
    @param recipient Recipient address.
    @param amount Token amount.
    @param lockDuration Token lock duration.
   */
  function transfer(address recipient, uint256 amount, uint256 lockDuration) public returns (bool) {
    require(balanceOf(msg.sender).sub(lockedBalances[msg.sender]) >= amount, "Not enough tokens.");

    super.transfer(recipient, amount);    
    
    if(lockDuration > 0) {
        lockedBalances[recipient] = lockedBalances[recipient].add(amount);
        releaseTimestamps[recipient].push(now.add(lockDuration));
        lockedTokensForReleaseTime[recipient][now.add(lockDuration)] = amount;
    }
  }
  
  /**
    @dev Transfers tokens from sender to recipient address.
    @param sender Sender address.
    @param recipient Recipient address.
    @param amount Token amount.
    @param lockDuration Token lock duration.
   */
//   function transferFrom(address sender, address recipient, uint256 amount, uint256 lockDuration) public returns (bool) {
//     super.transferFrom(sender, recipient, amount);
//   }

  /**
    @dev Disable transfer functional.
   */
  function transfer(address recipient, uint256 amount) public returns (bool) {
    require(false, "Disabled");
  }

  /**
    @dev Disable transferFrom functional.
   */
  function transferFrom(address sender, address recipient, uint256 amount) public returns (bool) {
    require(false, "Disabled");
  }
}

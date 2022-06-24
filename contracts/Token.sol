pragma solidity ^0.8.7;
import "@opengsn/contracts/src/BaseRelayRecipient.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Token is ERC20 {
    constructor() ERC20("Gold", "GLD") {
        uint256 n = 1000;
        _mint(msg.sender, n * 10**uint(decimals()));
    }
}

contract TokenStorage is BaseRelayRecipient {
	IERC20 public token;

    event Store(uint256 amount);
    event Take(uint256 amount);

    mapping(address => uint256) storedAmount;

	constructor(address _forwarder, address _tokenAddress) {
		_setTrustedForwarder(_forwarder);
		token = IERC20(_tokenAddress);
	}

	function versionRecipient() external override pure returns (string memory) {
		return "2.2.1";
	}

	function store(uint256 _amount) payable public {
        token.transferFrom(_msgSender(), address(this), _amount);
        storedAmount[_msgSender()] += _amount;
    }

    function take(uint256 _amount) payable public {
        require(storedAmount[_msgSender()] >= _amount);
        token.transfer(_msgSender(), _amount);
        storedAmount[_msgSender()] -= _amount;
    }

    function getStoredAmount(address _account) external view returns(uint256) {
        return storedAmount[_account];
    }
} 


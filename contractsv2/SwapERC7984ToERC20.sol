// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {FHE, externalEuint64, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./SalaryToken.sol";

contract SwapERC7984ToERC20 is Ownable,ZamaEthereumConfig {
    using SafeERC20 for IERC20;

    error SwapERC7984ToERC20NoPendingSwap();

    struct PendingSwap {
        address receiver;
        euint64 amount;
        uint256 timestamp;
        bool isActive;
    }

    mapping(bytes32 => PendingSwap) private _pendingSwaps;
    SalaryToken private immutable _erc7984Token;
    IERC20 private immutable _erc20Token;

    event SwapRequested(address indexed user, bytes32 indexed swapId, bytes32 amountHandle, uint256 timestamp);
    event SwapFinalized(address indexed user, bytes32 indexed swapId, uint64 cleartextAmount, uint256 timestamp);

    constructor(SalaryToken erc7984Token_, IERC20 erc20Token_) Ownable(msg.sender) {
        _erc7984Token = erc7984Token_;
        _erc20Token = erc20Token_;
    }

    function swapConfidentialToERC20(externalEuint64 encryptedInput, bytes calldata inputProof) public returns (bytes32) {
        euint64 amount = FHE.fromExternal(encryptedInput, inputProof);
        
        FHE.allowTransient(amount, address(_erc7984Token));
        _erc7984Token.confidentialTransferFrom(msg.sender, address(this), amount);
        
        FHE.makePubliclyDecryptable(amount);
        
        bytes32 swapId = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp));
        
        _pendingSwaps[swapId] = PendingSwap({
            receiver: msg.sender,
            amount: amount,
            timestamp: block.timestamp,
            isActive: true
        });
   
        emit SwapRequested(msg.sender, swapId, euint64.unwrap(amount), block.timestamp);
        return swapId;
    }

    function finalizeSwap(bytes32 swapId, uint64 clearAmount, bytes calldata decryptionProof) public {
        PendingSwap storage swap = _pendingSwaps[swapId];
        if (!swap.isActive) {
            revert SwapERC7984ToERC20NoPendingSwap();
        }

        bytes32[] memory handles = new bytes32[](1);
        handles[0] = euint64.unwrap(swap.amount);
        FHE.checkSignatures(handles, abi.encode(clearAmount), decryptionProof);

        address to = swap.receiver;
        delete _pendingSwaps[swapId];

        if (clearAmount != 0) {
            SafeERC20.safeTransfer(_erc20Token, to, uint256(clearAmount));
        }

        emit SwapFinalized(to, swapId, clearAmount, block.timestamp);
    }

    function depositERC20(uint256 amount) public onlyOwner {
        SafeERC20.safeTransferFrom(_erc20Token, msg.sender, address(this), amount);
    }

    function getPendingSwap(bytes32 swapId) public view returns (address receiver, bytes32 amountHandle, uint256 timestamp, bool isActive) {
        PendingSwap storage swap = _pendingSwaps[swapId];
        return (swap.receiver, euint64.unwrap(swap.amount), swap.timestamp, swap.isActive);
    }

    function erc7984Token() public view returns (address) {
        return address(_erc7984Token);
    }

    function erc20Token() public view returns (address) {
        return address(_erc20Token);
    }
}

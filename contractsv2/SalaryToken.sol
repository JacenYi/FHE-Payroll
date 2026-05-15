// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

/**
 * OpenZeppelin
 */
import {
    Ownable2Step,
    Ownable
} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * Zama fhEVM
 */
import {
    FHE,
    euint64,
    externalEuint64
} from "@fhevm/solidity/lib/FHE.sol";


import {
    ZamaEthereumConfig
} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * ERC7984
 */
import {
    ERC7984
} from "@openzeppelin/confidential-contracts/token/ERC7984/ERC7984.sol";

contract SalaryToken is
    ZamaEthereumConfig,
    ERC7984,
    Ownable2Step
{
    /**
     * constructor
     */
    constructor(
        address owner_,
        uint64 initialSupply_,
        string memory name_,
        string memory symbol_,
        string memory contractURI_
    )
        ERC7984(name_, symbol_, contractURI_)
        Ownable(owner_)
    {
        /**
         * 初始供应量加密
         */
        euint64 encryptedSupply = FHE.asEuint64(initialSupply_);

        /**
         * mint 给 owner
         */
        _mint(owner_, encryptedSupply);
    }
    function decimals() public view virtual override returns (uint8) {
        return 6;
    }

    // =========================================================
    // Mint
    // =========================================================

    /**
     * 明文 Mint
     */
    function mint(
        address to,
        uint64 amount
    ) external onlyOwner {

        euint64 encryptedAmount = FHE.asEuint64(amount);

        _mint(to, encryptedAmount);
    }

    /**
     * 加密 Mint
     */
    function confidentialMint(
        address to,
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external onlyOwner {

        euint64 amount = FHE.fromExternal(
            encryptedAmount,
            inputProof
        );

        _mint(to, amount);
    }

    // =========================================================
    // Burn
    // =========================================================

    /**
     * 明文 Burn
     */
    function burn(
        uint64 amount
    ) external {

        euint64 encryptedAmount = FHE.asEuint64(amount);

        _burn(msg.sender, encryptedAmount);
    }

    /**
     * 加密 Burn
     */
    function confidentialBurn(
        externalEuint64 encryptedAmount,
        bytes calldata inputProof
    ) external {

        euint64 amount = FHE.fromExternal(
            encryptedAmount,
            inputProof
        );

        _burn(msg.sender, amount);
    }

    // =========================================================
    // View
    // =========================================================

    /**
     * 查询加密余额 Handle
     */
    function encryptedBalanceOf(
        address user
    ) external view returns (euint64) {

        return confidentialBalanceOf(user);
    }

    /**
     * 查询加密 TotalSupply
     */
    function encryptedTotalSupply()
        external
        view
        returns (euint64)
    {
        return confidentialTotalSupply();
    }
}

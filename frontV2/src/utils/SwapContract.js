/**
 * @file SwapERC7984ToERC20 合约交互封装类
 * @description 封装 SwapERC7984ToERC20 合约的交互逻辑，提供加密代币与 ERC20 代币的交换功能
 * @version 1.0
 * @author perry
 * 
 * @overview
 * SwapERC7984ToERC20 合约用于将加密的 ERC7984 代币（CUSDO）转换为普通 ERC20 代币（USDO）。
 * 该合约实现了一个两阶段交换流程：
 * 1. 用户发起交换请求（swapConfidentialToERC20）
 * 2. 用户完成交换（finalizeSwap）- 需要提供解密证明
 * 
 * @usage
 * ```javascript
 * import SwapContract from './SwapContract';
 * 
 * // 创建实例
 * const swapContract = SwapContract.fromPreset();
 * 
 * // 连接合约
 * await swapContract.connect(provider, signer);
 * 
 * // 发起交换
 * const result = await swapContract.swapConfidentialToERC20(encryptedAmount, inputProof);
 * ```
 */

import { ethers } from 'ethers';
import { ENV } from '../config/env';
import SwapERC7984ToERC20 from './SwapERC7984ToERC20.json';

/**
 * SwapERC7984ToERC20 合约交互类
 * 
 * 提供与 SwapERC7984ToERC20 合约交互的完整接口，包括：
 * - 合约连接与断开
 * - 加密代币到 ERC20 的交换
 * - 交换状态查询
 * - 管理员操作
 */
class SwapContract {
  /**
   * 构造函数
   * 
   * @property {string} contractAddress - 合约地址
   * @property {Array} contractAbi - 合约 ABI
   * @property {ethers.Provider|null} provider - ethers Provider 实例
   * @property {ethers.Signer|null} signer - ethers Signer 实例
   * @property {ethers.Contract|null} contract - 合约实例
   * @property {string|null} account - 当前连接的钱包地址
   */
  constructor() {
    this.contractAddress = ENV.SWAP_CONTRACT_ADDRESS;
    this.contractAbi = SwapERC7984ToERC20.abi;
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  /**
   * 使用预设配置快速创建实例
   * 
   * @description 从环境变量读取合约地址和 ABI，创建合约实例
   * @returns {SwapContract} SwapContract 实例
   */
  static fromPreset() {
    return new SwapContract();
  }

  /**
   * 连接到 SwapERC7984ToERC20 合约
   * 
   * @description 初始化合约实例，需要传入 ethers Provider 和 Signer
   * 
   * @param {ethers.Provider} provider - ethers Provider 实例
   * @param {ethers.Signer} signer - ethers Signer 实例
   * 
   * @returns {Object} 连接结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} account - 连接的账户地址
   * @returns {string|null} error - 错误信息
   */
  async connect(provider, signer) {
    try {
      this.provider = provider;
      this.signer = signer;
      this.account = await signer.getAddress();
      
      this.contract = new ethers.Contract(
        this.contractAddress,
        this.contractAbi,
        this.signer
      );

      return {
        success: true,
        account: this.account,
        error: null
      };
    } catch (error) {
      console.error('Failed to connect to Swap contract:', error);
      return {
        success: false,
        account: null,
        error: error.message
      };
    }
  }

  /**
   * 发起加密代币到 ERC20 的交换请求
   * 
   * @description 将加密的 ERC7984 代币（CUSDO）存入合约，创建待处理交换记录
   * 
   * @param {string} encryptedAmount - 加密的交换金额（externalEuint64，bytes32 格式）
   * @param {string} inputProof - 输入证明
   * 
   * @returns {Object} 交换请求结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {Object|null} receipt - 交易回执
   * @returns {string|null} error - 错误信息
   */
  async swapConfidentialToERC20(encryptedAmount, inputProof) {
    try {
      if (!this.contract) {
        return { success: false, error: 'Contract not initialized' };
      }

      const tx = await this.contract.swapConfidentialToERC20(encryptedAmount, inputProof);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        receipt: receipt,
        error: null
      };
    } catch (error) {
      console.error('Failed to swap confidential to ERC20:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 完成交换（最终兑换）
   * 
   * @description 使用解密证明验证金额，将 ERC20 代币发放给用户
   * 
   * @param {string} swapId - 交换 ID（由合约生成）
   * @param {number} clearAmount - 明文金额（uint64）
   * @param {string} decryptionProof - 解密证明
   * 
   * @returns {Object} 完成交换结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {Object|null} receipt - 交易回执
   * @returns {string|null} error - 错误信息
   */
  async finalizeSwap(swapId, clearAmount, decryptionProof) {
    try {
      if (!this.contract) {
        return { success: false, error: 'Contract not initialized' };
      }

      const tx = await this.contract.finalizeSwap(swapId, clearAmount, decryptionProof);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        receipt: receipt,
        error: null
      };
    } catch (error) {
      console.error('Failed to finalize swap:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 查询待处理的交换请求
   * 
   * @description 获取指定 swapId 的待处理交换信息
   * 
   * @param {string} swapId - 交换 ID
   * 
   * @returns {Object|null} 待处理交换信息
   * @returns {string} receiver - 接收者地址
   * @returns {number} timestamp - 请求时间戳
   * @returns {boolean} isActive - 是否活跃（未完成）
   */
  async getPendingSwap(swapId) {
    try {
      if (!this.contract) {
        console.error('Contract not initialized');
        return null;
      }

      const result = await this.contract.getPendingSwap(swapId);
      if (result) {
        return {
          receiver: result[0],
          timestamp: result[1],
          isActive: result[2]
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get pending swap:', error);
      return null;
    }
  }

  /**
   * 获取待处理交换的加密金额句柄
   * 
   * @description 获取链上存储的加密金额句柄，用于调用 publicDecrypt 获取解密凭证
   * 
   * @param {string} swapId - 交换 ID
   * 
   * @returns {string|null} 加密金额句柄（bytes32）
   */
  async getPendingSwapAmount(swapId) {
    try {
      if (!this.contract) {
        console.error('Contract not initialized');
        return null;
      }

      const result = await this.contract.getPendingSwapAmount(swapId);
      return result;
    } catch (error) {
      console.error('Failed to get pending swap amount:', error);
      return null;
    }
  }

  /**
   * 存入 ERC20 代币到交换合约（仅管理员）
   * 
   * @description 管理员向合约存入 ERC20 代币，用于兑换
   * 
   * @param {number} amount - 存入金额（uint256）
   * 
   * @returns {Object} 存入结果
   * @returns {boolean} success - 是否成功
   * @returns {string|null} txHash - 交易哈希
   * @returns {Object|null} receipt - 交易回执
   * @returns {string|null} error - 错误信息
   */
  async depositERC20(amount) {
    try {
      if (!this.contract) {
        return { success: false, error: 'Contract not initialized' };
      }

      const tx = await this.contract.depositERC20(amount);
      const receipt = await tx.wait();

      return {
        success: true,
        txHash: tx.hash,
        receipt: receipt,
        error: null
      };
    } catch (error) {
      console.error('Failed to deposit ERC20:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * 获取绑定的 ERC7984 代币地址
   * 
   * @returns {string|null} ERC7984 代币合约地址
   */
  async getErc7984Token() {
    try {
      if (!this.contract) {
        console.error('Contract not initialized');
        return null;
      }

      return await this.contract.erc7984Token();
    } catch (error) {
      console.error('Failed to get ERC7984 token:', error);
      return null;
    }
  }

  /**
   * 获取绑定的 ERC20 代币地址
   * 
   * @returns {string|null} ERC20 代币合约地址
   */
  async getErc20Token() {
    try {
      if (!this.contract) {
        console.error('Contract not initialized');
        return null;
      }

      return await this.contract.erc20Token();
    } catch (error) {
      console.error('Failed to get ERC20 token:', error);
      return null;
    }
  }

  /**
   * 获取合约所有者地址
   * 
   * @returns {string|null} 合约所有者地址
   */
  async getOwner() {
    try {
      if (!this.contract) {
        console.error('Contract not initialized');
        return null;
      }

      return await this.contract.owner();
    } catch (error) {
      console.error('Failed to get owner:', error);
      return null;
    }
  }

  /**
   * 断开合约连接
   * 
   * @description 清理所有合约实例和状态
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }
}

export default SwapContract;

export { SwapContract };
/**
 * 钱包 Context
 * 
 * 功能概述：
 * - 创建和导出 WalletContext
 * - 导出 useWallet hook
 * - 提供类型提示（通过 JSDoc）
 * 
 * 使用方式：
 * - 在组件中使用 useWallet() 获取钱包状态和方法
 */

import { createContext, useContext } from 'react';

/**
 * 钱包 Context
 * 用于在组件树中传递钱包相关状态和方法
 */
export const WalletContext = createContext(null);

/**
 * 钱包 Hook
 * 在组件中使用，获取钱包相关状态和方法
 * 
 * @returns {Object} 钱包状态和方法
 * @property {string|null} account - 当前连接的钱包地址
 * @property {boolean} isConnecting - 是否正在连接
 * @property {number|null} chainId - 当前链 ID
 * @property {string|null} balance - 当前 ETH 余额
 * @property {string|null} error - 错误信息
 * @property {boolean} isInitialized - 是否已初始化
 * @property {boolean} isConnected - 是否已连接
 * @property {ethers.Provider|null} provider - ethers Provider 实例（供 FHE 使用）
 * @property {ethers.Signer|null} signer - ethers Signer 实例（供 FHE 使用）
 * @property {Function} connect - 连接钱包方法
 * @property {Function} disconnect - 断开钱包方法
 * @property {Function} refreshBalance - 刷新余额方法
 * @property {Function} callContract - 调用合约只读方法
 * @property {Function} sendTransaction - 调用合约写入方法
 * @property {Function} listenEvent - 监听合约事件
 * @property {Object} NETWORKS - 网络配置对象
 * @property {Object} contract - 合约实例
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

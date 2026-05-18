/**
 * 钱包状态管理
 * 
 * 功能概述：
 * - 使用 React Context 管理钱包连接状态
 * - 支持自动连接（页面刷新后保持连接）
 * - 提供钱包连接/断开、网络切换等功能
 * - 暴露合约实例供全局使用
 * 
 * 主要功能：
 * - 钱包连接/断开
 * - 网络切换
 * - 余额查询和刷新
 * - 合约调用封装
 * - 事件监听
 * - 状态持久化到 localStorage
 */

import { useState, useEffect, useCallback } from 'react';
import EVMContract, { NETWORKS } from '../utils/evmContract';
import { WalletContext } from './walletContext';

/**
 * 创建 EVM 合约实例
 * 使用预设配置创建薪资合约实例
 */
const evmContract = EVMContract.fromPreset();

/**
 * 钱包 Provider 组件
 * 为整个应用提供钱包状态和方法
 * 
 * @param {React.ReactNode} children - 子组件
 */
export function WalletProvider({ children }) {
  // 钱包相关状态
  const [account, setAccount] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * 断开钱包连接
   * 清理状态和 localStorage
   */
  const disconnect = useCallback(() => {
    evmContract.disconnectWallet();
    setAccount(null);
    setChainId(null);
    setBalance(null);
    setError(null);
    localStorage.removeItem('wallet_account');
    localStorage.removeItem('wallet_chainId');
  }, []);

  /**
   * 尝试自动连接（页面刷新时）
   * 检查 localStorage 中的账户信息，尝试静默重连
   */
  const autoConnect = useCallback(async () => {
    // 检查是否有保存的账户
    const savedAccount = localStorage.getItem('wallet_account');
    if (!savedAccount) {
      setIsInitialized(true);
      return;
    }

    // 检查 MetaMask 是否仍授权
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        // 使用 eth_accounts 获取已授权的账户（不会弹出窗口）
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });

        if (accounts.length > 0 && accounts[0].toLowerCase() === savedAccount.toLowerCase()) {
          // 重新连接钱包
          const result = await evmContract.connectWallet();
          if (result.success) {
            setAccount(result.account);

            // 获取网络信息
            const network = await evmContract.getNetworkInfo();
            if (network.success) {
              setChainId(network.data.chainId);
            }

            // 获取余额
            const bal = await evmContract.getBalance();
            if (bal.success) {
              setBalance(bal.balance);
            }
          }
        } else {
          // 账户不匹配或已断开，清除 localStorage
          localStorage.removeItem('wallet_account');
          localStorage.removeItem('wallet_chainId');
        }
      } catch (err) {
        console.error('Auto connect failed:', err);
        localStorage.removeItem('wallet_account');
        localStorage.removeItem('wallet_chainId');
      }
    }

    setIsInitialized(true);
  }, []);

  // 组件挂载时尝试自动连接
  useEffect(() => {
    autoConnect();
  }, [autoConnect]);

  /**
   * 连接钱包
   * 弹出 MetaMask 窗口请求用户授权
   * 
   * @returns {Promise<Object>} 连接结果
   */
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await evmContract.connectWallet();

      if (result.success) {
        setAccount(result.account);
        localStorage.setItem('wallet_account', result.account);

        // 获取网络信息
        const network = await evmContract.getNetworkInfo();
        if (network.success) {
          setChainId(network.data.chainId);
          localStorage.setItem('wallet_chainId', network.data.chainId.toString());
        }

        // 获取 ETH 余额
        const bal = await evmContract.getBalance();
        if (bal.success) {
          setBalance(bal.balance);
        }
      } else {
        // 连接失败，显示错误
        setError(result.error || 'Failed to connect wallet');
      }

      return result;
    } catch (err) {
      console.error('Failed to connect:', err);
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsConnecting(false);
    }
  }, []);



  /**
   * 刷新余额
   * 重新获取当前账户的 ETH 余额
   */
  const refreshBalance = useCallback(async () => {
    if (!evmContract.isConnected()) return;

    const bal = await evmContract.getBalance();
    if (bal.success) {
      setBalance(bal.balance);
    }
  }, []);

  /**
   * 调用合约只读方法
   * 
   * @param {string} methodName - 方法名
   * @param {...any} args - 方法参数
   * @returns {Promise<Object>} 调用结果
   */
  const callContract = useCallback(async (methodName, ...args) => {
    return await evmContract.call(methodName, ...args);
  }, []);

  /**
   * 调用合约写入方法
   * 会触发 MetaMask 签名弹窗
   * 
   * @param {string} methodName - 方法名
   * @param {...any} args - 方法参数
   * @returns {Promise<Object>} 交易结果
   */
  const sendTransaction = useCallback(async (methodName, ...args) => {
    const result = await evmContract.send(methodName, ...args);

    if (result.success) {
      // 交易成功后刷新余额
      await refreshBalance();
    }

    return result;
  }, [refreshBalance]);

  /**
   * 监听合约事件
   * 
   * @param {string} eventName - 事件名
   * @param {Function} callback - 回调函数
   * @returns {Function} 取消监听的函数
   */
  const listenEvent = useCallback((eventName, callback) => {
    return evmContract.onEvent(eventName, callback);
  }, []);

  // 监听 MetaMask 账户变化事件
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // 用户在 MetaMask 中断开了连接
        console.log('MetaMask disconnected');
        disconnect();
      } else if (account && accounts[0] !== account) {
        // 用户切换了账户
        console.log('MetaMask account changed:', accounts[0]);
        setAccount(accounts[0]);
        localStorage.setItem('wallet_account', accounts[0]);
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [account, disconnect]);

  // Context 提供的值
  const value = {
    // 状态
    account,
    isConnecting,
    chainId,
    balance,
    error,
    isInitialized,
    isConnected: !!account,

    // FHE 需要的 provider 和 signer
    provider: evmContract.provider,
    signer: evmContract.signer,

    // 方法
    connect,
    disconnect,
    refreshBalance,
    callContract,
    sendTransaction,
    listenEvent,

    // 工具
    NETWORKS,
    contract: evmContract
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

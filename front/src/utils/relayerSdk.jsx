/**
 * FHE（全同态加密）SDK 封装
 * 
 * @description 基于 @zama-fhe/relayer-sdk 实现的 React 封装层
 * 提供完整的加密、解密功能，支持薪资系统的隐私保护需求
 * 
 * 参考官方示例：https://github.com/gududefengzhong/zama-tutorial-cn
 * 
 * 使用方式：
 * 1. 在应用根节点用 <FHEProvider> 包裹
 * 2. 在组件中调用 useFHE() 获取加密/解密方法
 * 3. 必须先连接钱包才能使用加密功能
 * 
 * 支持网络：
 * - Sepolia 测试网（chainId: 11155111）
 * 
 * 核心功能：
 * - encryptNumber: 加密单个数值
 * - encryptSalary: 加密薪资（语义封装）
 * - encryptBatch: 批量加密多个数值
 * - decryptValue: 用户解密加密值
 * - decryptSalary: 解密薪资（语义封装）
 * 
 * @author perry
 * @version 1.0
 */

import { createContext, useContext, useCallback, useRef, useState, useEffect } from 'react';

// ─── 直接正确导入 Zama SDK（修复核心）──────────────────────────────────
import { initSDK, createInstance, SepoliaConfig } from '@zama-fhe/relayer-sdk/web';

// ─── ethers 用于地址格式处理 ───────────────────────────────────────────
import { ethers } from 'ethers';

// ─── Context 定义 ──────────────────────────────────────────────────────────────
const FHEContext = createContext(null);

// ─── Provider 组件 ─────────────────────────────────────────────────────────────
export function FHEProvider({ children }) {
  const instanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 初始化 relayer 实例（修复版，无动态导入坑点）
   */
  const initRelayer = useCallback(async () => {
    if (instanceRef.current) return instanceRef.current;

    setIsLoading(true);
    setError(null);

    try {
      // ✅ 直接调用正确导入的 initSDK（修复 undefined 报错）
      await initSDK();

      // ✅ 直接使用正确导入的 createInstance + SepoliaConfig
      instanceRef.current = await createInstance({
        ...SepoliaConfig,
        network: window.ethereum,
      });

      setIsReady(true);
      console.log('[FHE] SDK 初始化成功');
      return instanceRef.current;
    } catch (err) {
      const msg = err.message || 'FHE 初始化失败';
      setError(msg);
      console.error('[FHE] 初始化失败:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ 添加自动初始化
  useEffect(() => {
    initRelayer().catch(err => {
      console.error('[FHE] 自动初始化失败:', err);
    });
  }, [initRelayer]);

  const resetRelayer = useCallback(() => {
    instanceRef.current = null;
    setIsReady(false);
    setError(null);
  }, []);

  return (
    <FHEContext.Provider value={{ isReady, isLoading, error, initRelayer, resetRelayer }}>
      {children}
    </FHEContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useFHE() {
  const context = useContext(FHEContext);

  if (!context) {
    throw new Error('useFHE 必须在 <FHEProvider> 内部使用');
  }

  const { initRelayer, isReady, isLoading, error } = context;

  // ── 加密方法组 ──────────────────────────────────────────────────────────────
  const encryptNumber = useCallback(async (value, contractAddress, account) => {
    try {
      const relayer = await initRelayer();
      
      // 将地址转换为 checksum 格式（relayer-sdk 要求）
      const checksumAccount = ethers.getAddress(account);
      const checksumContractAddress = ethers.getAddress(contractAddress);
      
      const encrypted = await relayer
        .createEncryptedInput(checksumContractAddress, checksumAccount)
        .add64(BigInt(value))
        .encrypt();

      return {
        success: true,
        handle: encrypted.handles[0],
        inputProof: encrypted.inputProof,
        error: null,
      };
    } catch (err) {
      console.error('[FHE] 加密失败:', err);
      return {
        success: false,
        handle: null,
        inputProof: null,
        error: err.message || '加密失败',
      };
    }
  }, [initRelayer]);

  const encryptSalary = useCallback(async (salary, contractAddress, account) => {
    const result = await encryptNumber(salary, contractAddress, account);
    return {
      success: result.success,
      encryptedSalary: result.handle,
      inputProof: result.inputProof,
      error: result.error,
    };
  }, [encryptNumber]);

  const encryptBatch = useCallback(async (values, contractAddress, account) => {
    try {
      const relayer = await initRelayer();
      let input = relayer.createEncryptedInput(contractAddress, account);
      for (const v of values) {
        input = input.add64(BigInt(v));
      }
      const encrypted = await input.encrypt();

      return {
        success: true,
        handles: encrypted.handles,
        inputProof: encrypted.inputProof,
        error: null,
      };
    } catch (err) {
      console.error('[FHE] 批量加密失败:', err);
      return {
        success: false,
        handles: null,
        inputProof: null,
        error: err.message || '批量加密失败',
      };
    }
  }, [initRelayer]);

  // ── 解密方法组 ──────────────────────────────────────────────────────────────
const decryptValue = useCallback(async (handle, contractAddress, account, signer) => {
  try {
    console.log('[FHE] 解密参数:', {
      handle: handle?.slice?.(0, 20) + '...' || handle,
      contractAddress,
      account,
      accountLength: account?.length,
      signer: !!signer
    });
    
    if (!account) throw new Error('account is null');
    if (!contractAddress) throw new Error('contractAddress is null');
    if (!signer) throw new Error('signer is required');
    
    // 验证地址格式
    if (!ethers.isAddress(account)) throw new Error(`无效的账户地址: ${account}`);
    if (!ethers.isAddress(contractAddress)) throw new Error(`无效的合约地址: ${contractAddress}`);
    
    const relayer = await initRelayer();
    
    // 1️⃣ 生成临时密钥对 – 务必校验返回值
    const keypair = relayer.generateKeypair();
    if (!keypair || !keypair.publicKey || !keypair.privateKey) {
      throw new Error('generateKeypair 返回无效密钥对');
    }
    
    // 2️⃣ 确保密钥为带 0x 前缀的 hex 字符串（SDK 内部要求）
    const publicKey = keypair.publicKey.startsWith('0x') 
      ? keypair.publicKey 
      : '0x' + keypair.publicKey;
    const privateKey = keypair.privateKey.startsWith('0x') 
      ? keypair.privateKey 
      : '0x' + keypair.privateKey;
    
    const startTimestamp = Math.floor(Date.now() / 1000);
    const durationDays = 1;
    
    // 地址 checksum 化（必须）
    const checksumAccount = ethers.getAddress(account);
    const checksumContractAddress = ethers.getAddress(contractAddress);
    
    console.log('[FHE] keypair (已加0x前缀):', {
      publicKey: publicKey.slice(0, 20) + '...',
      privateKey: privateKey.slice(0, 20) + '...'
    });
    
    // 3️⃣ 创建 EIP-712 签名结构
    const eip712 = relayer.createEIP712(
      publicKey,
      [checksumContractAddress],
      startTimestamp,
      durationDays
    );
    
    // 4️⃣ 用户签名（移除 EIP712Domain 类型）
    const types = { ...eip712.types };
    delete types.EIP712Domain;
    const signature = await signer.signTypedData(
      eip712.domain,
      types,
      eip712.message
    );
    
    // 5️⃣ 调用解密 – 使用「数组参数」形式，避免对象结构歧义
    // 官方 SDK 更稳定的签名为:
    // userDecrypt(handles, privateKey, publicKey, signature, contractAddresses, userAddress, startTimestamp, durationDays)
    const decrypted = await relayer.userDecrypt(
      [{ handle, contractAddress: checksumContractAddress }], // handles
      privateKey,                                             // privateKey
      publicKey,                                              // publicKey
      signature,                                              // signature
      [checksumContractAddress],                              // contractAddresses
      checksumAccount,                                        // userAddress
      startTimestamp,                                         // startTimestamp
      durationDays                                            // durationDays
    );
    
    const value = decrypted[handle]?.toString() ?? null;
    return { success: true, value, error: null };
    
  } catch (err) {
    console.error('[FHE] 解密失败:', err);
    return { success: false, value: null, error: err.message || '解密失败' };
  }
}, [initRelayer]);

  const decryptSalary = useCallback(async (handle, contractAddress, account, signer) => {
    const result = await decryptValue(handle, contractAddress, account, signer);
    return {
      success: result.success,
      salary: result.value,
      error: result.error,
    };
  }, [decryptValue]);

  return {
    isReady,
    isLoading,
    error,
    encryptNumber,
    encryptSalary,
    encryptBatch,
    decryptValue,
    decryptSalary,
    initRelayer: context.initRelayer,
    resetRelayer: context.resetRelayer,
  };
}

export default FHEContext;